import Schema from "@deepseek-ai/schemastery";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { readFile } from "node:fs/promises";
//#region src/models.ts
/** 全部动画映射槽位（设置页表单 / 默认映射共用）。 */
const ANIMATION_SLOTS = [
	"idle",
	"thinking",
	"error",
	"done",
	"waiting",
	"head",
	"leg",
	"arm",
	"body"
];
/** 默认动画映射：Anime2.5DRig 预设动作（有序 fallback；配置映射后为随机选择）。 */
const DEFAULT_MOTION_MAP = {
	idle: ["Idle"],
	thinking: [
		"Thinking",
		"Working",
		"Idle"
	],
	error: [
		"Failed",
		"Sad",
		"Idle"
	],
	done: [
		"Jumping",
		"Done",
		"Idle"
	],
	waiting: ["Waiting", "Idle"],
	head: ["TapHead", "TapBody"],
	leg: ["TapLeg", "TapBody"],
	arm: ["TapArm", "TapBody"],
	body: ["TapBody"]
};
const DEFAULT_SPATIAL_TAP = {
	headMaxNy: .32,
	legMinNy: .58,
	armMinNy: .28,
	headMinNx: 0,
	headMaxNx: 1,
	bodyMinNx: .38,
	bodyMaxNx: .62,
	armLeftMinNx: 0,
	armRightMaxNx: 1
};
/** 判断是否为 http(s) 远程模型 URL（.psd 或任意可加载资源）。 */
function isRemoteModelUrl(value) {
	return /^https?:\/\//i.test(value.trim());
}
/** 判断是否为本地绝对路径（Windows 盘符 / UNC / Unix 根路径）。 */
function isLocalModelPath(value) {
	const v = value.trim();
	return /^[a-zA-Z]:[\\/]/.test(v) || /^\\\\/.test(v) || /^\//.test(v);
}
/** 自定义模型位置是否受支持（远程 URL 或本地绝对路径；Anime2.5DRig 接受 .psd）。 */
function isSupportedModelLocation(value) {
	return isRemoteModelUrl(value) || isLocalModelPath(value);
}
/** 把数值夹到 [0, 1]；非有限数回落 fallback。 */
function clamp01(n, fallback) {
	const v = typeof n === "number" ? n : Number(n);
	if (!Number.isFinite(v)) return fallback;
	if (v < 0) return 0;
	if (v > 1) return 1;
	return v;
}
/**
* 将可选覆盖与默认合并为完整阈值（非法/越界值夹到 0–1）。
* 旧字段 `armLeftMaxNx` / `armRightMinNx` 映射为 `bodyMinNx` / `bodyMaxNx`。
*/
function mergeSpatialTap(override) {
	const o = override ?? {};
	const bodyMinNx = clamp01(o.bodyMinNx ?? o.armLeftMaxNx, DEFAULT_SPATIAL_TAP.bodyMinNx);
	const bodyMaxNx = clamp01(o.bodyMaxNx ?? o.armRightMinNx, DEFAULT_SPATIAL_TAP.bodyMaxNx);
	return {
		headMaxNy: clamp01(o.headMaxNy, DEFAULT_SPATIAL_TAP.headMaxNy),
		legMinNy: clamp01(o.legMinNy, DEFAULT_SPATIAL_TAP.legMinNy),
		armMinNy: clamp01(o.armMinNy, DEFAULT_SPATIAL_TAP.armMinNy),
		headMinNx: clamp01(o.headMinNx, DEFAULT_SPATIAL_TAP.headMinNx),
		headMaxNx: clamp01(o.headMaxNx, DEFAULT_SPATIAL_TAP.headMaxNx),
		bodyMinNx,
		bodyMaxNx,
		armLeftMinNx: clamp01(o.armLeftMinNx, DEFAULT_SPATIAL_TAP.armLeftMinNx),
		armRightMaxNx: clamp01(o.armRightMaxNx, DEFAULT_SPATIAL_TAP.armRightMaxNx)
	};
}
/**
* 按当前选中模型解析生效空间阈值/动画映射/URL 的 host 侧实现见 `models-host.ts`，
* 该模块读取 presets.jsonc（JSONC 支持注释），仅供 Node 侧使用。
*/
//#endregion
//#region src/local-models.ts
/**
* 本地模型文件支持：用户填写的本地绝对路径由 Host 映射为同源 HTTP 路由
* `/pet-local-models/<customId>/<fileName>`，浏览器无需访问 file://。
* @module dsh-anime25d-pets/local-models
*/
/**
* 解析用户填写的本地模型位置：
* - 文件路径 → 目录 + 文件名
* - 目录路径 → 目录 + 目录内第一个 .psd（找不到再找 .model3.json）
*/
function localModelTarget(modelUrl) {
	if (!isLocalModelPath(modelUrl)) return null;
	const p = modelUrl.trim();
	try {
		const st = statSync(p);
		if (st.isDirectory()) {
			let files = readdirSync(p).filter((f) => f.toLowerCase().endsWith(".psd"));
			if (files.length === 0) files = readdirSync(p).filter((f) => f.toLowerCase().endsWith(".model3.json"));
			if (files.length === 0) return null;
			return {
				root: p,
				fileName: files[0]
			};
		}
		if (st.isFile()) return {
			root: dirname(p),
			fileName: basename(p)
		};
	} catch {
		return null;
	}
	return null;
}
/** 生成浏览器可访问的本地模型入口 URL。 */
function localModelUrlPath(customId, modelUrl) {
	const target = localModelTarget(modelUrl);
	if (!target) return null;
	return `/pet-local-models/${encodeURIComponent(customId)}/${target.fileName.split(/[\\/]/).map(encodeURIComponent).join("/")}`;
}
/** 把本地模型路由的相对路径安全解析为真实文件路径；越界返回 null。 */
function resolveLocalModelFile(modelUrl, relativePath) {
	const target = localModelTarget(modelUrl);
	if (!target) return null;
	const root = resolve(target.root);
	const file = resolve(root, relativePath);
	const rel = relative(root, file);
	if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) return null;
	if (!existsSync(file)) return null;
	return file;
}
//#endregion
//#region src/persona-shared.ts
/** 全部台词池键（自定义条目校验/合并用）。 */
const COPY_KEYS = [
	"idle",
	"error",
	"done",
	"thinking1",
	"thinking2",
	"thinking3",
	"waiting1",
	"waiting2",
	"waiting3",
	"tapHead",
	"tapLeg",
	"tapArm",
	"tapBody"
];
/** 内置人设 id（顺序即设置页下拉顺序）。 */
const BUILTIN_PERSONA_IDS = [
	"tsundere",
	"genki",
	"airhead",
	"kuudere",
	"healing",
	"yandere"
];
/**
* 自定义人设文件模板（JSONC）：首次启动原样落地到
* $DSH_HOME/anime25d-pet/personas.jsonc；此后插件只读不写，注释永存。
* 女仆人设以注释形态预置——取消注释、点「重新读取」即得（彩蛋）。
*/
const PERSONAS_TEMPLATE = `{
  // ============================================================
  // dsh-anime25d-pets 自定义人设配置（JSONC：允许注释）
  // ------------------------------------------------------------
  //  · 每个人设是一个对象，放进 "personas" 数组即可
  //  · id   ：唯一英文标识（出现在设置页下拉里）
  //  · name ：下拉显示名（缺省用 id）
  //  · base ：继承哪个人设（内置：tsundere/genki/airhead/kuudere/healing/yandere，
  //           也可填其它自定义 id）；没写的台词池沿用基座的
  //  · copy ：想覆盖的台词池（13 池：idle/error/done、
  //           thinking1~3、waiting1~3、tapHead/tapLeg/tapArm/tapBody）
  //  · 改完保存 → 设置页「人设」区点 ↻ 重新读取 即时生效（宠物当场换台词）
  //
  // ↓↓↓ 彩蛋：把下面整块取消注释，点「重新读取」，下拉里就会出现女仆 ↓↓↓
  //
  // {
  //   "id": "maid",
  //   "name": "女仆",
  //   "base": "healing",
  //   "copy": {
  //     "idle": ["主人在，就一直待命哦。", "主人，有什么吩咐吗？"],
  //     "error": ["非常抱歉主人…马上处理！", "出错了…女仆的失职，请责罚。"],
  //     "done": ["任务完成，主人请过目！", "做好了…有奖励吗，主人？"],
  //     "thinking1": ["遵命，思考中…", "让女仆想想…"],
  //     "thinking2": ["还在努力，请稍候…", "马上就好，主人…"],
  //     "thinking3": ["这道题有点难呢…", "很快就好，请再等等…"],
  //     "waiting1": ["等主人拍板哦。", "主人慢慢考虑。"],
  //     "waiting2": ["不着急，女仆一直都在。", "您考虑，我侍立一旁。"],
  //     "waiting3": ["女仆先退下待命…主人随时吩咐。", "等候多时了，主人。"],
  //     "tapHead": ["主人的手…好幸福…", "谢谢主人的抚摸！", "再摸一下…可以吗，主人？", "被主人摸头…好安心…", "头发乱了也没关系…主人喜欢就好。"],
  //     "tapLeg": ["那、那里不行的，主人！", "讨厌…会痒的…", "腿…请温柔一点…", "主人好坏…专戳那里…", "站不稳了…请扶着我…"],
  //     "tapArm": ["可以牵着主人…吗？", "与主人击掌！", "手…一直想牵着您…", "击掌！女仆会更努力！", "握住就不想松开了…"],
  //     "tapBody": ["主人想按摩吗？", "嘿嘿…主人真贪心。", "身体…请随便吩咐…", "再戳…女仆会害羞的…", "主人的手好温暖…"]
  //   }
  // }
  //
  // ↑↑↑ 彩蛋结束。想加自己的人设：复制上面整块、改 id/name/台词，加进数组 ↑↑↑
  // ============================================================
  "personas": []
}
`;
/** DSH home 目录（与 persist.ts 同一规则）。 */
function petHomeDir$2() {
	return process.env.DSH_HOME ?? join(homedir(), ".dsh");
}
/** 插件私有数据目录：$DSH_HOME/anime25d-pet。 */
function petDataDir() {
	return join(petHomeDir$2(), "anime25d-pet");
}
/**
* 剥离 JSONC 注释（行注释与块注释），字符串字面量内的注释符原样保留。
* 不做任何修复/改写，只去注释——保证「落地模板后插件只读不写」的承诺。
*/
function stripJsonComments(text) {
	let out = "";
	let i = 0;
	let inString = false;
	while (i < text.length) {
		const ch = text[i];
		const next = text[i + 1];
		if (inString) {
			out += ch;
			if (ch === "\\") {
				if (i + 1 < text.length) out += next;
				i += 2;
				continue;
			}
			if (ch === "\"") inString = false;
			i += 1;
			continue;
		}
		if (ch === "\"") {
			inString = true;
			out += ch;
			i += 1;
			continue;
		}
		if (ch === "/" && next === "/") {
			i += 2;
			while (i < text.length && text[i] !== "\n") i += 1;
			continue;
		}
		if (ch === "/" && next === "*") {
			i += 2;
			while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i += 1;
			i = Math.min(i + 2, text.length);
			out += " ";
			continue;
		}
		out += ch;
		i += 1;
	}
	return out;
}
/** 校验并归一化单个自定义人设条目；非法时返回 null（调用方跳过）。 */
function normalizeCustomPersona(raw) {
	if (typeof raw !== "object" || raw === null) return null;
	const record = raw;
	const id = typeof record.id === "string" ? record.id.trim() : "";
	if (!id || !/^[a-z][a-z0-9_-]*$/i.test(id)) return null;
	if (BUILTIN_PERSONA_IDS.includes(id)) return null;
	const def = { id };
	if (typeof record.name === "string" && record.name.trim() !== "") def.name = record.name.trim();
	if (typeof record.base === "string" && record.base.trim() !== "") def.base = record.base.trim();
	if (typeof record.copy === "object" && record.copy !== null) {
		const copy = {};
		for (const [key, value] of Object.entries(record.copy)) {
			if (!COPY_KEYS.includes(key)) continue;
			if (Array.isArray(value) && value.length > 0 && value.every((line) => typeof line === "string" && line.trim() !== "")) copy[key] = value;
		}
		if (Object.keys(copy).length > 0) def.copy = copy;
	}
	return def;
}
/** id 去重（后到忽略）。 */
function dedupeById$1(defs) {
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const def of defs) {
		if (seen.has(def.id)) continue;
		seen.add(def.id);
		out.push(def);
	}
	return out;
}
/**
* 人设文件存取器：构造时落地模板（不存在才写，仅此一次），
* 之后 load() 每次现读——无缓存，改完文件点「重新读取」/刷新页面即生效。
*/
var PersonasStore = class {
	path;
	lastGood = [];
	lastError = null;
	constructor(path) {
		this.path = path ?? join(petDataDir(), "personas.jsonc");
		try {
			mkdirSync(dirname(this.path), { recursive: true });
		} catch {}
		const legacyPath = join(petHomeDir$2(), "anime25d-pet-personas.json");
		try {
			if (!existsSync(this.path) && existsSync(legacyPath)) copyFileSync(legacyPath, this.path);
		} catch {}
		try {
			if (!existsSync(this.path)) writeFileSync(this.path, PERSONAS_TEMPLATE, "utf8");
		} catch {}
	}
	/** 现读并解析；失败时沿用上一份好结果并给出错误消息。 */
	load() {
		let text;
		try {
			text = readFileSync(this.path, "utf8");
		} catch (error) {
			this.lastError = `无法读取 ${this.path}：${error instanceof Error ? error.message : String(error)}`;
			return {
				personas: this.lastGood,
				error: this.lastError,
				path: this.path
			};
		}
		let parsed;
		try {
			parsed = JSON.parse(stripJsonComments(text));
		} catch (error) {
			this.lastError = `JSONC 解析失败（沿用上次结果）：${error instanceof Error ? error.message : String(error)}`;
			return {
				personas: this.lastGood,
				error: this.lastError,
				path: this.path
			};
		}
		const rawList = parsed?.personas;
		if (rawList !== void 0 && !Array.isArray(rawList)) {
			this.lastError = "JSONC 结构错误：\"personas\" 必须是数组（沿用上次结果）";
			return {
				personas: this.lastGood,
				error: this.lastError,
				path: this.path
			};
		}
		const defs = Array.isArray(rawList) ? rawList : [];
		const good = [];
		const bad = [];
		for (const raw of defs) {
			const def = normalizeCustomPersona(raw);
			if (def === null) {
				bad.push(typeof raw?.id === "string" ? String(raw.id) : "?");
				continue;
			}
			good.push(def);
		}
		this.lastGood = dedupeById$1(good);
		this.lastError = bad.length > 0 ? `已跳过 ${bad.length} 个非法条目（id：${bad.join("、")}）` : null;
		return {
			personas: this.lastGood,
			error: this.lastError,
			path: this.path
		};
	}
};
//#endregion
//#region src/models-host.ts
/**
* Host 侧模型清单读取与解析：内置 presets.jsonc（JSONC 支持注释）由 Node 读取。
* 本模块不可被 client 打包引入（依赖 node:fs / node:path / node:url）。
* 共享类型与默认值见 `models.ts`。
* @module dsh-anime25d-pets/models-host
*/
/** 包根目录（从本模块位置解析：源码测试时指向仓库根，构建后 lib/ 的上一级即包根）。 */
function packageRoot() {
	return fileURLToPath(new URL("../", import.meta.url));
}
const presetsData = JSON.parse(stripJsonComments(readFileSync(join(packageRoot(), "src/presets/presets.jsonc"), "utf8")));
/** 内置策展清单（只读，来自 presets.jsonc）。 */
function listBuiltinPresets() {
	return presetsData.presets;
}
/**
* 按当前选中模型解析生效空间阈值：
* 自定义条目覆盖优先；否则内置 preset 的 `spatialTap`；再否则全局默认。
*/
function resolveSpatialTap(model, customModels) {
	const custom = customModels.find((c) => c.id === model);
	if (custom?.spatialTap) return mergeSpatialTap(custom.spatialTap);
	return mergeSpatialTap(presetsData.presets.find((p) => p.id === model)?.spatialTap);
}
/**
* 按当前选中模型解析生效动画映射：
* 自定义条目 animationMap 优先；否则内置 preset 的 animationMap；再否则默认映射。
* 只做浅合并：配置过的槽位覆盖，未配置槽位沿用默认。
*/
function resolveMotionMap(model, customModels) {
	const custom = customModels.find((c) => c.id === model);
	if (custom?.animationMap) return {
		...DEFAULT_MOTION_MAP,
		...custom.animationMap
	};
	const preset = presetsData.presets.find((p) => p.id === model);
	if (preset?.animationMap) return {
		...DEFAULT_MOTION_MAP,
		...preset.animationMap
	};
	return { ...DEFAULT_MOTION_MAP };
}
/**
* 把 `config.model` 解析为可加载的 `.psd` URL（Anime2.5DRig 模型）：
* - 已是 http(s) URL → 原样返回
* - preset id → presets.jsonc 匹配
* - 自定义模型 id → settings 用户层 customModels 匹配
* 支持 .psd / .model3.json 均可；未命中返回 null（客户端降级静态头像）。
*/
function resolveModelUrl(model, customModels) {
	if (isRemoteModelUrl(model)) return model;
	const preset = presetsData.presets.find((p) => p.id === model);
	if (preset) return preset.modelUrl;
	const custom = customModels.find((c) => c.id === model);
	if (custom) {
		if (isRemoteModelUrl(custom.modelUrl)) return custom.modelUrl;
		return localModelUrlPath(custom.id, custom.modelUrl);
	}
	return null;
}
/** DSH home 目录（与 persist.ts / personas.ts 同一规则）。 */
function petHomeDir$1() {
	return process.env.DSH_HOME ?? join(homedir(), ".dsh");
}
/** 文件头注释：每次写回时保留，提示用户这是插件私有配置。 */
const CUSTOM_MODELS_HEADER = `// 自定义模型配置文件（插件私有，JSONC 支持注释）。
// 路径：$DSH_HOME/anime25d-pet/custom-models.jsonc
// 建议通过设置面板「我的模型」增删改；直接编辑后刷新页面/重开设置即可生效。
// 字段：id / name / modelUrl / spatialTap / animationMap`;
function serializeCustomModels(models) {
	return `${CUSTOM_MODELS_HEADER}\n${JSON.stringify({ models }, null, 2)}\n`;
}
const CUSTOM_MODELS_TEMPLATE = serializeCustomModels([]);
/** 校验并归一化单个自定义模型条目；非法时返回 null（调用方跳过）。 */
function normalizeCustomModel(raw) {
	if (typeof raw !== "object" || raw === null) return null;
	const record = raw;
	const id = typeof record.id === "string" ? record.id.trim() : "";
	const name = typeof record.name === "string" ? record.name.trim() : "";
	const modelUrl = typeof record.modelUrl === "string" ? record.modelUrl.trim() : "";
	if (!id || !/^[a-z][a-z0-9_-]*$/i.test(id)) return null;
	if (!name) return null;
	if (!isSupportedModelLocation(modelUrl)) return null;
	const entry = {
		id,
		name,
		modelUrl
	};
	if (record.spatialTap && typeof record.spatialTap === "object") entry.spatialTap = record.spatialTap;
	if (record.animationMap && typeof record.animationMap === "object") entry.animationMap = record.animationMap;
	return entry;
}
/** id 去重（后到忽略）。 */
function dedupeById(models) {
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const model of models) {
		if (seen.has(model.id)) continue;
		seen.add(model.id);
		out.push(model);
	}
	return out;
}
/**
* 自定义模型文件存取器：构造时确保目录存在并落地模板（不存在才写），
* 之后 load() 每次现读；write() 由设置面板保存时调用。
*/
var CustomModelsStore = class {
	path;
	lastGood = [];
	lastError = null;
	constructor(path) {
		this.path = path ?? join(petHomeDir$1(), "anime25d-pet", "custom-models.jsonc");
		try {
			mkdirSync(dirname(this.path), { recursive: true });
		} catch {}
		try {
			if (!existsSync(this.path)) writeFileSync(this.path, CUSTOM_MODELS_TEMPLATE, "utf8");
		} catch {}
	}
	/** 现读并解析；失败时沿用上一份好结果并给出错误消息。 */
	load() {
		let text;
		try {
			text = readFileSync(this.path, "utf8");
		} catch (error) {
			this.lastError = `无法读取 ${this.path}：${error instanceof Error ? error.message : String(error)}`;
			return {
				models: this.lastGood,
				error: this.lastError,
				path: this.path
			};
		}
		let parsed;
		try {
			parsed = JSON.parse(stripJsonComments(text));
		} catch (error) {
			this.lastError = `JSONC 解析失败（沿用上次结果）：${error instanceof Error ? error.message : String(error)}`;
			return {
				models: this.lastGood,
				error: this.lastError,
				path: this.path
			};
		}
		const rawList = parsed?.models;
		if (rawList !== void 0 && !Array.isArray(rawList)) {
			this.lastError = "JSONC 结构错误：\"models\" 必须是数组（沿用上次结果）";
			return {
				models: this.lastGood,
				error: this.lastError,
				path: this.path
			};
		}
		const list = Array.isArray(rawList) ? rawList : [];
		const good = [];
		const bad = [];
		for (const raw of list) {
			const model = normalizeCustomModel(raw);
			if (model === null) {
				bad.push(typeof raw?.id === "string" ? String(raw.id) : "?");
				continue;
			}
			good.push(model);
		}
		this.lastGood = dedupeById(good);
		this.lastError = bad.length > 0 ? `已跳过 ${bad.length} 个非法条目（id：${bad.join("、")}）` : null;
		return {
			models: this.lastGood,
			error: this.lastError,
			path: this.path
		};
	}
	/** 写回自定义模型列表（设置面板保存用；保留文件头注释）。 */
	write(models) {
		const normalized = dedupeById(models.map(normalizeCustomModel).filter((m) => m !== null));
		try {
			writeFileSync(this.path, serializeCustomModels(normalized), "utf8");
			this.lastGood = normalized;
			this.lastError = null;
		} catch (error) {
			this.lastError = `写入失败 ${this.path}：${error instanceof Error ? error.message : String(error)}`;
		}
		return this.load();
	}
};
//#endregion
//#region src/persist.ts
/**
* 宠物显示偏好持久化：$DSH_HOME/anime25d-pet.json（拖动位置/尺寸）。
* v0.1 采用简单同步读写；原子写入（dsh-atomic-write）留待后续。
* @module dsh-anime25d-pets/persist
*/
const DEFAULT_DISPLAY = {
	right: 24,
	bottom: 20,
	size: 160
};
const DISPLAY_MIN = 40;
const DISPLAY_MAX = 400;
const INSET_MAX = 4e3;
function clamp(value, min, max) {
	if (Number.isFinite(value)) return Math.min(max, Math.max(min, value));
	return min;
}
/** 归一化显示配置到合法边界（持久化读取与 API 写入共用同一权威规则）。 */
function normalizeDisplay(display) {
	return {
		right: clamp(display.right, 0, INSET_MAX),
		bottom: clamp(display.bottom, 0, INSET_MAX),
		size: clamp(display.size, DISPLAY_MIN, DISPLAY_MAX)
	};
}
function petHomeDir() {
	return process.env.DSH_HOME ?? join(homedir(), ".dsh");
}
function petFile() {
	return join(petHomeDir(), "anime25d-pet.json");
}
/** 读取持久化显示配置；不存在或损坏时回退默认值。 */
function loadPetPersist() {
	try {
		const raw = JSON.parse(readFileSync(petFile(), "utf8"));
		return normalizeDisplay({
			right: raw.right ?? DEFAULT_DISPLAY.right,
			bottom: raw.bottom ?? DEFAULT_DISPLAY.bottom,
			size: raw.size ?? DEFAULT_DISPLAY.size
		});
	} catch {
		return { ...DEFAULT_DISPLAY };
	}
}
/** 保存显示配置（尽力而为，失败不阻断交互）。 */
function savePetPersist(display) {
	try {
		writeFileSync(petFile(), JSON.stringify(display, null, 2), "utf8");
	} catch {}
}
//#endregion
//#region src/service.ts
/** "完成"庆祝状态在回到空闲前的保持时长（ms）。 */
const DONE_HOLD_MS = 3500;
var PetService = class {
	ctx;
	getConfig;
	personasStore;
	customModelsStore;
	state = "idle";
	agent = "idle";
	version = 0;
	display;
	doneTimerId;
	listeners = /* @__PURE__ */ new Set();
	constructor(ctx, getConfig, personasStore, customModelsStore) {
		this.ctx = ctx;
		this.getConfig = getConfig;
		this.personasStore = personasStore;
		this.customModelsStore = customModelsStore;
		this.display = loadPetPersist();
		ctx.effect(() => () => {
			if (this.doneTimerId) clearTimeout(this.doneTimerId);
		});
		ctx.on("agent/status", (payload) => {
			const status = payload?.status;
			if (!status) return;
			this.agent = String(status);
			if (status === "running") this.set("thinking");
			else if (status === "idle" && this.state !== "done") this.set("idle");
		});
		ctx.on("agent/error", () => this.set("error"));
		ctx.on("agent/turn-stopping", () => this.setDone());
		ctx.on("approval/request", (_req, next) => {
			this.set("waiting");
			return next();
		});
	}
	/** 立即切换状态；取消未完成的"完成"保持计时。 */
	set(next) {
		if (this.doneTimerId) {
			clearTimeout(this.doneTimerId);
			this.doneTimerId = void 0;
		}
		if (this.state === next) return;
		this.state = next;
		this.version += 1;
		this.emitChange();
	}
	/** 进入"完成"并保持 DONE_HOLD_MS 后回空闲（客户端据此播庆祝动画）。 */
	setDone() {
		this.set("done");
		this.doneTimerId = setTimeout(() => {
			this.doneTimerId = void 0;
			this.set("idle");
		}, DONE_HOLD_MS);
	}
	/** 浏览器轮询用的状态快照（配置实时读取 settings 解析值；人设文件每次现读，spec §2）。 */
	snapshot() {
		const config = this.getConfig();
		const personas = this.personasStore?.load() ?? {
			personas: [],
			error: null,
			path: ""
		};
		const customModels = this.listCustomModels();
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
				fpsLimit: config.fpsLimit ?? 30,
				opacity: config.opacity ?? 1,
				persona: config.persona || "tsundere"
			},
			display: { ...this.display },
			customPersonas: personas.personas,
			personasError: personas.error,
			personasFile: personas.path,
			version: this.version
		};
	}
	/** 重新读取人设文件并推送（设置页「↻ 重新读取」按钮；version 递增触发客户端感知）。 */
	reloadPersonas() {
		const view = this.personasStore?.load() ?? {
			personas: [],
			error: null,
			path: ""
		};
		this.version += 1;
		this.emitChange();
		return view;
	}
	/** 用户自定义模型列表（设置面板模型列表的 custom 部分，Host 权威视图）。 */
	listCustomModels() {
		return this.customModelsStore?.load().models ?? this.getConfig().customModels ?? [];
	}
	/** 自定义模型文件视图（路径/错误/列表），供设置面板与“打开配置文件”使用。 */
	customModelsFile() {
		return this.customModelsStore?.load() ?? {
			models: [],
			error: null,
			path: ""
		};
	}
	/** 写回自定义模型列表（设置面板保存后调用），并推送配置变化。 */
	saveCustomModels(models) {
		const view = this.customModelsStore?.write(models) ?? {
			models,
			error: null,
			path: ""
		};
		this.version += 1;
		this.emitChange();
		return view;
	}
	/** 更新显示配置（拖动/尺寸）并持久化；数值在服务端按权威边界 clamp。 */
	setDisplay(patch) {
		this.display = normalizeDisplay({
			right: patch.right ?? this.display.right,
			bottom: patch.bottom ?? this.display.bottom,
			size: patch.size ?? this.display.size
		});
		savePetPersist(this.display);
		this.version += 1;
		this.emitChange();
		return { ...this.display };
	}
	/** 重置为默认显示配置（调试用）。 */
	resetDisplay() {
		this.display = { ...DEFAULT_DISPLAY };
		savePetPersist(this.display);
		this.version += 1;
		this.emitChange();
		return { ...this.display };
	}
	/** 订阅变化推送（状态/显示变化自动触发）；返回退订函数。 */
	onChange(listener) {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}
	/** 配置（settings 解析值）变化后由外部调用，触发一次推送（ADR-006）。 */
	notifyConfigChanged() {
		this.emitChange();
	}
	emitChange() {
		for (const listener of this.listeners) listener();
	}
};
//#endregion
//#region src/routes.ts
/** 浏览器侧宠物 API 基路径。 */
const PET_API_PREFIX = "/api/anime25d-pet";
/** 浏览器侧素材静态路由基路径（vendor 运行时脚本 + 预设模型）。 */
const PET_ASSET_PREFIX = "/pet-assets";
/** 本地模型静态路由基路径（Host 按自定义模型 id 映射到用户本地路径）。 */
const PET_LOCAL_MODELS_PREFIX = "/pet-local-models";
/** 随包暴露的素材清单（Anime2.5DRig 的 PSD 解析/装配/差分库，路径相对于 package 根）。 */
const ASSET_FILES = [
	{
		name: "vendor/ag-psd.min.js",
		mime: "text/javascript"
	},
	{
		name: "lib/rigger.js",
		mime: "text/javascript"
	},
	{
		name: "lib/genericparts.js",
		mime: "text/javascript"
	},
	{
		name: "lib/eye_close.psd",
		mime: "application/octet-stream"
	},
	{
		name: "lib/mouth_close.psd",
		mime: "application/octet-stream"
	},
	{
		name: "models/sample.psd",
		mime: "application/octet-stream"
	}
];
/** 包根目录（从本模块自身位置解析）。 */
function petPackageRoot(importMetaUrl) {
	return fileURLToPath(new URL("../", importMetaUrl));
}
function json(res, status, body) {
	res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
	res.end(JSON.stringify(body));
}
function requireMethod(req, res, method) {
	if (req.method === method) return true;
	json(res, 405, {
		ok: false,
		error: "method-not-allowed"
	});
	return false;
}
function readJsonBody(req) {
	return new Promise((resolve, reject) => {
		let size = 0;
		const chunks = [];
		req.on("data", (chunk) => {
			size += chunk.length;
			if (size > 65536) {
				reject(/* @__PURE__ */ new Error("body-too-large"));
				queueMicrotask(() => req.destroy());
				return;
			}
			chunks.push(chunk);
		});
		req.on("end", () => {
			if (chunks.length === 0) {
				resolve({});
				return;
			}
			try {
				resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
			} catch {
				reject(/* @__PURE__ */ new Error("invalid-json"));
			}
		});
		req.on("error", reject);
	});
}
function getRoute(path, run) {
	return {
		kind: "exact",
		path,
		handler: (req, res) => {
			if (!requireMethod(req, res, "GET")) return;
			run().then((value) => json(res, 200, value), (error) => {
				json(res, 500, {
					ok: false,
					error: error instanceof Error ? error.message : String(error)
				});
			});
		}
	};
}
function postRoute(path, run) {
	return {
		kind: "exact",
		path,
		handler: (req, res) => {
			if (!requireMethod(req, res, "POST")) return Promise.resolve();
			return readJsonBody(req).then((body) => {
				return run(typeof body === "object" && body !== null ? body : {}).then((value) => json(res, 200, value), (error) => json(res, 400, {
					ok: false,
					error: error instanceof Error ? error.message : String(error)
				}));
			}, (error) => {
				json(res, 400, {
					ok: false,
					error: error instanceof Error ? error.message : String(error)
				});
			});
		}
	};
}
/**
* 同一 path 上挂 GET + POST（webServer 按 path 唯一注册，不按 method 分表；
* 见 dsh-host-webserver register：duplicate exact route）。
*/
function getPostRoute(path, get, post) {
	return {
		kind: "exact",
		path,
		handler: (req, res) => {
			if (req.method === "GET") return get().then((value) => json(res, 200, value), (error) => {
				json(res, 500, {
					ok: false,
					error: error instanceof Error ? error.message : String(error)
				});
			});
			if (req.method === "POST") return readJsonBody(req).then((body) => {
				return post(typeof body === "object" && body !== null ? body : {}).then((value) => json(res, 200, value), (error) => json(res, 400, {
					ok: false,
					error: error instanceof Error ? error.message : String(error)
				}));
			}, (error) => {
				json(res, 400, {
					ok: false,
					error: error instanceof Error ? error.message : String(error)
				});
			});
			json(res, 405, {
				ok: false,
				error: "method-not-allowed"
			});
		}
	};
}
/** SSE 心跳间隔（ms）：保持空闲连接活性，防止被中间层/浏览器回收。 */
const SSE_HEARTBEAT_MS = 3e4;
/**
* SSE 状态推送端点（ADR-006）：连接即回发当前快照，之后每次服务变化
* （状态/显示/配置）推送新快照。EventSource 断线自动重连（retry 3s），
* 重连后服务端立即回发快照，客户端无需补偿拉取。
* @param onStream - 路由生命周期钩子：插件卸载时由调用方关闭全部活跃流。
*/
function sseStateRoute(path, service, onStream) {
	return {
		kind: "exact",
		path,
		handler: (req, res) => {
			if (req.method !== "GET") {
				json(res, 405, {
					ok: false,
					error: "method-not-allowed"
				});
				return;
			}
			res.writeHead(200, {
				"content-type": "text/event-stream; charset=utf-8",
				"cache-control": "no-cache, no-store",
				connection: "keep-alive",
				"x-accel-buffering": "no"
			});
			res.on("error", () => {});
			res.write("retry: 3000\n\n");
			const send = () => {
				res.write(`data: ${JSON.stringify(service.snapshot())}\n\n`);
			};
			send();
			const unsubscribe = service.onChange(send);
			const heartbeat = setInterval(() => {
				res.write(": ping\n\n");
			}, SSE_HEARTBEAT_MS);
			let closed = false;
			const close = () => {
				if (closed) return;
				closed = true;
				unsubscribe();
				clearInterval(heartbeat);
				try {
					res.end();
				} catch {}
			};
			req.on("close", close);
			res.on("close", close);
			onStream?.(close);
		}
	};
}
/** 简单 MIME 推断（本地模型资源路由用）。 */
function mimeForFile(file) {
	const lower = file.toLowerCase();
	if (lower.endsWith(".json")) return "application/json";
	if (lower.endsWith(".png")) return "image/png";
	if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
	if (lower.endsWith(".webp")) return "image/webp";
	if (lower.endsWith(".bin") || lower.endsWith(".moc3")) return "application/octet-stream";
	if (lower.endsWith(".psd")) return "application/octet-stream";
	return "application/octet-stream";
}
/** 构建完整路由族（API + SSE + 素材）供 ctx.webServer.register。 */
function makePetRoutes(deps) {
	const { service, packageRoot, settings, onStream } = deps;
	const apiRoutes = [
		sseStateRoute(`${PET_API_PREFIX}/events`, service, onStream),
		getRoute(`${PET_API_PREFIX}/state`, async () => service.snapshot()),
		getRoute(`${PET_API_PREFIX}/models`, async () => ({
			builtin: listBuiltinPresets(),
			custom: service.listCustomModels(),
			presetsPath: join(packageRoot, "src", "presets", "presets.jsonc"),
			customModelsPath: service.customModelsFile().path
		})),
		getPostRoute(`${PET_API_PREFIX}/custom-models`, async () => service.customModelsFile(), (body) => {
			const models = Array.isArray(body.models) ? body.models : [];
			return Promise.resolve(service.saveCustomModels(models));
		}),
		getPostRoute(`${PET_API_PREFIX}/settings`, async () => settings.view(), (body) => {
			const ops = Array.isArray(body.ops) ? body.ops : [];
			return settings.write(ops).then(() => settings.view());
		}),
		postRoute(`${PET_API_PREFIX}/set-display`, (body) => {
			const patch = {};
			if (typeof body.right === "number") patch.right = body.right;
			if (typeof body.bottom === "number") patch.bottom = body.bottom;
			if (typeof body.size === "number") patch.size = body.size;
			return Promise.resolve({
				ok: true,
				display: service.setDisplay(patch)
			});
		}),
		postRoute(`${PET_API_PREFIX}/reset-display`, () => Promise.resolve({
			ok: true,
			display: service.resetDisplay()
		})),
		postRoute(`${PET_API_PREFIX}/reload-personas`, () => {
			const view = service.reloadPersonas();
			return Promise.resolve({
				ok: true,
				personas: view.personas,
				error: view.error,
				file: view.path
			});
		})
	];
	const localModelRoute = {
		kind: "prefix",
		path: PET_LOCAL_MODELS_PREFIX,
		handler: (req, res) => {
			if (req.method !== "GET" && req.method !== "HEAD") {
				res.writeHead(405);
				res.end();
				return Promise.resolve();
			}
			const parts = new URL(req.url ?? "/", "http://localhost").pathname.split("/").filter(Boolean);
			if (parts.length < 3) {
				res.writeHead(404);
				res.end();
				return Promise.resolve();
			}
			const id = decodeURIComponent(parts[1]);
			const relativePath = parts.slice(2).map(decodeURIComponent).join("/");
			const entry = service.listCustomModels().find((c) => c.id === id);
			if (!entry || !isLocalModelPath(entry.modelUrl)) {
				res.writeHead(404);
				res.end();
				return Promise.resolve();
			}
			const file = resolveLocalModelFile(entry.modelUrl, relativePath);
			if (!file) {
				res.writeHead(404);
				res.end();
				return Promise.resolve();
			}
			return readFile(file).then((body) => {
				res.writeHead(200, {
					"content-type": mimeForFile(file),
					"content-length": String(body.byteLength),
					"cache-control": "no-cache"
				});
				if (req.method === "HEAD") {
					res.end();
					return;
				}
				res.end(body);
			}, () => {
				res.writeHead(404);
				res.end();
			});
		}
	};
	const assetRoutes = ASSET_FILES.map((file) => ({
		kind: "exact",
		path: `${PET_ASSET_PREFIX}/${file.name}`,
		handler: (req, res) => {
			if (req.method !== "GET" && req.method !== "HEAD") {
				res.writeHead(405);
				res.end();
				return;
			}
			return readFile(join(packageRoot, "assets", file.name)).then((body) => {
				res.writeHead(200, {
					"content-type": file.mime,
					"content-length": String(body.byteLength),
					"cache-control": "no-cache"
				});
				if (req.method === "HEAD") {
					res.end();
					return;
				}
				res.end(body);
			}, () => {
				res.writeHead(404);
				res.end();
			});
		}
	}));
	return [
		...apiRoutes,
		...assetRoutes,
		localModelRoute
	];
}
//#endregion
//#region src/index.ts
/** 稳定 cordis 插件名（对应 cordis.patch.yml insert id）。 */
/** 使用 Anime2.5DRig PSD 模型替代 Live2D。 */
const name = "anime25d-pet";
/** settings namespace（settings.yaml 用户层 section 名）。 */
const SETTINGS_NAMESPACE = "anime25d-pet";
/** settings namespace（DSH 0.1.2+ 直接使用字符串，运行时不再导出 settingsNamespace；
* 这里仅做类型断言以兼容旧版 dsh-settings 的 Branded<SettingsNamespace>。 */
const NS = SETTINGS_NAMESPACE;
const Config = Schema.object({
	enabled: Schema.boolean().default(true),
	size: Schema.number().min(40).max(400).default(160),
	model: Schema.string().default("sample"),
	developerMode: Schema.boolean().default(false),
	debug: Schema.boolean().default(false),
	showTapZones: Schema.boolean().default(false),
	animeParams: Schema.object({}).default({}),
	talk: Schema.boolean().default(false),
	rand: Schema.boolean().default(false),
	flip: Schema.boolean().default(false),
	fpsLimit: Schema.number().min(0).max(60).default(30),
	opacity: Schema.number().min(0).max(1).default(1),
	persona: Schema.string().default("tsundere")
});
/** 依赖服务：webServer（同源路由）、settings（namespace 注册与解析）。 */
const inject = ["webServer", "settings"];
/** 注册宠物服务、settings namespace 及其 API + 素材路由。 */
function apply(ctx, config) {
	ctx.settings.register(NS, Config, { base: config });
	const resolveConfig = () => {
		return ctx.settings.get(NS) ?? config;
	};
	const customModelsStore = new CustomModelsStore();
	const initialConfig = resolveConfig();
	if (initialConfig.customModels?.length && customModelsStore.load().models.length === 0) customModelsStore.write(initialConfig.customModels);
	const service = new PetService(ctx, resolveConfig, new PersonasStore(), customModelsStore);
	const settingsApi = {
		view: () => ({
			value: resolveConfig(),
			writable: ctx.settings.writable
		}),
		write: (ops) => ctx.settings.mutate(NS, ops).then(() => {
			service.notifyConfigChanged();
		})
	};
	ctx.effect(() => {
		const openStreams = /* @__PURE__ */ new Set();
		const disposers = makePetRoutes({
			service,
			packageRoot: petPackageRoot(import.meta.url),
			settings: settingsApi,
			onStream: (close) => {
				openStreams.add(close);
			}
		}).map((route) => ctx.webServer.register(route));
		return () => {
			for (const close of openStreams) close();
			for (const dispose of disposers) dispose();
		};
	}, "anime25d-pet: routes");
}
//#endregion
export { ANIMATION_SLOTS, Config, DEFAULT_MOTION_MAP, DEFAULT_SPATIAL_TAP, PET_API_PREFIX, PET_ASSET_PREFIX, PetService, SETTINGS_NAMESPACE, apply, inject, listBuiltinPresets, makePetRoutes, mergeSpatialTap, name, petPackageRoot, resolveModelUrl, resolveMotionMap, resolveSpatialTap };
