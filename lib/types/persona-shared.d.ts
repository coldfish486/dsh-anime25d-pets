/**
 * 人设共享层（Host 与 client 两半区共用，纯常量与类型，零平台依赖）。
 * - CopyTable：一整套台词池（13 池：3 短状态 + 思考/等审批各 3 阶段 + 4 部位互动）
 * - CustomPersonaDef：$DSH_HOME/anime25d-pet/personas.jsonc 里的自定义人设条目
 * - PERSONAS_TEMPLATE：首次落地到上述文件的内容（JSONC，含注释版女仆彩蛋）
 * @module dsh-anime25d-pets/persona-shared
 */
/** 一整套人设台词池（flat 阶段键，便于用户手写 JSON）。 */
export interface CopyTable {
    idle: string[];
    error: string[];
    done: string[];
    thinking1: string[];
    thinking2: string[];
    thinking3: string[];
    waiting1: string[];
    waiting2: string[];
    waiting3: string[];
    tapHead: string[];
    tapLeg: string[];
    tapArm: string[];
    tapBody: string[];
}
/** 台词池键（CopyTable 的键序即设置文档中的说明顺序）。 */
export type CopyKey = keyof CopyTable;
/** 全部台词池键（自定义条目校验/合并用）。 */
export declare const COPY_KEYS: readonly CopyKey[];
/** 内置人设 id（顺序即设置页下拉顺序）。 */
export declare const BUILTIN_PERSONA_IDS: readonly ["tsundere", "genki", "airhead", "kuudere", "healing", "yandere"];
/** 内置人设 id 类型。 */
export type BuiltinPersonaId = typeof BUILTIN_PERSONA_IDS[number];
/** 默认人设 id。 */
export declare const DEFAULT_PERSONA_ID: BuiltinPersonaId;
/** 自定义人设条目（personas.jsonc）。 */
export interface CustomPersonaDef {
    id: string;
    /** 设置页下拉显示名（缺省用 id）。 */
    name?: string;
    /** 继承的基座人设 id（内置或其它自定义；缺省 tsundere）。 */
    base?: string;
    /** 只覆盖想改的台词池，其余回退基座。 */
    copy?: Partial<CopyTable>;
}
/**
 * 自定义人设文件模板（JSONC）：首次启动原样落地到
 * $DSH_HOME/anime25d-pet/personas.jsonc；此后插件只读不写，注释永存。
 * 女仆人设以注释形态预置——取消注释、点「重新读取」即得（彩蛋）。
 */
export declare const PERSONAS_TEMPLATE = "{\n  // ============================================================\n  // dsh-anime25d-pets \u81EA\u5B9A\u4E49\u4EBA\u8BBE\u914D\u7F6E\uFF08JSONC\uFF1A\u5141\u8BB8\u6CE8\u91CA\uFF09\n  // ------------------------------------------------------------\n  //  \u00B7 \u6BCF\u4E2A\u4EBA\u8BBE\u662F\u4E00\u4E2A\u5BF9\u8C61\uFF0C\u653E\u8FDB \"personas\" \u6570\u7EC4\u5373\u53EF\n  //  \u00B7 id   \uFF1A\u552F\u4E00\u82F1\u6587\u6807\u8BC6\uFF08\u51FA\u73B0\u5728\u8BBE\u7F6E\u9875\u4E0B\u62C9\u91CC\uFF09\n  //  \u00B7 name \uFF1A\u4E0B\u62C9\u663E\u793A\u540D\uFF08\u7F3A\u7701\u7528 id\uFF09\n  //  \u00B7 base \uFF1A\u7EE7\u627F\u54EA\u4E2A\u4EBA\u8BBE\uFF08\u5185\u7F6E\uFF1Atsundere/genki/airhead/kuudere/healing/yandere\uFF0C\n  //           \u4E5F\u53EF\u586B\u5176\u5B83\u81EA\u5B9A\u4E49 id\uFF09\uFF1B\u6CA1\u5199\u7684\u53F0\u8BCD\u6C60\u6CBF\u7528\u57FA\u5EA7\u7684\n  //  \u00B7 copy \uFF1A\u60F3\u8986\u76D6\u7684\u53F0\u8BCD\u6C60\uFF0813 \u6C60\uFF1Aidle/error/done\u3001\n  //           thinking1~3\u3001waiting1~3\u3001tapHead/tapLeg/tapArm/tapBody\uFF09\n  //  \u00B7 \u6539\u5B8C\u4FDD\u5B58 \u2192 \u8BBE\u7F6E\u9875\u300C\u4EBA\u8BBE\u300D\u533A\u70B9 \u21BB \u91CD\u65B0\u8BFB\u53D6 \u5373\u65F6\u751F\u6548\uFF08\u5BA0\u7269\u5F53\u573A\u6362\u53F0\u8BCD\uFF09\n  //\n  // \u2193\u2193\u2193 \u5F69\u86CB\uFF1A\u628A\u4E0B\u9762\u6574\u5757\u53D6\u6D88\u6CE8\u91CA\uFF0C\u70B9\u300C\u91CD\u65B0\u8BFB\u53D6\u300D\uFF0C\u4E0B\u62C9\u91CC\u5C31\u4F1A\u51FA\u73B0\u5973\u4EC6 \u2193\u2193\u2193\n  //\n  // {\n  //   \"id\": \"maid\",\n  //   \"name\": \"\u5973\u4EC6\",\n  //   \"base\": \"healing\",\n  //   \"copy\": {\n  //     \"idle\": [\"\u4E3B\u4EBA\u5728\uFF0C\u5C31\u4E00\u76F4\u5F85\u547D\u54E6\u3002\", \"\u4E3B\u4EBA\uFF0C\u6709\u4EC0\u4E48\u5429\u5490\u5417\uFF1F\"],\n  //     \"error\": [\"\u975E\u5E38\u62B1\u6B49\u4E3B\u4EBA\u2026\u9A6C\u4E0A\u5904\u7406\uFF01\", \"\u51FA\u9519\u4E86\u2026\u5973\u4EC6\u7684\u5931\u804C\uFF0C\u8BF7\u8D23\u7F5A\u3002\"],\n  //     \"done\": [\"\u4EFB\u52A1\u5B8C\u6210\uFF0C\u4E3B\u4EBA\u8BF7\u8FC7\u76EE\uFF01\", \"\u505A\u597D\u4E86\u2026\u6709\u5956\u52B1\u5417\uFF0C\u4E3B\u4EBA\uFF1F\"],\n  //     \"thinking1\": [\"\u9075\u547D\uFF0C\u601D\u8003\u4E2D\u2026\", \"\u8BA9\u5973\u4EC6\u60F3\u60F3\u2026\"],\n  //     \"thinking2\": [\"\u8FD8\u5728\u52AA\u529B\uFF0C\u8BF7\u7A0D\u5019\u2026\", \"\u9A6C\u4E0A\u5C31\u597D\uFF0C\u4E3B\u4EBA\u2026\"],\n  //     \"thinking3\": [\"\u8FD9\u9053\u9898\u6709\u70B9\u96BE\u5462\u2026\", \"\u5F88\u5FEB\u5C31\u597D\uFF0C\u8BF7\u518D\u7B49\u7B49\u2026\"],\n  //     \"waiting1\": [\"\u7B49\u4E3B\u4EBA\u62CD\u677F\u54E6\u3002\", \"\u4E3B\u4EBA\u6162\u6162\u8003\u8651\u3002\"],\n  //     \"waiting2\": [\"\u4E0D\u7740\u6025\uFF0C\u5973\u4EC6\u4E00\u76F4\u90FD\u5728\u3002\", \"\u60A8\u8003\u8651\uFF0C\u6211\u4F8D\u7ACB\u4E00\u65C1\u3002\"],\n  //     \"waiting3\": [\"\u5973\u4EC6\u5148\u9000\u4E0B\u5F85\u547D\u2026\u4E3B\u4EBA\u968F\u65F6\u5429\u5490\u3002\", \"\u7B49\u5019\u591A\u65F6\u4E86\uFF0C\u4E3B\u4EBA\u3002\"],\n  //     \"tapHead\": [\"\u4E3B\u4EBA\u7684\u624B\u2026\u597D\u5E78\u798F\u2026\", \"\u8C22\u8C22\u4E3B\u4EBA\u7684\u629A\u6478\uFF01\", \"\u518D\u6478\u4E00\u4E0B\u2026\u53EF\u4EE5\u5417\uFF0C\u4E3B\u4EBA\uFF1F\", \"\u88AB\u4E3B\u4EBA\u6478\u5934\u2026\u597D\u5B89\u5FC3\u2026\", \"\u5934\u53D1\u4E71\u4E86\u4E5F\u6CA1\u5173\u7CFB\u2026\u4E3B\u4EBA\u559C\u6B22\u5C31\u597D\u3002\"],\n  //     \"tapLeg\": [\"\u90A3\u3001\u90A3\u91CC\u4E0D\u884C\u7684\uFF0C\u4E3B\u4EBA\uFF01\", \"\u8BA8\u538C\u2026\u4F1A\u75D2\u7684\u2026\", \"\u817F\u2026\u8BF7\u6E29\u67D4\u4E00\u70B9\u2026\", \"\u4E3B\u4EBA\u597D\u574F\u2026\u4E13\u6233\u90A3\u91CC\u2026\", \"\u7AD9\u4E0D\u7A33\u4E86\u2026\u8BF7\u6276\u7740\u6211\u2026\"],\n  //     \"tapArm\": [\"\u53EF\u4EE5\u7275\u7740\u4E3B\u4EBA\u2026\u5417\uFF1F\", \"\u4E0E\u4E3B\u4EBA\u51FB\u638C\uFF01\", \"\u624B\u2026\u4E00\u76F4\u60F3\u7275\u7740\u60A8\u2026\", \"\u51FB\u638C\uFF01\u5973\u4EC6\u4F1A\u66F4\u52AA\u529B\uFF01\", \"\u63E1\u4F4F\u5C31\u4E0D\u60F3\u677E\u5F00\u4E86\u2026\"],\n  //     \"tapBody\": [\"\u4E3B\u4EBA\u60F3\u6309\u6469\u5417\uFF1F\", \"\u563F\u563F\u2026\u4E3B\u4EBA\u771F\u8D2A\u5FC3\u3002\", \"\u8EAB\u4F53\u2026\u8BF7\u968F\u4FBF\u5429\u5490\u2026\", \"\u518D\u6233\u2026\u5973\u4EC6\u4F1A\u5BB3\u7F9E\u7684\u2026\", \"\u4E3B\u4EBA\u7684\u624B\u597D\u6E29\u6696\u2026\"]\n  //   }\n  // }\n  //\n  // \u2191\u2191\u2191 \u5F69\u86CB\u7ED3\u675F\u3002\u60F3\u52A0\u81EA\u5DF1\u7684\u4EBA\u8BBE\uFF1A\u590D\u5236\u4E0A\u9762\u6574\u5757\u3001\u6539 id/name/\u53F0\u8BCD\uFF0C\u52A0\u8FDB\u6570\u7EC4 \u2191\u2191\u2191\n  // ============================================================\n  \"personas\": []\n}\n";
