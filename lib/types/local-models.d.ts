/**
 * 本地模型文件支持：用户填写的本地绝对路径由 Host 映射为同源 HTTP 路由
 * `/pet-local-models/<customId>/<fileName>`，浏览器无需访问 file://。
 * @module dsh-anime25d-pets/local-models
 */
/** 本地路径解析结果：模型文件所在目录 + 入口 .psd 文件名（Anime2.5DRig 支持 .psd/.model3.json）。 */
export interface LocalModelTarget {
    root: string;
    fileName: string;
}
/**
 * 解析用户填写的本地模型位置：
 * - 文件路径 → 目录 + 文件名
 * - 目录路径 → 目录 + 目录内第一个 .psd（找不到再找 .model3.json）
 */
export declare function localModelTarget(modelUrl: string): LocalModelTarget | null;
/** 生成浏览器可访问的本地模型入口 URL。 */
export declare function localModelUrlPath(customId: string, modelUrl: string): string | null;
/** 把本地模型路由的相对路径安全解析为真实文件路径；越界返回 null。 */
export declare function resolveLocalModelFile(modelUrl: string, relativePath: string): string | null;
/** 路径分隔符导出（路由/测试用）。 */
export declare const PATH_SEP: "\\" | "/";
