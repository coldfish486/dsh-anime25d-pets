/**
 * 自定义模型文件（$DSH_HOME/anime25d-pet/custom-models.jsonc，JSONC）：
 * 用户自定义模型不再混入 DSH settings.yaml，而是像自定义人设一样放到插件私有目录。
 * 首次启动落地模板；UI 保存时由插件写回（保留文件头注释）。
 * @module dsh-anime25d-pets/custom-models
 */
import type { CustomModelEntry } from './models.ts';
/** 自定义模型文件名（$DSH_HOME/anime25d-pet 下）。 */
export declare const CUSTOM_MODELS_FILENAME = "custom-models.jsonc";
/** 自定义模型文件读取结果。 */
export interface CustomModelsFileView {
    models: CustomModelEntry[];
    error: string | null;
    path: string;
}
/** 校验并归一化单个自定义模型条目；非法时返回 null（调用方跳过）。 */
export declare function normalizeCustomModel(raw: unknown): CustomModelEntry | null;
/**
 * 自定义模型文件存取器：构造时确保目录存在并落地模板（不存在才写），
 * 之后 load() 每次现读；write() 由设置面板保存时调用。
 */
export declare class CustomModelsStore {
    readonly path: string;
    private lastGood;
    private lastError;
    constructor(path?: string);
    /** 现读并解析；失败时沿用上一份好结果并给出错误消息。 */
    load(): CustomModelsFileView;
    /** 写回自定义模型列表（设置面板保存用；保留文件头注释）。 */
    write(models: CustomModelEntry[]): CustomModelsFileView;
}
