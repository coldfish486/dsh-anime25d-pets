/**
 * 内置人设文案表（client 常量，spec §3）：六种二次元经典性格，
 * 每人设一整套 13 池台词（短状态 + 思考/等审批阶段 + 四档部位互动）。
 * 自定义人设（$DSH_HOME/anime25d-pet/personas.jsonc）在 client 端按 base 继承合并，
 * 合并结果与本表同构，宠物台词一律从「当前人设台词表」取。
 * @module dsh-anime25d-pets/client/personas
 */
import type { CopyTable, CustomPersonaDef } from '../persona-shared.ts';
/** 内置人设（顺序即设置页下拉顺序）。 */
export declare const BUILTIN_PERSONAS: ReadonlyArray<{
    id: string;
    name: string;
    copy: CopyTable;
}>;
/** 内置人设下拉清单（id + 中文名）。 */
export declare function builtinPersonaOptions(): Array<{
    id: string;
    name: string;
}>;
/**
 * 解析某个人设 id 的完整台词表：内置直接取；自定义沿 base 链逐层覆盖
 * （自定义 → 其 base → … → 内置），未覆盖的池沿用上一层，最终兜底默认人设。
 */
export declare function resolvePersonaCopy(id: string, customPersonas: readonly CustomPersonaDef[]): CopyTable;
