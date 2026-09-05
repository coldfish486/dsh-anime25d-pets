/**
 * 模型清单的共享类型与默认值：内置 presets.jsonc（只读策展，JSONC 支持注释）
 * 由 host 侧 `models-host.ts` 负责读取；本模块保持 client 可安全打包。
 * 模型一律 URL 直载（spec §6）；Anime2.5DRig 使用 .psd 分图层 PSD 模型；内置/自定义均可可选覆盖空间回退分区阈值（spec §4/§6）。
 * @module dsh-anime25d-pets/models
 */
/** 内置策展条目（presets.jsonc 结构，spec §6：许可可标注）。 */
export interface BuiltinPreset {
    id: string;
    name: string;
    author: string;
    modelUrl: string;
    license: {
        type: string;
        url: string;
    };
    cubism: number;
    status: string;
    /** 可选：该内置模型的空间回退覆盖。 */
    spatialTap?: SpatialTapOverride;
    /** 可选：开发者预置的状态/互动动画映射（Anime2.5DRig 预设动作名）；缺省用 DEFAULT_MOTION_MAP。 */
    animationMap?: MotionMap;
}
/**
 * 动画映射槽位：5 个宠物状态 + 4 个互动部位。
 * 每个槽位可配置一个或多个 Anime2.5DRig 预设动作；多选时触发随机选一个播放。
 */
export type AnimationSlot = 'idle' | 'thinking' | 'error' | 'done' | 'waiting' | 'head' | 'leg' | 'arm' | 'body';
/** 全部动画映射槽位（设置页表单 / 默认映射共用）。 */
export declare const ANIMATION_SLOTS: readonly AnimationSlot[];
/**
 * 状态/互动部位 → 候选动作组集合。
 * 值数组表示该槽位可用的动作组；未配置的槽位由 DEFAULT_MOTION_MAP 兜底。
 */
export type MotionMap = Partial<Record<AnimationSlot, string[]>>;
/** 默认动画映射：Anime2.5DRig 预设动作（有序 fallback；配置映射后为随机选择）。 */
export declare const DEFAULT_MOTION_MAP: MotionMap;
/**
 * 空间回退完整阈值（相对模型包围盒，spec §4）。
 * 五个矩形：头（居中列上段）、身（居中列中段）、腿（居中列下段）、左/右臂（侧列中段）。
 * 与 client 分档 / showTapZones 色块共用。
 */
export interface SpatialTapConfig {
    /** 头带下沿：ny < headMaxNy 且在头横向列 → head */
    headMaxNy: number;
    /** 腿带上沿：ny > legMinNy 且在身横向列 → leg */
    legMinNy: number;
    /** 手臂高度带上沿（通常 ≈ headMaxNy） */
    armMinNy: number;
    /** 头矩形左缘 */
    headMinNx: number;
    /** 头矩形右缘 */
    headMaxNx: number;
    /** 身/腿居中列左缘（亦为左臂右缘） */
    bodyMinNx: number;
    /** 身/腿居中列右缘（亦为右臂左缘） */
    bodyMaxNx: number;
    /** 左臂左缘 */
    armLeftMinNx: number;
    /** 右臂右缘 */
    armRightMaxNx: number;
}
/** 可选覆盖：缺省字段沿用 {@link DEFAULT_SPATIAL_TAP}。兼容旧键 armLeftMaxNx/armRightMinNx → body 列。 */
export type SpatialTapOverride = Partial<SpatialTapConfig> & {
    /** @deprecated 用 bodyMinNx */
    armLeftMaxNx?: number;
    /** @deprecated 用 bodyMaxNx */
    armRightMinNx?: number;
};
/**
 * 全局默认：头/腿仍整宽（兼容旧行为），身在中列、臂在两侧。
 * 内置 Hiyori 等可在 presets.jsonc 收紧为居中五矩形。
 */
/** 默认帧率限制（0=无限制）。 */
export declare const DEFAULT_FPS_LIMIT = 30;
/** 默认宠物透明度（0~1）。 */
export declare const DEFAULT_OPACITY = 1;
export declare const DEFAULT_SPATIAL_TAP: SpatialTapConfig;
/** 判断是否为 http(s) 远程模型 URL（.psd 或任意可加载资源）。 */
export declare function isRemoteModelUrl(value: string): boolean;
/** 判断是否为本地绝对路径（Windows 盘符 / UNC / Unix 根路径）。 */
export declare function isLocalModelPath(value: string): boolean;
/** 自定义模型位置是否受支持（远程 URL 或本地绝对路径；Anime2.5DRig 接受 .psd）。 */
export declare function isSupportedModelLocation(value: string): boolean;
/** 用户自定义模型（名称 + .psd URL/本地路径 + 可选空间分区覆盖 + 可选动画映射，spec §2/§6）。 */
export interface CustomModelEntry {
    id: string;
    name: string;
    modelUrl: string;
    /** 可选：仅该模型覆盖空间回退阈值；未写字段用默认。 */
    spatialTap?: SpatialTapOverride;
    /** 可选：状态/互动部位动画映射；未写槽位用 DEFAULT_MOTION_MAP。 */
    animationMap?: MotionMap;
}
/**
 * 将可选覆盖与默认合并为完整阈值（非法/越界值夹到 0–1）。
 * 旧字段 `armLeftMaxNx` / `armRightMinNx` 映射为 `bodyMinNx` / `bodyMaxNx`。
 */
export declare function mergeSpatialTap(override?: SpatialTapOverride | null): SpatialTapConfig;
/**
 * 按当前选中模型解析生效空间阈值/动画映射/URL 的 host 侧实现见 `models-host.ts`，
 * 该模块读取 presets.jsonc（JSONC 支持注释），仅供 Node 侧使用。
 */
