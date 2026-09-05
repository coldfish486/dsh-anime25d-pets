/**
 * Host 侧模型清单读取与解析：内置 presets.jsonc（JSONC 支持注释）由 Node 读取。
 * 本模块不可被 client 打包引入（依赖 node:fs / node:path / node:url）。
 * 共享类型与默认值见 `models.ts`。
 * @module dsh-anime25d-pets/models-host
 */
import { type BuiltinPreset, type CustomModelEntry, type MotionMap, type SpatialTapConfig } from './models.ts';
/** 内置策展清单（只读，来自 presets.jsonc）。 */
export declare function listBuiltinPresets(): BuiltinPreset[];
/**
 * 按当前选中模型解析生效空间阈值：
 * 自定义条目覆盖优先；否则内置 preset 的 `spatialTap`；再否则全局默认。
 */
export declare function resolveSpatialTap(model: string, customModels: CustomModelEntry[]): SpatialTapConfig;
/**
 * 按当前选中模型解析生效动画映射：
 * 自定义条目 animationMap 优先；否则内置 preset 的 animationMap；再否则默认映射。
 * 只做浅合并：配置过的槽位覆盖，未配置槽位沿用默认。
 */
export declare function resolveMotionMap(model: string, customModels: CustomModelEntry[]): MotionMap;
/**
 * 把 `config.model` 解析为可加载的 `.psd` URL（Anime2.5DRig 模型）：
 * - 已是 http(s) URL → 原样返回
 * - preset id → presets.jsonc 匹配
 * - 自定义模型 id → settings 用户层 customModels 匹配
 * 支持 .psd / .model3.json 均可；未命中返回 null（客户端降级静态头像）。
 */
export declare function resolveModelUrl(model: string, customModels: CustomModelEntry[]): string | null;
