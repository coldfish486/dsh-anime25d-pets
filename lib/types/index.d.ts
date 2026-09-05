/**
 * dsh-anime25d-pets host 半区：注册宠物服务、settings namespace 与同源 HTTP 路由。
 * 使用 Anime2.5DRig（PSD 自动装配）替代 Live2D 渲染。
 * 官方插件形态（docs/user/develop/basic/publish.md）：组合包 bundle，
 * 配置经 Schemastery Config schema 传入，并注册为 settings namespace
 * （base = cordis.yml 插件行 config，用户层覆盖，settings.yaml 持久化）。
 * @module dsh-anime25d-pets
 */
import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
import { type CustomModelEntry } from './models.ts';
export { PetService } from './service.ts';
export type { PetState, PetStateView } from './service.ts';
export { makePetRoutes, petPackageRoot, PET_API_PREFIX, PET_ASSET_PREFIX } from './routes.ts';
export { listBuiltinPresets, resolveModelUrl, resolveSpatialTap, resolveMotionMap, } from './models-host.ts';
export { mergeSpatialTap, DEFAULT_SPATIAL_TAP, DEFAULT_MOTION_MAP, ANIMATION_SLOTS, } from './models.ts';
export type { BuiltinPreset, CustomModelEntry, SpatialTapConfig, SpatialTapOverride, AnimationSlot, MotionMap, } from './models.ts';
/** 稳定 cordis 插件名（对应 cordis.patch.yml insert id）。 */
/** 使用 Anime2.5DRig PSD 模型替代 Live2D。 */
export declare const name = "anime25d-pet";
/** settings namespace（settings.yaml 用户层 section 名）。 */
export declare const SETTINGS_NAMESPACE = "anime25d-pet";
export interface Config {
    /** 插件总开关。 */
    enabled: boolean;
    /** 宠物尺寸（px，滑杆 40–400）。 */
    size: number;
    /** 选中模型：内置 preset id 或自定义模型 id（也兼容直接 URL）。 */
    model: string;
    /** 开发者选项总开关：开启后显示调试面板/点击分区等开发者入口。 */
    developerMode: boolean;
    /** 调试面板：显示调试面板（开发用）。 */
    debug: boolean;
    /** 显示点击分区叠加层（空间回退色块，开发用）。 */
    showTapZones: boolean;
    /** @deprecated 自定义模型已迁移到 $DSH_HOME/anime25d-pet/custom-models.jsonc，不再写 settings.yaml。 */
    customModels?: CustomModelEntry[];
    /** Anime2.5DRig 参数覆盖（浮动画板滑块，settings.yaml 持久化）。 */
    animeParams?: Record<string, number>;
    /** 随机开口说话开关（浮动画板，settings.yaml 持久化）。 */
    talk?: boolean;
    /** 随机小动作开关（浮动画板，settings.yaml 持久化）。 */
    rand?: boolean;
    /** 左右翻转桌宠（浮动画板，settings.yaml 持久化）。 */
    flip?: boolean;
    /** FPS 限制（30 / 60 / 0=无限制，settings.yaml 持久化）。 */
    fpsLimit?: number;
    /** 宠物透明度（0~1，含气泡，settings.yaml 持久化）。 */
    opacity?: number;
    /** 选中人设 id：内置（tsundere/genki/…）或自定义人设 id（spec §3）。 */
    persona: string;
}
export declare const Config: Schema<Config>;
/** 依赖服务：webServer（同源路由）、settings（namespace 注册与解析）。 */
export declare const inject: string[];
/** 注册宠物服务、settings namespace 及其 API + 素材路由。 */
export declare function apply(ctx: Context, config: Config): void;
