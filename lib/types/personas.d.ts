/**
 * 自定义人设文件（$DSH_HOME/anime25d-pet/personas.jsonc，JSONC）：
 * 首次启动原样落地模板（此后只读不写）、按需现读解析（无缓存——
 * 刷新页面/点「重新读取」即生效）、解析失败保留上一份好结果。
 * 自定义人设零接触 DSH settings yaml 体系（插件独有文件，ADR-007）。
 * @module dsh-anime25d-pets/personas
 */
import { type CustomPersonaDef } from './persona-shared.ts';
/** 人设文件名（$DSH_HOME/anime25d-pet 下）。 */
export declare const PERSONAS_FILENAME = "personas.jsonc";
/** 人设文件读取结果。 */
export interface PersonasFileView {
    /** 解析通过的自定义人设（文件级失败时为上一份好结果，可能为空数组）。 */
    personas: CustomPersonaDef[];
    /** 文件级错误（解析失败/读取失败）；条目级坏行会被跳过并记入此消息。 */
    error: string | null;
    /** 文件绝对路径（设置页「自定义人设 ↗」打开/复制用）。 */
    path: string;
}
/**
 * 剥离 JSONC 注释（行注释与块注释），字符串字面量内的注释符原样保留。
 * 不做任何修复/改写，只去注释——保证「落地模板后插件只读不写」的承诺。
 */
export declare function stripJsonComments(text: string): string;
/** 校验并归一化单个自定义人设条目；非法时返回 null（调用方跳过）。 */
export declare function normalizeCustomPersona(raw: unknown): CustomPersonaDef | null;
/**
 * 人设文件存取器：构造时落地模板（不存在才写，仅此一次），
 * 之后 load() 每次现读——无缓存，改完文件点「重新读取」/刷新页面即生效。
 */
export declare class PersonasStore {
    readonly path: string;
    private lastGood;
    private lastError;
    constructor(path?: string);
    /** 现读并解析；失败时沿用上一份好结果并给出错误消息。 */
    load(): PersonasFileView;
}
