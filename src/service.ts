/**
 * PetService：宠物状态机 + 显示配置 + 持久化。
 * 状态源为 DSH 真实事件（Event.listEvents 实测）：
 *   agent/status（idle⇄running）、agent/error、agent/turn-stopping、approval/request。
 * 配置经 getConfig() 读取 settings 解析值（schema 默认 → base → 用户层）。
 * @module dsh-anime25d-pets/service
 */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-user-approval'
import type { Config } from './index.ts'
import type { CustomModelEntry, MotionMap, SpatialTapConfig } from './models.ts'
import { resolveModelUrl, resolveMotionMap, resolveSpatialTap } from './models-host.ts'
import { CustomModelsStore, type CustomModelsFileView } from './custom-models.ts'
import {
  loadPetPersist,
  savePetPersist,
  normalizeDisplay,
  DEFAULT_DISPLAY,
  type PetDisplay,
} from './persist.ts'
import { PersonasStore, type PersonasFileView } from './personas.ts'
import { DEFAULT_PERSONA_ID, type CustomPersonaDef } from './persona-shared.ts'

export type PetState = 'idle' | 'thinking' | 'error' | 'done' | 'waiting'

export interface PetStateView {
  state: PetState
  agent: string
  config: {
    enabled: boolean
    size: number
    model: string
    /** 解析后的 .psd URL（模型 id → URL，Anime2.5DRig 渲染，spec §6）。 */
    modelUrl: string | null
    debug: boolean
    /** 显示点击分区叠加层（空间回退色块）。 */
    showTapZones: boolean
    /** 当前模型生效的空间回退完整阈值（自定义可覆盖；spec §4）。 */
    spatialTap: SpatialTapConfig
    /** 当前模型生效的状态/互动动画映射（自定义/内置可覆盖；缺省 DEFAULT_MOTION_MAP）。 */
    motionMap: MotionMap
    /** Anime2.5DRig 参数覆盖（浮动画板滑块，可覆盖默认参数）。 */
    animeParams: Record<string, number>
    /** 随机开口说话开关。 */
    talk: boolean
    /** 随机小动作开关。 */
    rand: boolean
    /** 左右翻转桌宠（镜像显示）。 */
    flip: boolean
    /** 选中人设 id（内置或自定义；spec §3）。 */
    persona: string
  }
  display: PetDisplay
  /** 自定义人设原样定义（client 端与内置文案合并出完整台词池）。 */
  customPersonas: CustomPersonaDef[]
  /** 人设文件级/条目级问题（设置页内联提示；null 无异常）。 */
  personasError: string | null
  /** 人设文件绝对路径（「自定义人设 ↗」openPath / 复制路径用）。 */
  personasFile: string
  version: number
}

/** "完成"庆祝状态在回到空闲前的保持时长（ms）。 */
const DONE_HOLD_MS = 3500

/** 变化通知监听器（状态/显示/配置变化时触发，供 SSE 推送使用）。 */
type ChangeListener = () => void

export class PetService {
  private state: PetState = 'idle'
  private agent = 'idle'
  private version = 0
  private display: PetDisplay
  private doneTimerId: ReturnType<typeof setTimeout> | undefined
  private listeners = new Set<ChangeListener>()

  constructor(
    private readonly ctx: Context,
    private readonly getConfig: () => Config,
    private readonly personasStore?: PersonasStore,
    private readonly customModelsStore?: CustomModelsStore,
  ) {
    this.display = loadPetPersist()
    // 卸载时清理"完成"保持计时器
    ctx.effect(() => () => {
      if (this.doneTimerId) clearTimeout(this.doneTimerId)
    })

    ctx.on('agent/status', (payload) => {
      const status = payload?.status
      if (!status) return
      this.agent = String(status)
      if (status === 'running') {
        this.set('thinking')
      } else if (status === 'idle' && this.state !== 'done') {
        // done 保持期内到达的 idle 不打断庆祝（由 setDone 的计时器负责回收）
        this.set('idle')
      }
    })
    ctx.on('agent/error', () => this.set('error'))
    ctx.on('agent/turn-stopping', () => this.setDone())
    // approval/request 是 waterfall 事件：必须调用 next() 放行审批链
    ctx.on('approval/request', (_req, next) => {
      this.set('waiting')
      return next()
    })
  }

  /** 立即切换状态；取消未完成的"完成"保持计时。 */
  private set(next: PetState): void {
    if (this.doneTimerId) {
      clearTimeout(this.doneTimerId)
      this.doneTimerId = undefined
    }
    if (this.state === next) return
    this.state = next
    this.version += 1
    this.emitChange()
  }

  /** 进入"完成"并保持 DONE_HOLD_MS 后回空闲（客户端据此播庆祝动画）。 */
  private setDone(): void {
    this.set('done')
    this.doneTimerId = setTimeout(() => {
      this.doneTimerId = undefined
      this.set('idle')
    }, DONE_HOLD_MS)
  }

  /** 浏览器轮询用的状态快照（配置实时读取 settings 解析值；人设文件每次现读，spec §2）。 */
  snapshot(): PetStateView {
    const config = this.getConfig()
    // 无缓存现读：改完文件刷新页面/点「重新读取」即拿到最新（spec §2）
    const personas: PersonasFileView = this.personasStore?.load()
      ?? { personas: [], error: null, path: '' }
    const customModels = this.listCustomModels()
    return {
      state: this.state,
      agent: this.agent,
      config: {
        enabled: config.enabled,
        size: config.size,
        model: config.model,
        modelUrl: resolveModelUrl(config.model, customModels),
        debug: config.debug,
        showTapZones: !!config.showTapZones,
        spatialTap: resolveSpatialTap(config.model, customModels),
        motionMap: resolveMotionMap(config.model, customModels),
        animeParams: config.animeParams ?? {},
        talk: config.talk ?? false,
        rand: config.rand ?? false,
        flip: config.flip ?? false,
        persona: config.persona || DEFAULT_PERSONA_ID,
      },
      display: { ...this.display },
      customPersonas: personas.personas,
      personasError: personas.error,
      personasFile: personas.path,
      version: this.version,
    }
  }

  /** 重新读取人设文件并推送（设置页「↻ 重新读取」按钮；version 递增触发客户端感知）。 */
  reloadPersonas(): PersonasFileView {
    const view = this.personasStore?.load() ?? { personas: [], error: null, path: '' }
    this.version += 1
    this.emitChange()
    return view
  }

  /** 用户自定义模型列表（设置面板模型列表的 custom 部分，Host 权威视图）。 */
  listCustomModels(): CustomModelEntry[] {
    return this.customModelsStore?.load().models ?? this.getConfig().customModels ?? []
  }

  /** 自定义模型文件视图（路径/错误/列表），供设置面板与“打开配置文件”使用。 */
  customModelsFile(): CustomModelsFileView {
    return this.customModelsStore?.load() ?? { models: [], error: null, path: '' }
  }

  /** 写回自定义模型列表（设置面板保存后调用），并推送配置变化。 */
  saveCustomModels(models: CustomModelEntry[]): CustomModelsFileView {
    const view = this.customModelsStore?.write(models) ?? { models, error: null, path: '' }
    this.version += 1
    this.emitChange()
    return view
  }

  /** 更新显示配置（拖动/尺寸）并持久化；数值在服务端按权威边界 clamp。 */
  setDisplay(patch: Partial<PetDisplay>): PetDisplay {
    this.display = normalizeDisplay({
      right: patch.right ?? this.display.right,
      bottom: patch.bottom ?? this.display.bottom,
      size: patch.size ?? this.display.size,
    })
    savePetPersist(this.display)
    this.version += 1
    this.emitChange()
    return { ...this.display }
  }

  /** 重置为默认显示配置（调试用）。 */
  resetDisplay(): PetDisplay {
    this.display = { ...DEFAULT_DISPLAY }
    savePetPersist(this.display)
    this.version += 1
    this.emitChange()
    return { ...this.display }
  }

  /** 订阅变化推送（状态/显示变化自动触发）；返回退订函数。 */
  onChange(listener: ChangeListener): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  /** 配置（settings 解析值）变化后由外部调用，触发一次推送（ADR-006）。 */
  notifyConfigChanged(): void {
    this.emitChange()
  }

  private emitChange(): void {
    for (const listener of this.listeners) listener()
  }
}
