/**
 * dsh-anime25d-pets host 半区：注册宠物服务、volatile 配置引用与同源 HTTP 路由。
 * 使用 Anime2.5DRig（PSD 自动装配）替代 Live2D 渲染。
 * 官方插件形态（docs/user/develop/basic/publish.md）：组合包 bundle，
 * 配置经 Schemastery Config schema 传入；可热改字段用 `.volatile()` 声明，
 * 由 DSH `ctx.settings`（SettingsForms）投影为配置表单并持久化到 profile patch，
 * 业务侧直接读 volatile 引用的 `.get()`（DSH 0.2.0-rc.2 起不再有
 * `ctx.settings.register/get/mutate` 旧注册面）。
 * @module dsh-anime25d-pets
 */

import type { Context, Volatile } from '@deepseek-ai/cordis'
import type { SettingsNamespace, SettingsPathOp } from '@deepseek-ai/dsh-settings'
import Schema from '@deepseek-ai/schemastery'
import type {} from '@deepseek-ai/dsh-host-webserver'
import { PetService } from './service.ts'
import { makePetRoutes, petPackageRoot, type SettingsRoutesApi } from './routes.ts'
import { DEFAULT_FPS_LIMIT, DEFAULT_OPACITY, type CustomModelEntry } from './models.ts'
import { listBuiltinPresets, resolveModelUrl, resolveSpatialTap, resolveMotionMap } from './models-host.ts'
import { PersonasStore } from './personas.ts'
import { CustomModelsStore } from './custom-models.ts'

export { PetService } from './service.ts'
export type { PetState, PetStateView } from './service.ts'
export { makePetRoutes, petPackageRoot, PET_API_PREFIX, PET_ASSET_PREFIX } from './routes.ts'
export {
  listBuiltinPresets,
  resolveModelUrl,
  resolveSpatialTap,
  resolveMotionMap,
} from './models-host.ts'
export {
  mergeSpatialTap,
  DEFAULT_SPATIAL_TAP,
  DEFAULT_MOTION_MAP,
  ANIMATION_SLOTS,
} from './models.ts'
export type {
  BuiltinPreset,
  CustomModelEntry,
  SpatialTapConfig,
  SpatialTapOverride,
  AnimationSlot,
  MotionMap,
} from './models.ts'

/** 稳定 cordis 插件名（对应 cordis.patch.yml insert id）。 */
/** 使用 Anime2.5DRig PSD 模型替代 Live2D。 */
export const name = 'anime25d-pet'

/** settings namespace（= profile 中本插件条目的 id）。 */
export const SETTINGS_NAMESPACE = 'anime25d-pet'

/** settings namespace（DSH 0.2.0-rc.2 起 namespace 即 profile entry id；仅做类型断言）。 */
const NS = SETTINGS_NAMESPACE as SettingsNamespace

/**
 * 插件配置（Loader 校验输出）。标 `.volatile()` 的字段是**可热改引用**
 * （`Volatile<T>`），业务侧经 {@link readConfig} 取平面值；未标字段是普通值。
 */
export interface Config {
  /** 插件总开关。 */
  enabled: Volatile<boolean>
  /** 宠物尺寸（px，滑杆 40–400）。 */
  size: Volatile<number>
  /** 选中模型：内置 preset id 或自定义模型 id（也兼容直接 URL）。 */
  model: Volatile<string>
  /** 开发者选项总开关：开启后显示调试面板/点击分区等开发者入口。 */
  developerMode: Volatile<boolean>
  /** 调试面板：显示调试面板（开发用）。 */
  debug: Volatile<boolean>
  /** 显示点击分区叠加层（空间回退色块，开发用）。 */
  showTapZones: Volatile<boolean>
  /** @deprecated 自定义模型已迁移到 $DSH_HOME/anime25d-pet/custom-models.jsonc，不再写配置。 */
  customModels?: CustomModelEntry[]
  /** Anime2.5DRig 参数覆盖（浮动画板滑块，配置持久化）。 */
  animeParams: Volatile<Record<string, number>>
  /** 随机开口说话开关（浮动画板，配置持久化）。 */
  talk: Volatile<boolean>
  /** 随机小动作开关（浮动画板，配置持久化）。 */
  rand: Volatile<boolean>
  /** 左右翻转桌宠（浮动画板，配置持久化）。 */
  flip: Volatile<boolean>
  /** FPS 限制（30 / 60 / 0=无限制，配置持久化）。 */
  fpsLimit: Volatile<number>
  /** 宠物透明度（0~1，含气泡，配置持久化）。 */
  opacity: Volatile<number>
  /** 选中人设 id：内置（tsundere/genki/…）或自定义人设 id（spec §3）。 */
  persona: Volatile<string>
}

/**
 * 配置 schema。这里必须给显式注解，否则声明生成（`tsc --emitDeclarationOnly`）
 * 会试图命名推导类型里的 `Dict`（来自 pnpm 内部路径下的 `@deepseek-ai/cosmokit`），
 * 触发 TS2883。
 *
 * 不能写成 `Schema<Config>`：volatile 字段的运行值是 `Volatile<T>`，而 schema 的
 * **输入**面是普通值，函数参数位置逆变导致二者不兼容。因此输入面用 `any`
 * （schema 输出面仍由同名 `Config` interface 精确描述，`readConfig` 依此取值）。
 */
export const Config: Schema<any, Config> = Schema.object({
  enabled: Schema.boolean().default(true).volatile(),
  size: Schema.number().min(40).max(400).default(160).volatile(),
  model: Schema.string().default('sample').volatile(),
  developerMode: Schema.boolean().default(false).volatile(),
  debug: Schema.boolean().default(false).volatile(),
  showTapZones: Schema.boolean().default(false).volatile(),
  customModels: Schema.array(Schema.any()).default([]),
  animeParams: Schema.dict(Schema.number()).default({}).volatile(),
  talk: Schema.boolean().default(false).volatile(),
  rand: Schema.boolean().default(false).volatile(),
  flip: Schema.boolean().default(false).volatile(),
  fpsLimit: Schema.number().min(0).max(60).default(DEFAULT_FPS_LIMIT).volatile(),
  opacity: Schema.number().min(0).max(1).default(DEFAULT_OPACITY).volatile(),
  persona: Schema.string().default('tsundere').volatile(),
})

/** 平面配置快照（volatile 引用已解引用；业务/路由侧只读此类型）。 */
export interface PetConfig {
  enabled: boolean
  size: number
  model: string
  developerMode: boolean
  debug: boolean
  showTapZones: boolean
  animeParams: Record<string, number>
  talk: boolean
  rand: boolean
  flip: boolean
  fpsLimit: number
  opacity: number
  persona: string
  /** @deprecated 仅遗留迁移用。 */
  customModels?: CustomModelEntry[]
}

/**
 * 解引用当前 volatile 配置（每次调用现读，热改即时反映，无需重挂载）。
 * @param config - Loader 传入的插件配置。
 * @returns 平面配置快照。
 */
export function readConfig(config: Config): PetConfig {
  return {
    enabled: config.enabled.get(),
    size: config.size.get(),
    model: config.model.get(),
    developerMode: config.developerMode.get(),
    debug: config.debug.get(),
    showTapZones: config.showTapZones.get(),
    animeParams: { ...config.animeParams.get() },
    talk: config.talk.get(),
    rand: config.rand.get(),
    flip: config.flip.get(),
    fpsLimit: config.fpsLimit.get(),
    opacity: config.opacity.get(),
    persona: config.persona.get(),
    customModels: config.customModels,
  }
}

/** 依赖服务：webServer（同源路由）、settings（配置表单投影与写入）。 */
export const inject = ['webServer', 'settings']

/** 注册宠物服务、配置表单策略及其 API + 素材路由。 */
export function apply(ctx: Context, config: Config): void {
  // 本插件自带「桌宠配置」页，关闭平台 schema 自动生成页。
  ctx.effect(() => ctx.settings.configure({ auto: false }, ctx.fiber))

  // 现读 volatile 引用：settings 写入后无需重载插件即可生效。
  const resolveConfig = (): PetConfig => readConfig(config)

  const customModelsStore = new CustomModelsStore()
  // 旧数据迁移：遗留配置里若还有 customModels 且新文件为空，则一次性写入 custom-models.jsonc
  const initialConfig = resolveConfig()
  if (initialConfig.customModels?.length && customModelsStore.load().models.length === 0) {
    customModelsStore.write(initialConfig.customModels)
  }
  const service = new PetService(ctx, resolveConfig, new PersonasStore(), customModelsStore)

  // 设置读写 API：Host 直连 ctx.settings（SettingsForms）。describe() 返回
  // volatile 字段的解析值（schema 默认 → 继承层 → profile 覆盖），
  // mutate() 按路径写回并持久化到 profile patch。
  const settingsApi: SettingsRoutesApi = {
    view: () => {
      const descriptor = ctx.settings.describe().find((row) => row.ns === NS)
      return { value: descriptor?.value, writable: ctx.settings.writable }
    },
    write: (ops: readonly SettingsPathOp[]) => ctx.settings.mutate(NS, ops).then(() => {
      service.notifyConfigChanged()
    }),
  }

  // 路由随插件生命周期注册/清理；配置变更（HMR / settings 热更新）经 resolveConfig 即时反映。
  // 插件卸载时同时关闭全部活跃 SSE 流（onStream），避免旧流在路由注销后空转心跳。
  ctx.effect(() => {
    const openStreams = new Set<() => void>()
    const routes = makePetRoutes({
      service,
      packageRoot: petPackageRoot(import.meta.url),
      settings: settingsApi,
      onStream: (close) => { openStreams.add(close) },
    })
    const disposers = routes.map((route) => ctx.webServer.register(route))
    return () => {
      for (const close of openStreams) close()
      for (const dispose of disposers) dispose()
    }
  }, 'anime25d-pet: routes')
}
