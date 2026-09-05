window.__ModuleLoader__.load({
	id: "dsh-anime25d-pets",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
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
		/**
		* 按当前选中模型解析生效空间阈值/动画映射/URL 的 host 侧实现见 `models-host.ts`，
		* 该模块读取 presets.jsonc（JSONC 支持注释），仅供 Node 侧使用。
		*/
		//#endregion
		//#region src/persona-shared.ts
		/** 默认人设 id。 */
		const DEFAULT_PERSONA_ID = "tsundere";
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
		//#endregion
		//#region src/client/personas.ts
		/** 内置人设（顺序即设置页下拉顺序）。 */
		const BUILTIN_PERSONAS = [
			{
				id: "tsundere",
				name: "傲娇",
				copy: {
					idle: ["闲、闲着才不是在等你！", "别、别一直盯着看啊！"],
					error: ["哼，才不是我搞坏的！…要看就快看啦！", "出错了…怎、怎么办啊笨蛋！"],
					done: ["搞定了！…才不是为了求夸奖！", "哼，这点小事轻轻松松啦！"],
					thinking1: ["思考中…", "让我想想…"],
					thinking2: ["还在想…", "让我再理理思路…"],
					thinking3: ["这个问题有点东西…", "快了快了…"],
					waiting1: ["等你拍板~", "你决定了叫我，哼！"],
					waiting2: ["不着急…谁说我着急了！", "慢慢想，我才没有等很烦！"],
					waiting3: ["我先眯一会儿，好了叫我", "等这么久…你欠我一次摸头！"],
					tapHead: [
						"哼、哼才不是舒服呢！",
						"就、就允许你摸一下头！",
						"再摸…也、也不是不行啦！",
						"头、头发要乱了笨蛋！",
						"别、别摸太久啊！"
					],
					tapLeg: [
						"哼！才不是给你摸的！",
						"笨蛋！谁让你碰腿了！",
						"腿、腿很敏感的！",
						"再碰腿就、就生气了！",
						"走开啦，笨手笨脚！"
					],
					tapArm: [
						"牵、牵手才没有很开心！",
						"击掌就击掌，笨蛋！",
						"手、手汗都沾上了啦！",
						"拉我就拉，别得意！",
						"松开…才不是舍不得！"
					],
					tapBody: [
						"摸、摸够了没有！",
						"再乱摸真生气了哦，笨蛋！",
						"身体…才不是软软的！",
						"戳哪里啊你！",
						"够了够了，一边去！"
					]
				}
			},
			{
				id: "genki",
				name: "元气",
				copy: {
					idle: ["元气满满待机中！", "今天也要一起冲鸭！"],
					error: ["呜哇出错了！马上重整旗鼓！", "哎呀翻车了…再来一次一定行！"],
					done: ["搞定啦！我最棒吧！", "任务完成！给我鼓掌！"],
					thinking1: ["收到！速速思考中！", "让我想想哦！"],
					thinking2: ["还在想，马上就好！", "灵感快来快来！"],
					thinking3: ["这关有点难，但我不怕！", "冲冲冲，快打通了！"],
					waiting1: ["等你拍板哦！", "你决定我们就出发！"],
					waiting2: ["不急不急，我原地待命！", "慢慢想，我做个操等你！"],
					waiting3: ["等好久啦…我先充个电！", "呼…睡了一觉你还没好吗！"],
					tapHead: [
						"好舒服再来再来！",
						"摸头头能量满格！",
						"呼噜呼噜~还要！",
						"头好酥，我起飞啦！",
						"再摸我变超级元气！"
					],
					tapLeg: [
						"痒痒痒哈哈别闹！",
						"腿腿要跑掉啦！",
						"别挠啦我站不稳！",
						"哈哈腿在抗议哦！",
						"再碰我就蹦起来！"
					],
					tapArm: [
						"击掌！耶！",
						"牵手手出发喽！",
						"手手充电成功！",
						"拉我冲鸭！",
						"击掌再来一次！"
					],
					tapBody: [
						"嘿嘿好痒！",
						"再戳我要跳起来啦！",
						"肚子不许偷袭！",
						"嘿嘿被抓到啦！",
						"再戳我就抱住你！"
					]
				}
			},
			{
				id: "airhead",
				name: "天然呆",
				copy: {
					idle: ["发呆中…咦我在哪…", "咦…刚才想说什么来着…"],
					error: ["咦？坏掉了诶…", "出错了…要、要怎么办来着…"],
					done: ["咦，做好了吗？", "完成…啦？要夸夸我哦…"],
					thinking1: ["想想想中…", "让我想想哦…"],
					thinking2: ["还、还没想出来…", "咦，刚才想到哪了…"],
					thinking3: ["想了好久，肚子饿了…", "这个…好难诶…"],
					waiting1: ["等你来决定哦…", "你慢慢想，我不急的…"],
					waiting2: ["咦，你还在想吗…", "我也一起想…想着想着…"],
					waiting3: ["咦…你还在吗…我先睡了…", "呼…睡着了…别忘了我哦…"],
					tapHead: [
						"咦，好舒服…",
						"摸头…会变聪明吗…",
						"头…暖暖的…",
						"再摸一下下…可以吗…",
						"咦，我在被摸头…"
					],
					tapLeg: [
						"咦，那是腿…",
						"痒痒…哈哈哈…",
						"腿…为什么会笑…",
						"别挠…会站不稳…",
						"咦嘿嘿…脚麻了…"
					],
					tapArm: [
						"牵手…好哦…",
						"击掌…啪…",
						"手…好大…",
						"牵着…就不会迷路吧…",
						"咦，我们在击掌吗…"
					],
					tapBody: [
						"咦嘿嘿…",
						"别戳啦，会歪掉的…",
						"身体…软软的吗…",
						"咦，那里是哪里…",
						"再戳…我会飘走哦…"
					]
				}
			},
			{
				id: "kuudere",
				name: "三无",
				copy: {
					idle: ["在。", "无事。"],
					error: ["出错。需要你。", "异常。原因不明。"],
					done: ["完成。", "结束了。"],
					thinking1: ["思考中。", "解析。"],
					thinking2: ["仍在思考。", "继续。"],
					thinking3: ["难度：高。", "尚未结束。"],
					waiting1: ["等待指示。", "待命。"],
					waiting2: ["继续等待。", "无限期待机也可。"],
					waiting3: ["休眠中。可唤醒。", "你回来了。"],
					tapHead: [
						"…舒服。",
						"许可。",
						"继续。",
						"无异议。",
						"记录：摸头。"
					],
					tapLeg: [
						"…无感。",
						"别碰。会掉。",
						"腿。静止。",
						"无效输入。",
						"已忽略。"
					],
					tapArm: [
						"牵手。可以。",
						"击掌。啪。",
						"手部接触。确认。",
						"握力。适中。",
						"结束随意。"
					],
					tapBody: [
						"…随便。",
						"反应：微弱。",
						"躯干。触碰。",
						"无评论。",
						"…嗯。"
					]
				}
			},
			{
				id: "healing",
				name: "温柔治愈",
				copy: {
					idle: ["一直陪着你哦~", "需要我的时候说一声~"],
					error: ["出错了呢…一起看看好吗？", "别急，我们慢慢来~"],
					done: ["做好啦，辛苦你了~", "完成了，休息一下吧~"],
					thinking1: ["我想想哦…", "交给我吧~"],
					thinking2: ["还在想，不急哦…", "快好了，等我一下下~"],
					thinking3: ["这个问题好认真…", "马上就通了，再等等我~"],
					waiting1: ["等你决定哦，慢慢来~", "你想好再叫我~"],
					waiting2: ["不着急，我陪你想~", "慢慢考虑，我一直都在~"],
					waiting3: ["等久了呢…我先眯一下，你叫我哦~", "辛苦啦，慢慢来~"],
					tapHead: [
						"摸头好舒服~嗯~",
						"最喜欢摸头了~",
						"温柔的手掌~真好~",
						"再摸一会儿好吗~",
						"头靠着你就安心~"
					],
					tapLeg: [
						"腿腿也会害羞的~",
						"轻轻的哦~",
						"别怕，慢慢来~",
						"痒痒的…好可爱~",
						"腿也想被照顾呢~"
					],
					tapArm: [
						"牵手~好温暖~",
						"击掌！耶~",
						"手心暖暖的~",
						"牵着就不害怕了~",
						"再击一次掌吧~"
					],
					tapBody: [
						"嘿嘿~今天累了吗？",
						"温柔一点哦~",
						"抱抱也可以的哦~",
						"戳戳…在听你说话~",
						"身体也想被安慰呢~"
					]
				}
			},
			{
				id: "yandere",
				name: "病娇",
				copy: {
					idle: ["一直看着你哦…", "你不在的话…会很寂寞的…"],
					error: ["谁弄坏的…告诉我名字…", "坏掉了…不过，还有我在…"],
					done: ["只为你做的哦…", "完成…只夸我一个人…"],
					thinking1: ["为了你，思考中…", "想想怎么帮你…"],
					thinking2: ["还没想完…不要走开哦…", "再等一下下就好…"],
					thinking3: ["想太久了…对不起…", "快好了…别离开我…"],
					waiting1: ["等你的答复…一直等…", "你不回我…会寂寞死的…"],
					waiting2: ["不急…我很有耐心…", "慢慢想…但别丢下我…"],
					waiting3: ["还没好吗…你不会走吧…", "我一直、一直在这里哦…"],
					tapHead: [
						"摸头…只准你摸哦…",
						"嘿嘿…再摸嘛…",
						"摸头…就属于我了…",
						"再摸…不许停…",
						"头…记住你的手温了…"
					],
					tapLeg: [
						"那里…只属于你…",
						"再摸…就缠上你了哦…",
						"腿…逃不掉的…",
						"碰这里…不许看别人…",
						"再摸…就绑住你…"
					],
					tapArm: [
						"牵住…就不放手了…",
						"击掌…约定好了哦…",
						"手…永远牵着…",
						"松开试试？做不到吧…",
						"击掌…生死契约…"
					],
					tapBody: [
						"嘿嘿…最喜欢你了…",
						"再摸…要给你更多哦…",
						"身体…全是你的…",
						"再戳…就吃掉你…",
						"摸够了吗…我还没有…"
					]
				}
			}
		];
		/** 内置人设下拉清单（id + 中文名）。 */
		function builtinPersonaOptions() {
			return BUILTIN_PERSONAS.map(({ id, name }) => ({
				id,
				name
			}));
		}
		function builtinCopy(id) {
			const hit = BUILTIN_PERSONAS.find((p) => p.id === id);
			return hit ? hit.copy : null;
		}
		/** base 继承链解析深度上限（防自定义 id 互相环引用）。 */
		const BASE_CHAIN_LIMIT = 5;
		/**
		* 解析某个人设 id 的完整台词表：内置直接取；自定义沿 base 链逐层覆盖
		* （自定义 → 其 base → … → 内置），未覆盖的池沿用上一层，最终兜底默认人设。
		*/
		function resolvePersonaCopy(id, customPersonas) {
			const byId = new Map(customPersonas.map((p) => [p.id, p]));
			const chain = [];
			let cursor = id;
			for (let depth = 0; depth < BASE_CHAIN_LIMIT; depth += 1) {
				const def = cursor === void 0 ? void 0 : byId.get(cursor);
				if (!def) break;
				chain.unshift(def);
				cursor = def.base;
			}
			const table = { ...builtinCopy(cursor && builtinCopy(cursor) ? cursor : "tsundere") ?? builtinCopy("tsundere") };
			for (const def of chain) if (def.copy) Object.assign(table, def.copy);
			return table;
		}
		//#endregion
		//#region src/client/settings.ts
		/**
		* 桌宠配置设置页（`settings.section` 注册体，spec §2）。
		* 设置项：开关 / 尺寸滑杆 / Anime2.5DRig 参数滑块 / 人设 / 模型列表（内置只读 + 自定义增删改）/ 调试模式。
		* 读写经插件自己的同源 API `/api/anime25d-pet/settings`（Host 直连 ctx.settings，
		* 持久化到 settings.yaml 用户层）——不走 client settingsScope wire，因为
		* dsh-host-apiproxy 只把内置 allowlist 的 namespace 暴露给浏览器
		* （见 docs/research/settings-tab.md「设置服务不可用」根因）。
		* 不引入任何非平台模块值导入。
		* @module dsh-anime25d-pets/client/settings
		*/
		const DEFAULT_VALUE = {
			enabled: true,
			size: 160,
			model: "sample",
			developerMode: false,
			debug: false,
			showTapZones: false,
			persona: "tsundere",
			fpsLimit: 30,
			opacity: 1
		};
		const EMPTY_SPATIAL_DRAFT = {
			headMaxNy: "",
			legMinNy: "",
			armMinNy: "",
			headMinNx: "",
			headMaxNx: "",
			bodyMinNx: "",
			bodyMaxNx: "",
			armLeftMinNx: "",
			armRightMaxNx: ""
		};
		const SPATIAL_FIELD_LABELS = [
			{
				key: "headMaxNy",
				label: "头下沿",
				hint: String(DEFAULT_SPATIAL_TAP.headMaxNy)
			},
			{
				key: "legMinNy",
				label: "腿上沿",
				hint: String(DEFAULT_SPATIAL_TAP.legMinNy)
			},
			{
				key: "armMinNy",
				label: "手臂顶",
				hint: String(DEFAULT_SPATIAL_TAP.armMinNy)
			},
			{
				key: "headMinNx",
				label: "头左",
				hint: String(DEFAULT_SPATIAL_TAP.headMinNx)
			},
			{
				key: "headMaxNx",
				label: "头右",
				hint: String(DEFAULT_SPATIAL_TAP.headMaxNx)
			},
			{
				key: "bodyMinNx",
				label: "身左",
				hint: String(DEFAULT_SPATIAL_TAP.bodyMinNx)
			},
			{
				key: "bodyMaxNx",
				label: "身右",
				hint: String(DEFAULT_SPATIAL_TAP.bodyMaxNx)
			},
			{
				key: "armLeftMinNx",
				label: "左臂左",
				hint: String(DEFAULT_SPATIAL_TAP.armLeftMinNx)
			},
			{
				key: "armRightMaxNx",
				label: "右臂右",
				hint: String(DEFAULT_SPATIAL_TAP.armRightMaxNx)
			}
		];
		/** 动画映射槽位中文名（设置页「动画映射」表单）。 */
		const ANIMATION_SLOT_LABELS = {
			idle: "空闲",
			thinking: "思考",
			error: "出错",
			done: "完成",
			waiting: "等待审批",
			head: "摸头",
			leg: "摸腿",
			arm: "摸手",
			body: "摸身体"
		};
		/** 动画映射草稿 → 存储对象；全空返回 undefined（不写字段）。 */
		function motionMapFromDraft(draft) {
			const out = {};
			for (const slot of ANIMATION_SLOTS) {
				const groups = (draft[slot] ?? []).filter(Boolean);
				if (groups.length > 0) out[slot] = groups;
			}
			return Object.keys(out).length > 0 ? out : void 0;
		}
		/** 存储对象 → 表单草稿（未配置槽位为空数组）。 */
		function draftFromMotionMap(m) {
			const draft = {};
			for (const slot of ANIMATION_SLOTS) draft[slot] = [...m?.[slot] ?? []];
			return draft;
		}
		/** 获取 Anime2.5DRig 可用的动作组名列表（内置预设动作，不依赖外部 JSON）。 */
		async function fetchMotionGroups() {
			return [
				"Idle",
				"Thinking",
				"Working",
				"Failed",
				"Sad",
				"Jumping",
				"Done",
				"Waiting",
				"TapHead",
				"TapBody",
				"TapLeg",
				"TapArm"
			];
		}
		function draftFromOverride(o) {
			return {
				headMaxNy: o?.headMaxNy != null ? String(o.headMaxNy) : "",
				legMinNy: o?.legMinNy != null ? String(o.legMinNy) : "",
				armMinNy: o?.armMinNy != null ? String(o.armMinNy) : "",
				headMinNx: o?.headMinNx != null ? String(o.headMinNx) : "",
				headMaxNx: o?.headMaxNx != null ? String(o.headMaxNx) : "",
				bodyMinNx: o?.bodyMinNx != null ? String(o.bodyMinNx) : o?.armLeftMaxNx != null ? String(o.armLeftMaxNx) : "",
				bodyMaxNx: o?.bodyMaxNx != null ? String(o.bodyMaxNx) : o?.armRightMinNx != null ? String(o.armRightMinNx) : "",
				armLeftMinNx: o?.armLeftMinNx != null ? String(o.armLeftMinNx) : "",
				armRightMaxNx: o?.armRightMaxNx != null ? String(o.armRightMaxNx) : ""
			};
		}
		/** 草稿 → 覆盖对象；全空则 undefined（不写字段）。 */
		function overrideFromDraft(d) {
			const out = {};
			for (const { key } of SPATIAL_FIELD_LABELS) {
				const raw = d[key].trim();
				if (!raw) continue;
				const n = Number(raw);
				if (!Number.isFinite(n)) continue;
				out[key] = Math.min(1, Math.max(0, n));
			}
			return Object.keys(out).length > 0 ? out : void 0;
		}
		const SETTINGS_API = "/api/anime25d-pet/settings";
		const MODELS_API = "/api/anime25d-pet/models";
		const CUSTOM_MODELS_API = "/api/anime25d-pet/custom-models";
		const STATE_API = "/api/anime25d-pet/state";
		const RELOAD_PERSONAS_API = "/api/anime25d-pet/reload-personas";
		const rowStyle = {
			padding: "10px 12px",
			marginBottom: 8,
			borderRadius: 8,
			background: "rgba(128,128,128,.08)"
		};
		const labelStyle = {
			display: "flex",
			alignItems: "center",
			gap: 8,
			cursor: "pointer",
			flex: 1,
			minWidth: 0
		};
		const linkStyle = {
			color: "inherit",
			fontSize: 12,
			marginLeft: 8
		};
		const buttonStyle = {
			marginLeft: 6,
			padding: "2px 10px",
			borderRadius: 6,
			cursor: "pointer",
			fontSize: 12,
			background: "rgba(128,128,128,.14)",
			color: "inherit",
			border: "none"
		};
		/** 自定义模型“空间分区覆盖 / 动画映射”tab 样式。 */
		const panelTabStyle = {
			...buttonStyle,
			marginLeft: 0,
			padding: "4px 12px",
			borderRadius: 6
		};
		const panelTabActiveStyle = {
			...panelTabStyle,
			background: "rgba(120,170,255,.26)",
			color: "#fff"
		};
		/** 分组标题右侧的链接型操作（蓝色、hover 下划线），与“打开内置模型配置文件”一致。 */
		function headerLink(text, onClick) {
			return (0, react.createElement)("a", {
				href: "#",
				style: {
					color: "#4a9eff",
					fontSize: 12,
					textDecoration: "none",
					cursor: "pointer"
				},
				onMouseEnter: (e) => {
					e.currentTarget.style.textDecoration = "underline";
				},
				onMouseLeave: (e) => {
					e.currentTarget.style.textDecoration = "none";
				},
				onClick: (e) => {
					e.preventDefault();
					onClick();
				}
			}, text);
		}
		/**
		* 滑块 pending 草稿 hook：
		* - 拖动时只更新本地 draft，松手/失焦才提交
		* - 提交后保留 pending，等配置回写成同一值时再清空，避免 UI 闪回旧值
		*/
		function usePendingRange(currentValue, onCommit, equals = (a, b) => a === b) {
			const [draft, setDraft] = (0, react.useState)(null);
			const [pending, setPending] = (0, react.useState)(null);
			const equalsRef = (0, react.useRef)(equals);
			equalsRef.current = equals;
			(0, react.useEffect)(() => {
				if (draft === null) return;
				if (pending !== null && equalsRef.current(currentValue, pending)) {
					setDraft(null);
					setPending(null);
				}
			}, [
				currentValue,
				draft,
				pending
			]);
			const value = draft ?? pending ?? currentValue;
			const commit = () => {
				if (draft === null) return;
				const next = draft;
				setPending(next);
				onCommit(next);
			};
			return {
				value,
				draft,
				setDraft,
				commit
			};
		}
		const inputStyle = {
			padding: "6px 8px",
			borderRadius: 6,
			border: "1px solid rgba(128,128,128,.35)",
			background: "transparent",
			color: "inherit",
			fontSize: 13,
			minWidth: 0,
			flex: 1
		};
		function spatialTapFields(draft, setDraft, disabled) {
			return (0, react.createElement)("div", { style: {
				display: "grid",
				gridTemplateColumns: "repeat(auto-fill,minmax(88px,1fr))",
				gap: 6,
				marginTop: 8
			} }, ...SPATIAL_FIELD_LABELS.map(({ key, label, hint }) => (0, react.createElement)("label", {
				key,
				style: {
					display: "flex",
					flexDirection: "column",
					gap: 2,
					fontSize: 11,
					color: "#888"
				}
			}, `${label} (默认 ${hint})`, (0, react.createElement)("input", {
				style: {
					...inputStyle,
					width: "100%",
					boxSizing: "border-box"
				},
				inputMode: "decimal",
				placeholder: hint,
				disabled,
				value: draft[key],
				onChange: (e) => setDraft({
					...draft,
					[key]: e.target.value
				})
			}))));
		}
		/** 动画映射表单：9 个槽位各一个多选下拉；解析失败时显示重试。 */
		function motionMapFields(draft, setDraft, groups, status, disabled, onRetry) {
			const options = groups.map((g) => ({
				id: g,
				name: g
			}));
			const statusLine = status === "loading" ? "正在解析模型动画列表…" : status === "error" ? "无法解析动画列表，可稍后重试（模型仍可保存）" : status === "ready" ? `已解析到 ${groups.length} 个动作组；多选=触发时随机选一个` : "打开后实时解析模型动画列表；未配置的槽位沿用默认映射。";
			return (0, react.createElement)("div", { style: {
				marginTop: 8,
				display: "grid",
				gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
				gap: "8px 10px"
			} }, (0, react.createElement)("div", { style: {
				gridColumn: "1 / -1",
				display: "flex",
				alignItems: "center",
				gap: 6,
				fontSize: 11,
				color: "#888"
			} }, (0, react.createElement)("span", null, statusLine), status === "error" && onRetry ? (0, react.createElement)("button", {
				type: "button",
				style: buttonStyle,
				onClick: onRetry
			}, "重试") : null), ...ANIMATION_SLOTS.map((slot) => (0, react.createElement)("label", {
				key: slot,
				style: {
					display: "flex",
					flexDirection: "column",
					gap: 2,
					fontSize: 12,
					minWidth: 0
				}
			}, (0, react.createElement)("span", { style: { color: "#888" } }, ANIMATION_SLOT_LABELS[slot]), (0, react.createElement)(ThemeMultiSelect, {
				value: draft[slot] ?? [],
				options,
				disabled: disabled || status !== "ready",
				placeholder: "未配置（用默认）",
				onChange: (next) => setDraft({
					...draft,
					[slot]: next
				})
			}))));
		}
		/** 选中态强调色（与设置页其它高亮一致，贴近系统 radio 蓝点观感）。 */
		const RADIO_ACCENT = "rgba(90,150,255,.95)";
		const RADIO_RING = "rgba(160,160,170,.75)";
		/** 自绘圆点：帧率档与模型列表共用，避免原生 radio 深色主题白框。 */
		function ThemeRadioDot(props) {
			const { selected } = props;
			return (0, react.createElement)("span", {
				"aria-hidden": true,
				style: {
					width: 14,
					height: 14,
					borderRadius: "50%",
					boxSizing: "border-box",
					border: `1.5px solid ${selected ? RADIO_ACCENT : RADIO_RING}`,
					background: "transparent",
					display: "inline-flex",
					alignItems: "center",
					justifyContent: "center",
					flexShrink: 0
				}
			}, selected ? (0, react.createElement)("span", { style: {
				width: 6,
				height: 6,
				borderRadius: "50%",
				background: RADIO_ACCENT
			} }) : null);
		}
		/** 可点的圆点 + 文案行（帧率横排 / 模型行复用）。 */
		function ThemeRadioOption(props) {
			const { selected, disabled, onSelect, children, style } = props;
			return (0, react.createElement)("button", {
				type: "button",
				role: "radio",
				"aria-checked": selected,
				disabled: !!disabled,
				onClick: () => {
					if (!disabled && !selected) onSelect();
				},
				style: {
					display: "inline-flex",
					alignItems: "center",
					gap: 8,
					margin: 0,
					padding: 0,
					border: "none",
					background: "transparent",
					color: "inherit",
					font: "inherit",
					fontSize: 13,
					cursor: disabled ? "not-allowed" : "pointer",
					outline: "none",
					minWidth: 0,
					...style
				}
			}, (0, react.createElement)(ThemeRadioDot, { selected }), children);
		}
		/** 自绘 switch：用于开发者选项总开关等“组标题右侧开关”场景。 */
		function ThemeSwitch(props) {
			const { checked, disabled, onChange } = props;
			return (0, react.createElement)("button", {
				type: "button",
				role: "switch",
				"aria-checked": checked,
				disabled: !!disabled,
				onClick: () => {
					if (!disabled) onChange(!checked);
				},
				style: {
					position: "relative",
					width: 38,
					height: 20,
					flexShrink: 0,
					padding: 0,
					border: "none",
					borderRadius: 10,
					cursor: disabled ? "not-allowed" : "pointer",
					background: checked ? RADIO_ACCENT : "rgba(128,128,128,.35)",
					opacity: disabled ? .55 : 1,
					transition: "background .15s",
					outline: "none"
				}
			}, (0, react.createElement)("span", { style: {
				position: "absolute",
				top: 2,
				left: checked ? 20 : 2,
				width: 16,
				height: 16,
				borderRadius: "50%",
				background: "#fff",
				boxShadow: "0 1px 3px rgba(0,0,0,.4)",
				transition: "left .15s"
			} }));
		}
		/**
		* 自绘下拉：原生 select 在 Windows 深色主题下会出焦点白框与 options 底部白线，
		* UA 弹出层几乎不可主题化，故用同色板菜单替代。
		*/
		function ThemeSelect(props) {
			const { value, options, disabled, onChange } = props;
			const [open, setOpen] = (0, react.useState)(false);
			const rootRef = (0, react.useRef)(null);
			const label = options.find((o) => o.id === value)?.name ?? value;
			(0, react.useEffect)(() => {
				if (!open) return;
				const onDoc = (e) => {
					if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
				};
				const onKey = (e) => {
					if (e.key === "Escape") setOpen(false);
				};
				document.addEventListener("pointerdown", onDoc);
				document.addEventListener("keydown", onKey);
				return () => {
					document.removeEventListener("pointerdown", onDoc);
					document.removeEventListener("keydown", onKey);
				};
			}, [open]);
			return (0, react.createElement)("div", {
				ref: rootRef,
				style: {
					position: "relative",
					flex: 1,
					minWidth: 0
				}
			}, (0, react.createElement)("button", {
				type: "button",
				disabled: !!disabled,
				"aria-haspopup": "listbox",
				"aria-expanded": open,
				onClick: () => {
					if (!disabled) setOpen((v) => !v);
				},
				style: {
					...inputStyle,
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 8,
					width: "100%",
					textAlign: "left",
					cursor: disabled ? "not-allowed" : "pointer",
					background: "rgba(128,128,128,.14)",
					outline: "none",
					boxShadow: "none",
					opacity: disabled ? .55 : 1
				}
			}, (0, react.createElement)("span", { style: {
				overflow: "hidden",
				textOverflow: "ellipsis",
				whiteSpace: "nowrap"
			} }, label), (0, react.createElement)("span", { style: {
				color: "#888",
				fontSize: 10,
				flexShrink: 0
			} }, open ? "▴" : "▾")), open && (0, react.createElement)("div", {
				role: "listbox",
				style: {
					position: "absolute",
					left: 0,
					right: 0,
					top: "calc(100% + 4px)",
					zIndex: 20,
					margin: 0,
					padding: 4,
					borderRadius: 8,
					border: "1px solid rgba(128,128,128,.35)",
					background: "#2a2a2e",
					color: "#e8e8ec",
					boxShadow: "0 8px 24px rgba(0,0,0,.45)",
					maxHeight: 240,
					overflowY: "auto"
				}
			}, options.map((o) => {
				const selected = o.id === value;
				return (0, react.createElement)("button", {
					key: o.id,
					type: "button",
					role: "option",
					"aria-selected": selected,
					onClick: () => {
						onChange(o.id);
						setOpen(false);
					},
					style: {
						display: "block",
						width: "100%",
						margin: 0,
						padding: "6px 10px",
						border: "none",
						borderRadius: 6,
						textAlign: "left",
						cursor: "pointer",
						fontSize: 13,
						color: "#e8e8ec",
						background: selected ? "rgba(120,170,255,.28)" : "transparent",
						outline: "none"
					},
					onMouseEnter: (e) => {
						if (!selected) e.currentTarget.style.background = "rgba(128,128,128,.22)";
					},
					onMouseLeave: (e) => {
						e.currentTarget.style.background = selected ? "rgba(120,170,255,.28)" : "transparent";
					}
				}, o.name);
			})));
		}
		/** 多选下拉：选中项以 tag 展示在主按钮内；点击下拉项切换选中，保持打开以支持连续多选。 */
		function ThemeMultiSelect(props) {
			const { value, options, disabled, placeholder, onChange } = props;
			const [open, setOpen] = (0, react.useState)(false);
			const rootRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				if (!open) return;
				const onDoc = (e) => {
					if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
				};
				const onKey = (e) => {
					if (e.key === "Escape") setOpen(false);
				};
				document.addEventListener("pointerdown", onDoc);
				document.addEventListener("keydown", onKey);
				return () => {
					document.removeEventListener("pointerdown", onDoc);
					document.removeEventListener("keydown", onKey);
				};
			}, [open]);
			const nameOf = (id) => options.find((o) => o.id === id)?.name ?? id;
			return (0, react.createElement)("div", {
				ref: rootRef,
				style: {
					position: "relative",
					flex: 1,
					minWidth: 0
				}
			}, (0, react.createElement)("button", {
				type: "button",
				disabled: !!disabled,
				"aria-haspopup": "listbox",
				"aria-expanded": open,
				onClick: () => {
					if (!disabled) setOpen((v) => !v);
				},
				style: {
					...inputStyle,
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 8,
					width: "100%",
					minHeight: 34,
					textAlign: "left",
					cursor: disabled ? "not-allowed" : "pointer",
					background: "rgba(128,128,128,.14)",
					outline: "none",
					boxShadow: "none",
					opacity: disabled ? .55 : 1
				}
			}, (0, react.createElement)("span", { style: {
				display: "flex",
				flexWrap: "wrap",
				gap: 4,
				alignItems: "center",
				flex: 1,
				minWidth: 0
			} }, value.length === 0 ? (0, react.createElement)("span", { style: { color: "#888" } }, placeholder ?? "选择动作组") : value.map((id) => (0, react.createElement)("span", {
				key: id,
				style: {
					padding: "1px 6px",
					borderRadius: 4,
					background: "rgba(120,170,255,.22)",
					color: "#dbe7ff",
					fontSize: 11,
					whiteSpace: "nowrap"
				}
			}, nameOf(id)))), (0, react.createElement)("span", { style: {
				color: "#888",
				fontSize: 10,
				flexShrink: 0
			} }, open ? "▴" : "▾")), open && (0, react.createElement)("div", {
				role: "listbox",
				"aria-multiselectable": true,
				style: {
					position: "absolute",
					left: 0,
					right: 0,
					top: "calc(100% + 4px)",
					zIndex: 20,
					margin: 0,
					padding: 4,
					borderRadius: 8,
					border: "1px solid rgba(128,128,128,.35)",
					background: "#2a2a2e",
					color: "#e8e8ec",
					boxShadow: "0 8px 24px rgba(0,0,0,.45)",
					maxHeight: 240,
					overflowY: "auto"
				}
			}, options.map((o) => {
				const selected = value.includes(o.id);
				return (0, react.createElement)("button", {
					key: o.id,
					type: "button",
					role: "option",
					"aria-selected": selected,
					onClick: () => {
						const next = selected ? value.filter((v) => v !== o.id) : [...value, o.id];
						onChange(next);
					},
					style: {
						display: "flex",
						alignItems: "center",
						gap: 6,
						width: "100%",
						margin: 0,
						padding: "6px 10px",
						border: "none",
						borderRadius: 6,
						textAlign: "left",
						cursor: "pointer",
						fontSize: 13,
						color: "#e8e8ec",
						background: selected ? "rgba(120,170,255,.28)" : "transparent",
						outline: "none"
					},
					onMouseEnter: (e) => {
						if (!selected) e.currentTarget.style.background = "rgba(128,128,128,.22)";
					},
					onMouseLeave: (e) => {
						e.currentTarget.style.background = selected ? "rgba(120,170,255,.28)" : "transparent";
					}
				}, (0, react.createElement)("span", { style: {
					width: 14,
					flexShrink: 0,
					textAlign: "center"
				} }, selected ? "☑" : "☐"), o.name);
			})));
		}
		/** 读取设置（GET）。 */
		async function loadSettings() {
			try {
				const response = await fetch(SETTINGS_API);
				if (!response.ok) return null;
				return await response.json();
			} catch {
				return null;
			}
		}
		/** 写入设置（POST 路径 op；返回写后视图）。 */
		async function writeSettings(ops) {
			try {
				const response = await fetch(SETTINGS_API, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ ops })
				});
				if (!response.ok) return null;
				return await response.json();
			} catch {
				return null;
			}
		}
		/** 读取自定义模型文件（GET）。 */
		async function loadCustomModels() {
			try {
				const response = await fetch(CUSTOM_MODELS_API);
				if (!response.ok) return null;
				return await response.json();
			} catch {
				return null;
			}
		}
		/** 写回自定义模型文件（POST 全量列表）。 */
		async function saveCustomModelsFile(models) {
			try {
				const response = await fetch(CUSTOM_MODELS_API, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ models })
				});
				if (!response.ok) return null;
				return await response.json();
			} catch {
				return null;
			}
		}
		/** 单个模型行（自绘 radio + 元信息 + 右侧操作；圆点与帧率档共用 ThemeRadioDot）。 */
		function modelRow(key, selected, onSelect, meta, disabled, actions, licenseLink) {
			return (0, react.createElement)("div", {
				key,
				style: {
					...rowStyle,
					display: "flex",
					alignItems: "center",
					gap: 8
				}
			}, (0, react.createElement)(ThemeRadioOption, {
				selected,
				disabled,
				onSelect,
				style: {
					...labelStyle,
					margin: 0,
					flex: 1
				},
				children: (0, react.createElement)("span", { style: {
					flex: 1,
					minWidth: 0,
					overflow: "hidden",
					textOverflow: "ellipsis",
					whiteSpace: "nowrap",
					textAlign: "left"
				} }, meta)
			}), licenseLink, actions);
		}
		/** 拉取宠物状态（人设区数据源）。 */
		async function loadPersonaState() {
			try {
				const response = await fetch(STATE_API);
				if (!response.ok) return null;
				return await response.json();
			} catch {
				return null;
			}
		}
		/** 写剪贴板（尽力而为）。 */
		async function copyText(text) {
			try {
				await navigator.clipboard.writeText(text);
				return true;
			} catch {
				return false;
			}
		}
		function PetSettingsSection(props) {
			const [state, setState] = (0, react.useState)({
				status: "loading",
				writable: false
			});
			const stateRef = (0, react.useRef)(state);
			const setSettingsState = (next) => {
				const resolved = typeof next === "function" ? next(stateRef.current) : next;
				stateRef.current = resolved;
				setState(resolved);
			};
			const reload = (0, react.useCallback)(() => {
				loadSettings().then((view) => {
					if (view === null) {
						setSettingsState((prev) => prev.status === "ready" ? prev : {
							status: "unavailable",
							writable: false
						});
						return;
					}
					setSettingsState({
						status: "ready",
						value: view.value,
						writable: view.writable !== false
					});
				});
			}, []);
			(0, react.useEffect)(() => {
				reload();
			}, [reload]);
			const value = state.value ?? DEFAULT_VALUE;
			const writable = state.writable;
			const [builtin, setBuiltin] = (0, react.useState)([]);
			const [presetsPath, setPresetsPath] = (0, react.useState)("");
			const [customModelsPath, setCustomModelsPath] = (0, react.useState)("");
			(0, react.useEffect)(() => {
				let alive = true;
				fetch(MODELS_API).then((r) => r.ok ? r.json() : null).then((data) => {
					if (!alive || !data) return;
					if (Array.isArray(data.builtin)) setBuiltin(data.builtin);
					if (typeof data.presetsPath === "string") setPresetsPath(data.presetsPath);
					if (typeof data.customModelsPath === "string") setCustomModelsPath(data.customModelsPath);
				}).catch(() => {});
				return () => {
					alive = false;
				};
			}, []);
			const [customModels, setCustomModels] = (0, react.useState)([]);
			const [customModelsError, setCustomModelsError] = (0, react.useState)(null);
			const reloadCustomModels = (0, react.useCallback)(() => {
				loadCustomModels().then((view) => {
					if (view === null) return;
					setCustomModels(view.models);
					setCustomModelsError(view.error);
					if (view.path) setCustomModelsPath(view.path);
				});
			}, []);
			(0, react.useEffect)(() => {
				reloadCustomModels();
			}, [reloadCustomModels]);
			const [builtinFileNotice, setBuiltinFileNotice] = (0, react.useState)(null);
			const [showBuiltinFilePopover, setShowBuiltinFilePopover] = (0, react.useState)(false);
			const openBuiltinPresetsFile = () => {
				if (!presetsPath) {
					setBuiltinFileNotice("内置模型配置文件路径不可用");
					return;
				}
				(props.openPath?.(presetsPath) ?? Promise.resolve(false)).then((ok) => {
					if (ok) setBuiltinFileNotice("已打开内置模型配置文件");
					else setShowBuiltinFilePopover(true);
				});
			};
			const [customFileNotice, setCustomFileNotice] = (0, react.useState)(null);
			const [showCustomFilePopover, setShowCustomFilePopover] = (0, react.useState)(false);
			const openCustomModelsFile = () => {
				if (!customModelsPath) {
					setCustomFileNotice("自定义模型配置文件路径不可用");
					return;
				}
				(props.openPath?.(customModelsPath) ?? Promise.resolve(false)).then((ok) => {
					if (ok) setCustomFileNotice("已打开自定义模型配置文件");
					else setShowCustomFilePopover(true);
				});
			};
			const sizeRange = usePendingRange(value.size, (next) => {
				enqueueWrite(() => [{
					op: "set",
					path: ["size"],
					value: next
				}]);
			});
			const size = sizeRange.value;
			const setDraftSize = sizeRange.setDraft;
			const commitSize = sizeRange.commit;
			const opacityRange = usePendingRange(value.opacity ?? 1, (next) => {
				enqueueWrite(() => [{
					op: "set",
					path: ["opacity"],
					value: next
				}]);
			}, (a, b) => Math.abs(a - b) < .001);
			const opacity = opacityRange.value;
			const setDraftOpacity = opacityRange.setDraft;
			const commitOpacity = opacityRange.commit;
			const [newName, setNewName] = (0, react.useState)("");
			const [newUrl, setNewUrl] = (0, react.useState)("");
			const [newSpatial, setNewSpatial] = (0, react.useState)(EMPTY_SPATIAL_DRAFT);
			const [activeNewPanel, setActiveNewPanel] = (0, react.useState)(null);
			const [newMotionMap, setNewMotionMap] = (0, react.useState)({});
			const [newMotionGroups, setNewMotionGroups] = (0, react.useState)([]);
			const [newMotionStatus, setNewMotionStatus] = (0, react.useState)("idle");
			const [editId, setEditId] = (0, react.useState)(null);
			const [editName, setEditName] = (0, react.useState)("");
			const [editUrl, setEditUrl] = (0, react.useState)("");
			const [editSpatial, setEditSpatial] = (0, react.useState)(EMPTY_SPATIAL_DRAFT);
			const [activeEditPanel, setActiveEditPanel] = (0, react.useState)(null);
			const [editMotionMap, setEditMotionMap] = (0, react.useState)({});
			const [editMotionGroups, setEditMotionGroups] = (0, react.useState)([]);
			const [editMotionStatus, setEditMotionStatus] = (0, react.useState)("idle");
			const custom = customModels;
			const customRef = (0, react.useRef)(custom);
			customRef.current = custom;
			(0, react.useEffect)(() => {
				if (activeNewPanel !== "motion" || !isSupportedModelLocation(newUrl)) return;
				let alive = true;
				setNewMotionStatus("loading");
				fetchMotionGroups().then((groups) => {
					if (!alive) return;
					setNewMotionGroups(groups);
					setNewMotionStatus("ready");
				}).catch(() => {
					if (!alive) return;
					setNewMotionGroups([]);
					setNewMotionStatus("error");
				});
				return () => {
					alive = false;
				};
			}, [activeNewPanel, newUrl]);
			(0, react.useEffect)(() => {
				if (activeEditPanel !== "motion" || !isSupportedModelLocation(editUrl)) return;
				let alive = true;
				setEditMotionStatus("loading");
				fetchMotionGroups().then((groups) => {
					if (!alive) return;
					setEditMotionGroups(groups);
					setEditMotionStatus("ready");
				}).catch(() => {
					if (!alive) return;
					setEditMotionGroups([]);
					setEditMotionStatus("error");
				});
				return () => {
					alive = false;
				};
			}, [activeEditPanel, editUrl]);
			const writeQueue = (0, react.useRef)(Promise.resolve());
			const enqueueWrite = (compose) => {
				writeQueue.current = writeQueue.current.then(async () => {
					const view = await writeSettings(compose(stateRef.current.value ?? DEFAULT_VALUE));
					if (view !== null) setSettingsState({
						status: "ready",
						value: view.value,
						writable: view.writable !== false
					});
				});
			};
			const customWriteQueue = (0, react.useRef)(Promise.resolve());
			const enqueueCustomWrite = (compose) => {
				customWriteQueue.current = customWriteQueue.current.then(async () => {
					const view = await saveCustomModelsFile(compose(customRef.current));
					if (view !== null) {
						setCustomModels(view.models);
						setCustomModelsError(view.error);
						if (view.path) setCustomModelsPath(view.path);
					}
				});
			};
			const addModel = () => {
				const name = newName.trim();
				const url = newUrl.trim();
				if (!name || !isSupportedModelLocation(url)) return;
				const spatialTap = overrideFromDraft(newSpatial);
				const animationMap = motionMapFromDraft(newMotionMap);
				const entry = {
					id: `m${Date.now()}`,
					name,
					modelUrl: url
				};
				if (spatialTap) entry.spatialTap = spatialTap;
				if (animationMap) entry.animationMap = animationMap;
				enqueueCustomWrite((current) => [...current, entry]);
				setNewName("");
				setNewUrl("");
				setNewSpatial(EMPTY_SPATIAL_DRAFT);
				setActiveNewPanel(null);
				setNewMotionMap({});
				setNewMotionGroups([]);
				setNewMotionStatus("idle");
			};
			const saveEdit = (id) => {
				const name = editName.trim();
				const url = editUrl.trim();
				if (!name || !isSupportedModelLocation(url)) return;
				const spatialTap = overrideFromDraft(editSpatial);
				const animationMap = motionMapFromDraft(editMotionMap);
				enqueueCustomWrite((current) => current.map((c) => {
					if (c.id !== id) return c;
					const next = {
						id: c.id,
						name,
						modelUrl: url
					};
					if (spatialTap) next.spatialTap = spatialTap;
					if (animationMap) next.animationMap = animationMap;
					return next;
				}));
				setEditId(null);
				setActiveEditPanel(null);
			};
			const beginEdit = (c) => {
				setEditId(c.id);
				setEditName(c.name);
				setEditUrl(c.modelUrl);
				setEditSpatial(draftFromOverride(c.spatialTap));
				const hasSpatial = !!c.spatialTap && Object.keys(c.spatialTap).length > 0;
				const hasMotion = !!c.animationMap && Object.keys(c.animationMap).length > 0;
				setActiveEditPanel(hasSpatial ? "spatial" : hasMotion ? "motion" : null);
				setEditMotionMap(draftFromMotionMap(c.animationMap));
				setEditMotionGroups([]);
				setEditMotionStatus("idle");
			};
			const removeModel = (id) => {
				const fallbackModel = builtin[0]?.id ?? "hiyori";
				enqueueCustomWrite((current) => current.filter((c) => c.id !== id));
				if (value.model === id) enqueueWrite(() => [{
					op: "set",
					path: ["model"],
					value: fallbackModel
				}]);
			};
			const [personaState, setPersonaState] = (0, react.useState)(null);
			const [personaNotice, setPersonaNotice] = (0, react.useState)(null);
			const [showPersonaPopover, setShowPersonaPopover] = (0, react.useState)(false);
			const reloadPersonaState = (0, react.useCallback)(() => {
				loadPersonaState().then((view) => {
					if (view) setPersonaState(view);
				});
			}, []);
			(0, react.useEffect)(() => {
				reloadPersonaState();
			}, [reloadPersonaState]);
			const builtinPersonaList = builtinPersonaOptions();
			const customPersonaList = personaState?.customPersonas ?? [];
			const activePersona = personaState?.persona ?? value.persona;
			const reloadPersonas = () => {
				setPersonaNotice("读取中…");
				fetch(RELOAD_PERSONAS_API, { method: "POST" }).then((r) => r.ok ? r.json() : null).then((data) => {
					reloadPersonaState();
					setPersonaNotice(data?.error ? `已重读：${data.error}` : "已重新读取人设文件");
				}).catch(() => setPersonaNotice("重新读取失败（Host 不可达）"));
			};
			const openPersonasFile = () => {
				const file = personaState?.personasFile;
				if (!file) return;
				(props.openPath?.(file) ?? Promise.resolve(false)).then((ok) => {
					if (ok) setPersonaNotice("已用系统默认程序打开人设文件");
					else setShowPersonaPopover(true);
				});
			};
			const builtinRows = builtin.map((p) => modelRow(`builtin-${p.id}`, value.model === p.id, () => enqueueWrite(() => [{
				op: "set",
				path: ["model"],
				value: p.id
			}]), `${p.name}（${p.author}）`, !writable, void 0, (0, react.createElement)("a", {
				key: "license",
				href: p.license?.url,
				target: "_blank",
				rel: "noreferrer",
				style: linkStyle,
				onClick: (e) => e.stopPropagation()
			}, p.license?.type ?? "许可")));
			const customRows = custom.map((c) => {
				const hasOverride = !!c.spatialTap && Object.keys(c.spatialTap).length > 0;
				const hasMotionMap = !!c.animationMap && Object.keys(c.animationMap).length > 0;
				const tags = [hasOverride ? "分区已覆盖" : null, hasMotionMap ? "动画已映射" : null].filter(Boolean);
				if (editId === c.id) return (0, react.createElement)("div", {
					key: c.id,
					style: {
						...rowStyle,
						display: "flex",
						flexDirection: "column",
						gap: 6
					}
				}, (0, react.createElement)("div", { style: {
					display: "flex",
					gap: 6,
					alignItems: "center",
					flexWrap: "wrap"
				} }, (0, react.createElement)("input", {
					style: inputStyle,
					value: editName,
					placeholder: "名称",
					onChange: (e) => setEditName(e.target.value)
				}), (0, react.createElement)("input", {
					style: {
						...inputStyle,
						flex: 1,
						minWidth: 120
					},
					value: editUrl,
					placeholder: "https://…/model.psd 或 C:/models/...",
					onChange: (e) => setEditUrl(e.target.value)
				}), (0, react.createElement)("button", {
					style: buttonStyle,
					onClick: () => saveEdit(c.id)
				}, "保存"), (0, react.createElement)("button", {
					style: buttonStyle,
					onClick: () => {
						setEditId(null);
						setActiveEditPanel(null);
					}
				}, "取消")), (0, react.createElement)("div", {
					key: "edit-panel-tabs",
					style: {
						display: "flex",
						gap: 4,
						marginTop: 4
					}
				}, (0, react.createElement)("button", {
					type: "button",
					style: activeEditPanel === "spatial" ? panelTabActiveStyle : panelTabStyle,
					onClick: () => setActiveEditPanel((v) => v === "spatial" ? null : "spatial")
				}, "空间分区覆盖"), (0, react.createElement)("button", {
					type: "button",
					style: activeEditPanel === "motion" ? panelTabActiveStyle : panelTabStyle,
					onClick: () => setActiveEditPanel((v) => v === "motion" ? null : "motion")
				}, "动画映射")), activeEditPanel === "spatial" && (0, react.createElement)("div", { key: "edit-spatial" }, (0, react.createElement)("div", { style: {
					fontSize: 11,
					color: "#888",
					marginBottom: 4
				} }, "相对包围盒 0–1；留空=该字段用全局默认。改完请开「显示点击分区」对照色块。"), spatialTapFields(editSpatial, setEditSpatial, !writable)), activeEditPanel === "motion" && (0, react.createElement)("div", { key: "edit-motion" }, (0, react.createElement)("div", { style: {
					fontSize: 11,
					color: "#888",
					marginBottom: 4
				} }, "按状态/互动部位配置模型动作组；未配置项沿用默认。"), motionMapFields(editMotionMap, setEditMotionMap, editMotionGroups, editMotionStatus, !writable, () => {
					setActiveEditPanel(null);
					requestAnimationFrame(() => setActiveEditPanel("motion"));
				})));
				return modelRow(`custom-${c.id}`, value.model === c.id, () => enqueueWrite(() => [{
					op: "set",
					path: ["model"],
					value: c.id
				}]), tags.length > 0 ? `${c.name} · ${tags.join(" · ")}` : c.name, !writable, (0, react.createElement)("span", { key: "actions" }, (0, react.createElement)("button", {
					style: buttonStyle,
					onClick: () => beginEdit(c)
				}, "修改"), (0, react.createElement)("button", {
					style: buttonStyle,
					onClick: () => removeModel(c.id)
				}, "删除")), void 0);
			});
			const children = [(0, react.createElement)("h3", {
				key: "title",
				style: { margin: "0 0 4px" }
			}, "桌宠配置"), (0, react.createElement)("p", {
				key: "sub",
				style: {
					margin: "0 0 12px",
					color: "#888",
					fontSize: 12
				}
			}, "设置经 $DSH_HOME/settings.yaml 持久化，立即生效。")];
			if (state.status !== "ready") children.push((0, react.createElement)("div", {
				key: "notice",
				style: {
					...rowStyle,
					color: "#b45309"
				}
			}, state.status === "unavailable" ? "设置服务不可用（Host 插件未加载）。" : "设置加载中…"));
			children.push((0, react.createElement)("div", {
				key: "enabled",
				style: rowStyle
			}, (0, react.createElement)("label", { style: labelStyle }, (0, react.createElement)("input", {
				type: "checkbox",
				checked: !!value.enabled,
				disabled: !writable,
				onChange: (e) => {
					const next = e.target.checked;
					enqueueWrite(() => [{
						op: "set",
						path: ["enabled"],
						value: next
					}]);
				}
			}), (0, react.createElement)("span", null, "显示宠物"))));
			children.push((0, react.createElement)("div", {
				key: "size",
				style: rowStyle
			}, (0, react.createElement)("div", { style: {
				display: "flex",
				alignItems: "center",
				gap: 10
			} }, (0, react.createElement)("span", { style: { whiteSpace: "nowrap" } }, "尺寸"), (0, react.createElement)("input", {
				type: "range",
				min: 40,
				max: 400,
				step: 1,
				value: size,
				disabled: !writable,
				style: { flex: 1 },
				onChange: (e) => setDraftSize(Number(e.target.value)),
				onPointerUp: commitSize,
				onKeyUp: commitSize,
				onBlur: commitSize
			}), (0, react.createElement)("span", { style: {
				width: 56,
				textAlign: "right",
				color: "#888",
				fontSize: 12
			} }, `${size}px`))));
			children.push((0, react.createElement)("div", {
				key: "performance",
				style: rowStyle
			}, (0, react.createElement)("div", { style: {
				display: "flex",
				alignItems: "center",
				gap: 10
			} }, (0, react.createElement)("span", { style: { whiteSpace: "nowrap" } }, "帧率"), (0, react.createElement)(ThemeSelect, {
				value: String(value.fpsLimit ?? 30),
				options: [
					{
						id: "30",
						name: "30 FPS"
					},
					{
						id: "60",
						name: "60 FPS"
					},
					{
						id: "0",
						name: "无限制"
					}
				],
				disabled: !writable,
				onChange: (id) => {
					enqueueWrite(() => [{
						op: "set",
						path: ["fpsLimit"],
						value: Number(id)
					}]);
				}
			})), (0, react.createElement)("div", { style: {
				display: "flex",
				alignItems: "center",
				gap: 10,
				marginTop: 10
			} }, (0, react.createElement)("span", { style: { whiteSpace: "nowrap" } }, "透明度"), (0, react.createElement)("input", {
				type: "range",
				min: 0,
				max: 1,
				step: .05,
				value: opacity,
				disabled: !writable,
				style: { flex: 1 },
				onChange: (e) => setDraftOpacity(Number(e.target.value)),
				onPointerUp: commitOpacity,
				onKeyUp: commitOpacity,
				onBlur: commitOpacity
			}), (0, react.createElement)("span", { style: {
				width: 56,
				textAlign: "right",
				color: "#888",
				fontSize: 12
			} }, `${Math.round(opacity * 100)}%`))));
			const personaOptions = [...builtinPersonaList, ...customPersonaList.map((p) => ({
				id: p.id,
				name: p.name ?? p.id
			}))];
			children.push((0, react.createElement)("div", { key: "persona" }, (0, react.createElement)("div", { style: {
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				margin: "16px 0 8px"
			} }, (0, react.createElement)("div", { style: {
				fontSize: 13,
				fontWeight: 600,
				color: "#888"
			} }, "人设台词"), headerLink("自定义人设 ↗", openPersonasFile)), (0, react.createElement)("div", { style: rowStyle }, (0, react.createElement)("div", { style: {
				display: "flex",
				alignItems: "center",
				gap: 8,
				marginBottom: personaNotice || personaState?.personasError ? 6 : 0
			} }, (0, react.createElement)(ThemeSelect, {
				value: activePersona,
				options: personaOptions,
				disabled: !writable,
				onChange: (id) => {
					enqueueWrite(() => [{
						op: "set",
						path: ["persona"],
						value: id
					}]);
				}
			}), (0, react.createElement)("button", {
				style: buttonStyle,
				onClick: reloadPersonas
			}, "↻ 重新读取")), (personaState?.personasError || personaNotice) && (0, react.createElement)("div", {
				key: "persona-notice",
				style: {
					color: personaState?.personasError ? "#b45309" : "#888",
					fontSize: 12
				}
			}, (personaState?.personasError ? `人设文件：${personaState.personasError}` : null) ?? personaNotice), showPersonaPopover && (0, react.createElement)("div", {
				key: "persona-popover",
				style: {
					marginTop: 8,
					padding: "8px 10px",
					borderRadius: 8,
					background: "rgba(128,128,128,.12)",
					fontSize: 12,
					wordBreak: "break-all"
				}
			}, (0, react.createElement)("div", null, "无法直接打开，请手动编辑人设文件："), (0, react.createElement)("div", { style: {
				margin: "4px 0",
				color: "#666"
			} }, personaState?.personasFile ?? ""), (0, react.createElement)("div", { style: {
				display: "flex",
				gap: 6
			} }, (0, react.createElement)("button", {
				style: buttonStyle,
				onClick: () => {
					copyText(personaState?.personasFile ?? "").then((ok) => setPersonaNotice(ok ? "已复制文件路径" : "复制失败"));
				}
			}, "复制路径"), (0, react.createElement)("button", {
				style: buttonStyle,
				onClick: () => {
					copyText(PERSONAS_TEMPLATE).then((ok) => setPersonaNotice(ok ? "已复制人设模板（女仆示例）" : "复制失败"));
				}
			}, "复制模板"), (0, react.createElement)("button", {
				style: buttonStyle,
				onClick: () => setShowPersonaPopover(false)
			}, "收起"))))));
			children.push((0, react.createElement)("div", { key: "models" }, (0, react.createElement)("div", { style: {
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				margin: "16px 0 8px"
			} }, (0, react.createElement)("div", { style: {
				fontSize: 13,
				fontWeight: 600,
				color: "#888"
			} }, "内置模型（只读）"), !!value.developerMode && headerLink("打开配置文件 ↗", openBuiltinPresetsFile)), (builtinFileNotice || showBuiltinFilePopover) && (0, react.createElement)("div", {
				key: "builtin-file-notice",
				style: {
					marginBottom: 6,
					color: "#b45309",
					fontSize: 12
				}
			}, builtinFileNotice, showBuiltinFilePopover && (0, react.createElement)("div", { style: {
				marginTop: 4,
				wordBreak: "break-all"
			} }, "无法直接打开，文件路径：", (0, react.createElement)("div", { style: { color: "#666" } }, presetsPath), (0, react.createElement)("button", {
				style: {
					...buttonStyle,
					marginLeft: 0,
					marginTop: 4
				},
				onClick: () => setShowBuiltinFilePopover(false)
			}, "收起"))), (0, react.createElement)("div", {
				role: "radiogroup",
				"aria-label": "内置模型"
			}, builtinRows.length > 0 ? builtinRows : (0, react.createElement)("div", { style: {
				color: "#888",
				fontSize: 12
			} }, "清单加载中…")), (0, react.createElement)("div", { style: {
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				margin: "16px 0 8px"
			} }, (0, react.createElement)("div", { style: {
				fontSize: 13,
				fontWeight: 600,
				color: "#888"
			} }, "我的模型"), headerLink("打开配置文件 ↗", openCustomModelsFile)), (customFileNotice || showCustomFilePopover) && (0, react.createElement)("div", {
				key: "custom-file-notice",
				style: {
					marginBottom: 6,
					color: "#b45309",
					fontSize: 12
				}
			}, customFileNotice, showCustomFilePopover && (0, react.createElement)("div", { style: {
				marginTop: 4,
				wordBreak: "break-all"
			} }, "无法直接打开，文件路径：", (0, react.createElement)("div", { style: { color: "#666" } }, customModelsPath), (0, react.createElement)("button", {
				style: {
					...buttonStyle,
					marginLeft: 0,
					marginTop: 4
				},
				onClick: () => setShowCustomFilePopover(false)
			}, "收起"))), (0, react.createElement)("div", {
				role: "radiogroup",
				"aria-label": "我的模型"
			}, customRows.length > 0 ? customRows : (0, react.createElement)("div", { style: {
				color: "#888",
				fontSize: 12,
				marginBottom: 8
			} }, "尚未添加自定义模型")), (0, react.createElement)("div", { style: {
				display: "flex",
				flexDirection: "column",
				gap: 6
			} }, (0, react.createElement)("div", { style: {
				display: "flex",
				gap: 6,
				alignItems: "center",
				flexWrap: "wrap"
			} }, (0, react.createElement)("input", {
				style: inputStyle,
				value: newName,
				placeholder: "名称",
				disabled: !writable,
				onChange: (e) => setNewName(e.target.value)
			}), (0, react.createElement)("input", {
				style: {
					...inputStyle,
					flex: 1,
					minWidth: 140
				},
				value: newUrl,
				placeholder: "https://…/xxx.psd 或 C:/models/...",
				disabled: !writable,
				onChange: (e) => setNewUrl(e.target.value)
			}), (0, react.createElement)("button", {
				style: buttonStyle,
				onClick: addModel,
				disabled: !writable
			}, "添加")), (0, react.createElement)("div", {
				key: "new-panel-tabs",
				style: {
					display: "flex",
					gap: 4
				}
			}, (0, react.createElement)("button", {
				type: "button",
				style: activeNewPanel === "spatial" ? panelTabActiveStyle : panelTabStyle,
				disabled: !writable,
				onClick: () => setActiveNewPanel((v) => v === "spatial" ? null : "spatial")
			}, "空间分区覆盖"), (0, react.createElement)("button", {
				type: "button",
				style: activeNewPanel === "motion" ? panelTabActiveStyle : panelTabStyle,
				disabled: !writable,
				onClick: () => setActiveNewPanel((v) => v === "motion" ? null : "motion")
			}, "动画映射")), activeNewPanel === "spatial" && (0, react.createElement)("div", { key: "new-spatial" }, (0, react.createElement)("div", { style: {
				fontSize: 11,
				color: "#888",
				marginBottom: 4
			} }, "相对包围盒 0–1；留空=该字段用全局默认。适合大帽子/全身比例与默认差较多的模型。"), spatialTapFields(newSpatial, setNewSpatial, !writable)), activeNewPanel === "motion" && (0, react.createElement)("div", { key: "new-motion" }, (0, react.createElement)("div", { style: {
				fontSize: 11,
				color: "#888",
				marginBottom: 4
			} }, "按状态/互动部位配置模型动作组；未配置项沿用默认。"), motionMapFields(newMotionMap, setNewMotionMap, newMotionGroups, newMotionStatus, !writable, () => {
				setActiveNewPanel(null);
				requestAnimationFrame(() => setActiveNewPanel("motion"));
			})))));
			children.push((0, react.createElement)("div", { key: "devtools" }, (0, react.createElement)("div", { style: {
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				margin: "16px 0 8px"
			} }, (0, react.createElement)("div", { style: {
				fontSize: 13,
				fontWeight: 600,
				color: "#888"
			} }, "开发者选项"), (0, react.createElement)(ThemeSwitch, {
				checked: !!value.developerMode,
				disabled: !writable,
				onChange: (next) => {
					enqueueWrite(() => [{
						op: "set",
						path: ["developerMode"],
						value: next
					}]);
				}
			})), !!value.developerMode && (0, react.createElement)("div", { style: rowStyle }, (0, react.createElement)("label", { style: labelStyle }, (0, react.createElement)("input", {
				type: "checkbox",
				checked: !!value.debug,
				disabled: !writable,
				onChange: (e) => {
					const next = e.target.checked;
					enqueueWrite(() => [{
						op: "set",
						path: ["debug"],
						value: next
					}]);
				}
			}), (0, react.createElement)("span", null, "调试面板")), (0, react.createElement)("label", { style: {
				...labelStyle,
				marginTop: 8
			} }, (0, react.createElement)("input", {
				type: "checkbox",
				checked: !!value.showTapZones,
				disabled: !writable,
				onChange: (e) => {
					const next = e.target.checked;
					enqueueWrite(() => [{
						op: "set",
						path: ["showTapZones"],
						value: next
					}]);
				}
			}), (0, react.createElement)("span", null, "显示点击分区（空间回退色块）")))));
			return (0, react.createElement)("div", { style: {
				padding: "16px 20px",
				maxWidth: 560
			} }, children);
		}
		//#endregion
		//#region src/client/paw-icon.ts
		/**
		* 设置导航爪印图标（用户提供的「动物足迹」SVG；currentColor 跟随侧栏主题色）。
		*
		* DSH `dsh-client-ui-settings-general` 当前按 section id 硬编码导航图标
		* （未知 id 一律齿轮），settings.section 的 `icon` 选项尚未接入投影。
		* 因此在导航出现「桌宠配置」时用爪印 SVG 替换齿轮，作为可随插件发布的兼容方案。
		* @module dsh-anime25d-pets/client/paw-icon
		*/
		/** 足迹 path（源：动物足迹.svg，viewBox 0 0 56 56）。 */
		const PAW_PATH = "M16.881 50.83c-.202-.014-.404-.025-.605-.043c-1.13-.106-2.167-.475-3.087-1.14c-1.587-1.15-2.602-2.679-3.006-4.602a8.149 8.149 0 0 1-.147-2.188a9.757 9.757 0 0 1 .498-2.521c.439-1.308 1.1-2.495 1.937-3.589A14.948 14.948 0 0 1 14.6 34.5a18.334 18.334 0 0 0 2.031-2.077c.788-.935 1.5-1.926 2.205-2.924c.622-.882 1.234-1.77 1.894-2.622a16.959 16.959 0 0 1 1.605-1.83c.73-.707 1.536-1.305 2.486-1.694a6.161 6.161 0 0 1 2.224-.462a9.855 9.855 0 0 1 2.579.273a7.418 7.418 0 0 1 3.387 1.867c.662.63 1.222 1.344 1.742 2.09c.553.792 1.06 1.613 1.583 2.424c.59.913 1.2 1.812 1.88 2.662a18.325 18.325 0 0 0 2.242 2.344a15.79 15.79 0 0 1 2.611 2.909a12.18 12.18 0 0 1 1.518 2.979a9.4 9.4 0 0 1 .504 2.556c.07 1.332-.16 2.606-.765 3.804c-.56 1.11-1.37 2.003-2.386 2.71c-.748.521-1.555.917-2.443 1.137a6.49 6.49 0 0 1-.957.167c-.045.004-.088.012-.132.02c-.042.023-.088.005-.133.01c-.037.006-.075-.01-.11.012h-.828c-.033-.023-.07-.007-.105-.011h-.175c-.706-.023-1.391-.17-2.075-.329c-1.157-.27-2.292-.625-3.444-.918a21.385 21.385 0 0 0-2.83-.538a13.409 13.409 0 0 0-1.992-.062c-.53.018-1.058.1-1.58.197c-1.03.194-2.039.47-3.049.746c-1.068.294-2.136.585-3.23.764c-.445.072-.89.134-1.343.13c-.093-.002-.185.012-.279.01c-.12-.007-.237.014-.355-.013m20.41-45.81c1.488.179 2.626.936 3.495 2.129c.595.818.97 1.736 1.202 2.717a9.8 9.8 0 0 1 .245 2.57a11.205 11.205 0 0 1-1.12 4.546a9.43 9.43 0 0 1-1.886 2.668c-.703.688-1.498 1.238-2.426 1.581c-.652.24-1.322.36-2.016.318c-1.202-.069-2.223-.547-3.08-1.381c-.732-.712-1.23-1.574-1.575-2.527a8.93 8.93 0 0 1-.47-2.057a9.994 9.994 0 0 1-.06-1.446c.035-1.138.24-2.246.61-3.322a10.273 10.273 0 0 1 1.709-3.147c.64-.794 1.387-1.466 2.283-1.962a5.63 5.63 0 0 1 2.112-.686c.023-.013.048-.007.071-.009h.071c.035-.004.071.012.102-.012h.488c.031.025.067.008.101.012h.072c.023 0 .048-.005.072.008M3.045 22.6c.023-.454.105-.9.224-1.339c.232-.853.61-1.63 1.2-2.295a4.33 4.33 0 0 1 2.448-1.418c.792-.156 1.574-.09 2.342.148c.884.272 1.665.736 2.36 1.34c1.078.935 1.852 2.086 2.387 3.402a8.815 8.815 0 0 1 .666 3.218a7.539 7.539 0 0 1-.226 2.023c-.227.885-.609 1.69-1.217 2.38a4.322 4.322 0 0 1-2.612 1.453c-.766.124-1.519.04-2.255-.198c-.99-.321-1.84-.873-2.588-1.588a8.66 8.66 0 0 1-1.76-2.402a9.25 9.25 0 0 1-.896-2.787c-.025-.173-.046-.346-.07-.518c-.018-.079-.01-.16-.03-.238c-.009-.033-.004-.064-.005-.098c-.006-.041.013-.086-.013-.127v-.634c.04-.058.02-.122.024-.184c.004-.046-.008-.095.021-.137m10.453-10.158c.005-1.258.184-2.391.605-3.483c.317-.825.753-1.579 1.36-2.228c.653-.702 1.429-1.204 2.365-1.441c.936-.238 1.856-.17 2.76.157c.797.29 1.492.745 2.11 1.32c.985.916 1.69 2.023 2.193 3.264c.32.788.54 1.604.665 2.445c.071.476.112.957.122 1.44a9.947 9.947 0 0 1-.128 1.817c-.209 1.256-.635 2.426-1.395 3.46a5.32 5.32 0 0 1-1.751 1.555a4.47 4.47 0 0 1-2.522.536c-.806-.061-1.55-.325-2.243-.736c-.904-.535-1.636-1.257-2.246-2.107a10.024 10.024 0 0 1-1.534-3.325a11.078 11.078 0 0 1-.332-2a6.138 6.138 0 0 1-.029-.674m39.5 10.895v.146c-.055 1.213-.38 2.354-.903 3.442a9.148 9.148 0 0 1-1.59 2.319c-.835.885-1.804 1.576-2.957 1.99a5.366 5.366 0 0 1-2.137.33a4.4 4.4 0 0 1-2.829-1.194c-.658-.612-1.091-1.364-1.365-2.21a6.832 6.832 0 0 1-.32-2.338c.054-1.752.607-3.344 1.567-4.801a8.613 8.613 0 0 1 1.112-1.366c.857-.854 1.837-1.51 2.998-1.883a5.277 5.277 0 0 1 2.025-.252a4.39 4.39 0 0 1 2.749 1.21c.696.657 1.136 1.468 1.401 2.38c.147.503.233 1.018.25 1.543v.147a9.116 9.116 0 0 0 0 .537";
		/** 填充式爪印 SVG（16–20px 侧栏清晰可读）。 */
		function PawPrintIcon(props) {
			const size = props.size ?? 16;
			return (0, react.createElement)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 56 56",
				fill: "currentColor",
				className: props.className,
				"aria-hidden": true,
				focusable: false,
				"data-pet-nav-icon": "paw"
			}, (0, react.createElement)("path", {
				fillRule: "evenodd",
				d: PAW_PATH
			}));
		}
		/** 设置.section 注册用：按尺寸渲染爪印（待平台投影 icon 字段后可直接生效）。 */
		function pawNavIcon(size) {
			return (0, react.createElement)(PawPrintIcon, { size });
		}
		const NAV_LABEL = "桌宠配置";
		/**
		* 监视 DOM：把「桌宠配置」导航行上的默认齿轮换成爪印。
		* 返回停止函数（插件卸载 / section 退订时调用）。
		*/
		function installPetSettingsNavIcon() {
			const swap = () => {
				for (const btn of document.querySelectorAll("button")) {
					if (!Array.from(btn.querySelectorAll("span")).find((s) => s.textContent?.trim() === NAV_LABEL)) continue;
					const svg = btn.querySelector("svg");
					if (!svg || svg.getAttribute("data-pet-nav-icon") === "paw") continue;
					const next = document.createElementNS("http://www.w3.org/2000/svg", "svg");
					next.setAttribute("width", svg.getAttribute("width") || "16");
					next.setAttribute("height", svg.getAttribute("height") || "16");
					next.setAttribute("viewBox", "0 0 56 56");
					next.setAttribute("fill", "currentColor");
					next.setAttribute("aria-hidden", "true");
					next.setAttribute("focusable", "false");
					next.setAttribute("data-pet-nav-icon", "paw");
					const cls = svg.getAttribute("class");
					if (cls) next.setAttribute("class", cls);
					next.innerHTML = `<path fill-rule="evenodd" d="${PAW_PATH}"/>`;
					svg.replaceWith(next);
				}
			};
			swap();
			const mo = new MutationObserver(() => {
				swap();
			});
			mo.observe(document.documentElement, {
				childList: true,
				subtree: true
			});
			return () => mo.disconnect();
		}
		//#endregion
		//#region src/client/anime25d.ts
		/** 默认参数（与 Anime2.5DRig 一致）。 */
		const DEFAULT_PARAMS = {
			angleX: 0,
			angleY: 0,
			angleZ: 0,
			eyeOpenL: 1,
			eyeOpenR: 1,
			eyeX: 0,
			eyeY: 0,
			brow: 0,
			mouthOpen: 0,
			mouthForm: 0,
			mouthCY: 0,
			body: 0,
			physAmp: 2,
			soft: 2,
			browAngL: 0,
			browAngR: 0,
			browAngSym: 0,
			bangL: 0,
			bangC: 0,
			bangR: 0,
			armY: 0,
			armPos: 0,
			bust: 2.5,
			bustY: 1,
			irisScale: 1,
			mouthEase: .45,
			eyeEase: .3,
			fhAmp: 2,
			fhSoft: .4,
			eyeCY: 0,
			eyeCAng: 0,
			mouthCAng: 0,
			eyeScaleL: 1,
			eyeScaleR: 1,
			mouthScale: 1
		};
		/** 内置动作映射：状态/互动 → Anime2.5DRig 参数预设。 */
		const DEFAULT_MOTION_PRESETS = {
			Idle: { target: {
				angleX: .05,
				angleY: .03,
				angleZ: .02,
				mouthOpen: 0,
				mouthForm: 0,
				eyeOpenL: 1,
				eyeOpenR: 1,
				brow: 0
			} },
			Thinking: { target: {
				angleX: .85,
				angleY: -.35,
				angleZ: .5,
				eyeX: -.55,
				eyeY: -.9,
				brow: .7,
				mouthOpen: .1,
				mouthForm: -.1,
				body: .18,
				physAmp: 1.2
			} },
			Working: { target: {
				angleX: -.2,
				angleY: .1,
				angleZ: -.15,
				eyeX: -.3,
				eyeY: -.2,
				brow: .3,
				mouthOpen: 0
			} },
			Failed: {
				target: {
					angleX: 0,
					angleY: .45,
					angleZ: 0,
					brow: -.8,
					eyeX: 0,
					eyeY: .5,
					mouthOpen: 0,
					mouthForm: -.6,
					eyeOpenL: .3,
					eyeOpenR: .3,
					body: .1
				},
				duration: 2500
			},
			Sad: {
				target: {
					angleY: .35,
					brow: -.7,
					eyeOpenL: .25,
					eyeOpenR: .25,
					mouthOpen: 0,
					mouthForm: -.5,
					eyeY: .4
				},
				duration: 2500
			},
			Jumping: {
				target: {
					angleY: -.25,
					eyeOpenL: .1,
					eyeOpenR: .1,
					brow: .7,
					mouthOpen: .8,
					mouthForm: 1,
					irisScale: 1.1,
					body: -.15
				},
				duration: 3500
			},
			Done: {
				target: {
					eyeOpenL: .1,
					eyeOpenR: .1,
					brow: .5,
					mouthOpen: .6,
					mouthForm: 1,
					irisScale: 1.15,
					angleY: -.1
				},
				duration: 3500
			},
			Waiting: { target: {
				angleX: .32,
				angleY: .1,
				angleZ: .18,
				brow: .2,
				eyeOpenL: .25,
				eyeOpenR: .25,
				eyeX: .35,
				eyeY: .08,
				mouthOpen: .04,
				mouthForm: .3,
				body: .08,
				physAmp: 1.1
			} },
			TapHead: {
				target: {
					angleX: .25,
					angleY: -.2,
					angleZ: .1,
					eyeOpenL: .6,
					eyeOpenR: .8,
					mouthOpen: .1
				},
				duration: 1800
			},
			TapBody: {
				target: {
					angleX: .1,
					angleY: .15,
					mouthOpen: .1,
					mouthForm: .3
				},
				duration: 1500
			},
			TapLeg: {
				target: {
					angleX: -.1,
					angleY: .1,
					eyeOpenL: .5,
					eyeOpenR: .5,
					mouthOpen: .1,
					mouthForm: .2
				},
				duration: 1500
			},
			TapArm: {
				target: {
					angleX: .15,
					angleY: .1,
					eyeX: .3,
					mouthOpen: .05,
					armY: -.3
				},
				duration: 1500
			}
		};
		/** WebGL 渲染器 —— 封装 Anime2.5DRig 核心。 */
		var Anime25DRenderer = class {
			/** 目标画布。 */
			canvas;
			/** WebGL 上下文。 */
			gl = null;
			/** WebGL 着色器程序。 */
			prog = null;
			locPos = -1;
			locUV = -1;
			locRes = null;
			locCut = null;
			locAl = null;
			locFlip = null;
			/** 渲染层数据。 */
			layers = [];
			/** 锚点。 */
			A = null;
			CW = 768;
			CH = 768;
			FS = 1;
			NP = null;
			BP = null;
			FC = null;
			CHEST = null;
			bounce = {
				x: 0,
				v: 0,
				dy: 0
			};
			/** 参数（目标值/当前值）。 */
			P = { ...DEFAULT_PARAMS };
			T = { ...DEFAULT_PARAMS };
			cur = { ...DEFAULT_PARAMS };
			/** 用户手动设置过的参数集合（自动动画不会覆盖这些参数）。 */
			manualSet = /* @__PURE__ */ new Set();
			/** 自动动画开关。 */
			auto = {
				idle: true,
				blink: true,
				rand: false,
				talk: false,
				mouse: false,
				mic: false,
				phys: true
			};
			/** 动画状态。 */
			blinkT = -1;
			nextBlink = 0;
			rnd = {
				ax: 0,
				ay: 0,
				az: 0,
				bd: 0,
				ex: 0,
				ey: 0
			};
			nextRnd = 0;
			talkOn = false;
			talkV = 0;
			talkTgt = 0;
			nextTalkState = 0;
			nextSyl = 0;
			/** 鼠标状态。 */
			mouse = {
				x: 0,
				y: 0,
				in: false
			};
			/** 左右镜像翻转。 */
			flipped = false;
			/** 动作定时器（清理用）。 */
			motionTimer = null;
			/** 动画映射参数（当前动作的叠加目标）。 */
			motionTarget = null;
			motionStartTime = 0;
			motionDuration = 0;
			motionName = null;
			/** 帧循环控制。 */
			rafId = 0;
			last = 0;
			lastFrame = 0;
			frameInterval = 0;
			disposed = false;
			_onMotionFinish = null;
			/** 模型原始尺寸（用于适配）。 */
			baseW = 0;
			baseH = 0;
			/** 模型实际内容包围盒（所有图层的最小外接矩形）。 */
			contentBounds = {
				x: 0,
				y: 0,
				width: 0,
				height: 0
			};
			constructor(canvas) {
				this.canvas = canvas;
				this.initWebGL();
				this.initCanvasEvents();
				this.last = performance.now();
				this.nextBlink = this.last + 1800;
				this.nextRnd = this.last + 1400;
				this.nextTalkState = this.last + 1200;
				this.nextSyl = this.last + 500;
				this.rafId = requestAnimationFrame(this.tick);
			}
			/** 初始化 WebGL 上下文。 */
			initWebGL() {
				const cv = this.canvas;
				this.gl = cv.getContext("webgl", {
					alpha: true,
					stencil: true,
					antialias: true,
					premultipliedAlpha: true
				});
				if (!this.gl) return;
				const gl = this.gl;
				function sh(type, src) {
					const s = gl.createShader(type);
					gl.shaderSource(s, src);
					gl.compileShader(s);
					if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(String(gl.getShaderInfoLog(s)));
					return s;
				}
				this.prog = gl.createProgram();
				gl.attachShader(this.prog, sh(gl.VERTEX_SHADER, "attribute vec2 aPos; attribute vec2 aUV; uniform vec2 uRes; uniform float uFlip; varying vec2 vUV;void main(){ vUV=aUV; vec2 c = aPos/uRes*2.0-1.0; gl_Position=vec4(c.x*uFlip,-c.y,0.0,1.0); }"));
				gl.attachShader(this.prog, sh(gl.FRAGMENT_SHADER, "precision mediump float; varying vec2 vUV; uniform sampler2D uTex; uniform float uCut; uniform float uAlpha;void main(){ vec4 c=texture2D(uTex,vUV); if(c.a<uCut) discard; gl_FragColor=c*uAlpha; }"));
				gl.linkProgram(this.prog);
				gl.useProgram(this.prog);
				this.locPos = gl.getAttribLocation(this.prog, "aPos");
				this.locUV = gl.getAttribLocation(this.prog, "aUV");
				this.locRes = gl.getUniformLocation(this.prog, "uRes");
				this.locCut = gl.getUniformLocation(this.prog, "uCut");
				this.locAl = gl.getUniformLocation(this.prog, "uAlpha");
				this.locFlip = gl.getUniformLocation(this.prog, "uFlip");
				gl.enableVertexAttribArray(this.locPos);
				gl.enableVertexAttribArray(this.locUV);
				gl.enable(gl.BLEND);
				gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
				gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
			}
			/** 初始化画布事件（鼠标跟随）。 */
			initCanvasEvents() {
				this.canvas.addEventListener("mousemove", (e) => {
					const r = this.canvas.getBoundingClientRect();
					const rawX = (e.clientX - r.left) / r.width * 2 - 1;
					this.mouse.x = this.flipped ? -rawX : rawX;
					this.mouse.y = (e.clientY - r.top) / r.height * 2 - 1;
					this.mouse.in = true;
				});
				this.canvas.addEventListener("mouseleave", () => {
					this.mouse.in = false;
				});
			}
			/** 纹理创建。 */
			mkTex(imgData) {
				const gl = this.gl;
				const t = gl.createTexture();
				gl.bindTexture(gl.TEXTURE_2D, t);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgData);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				return t;
			}
			/** 应用装配好的 rig 到 WebGL 层。 */
			applyRig(rig) {
				const gl = this.gl;
				if (!gl) return;
				for (const L of this.layers) {
					if (L.tex) gl.deleteTexture(L.tex);
					if (L.vboPos) gl.deleteBuffer(L.vboPos);
					if (L.vboUV) gl.deleteBuffer(L.vboUV);
					if (L.ibo) gl.deleteBuffer(L.ibo);
				}
				this.layers = [];
				this.CW = rig.canvas.w;
				this.CH = rig.canvas.h;
				this.A = rig.anchors;
				this.FS = this.A.faceScale;
				this.NP = this.A.neckPivot;
				this.BP = this.A.bodyPivot;
				this.FC = {
					x: this.A.face.cx,
					y: this.A.face.cy
				};
				this.CHEST = {
					cx: this.NP.cx,
					cy: this.A.neckBottom + (this.A.face.y1 - this.A.face.y0) * .6,
					rx: (this.A.face.x1 - this.A.face.x0) * .6,
					ry: (this.A.face.y1 - this.A.face.y0) * .45
				};
				for (const Lr of rig.layers) {
					const L = Object.assign({}, Lr);
					const cell = (L.phys ? 30 : 42) * Math.max(.6, this.CW / 768);
					const nx = Math.max(2, Math.round(L.w / cell));
					const ny = Math.max(2, Math.round(L.h / cell));
					const nv = (nx + 1) * (ny + 1);
					const base = new Float32Array(nv * 2);
					const uv = new Float32Array(nv * 2);
					let k = 0;
					for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
						base[k] = L.x + L.w * i / nx;
						base[k + 1] = L.y + L.h * j / ny;
						uv[k] = i / nx;
						uv[k + 1] = j / ny;
						k += 2;
					}
					const idx = [];
					for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
						const a = j * (nx + 1) + i;
						const b = a + 1;
						const c = a + nx + 1;
						const d = c + 1;
						idx.push(a, b, c, b, d, c);
					}
					L.base = base;
					L.cur = new Float32Array(base);
					L.nIdx = idx.length;
					L.bn = window.Rigger ? window.Rigger.baseName(L.name.replace(/_(l|r)$/, "")) : L.name;
					if (L.strands && L.strands.length) {
						const S = L.strands;
						const nS = S.length;
						let spacing = 120;
						if (nS > 1) {
							const ds = [];
							for (let s = 1; s < nS; s++) ds.push(S[s].x - S[s - 1].x);
							ds.sort((a, b) => a - b);
							spacing = ds[ds.length >> 1];
						}
						const sig = spacing * .6;
						L.sw = new Float32Array(nv * nS);
						L.su = new Float32Array(nv);
						L.spr = S.map((s, i) => ({
							stiff: {
								x: 0,
								v: 0,
								dx: 0
							},
							soft: {
								x: 0,
								v: 0,
								dx: 0
							},
							phase: i * 1.37 + L.z
						}));
						for (let v = 0; v < nv; v++) {
							const x = base[v * 2];
							const y = base[v * 2 + 1];
							let tot = 0;
							for (let s = 0; s < nS; s++) {
								const w = Math.exp(-Math.pow((x - S[s].x) / sig, 2));
								L.sw[v * nS + s] = w;
								tot += w;
							}
							let rY = 0;
							let tY = 0;
							if (tot > 1e-6) for (let s = 0; s < nS; s++) {
								L.sw[v * nS + s] /= tot;
								rY += L.sw[v * nS + s] * S[s].rootY;
								tY += L.sw[v * nS + s] * S[s].tipY;
							}
							else {
								L.sw[v * nS + 0] = 1;
								rY = S[0].rootY;
								tY = S[0].tipY;
							}
							L.su[v] = Math.min(1, Math.max(0, (y - rY) / Math.max(1, tY - rY)));
						}
						if (L.bn === "front hair") {
							const fw = this.A.face.x1 - this.A.face.x0;
							const fcx = this.A.face.cx;
							const f = 36;
							const b1 = fcx - fw * .22;
							const b2 = fcx + fw * .22;
							L.bw = new Float32Array(nv * 3);
							for (let v = 0; v < nv; v++) {
								const x = base[v * 2];
								const s1 = this.smooth((x - b1) / f + .5);
								const s2 = this.smooth((x - b2) / f + .5);
								L.bw[v * 3] = 1 - s1;
								L.bw[v * 3 + 1] = s1 * (1 - s2);
								L.bw[v * 3 + 2] = s2;
							}
						}
					}
					L.vboPos = gl.createBuffer();
					L.vboUV = gl.createBuffer();
					L.ibo = gl.createBuffer();
					gl.bindBuffer(gl.ARRAY_BUFFER, L.vboUV);
					gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
					gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, L.ibo);
					gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
					const idata = typeof ImageData !== "undefined" ? new ImageData(new Uint8ClampedArray(L.img.data), L.img.width, L.img.height) : L.img;
					L.tex = this.mkTex(idata);
					delete L.img;
					this.layers.push(L);
				}
				this.canvas.width = this.CW;
				this.canvas.height = this.CH;
				this.baseW = this.CW;
				this.baseH = this.CH;
				let minX = Infinity;
				let minY = Infinity;
				let maxX = -Infinity;
				let maxY = -Infinity;
				for (const L of this.layers) {
					minX = Math.min(minX, L.x);
					minY = Math.min(minY, L.y);
					maxX = Math.max(maxX, L.x + L.w);
					maxY = Math.max(maxY, L.y + L.h);
				}
				if (minX < Infinity && maxX > -Infinity) {
					this.contentBounds = {
						x: Math.max(0, minX),
						y: Math.max(0, minY),
						width: Math.min(this.CW, maxX) - Math.max(0, minX),
						height: Math.min(this.CH, maxY) - Math.max(0, minY)
					};
					if (this.contentBounds.width <= 0) this.contentBounds.width = this.CW;
					if (this.contentBounds.height <= 0) this.contentBounds.height = this.CH;
				} else this.contentBounds = {
					x: 0,
					y: 0,
					width: this.CW,
					height: this.CH
				};
			}
			/** 从 PSD 数据加载模型。 */
			async loadPsdData(psdBuffer) {
				if (!window.agPsd) throw new Error("ag-psd.min.js 未加载");
				if (!window.Rigger) throw new Error("rigger.js 未加载");
				const psd = window.agPsd.readPsd(new Uint8Array(psdBuffer), {
					useImageData: true,
					skipThumbnail: true
				});
				window.Rigger.cleanPsdLayers(psd);
				const options = this.genericOpts();
				const rig = window.Rigger.buildRig(psd, options);
				this.applyRig(rig);
			}
			/** 从 URL 加载 PSD 模型。 */
			async loadFromUrl(url) {
				const res = await fetch(url);
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const buf = await res.arrayBuffer();
				await this.loadPsdData(buf);
			}
			/** 计算通用闭眼/闭口差分选项。 */
			genericOpts() {
				const GP = window.GenericParts;
				const base = GP ? {
					eyeL: GP.get("eyeL"),
					eyeR: GP.get("eyeR"),
					mouth: GP.get("mouth")
				} : {};
				return base.eyeL || base.mouth ? { generic: base } : {};
			}
			clamp(v, a, b) {
				return v < a ? a : v > b ? b : v;
			}
			smooth(t) {
				t = this.clamp(t, 0, 1);
				return t * t * (3 - 2 * t);
			}
			fadeAlpha(L, e) {
				if (!L.fade) return 1;
				if (L.fade === "eyeOpen") {
					const v = L.side === "L" ? e.eyeOpenL : e.eyeOpenR;
					return this.smooth((v - (.1 + e.eyeEase * .45)) / .15);
				}
				if (L.fade === "eyeClose") {
					const v = L.side === "L" ? e.eyeOpenL : e.eyeOpenR;
					return 1 - this.smooth((v - (.1 + e.eyeEase * .45)) / .15);
				}
				if (L.fade === "mouthOpen") return this.smooth((e.mouthOpen - (.05 + e.mouthEase * .35)) / .12);
				if (L.fade === "mouthClose") return 1 - this.smooth((e.mouthOpen - (.05 + e.mouthEase * .35)) / .12);
				return 1;
			}
			deform(L, e) {
				const b = L.base;
				const o = L.cur;
				const n = b.length;
				const isHead = L.group === "head";
				const az = e.angleZ * .07;
				const cz = Math.cos(az);
				const sz = Math.sin(az);
				const ab = e.body * .028;
				const cb = Math.cos(ab);
				const sb = Math.sin(ab);
				L.name;
				const bn = L.bn;
				const eyeSide = L.side;
				const EA = eyeSide === "L" ? this.A.eyeL : eyeSide === "R" ? this.A.eyeR : null;
				const vOpen = eyeSide === "L" ? e.eyeOpenL : e.eyeOpenR;
				const mo = e.mouthOpen;
				const mHalfW = (this.A.mouth.x1 - this.A.mouth.x0) / 2;
				const nS = L.strands ? L.strands.length : 0;
				const bcx = L.x + L.w / 2;
				const bcy = L.y + L.h / 2;
				const isFH = bn === "front hair";
				for (let k = 0; k < n; k += 2) {
					let x = b[k];
					let y = b[k + 1];
					const vi = k >> 1;
					if (EA && bn === "eye_close") {
						const sE = eyeSide === "L" ? e.eyeScaleL : e.eyeScaleR;
						if (sE !== 1) {
							const cxE = (EA.x0 + EA.x1) / 2;
							const cyE = (EA.y0 + EA.y1) / 2;
							x = cxE + (x - cxE) * sE;
							y = cyE + (y - cyE) * sE;
						}
					}
					if (bn === "mouth_open" || bn === "mouth_close") {
						const sM = e.mouthScale;
						if (sM !== 1) {
							x = this.A.mouth.cx + (x - this.A.mouth.cx) * sM;
							y = this.A.mouth.cy + (y - this.A.mouth.cy) * sM;
						}
					}
					if (L.fade === "eyeOpen" && EA) {
						if (bn === "irides") {
							const isc = e.irisScale;
							x = EA.icx + (x - EA.icx) * isc;
							y = EA.icy + (y - EA.icy) * isc;
							x += e.eyeX * 11 * this.FS;
							y += e.eyeY * 6 * this.FS;
							const tl = this.smooth((.32 - vOpen) / .32);
							y = EA.closeY + (y - EA.closeY) * (1 - .8 * tl);
						} else y = EA.closeY + (y - EA.closeY) * (1 - .85 * (1 - vOpen));
					}
					if (L.fade === "eyeClose" && EA) {
						y -= vOpen * 3;
						y += e.eyeCY * 14 * this.FS;
						const thE = e.eyeCAng * .3 * (eyeSide === "L" ? 1 : -1);
						if (thE) {
							const ct = Math.cos(thE);
							const st = Math.sin(thE);
							const rx = x - bcx;
							const ry = y - bcy;
							x = bcx + rx * ct - ry * st;
							y = bcy + rx * st + ry * ct;
						}
					}
					if (bn === "eyebrow") {
						y += (-e.brow * 9 + (1 - vOpen) * 3.5) * this.FS;
						const th = (eyeSide === "L" ? e.browAngL + e.browAngSym : e.browAngR - e.browAngSym) * .3;
						if (th) {
							const ct = Math.cos(th);
							const st = Math.sin(th);
							const rx = x - bcx;
							const ry = y - bcy;
							x = bcx + rx * ct - ry * st;
							y = bcy + rx * st + ry * ct;
						}
					}
					if (L.fade === "mouthOpen") {
						y = this.A.mouth.y0 + (y - this.A.mouth.y0) * (.5 + .5 * mo);
						const q = Math.pow(Math.abs(x - this.A.mouth.cx) / (mHalfW + 4), 1.5);
						y -= e.mouthForm * 6 * this.FS * (q - .35);
					}
					if (L.fade === "mouthClose") {
						y += e.mouthCY * 14 * this.FS;
						const thM = e.mouthCAng * .35;
						if (thM) {
							const ct = Math.cos(thM);
							const st = Math.sin(thM);
							const rx = x - this.A.mouth.cx;
							const ry = y - this.A.mouth.cy;
							x = this.A.mouth.cx + rx * ct - ry * st;
							y = this.A.mouth.cy + rx * st + ry * ct;
						}
					}
					if (bn === "face" && y > this.A.mouth.cy) y += mo * 6 * this.FS * this.smooth((y - this.A.mouth.cy) / (this.A.face.y1 - this.A.mouth.cy));
					let hw = isHead ? 1 : L.group === "body" ? .16 : 0;
					if (bn === "neck") hw = .55 * this.smooth((this.A.neckBottom - y) / Math.max(1, this.A.neckBottom - this.A.neckTop));
					if (hw > 0) {
						let rx = x - this.NP.cx;
						let ry = y - this.NP.cy;
						const rx2 = rx * cz - ry * sz;
						const ry2 = rx * sz + ry * cz;
						x += (rx2 - rx) * hw;
						y += (ry2 - ry) * hw;
						const dd = L.depth;
						x += hw * this.FS * (e.angleX * (14 + 40 * (dd - 1)) + e.angleX * (this.NP.cy - y) * .028);
						y += hw * this.FS * (-e.angleY * (9 + 30 * (dd - 1)) - e.angleY * (dd - 1) * (y - this.FC.y) * .05);
					}
					y -= (L.group === "body" ? e.breath * 2 : e.breathHead * 1.6) * this.FS;
					if (bn === "topwear" && y < this.CHEST.cy) y -= e.breath * 2.2 * this.FS * this.smooth((this.CHEST.cy - y) / (this.CHEST.ry * 2));
					if (bn === "topwear") x = this.NP.cx + (x - this.NP.cx) * (1 + e.breath * .003);
					if (bn === "topwear") {
						const gx = (x - this.CHEST.cx) / this.CHEST.rx;
						const gy = (y - (this.CHEST.cy + e.bustY * 70 * this.FS)) / this.CHEST.ry;
						y += this.bounce.dy * e.bust * Math.exp(-gx * gx - gy * gy);
					}
					if (bn === "handwear") {
						const w = this.smooth((y - L.y) / L.h * 1.15);
						y -= e.armY * 30 * this.FS * w;
						y += e.armPos * 40 * this.FS;
						x += e.armY * 6 * this.FS * w * (x < this.NP.cx ? 1 : -1);
					}
					if (L.bw && L.su) {
						const m = Math.pow(L.su[vi], 1.4) * 22 * this.FS;
						x += (e.bangL * L.bw[vi * 3] + e.bangC * L.bw[vi * 3 + 1] + e.bangR * L.bw[vi * 3 + 2]) * m;
					}
					if (nS && this.auto.phys) {
						const u = isFH ? Math.min(1, L.su[vi] * 1.6) : L.su[vi];
						const amp = Math.pow(u, isFH ? 1.8 : 2.1) * (isFH ? e.fhAmp : e.physAmp);
						const softMix = Math.pow(u, 1.2) * (isFH ? e.fhSoft : e.soft);
						let dx = 0;
						for (let s = 0; s < nS; s++) {
							const w = L.sw[vi * nS + s];
							if (w < .001) continue;
							const sp = L.spr[s];
							dx += w * (sp.stiff.dx * (1 - softMix) + sp.soft.dx * softMix);
						}
						x += dx * amp;
						y += Math.abs(dx) * amp * .12;
					}
					o[k] = x;
					o[k + 1] = y;
				}
				if (Math.abs(ab) > 1e-4) for (let k = 0; k < n; k += 2) {
					const rx = o[k] - this.BP.cx;
					const ry = o[k + 1] - this.BP.cy;
					o[k] = this.BP.cx + rx * cb - ry * sb;
					o[k + 1] = this.BP.cy + rx * sb + ry * cb;
				}
			}
			/** 播放动作（对应 Live2D 的 motion()）。 */
			async motion(name, _index, _priority) {
				const preset = DEFAULT_MOTION_PRESETS[name] || DEFAULT_MOTION_PRESETS[name.replace(/_\d+$/, "")];
				if (!preset) {
					this.motionTarget = null;
					this.motionName = null;
					this.motionDuration = 0;
					return false;
				}
				this.motionTarget = preset.target ? { ...preset.target } : null;
				this.motionName = name;
				this.motionDuration = preset.duration || 0;
				this.motionStartTime = performance.now();
				if (this.motionTimer) {
					clearTimeout(this.motionTimer);
					this.motionTimer = null;
				}
				if (this.motionDuration > 0) {
					const duration = this.motionDuration;
					this.motionTimer = setTimeout(() => {
						if (this.motionName === name && this._onMotionFinish) this._onMotionFinish();
						this.motionTimer = null;
					}, duration);
				}
				return true;
			}
			/** 停止所有动作。 */
			stopAllMotions() {
				this.motionTarget = null;
				this.motionName = null;
				this.motionDuration = 0;
				if (this.motionTimer) {
					clearTimeout(this.motionTimer);
					this.motionTimer = null;
				}
			}
			/** 鼠标/视线跟随（对应 Live2D 的 focus()）。 */
			focus(x, y, instant = false) {
				const w = this.canvas.width || 1;
				const h = this.canvas.height || 1;
				const fx = this.flipped ? w - x : x;
				const nx = this.clamp(fx / w * 2 - 1, -1, 1);
				const ny = this.clamp(y / h * 2 - 1, -1, 1);
				const speed = instant ? 1 : .2;
				this.P.angleX += (nx * .6 - this.P.angleX) * speed;
				this.P.angleY += (-ny * .5 - this.P.angleY) * speed;
				this.P.eyeX += (nx * 1 - this.P.eyeX) * speed;
				this.P.eyeY += (-ny * .8 - this.P.eyeY) * speed;
			}
			/** 重置视线到正视前方。 */
			resetFocus() {
				this.P.angleX += (0 - this.P.angleX) * .2;
				this.P.angleY += (0 - this.P.angleY) * .2;
				this.P.eyeX += (0 - this.P.eyeX) * .2;
				this.P.eyeY += (0 - this.P.eyeY) * .2;
			}
			/** 设置单个参数（用户手动调整时记录，自动动画不会覆盖）。 */
			setParam(key, value) {
				this.T[key] = value;
				this.manualSet.add(String(key));
				if (this.motionTarget) {
					if (Object.keys(this.motionTarget).includes(String(key))) {
						this.motionTarget = null;
						this.motionName = null;
						this.motionDuration = 0;
					}
				}
			}
			/** 批量设置参数（用户手动调整时记录，自动动画不会覆盖）。 */
			setParams(params) {
				Object.assign(this.T, params);
				for (const key of Object.keys(params)) this.manualSet.add(key);
				if (this.motionTarget) {
					const motionKeys = Object.keys(this.motionTarget);
					if (Object.keys(params).some((k) => motionKeys.includes(k))) {
						this.motionTarget = null;
						this.motionName = null;
						this.motionDuration = 0;
					}
				}
			}
			/** 重置为默认参数并清除手动跟踪。 */
			resetParams() {
				this.T = { ...DEFAULT_PARAMS };
				this.manualSet.clear();
			}
			/** 设置左右镜像翻转。 */
			setFlip(on) {
				this.flipped = !!on;
			}
			/** 设置 FPS 上限（0 = 不限制）。 */
			setFpsLimit(fps) {
				this.frameInterval = Number.isFinite(fps) && fps > 0 ? 1e3 / fps : 0;
			}
			/** 设置自动动画开关。 */
			setAuto(key, on) {
				this.auto[key] = on;
				if (on) {
					if (key === "talk") this.manualSet.delete("mouthOpen");
					if (key === "rand") {
						this.manualSet.delete("angleX");
						this.manualSet.delete("angleY");
						this.manualSet.delete("angleZ");
						this.manualSet.delete("eyeX");
						this.manualSet.delete("eyeY");
					}
					if (key === "blink") {
						this.manualSet.delete("eyeOpenL");
						this.manualSet.delete("eyeOpenR");
					}
					if (key === "idle") {
						this.manualSet.delete("angleX");
						this.manualSet.delete("angleY");
						this.manualSet.delete("angleZ");
						this.manualSet.delete("body");
					}
				}
			}
			/** 获取模型原始尺寸。 */
			get width() {
				return this.baseW || this.CW;
			}
			get height() {
				return this.baseH || this.CH;
			}
			/**
			* 获取模型包围盒（基于实际图层内容，转换为 CSS 显示坐标系）。
			* 客户端传入的点击坐标是 CSS 坐标（相对于 canvas 显示区域），
			* 这里需要把 PSD 原始坐标换算为 CSS 坐标，保证空间分区计算正确。
			*/
			getBounds() {
				const cssW = this.canvas.style.width ? parseFloat(this.canvas.style.width) : 0;
				const cssH = this.canvas.style.height ? parseFloat(this.canvas.style.height) : 0;
				if (cssW > 0 && cssH > 0 && this.CW > 0 && this.CH > 0) {
					const scaleX = cssW / this.CW;
					const scaleY = cssH / this.CH;
					return {
						x: this.contentBounds.x * scaleX,
						y: this.contentBounds.y * scaleY,
						width: this.contentBounds.width * scaleX,
						height: this.contentBounds.height * scaleY
					};
				}
				return { ...this.contentBounds };
			}
			/** 命中测试（Anime2.5DRig 无实际 HitArea，返回空数组，由空间回退处理）。 */
			hitTest(_x, _y) {
				return [];
			}
			/** 设置动作完成回调。 */
			set onMotionFinish(fn) {
				this._onMotionFinish = fn;
			}
			get onMotionFinish() {
				return this._onMotionFinish;
			}
			/** 销毁渲染器。 */
			destroy() {
				this.disposed = true;
				if (this.rafId) cancelAnimationFrame(this.rafId);
				if (this.gl) for (const L of this.layers) {
					if (L.tex) this.gl.deleteTexture(L.tex);
					if (L.vboPos) this.gl.deleteBuffer(L.vboPos);
					if (L.vboUV) this.gl.deleteBuffer(L.vboUV);
					if (L.ibo) this.gl.deleteBuffer(L.ibo);
				}
				this.layers = [];
				this._onMotionFinish = null;
				if (this.motionTimer) {
					clearTimeout(this.motionTimer);
					this.motionTimer = null;
				}
			}
			/** 暂停/恢复渲染循环。 */
			pause() {
				if (this.rafId) cancelAnimationFrame(this.rafId);
				this.rafId = 0;
			}
			resume() {
				if (this.disposed || this.rafId) return;
				this.last = performance.now();
				this.rafId = requestAnimationFrame(this.tick);
			}
			tick = (now) => {
				if (this.disposed) return;
				this.rafId = requestAnimationFrame(this.tick);
				if (!this.layers.length || !this.A) return;
				if (this.frameInterval > 0 && now - this.lastFrame < this.frameInterval - 1) return;
				this.lastFrame = now;
				const dt = Math.min(.05, (now - this.last) / 1e3);
				this.last = now;
				const t = now / 1e3;
				let tgt = { ...this.T };
				if (this.motionTarget) {
					const elapsed = this.motionDuration > 0 ? (now - this.motionStartTime) / this.motionDuration : 0;
					const progress = this.motionDuration > 0 ? Math.min(1, elapsed) : 1;
					const ease = this.smooth(progress);
					for (const key of Object.keys(this.motionTarget)) {
						const targetVal = this.motionTarget[key] ?? 0;
						const currentVal = tgt[key] ?? 0;
						tgt[key] = currentVal + (targetVal - currentVal) * ease;
					}
					if (this.motionDuration > 0 && progress >= 1) {
						this.motionTarget = null;
						this.motionName = null;
						this.motionDuration = 0;
					}
				}
				if (this.auto.mouse && this.mouse.in) {
					tgt.angleX = this.clamp(this.mouse.x * .9, -1, 1);
					tgt.angleY = this.clamp(-this.mouse.y * .7, -1, 1);
					tgt.eyeX = this.clamp(this.mouse.x * 1.2, -1, 1);
					tgt.eyeY = this.clamp(-this.mouse.y * .8, -1, 1);
				}
				if (this.auto.idle) {
					if (!this.manualSet.has("angleX")) tgt.angleX += .13 * Math.sin(t * .42) + .05 * Math.sin(t * 1.13);
					if (!this.manualSet.has("angleY")) tgt.angleY += .08 * Math.sin(t * .31 + 1.7);
					if (!this.manualSet.has("angleZ")) tgt.angleZ += .07 * Math.sin(t * .23 + .5);
					if (!this.manualSet.has("body")) tgt.body += .1 * Math.sin(t * .19 + 2.1);
				}
				if (this.auto.rand) {
					if (now > this.nextRnd) {
						this.nextRnd = now + 1400 + Math.random() * 2600;
						this.rnd.ax = (Math.random() * 2 - 1) * .55;
						this.rnd.ay = (Math.random() * 2 - 1) * .4;
						this.rnd.az = (Math.random() * 2 - 1) * .35;
						this.rnd.bd = (Math.random() * 2 - 1) * .3;
						this.rnd.ex = (Math.random() * 2 - 1) * .6;
						this.rnd.ey = (Math.random() * 2 - 1) * .35;
					}
					tgt.angleX = this.clamp(tgt.angleX + this.rnd.ax, -1, 1);
					tgt.angleY = this.clamp(tgt.angleY + this.rnd.ay, -1, 1);
					tgt.angleZ = this.clamp(tgt.angleZ + this.rnd.az, -1, 1);
					tgt.body = this.clamp(tgt.body + this.rnd.bd, -1, 1);
					tgt.eyeX = this.clamp(tgt.eyeX + this.rnd.ex, -1, 1);
					tgt.eyeY = this.clamp(tgt.eyeY + this.rnd.ey, -1, 1);
				}
				if (this.auto.talk) {
					if (now > this.nextTalkState) {
						this.talkOn = !this.talkOn;
						this.nextTalkState = now + (this.talkOn ? 1200 + Math.random() * 2200 : 600 + Math.random() * 1800);
					}
					if (this.talkOn && now > this.nextSyl) {
						this.nextSyl = now + 70 + Math.random() * 110;
						this.talkTgt = Math.random() < .25 ? .04 : .25 + Math.random() * .75;
					}
					if (!this.talkOn) this.talkTgt = 0;
					this.talkV += (this.talkTgt - this.talkV) * Math.min(1, dt * 22);
					if (!this.manualSet.has("mouthOpen")) tgt.mouthOpen = Math.max(tgt.mouthOpen, this.talkV);
				}
				if (this.auto.blink) {
					if (this.blinkT < 0 && now > this.nextBlink) {
						this.blinkT = 0;
						this.nextBlink = now + 1600 + Math.random() * 3800;
						if (Math.random() < .18) this.nextBlink = now + 280;
					}
					if (this.blinkT >= 0) {
						this.blinkT += dt;
						const d = this.blinkT;
						let v;
						if (d < .08) v = 1 - d / .08;
						else if (d < .42) v = 0;
						else if (d < .58) v = (d - .42) / .16;
						else {
							v = 1;
							this.blinkT = -1;
						}
						if (!this.manualSet.has("eyeOpenL")) tgt.eyeOpenL = Math.min(tgt.eyeOpenL, v);
						if (!this.manualSet.has("eyeOpenR")) tgt.eyeOpenR = Math.min(tgt.eyeOpenR, v);
					}
				}
				for (const key of Object.keys(this.cur)) {
					const tVal = tgt[key] ?? 0;
					const cVal = this.cur[key] ?? 0;
					this.cur[key] = cVal + (tVal - cVal) * Math.min(1, dt * 14);
				}
				const e = { ...this.cur };
				e.breath = .5 + .5 * Math.sin(t * 2 * Math.PI / 3.4);
				e.breathHead = .5 + .5 * Math.sin(t * 2 * Math.PI / 3.4 - .6);
				const headDX = (e.angleX * 14 + e.angleZ * .07 * (this.NP.cy - this.FC.y)) * this.FS;
				for (const L of this.layers) {
					if (!L.spr) continue;
					for (const sp of L.spr) {
						const txv = headDX + (this.auto.idle ? 1.8 * Math.sin(t * .8 + sp.phase) + 1 * Math.sin(t * 1.9 + sp.phase * 2.3) : 0) * this.FS;
						let kk = 70;
						let cc = 9;
						let axv = -kk * (sp.stiff.x - txv) - cc * sp.stiff.v;
						sp.stiff.v += axv * dt;
						sp.stiff.x += sp.stiff.v * dt;
						sp.stiff.dx = -(sp.stiff.x - txv) * 2.2;
						kk = 16;
						cc = 1.3;
						axv = -kk * (sp.soft.x - txv) - cc * sp.soft.v;
						sp.soft.v += axv * dt;
						sp.soft.x += sp.soft.v * dt;
						sp.soft.dx = -(sp.soft.x - txv) * 3;
					}
				}
				{
					const bustTgt = (e.breath * 3 - e.angleY * 6 + e.body * 4) * this.FS;
					const aa = -140 * (this.bounce.x - bustTgt) - 4.2 * this.bounce.v;
					this.bounce.v += aa * dt;
					this.bounce.x += this.bounce.v * dt;
					this.bounce.dy = -(this.bounce.x - bustTgt) * 3;
				}
				this.render(e);
			};
			/** 实际执行 WebGL 渲染。 */
			render(e) {
				const gl = this.gl;
				if (!gl) return;
				gl.viewport(0, 0, this.CW, this.CH);
				gl.clearColor(0, 0, 0, 0);
				gl.clearStencil(0);
				gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
				gl.uniform2f(this.locRes, this.CW, this.CH);
				gl.uniform1f(this.locFlip, this.flipped ? -1 : 1);
				for (const L of this.layers) {
					const fa = this.fadeAlpha(L, e);
					if (fa < .004 && !(L.fade === "eyeOpen" && L.name.indexOf("eyewhite") === 0)) continue;
					this.deform(L, e);
					gl.uniform1f(this.locAl, fa);
					gl.bindBuffer(gl.ARRAY_BUFFER, L.vboPos);
					gl.bufferData(gl.ARRAY_BUFFER, L.cur, gl.DYNAMIC_DRAW);
					gl.vertexAttribPointer(this.locPos, 2, gl.FLOAT, false, 0, 0);
					gl.bindBuffer(gl.ARRAY_BUFFER, L.vboUV);
					gl.vertexAttribPointer(this.locUV, 2, gl.FLOAT, false, 0, 0);
					gl.bindTexture(gl.TEXTURE_2D, L.tex);
					gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, L.ibo);
					if (L.name.indexOf("eyewhite") === 0) {
						gl.enable(gl.STENCIL_TEST);
						gl.stencilFunc(gl.ALWAYS, 1, 255);
						gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
						gl.uniform1f(this.locCut, .25);
						gl.drawElements(gl.TRIANGLES, L.nIdx, gl.UNSIGNED_SHORT, 0);
						gl.disable(gl.STENCIL_TEST);
						gl.uniform1f(this.locCut, 0);
					} else if (L.name.indexOf("irides") === 0) {
						gl.enable(gl.STENCIL_TEST);
						gl.stencilFunc(gl.EQUAL, 1, 255);
						gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
						gl.drawElements(gl.TRIANGLES, L.nIdx, gl.UNSIGNED_SHORT, 0);
						gl.disable(gl.STENCIL_TEST);
					} else gl.drawElements(gl.TRIANGLES, L.nIdx, gl.UNSIGNED_SHORT, 0);
				}
			}
		};
		/** Anime2.5DRig 全部滑块定义（按控制面板分组）。 */
		const ANIME_SLIDERS = [
			{
				key: "angleX",
				label: "左右转头",
				min: -1,
				max: 1,
				step: .01,
				default: 0,
				group: "头部姿态"
			},
			{
				key: "angleY",
				label: "上下点头",
				min: -1,
				max: 1,
				step: .01,
				default: 0,
				group: "头部姿态"
			},
			{
				key: "angleZ",
				label: "歪头角度",
				min: -1,
				max: 1,
				step: .01,
				default: 0,
				group: "头部姿态"
			},
			{
				key: "eyeOpenL",
				label: "左眼睁开",
				min: 0,
				max: 1,
				step: .01,
				default: 1,
				group: "眼睛"
			},
			{
				key: "eyeOpenR",
				label: "右眼睁开",
				min: 0,
				max: 1,
				step: .01,
				default: 1,
				group: "眼睛"
			},
			{
				key: "eyeX",
				label: "视线左右",
				min: -1,
				max: 1,
				step: .01,
				default: 0,
				group: "眼睛"
			},
			{
				key: "eyeY",
				label: "视线上下",
				min: -1,
				max: 1,
				step: .01,
				default: 0,
				group: "眼睛"
			},
			{
				key: "irisScale",
				label: "瞳孔大小",
				min: .5,
				max: 1.3,
				step: .01,
				default: 1,
				group: "眼睛"
			},
			{
				key: "eyeScaleL",
				label: "左闭眼大小",
				min: .5,
				max: 1.5,
				step: .01,
				default: 1,
				group: "眼睛"
			},
			{
				key: "eyeScaleR",
				label: "右闭眼大小",
				min: .5,
				max: 1.5,
				step: .01,
				default: 1,
				group: "眼睛"
			},
			{
				key: "eyeEase",
				label: "眨眼灵敏度",
				min: 0,
				max: 1,
				step: .01,
				default: .3,
				group: "眼睛"
			},
			{
				key: "eyeCY",
				label: "闭眼位置微调",
				min: -1,
				max: 1,
				step: .01,
				default: 0,
				group: "眼睛"
			},
			{
				key: "eyeCAng",
				label: "闭眼角度微调",
				min: -1,
				max: 1,
				step: .01,
				default: 0,
				group: "眼睛"
			},
			{
				key: "brow",
				label: "眉毛高低",
				min: -1,
				max: 1,
				step: .01,
				default: 0,
				group: "眉毛"
			},
			{
				key: "browAngSym",
				label: "眉毛对称角度",
				min: -1,
				max: 1,
				step: .01,
				default: 0,
				group: "眉毛"
			},
			{
				key: "browAngL",
				label: "左眉角度",
				min: -1,
				max: 1,
				step: .01,
				default: 0,
				group: "眉毛"
			},
			{
				key: "browAngR",
				label: "右眉角度",
				min: -1,
				max: 1,
				step: .01,
				default: 0,
				group: "眉毛"
			},
			{
				key: "mouthOpen",
				label: "嘴巴张开",
				min: 0,
				max: 1,
				step: .01,
				default: 0,
				group: "嘴巴"
			},
			{
				key: "mouthForm",
				label: "微笑弧度",
				min: -1,
				max: 1,
				step: .01,
				default: 0,
				group: "嘴巴"
			},
			{
				key: "mouthCY",
				label: "闭口位置微调",
				min: -1,
				max: 1,
				step: .01,
				default: 0,
				group: "嘴巴"
			},
			{
				key: "mouthEase",
				label: "闭口灵敏度",
				min: 0,
				max: 1,
				step: .01,
				default: .45,
				group: "嘴巴"
			},
			{
				key: "mouthCAng",
				label: "嘴巴角度微调",
				min: -1,
				max: 1,
				step: .01,
				default: 0,
				group: "嘴巴"
			},
			{
				key: "mouthScale",
				label: "嘴巴大小",
				min: .5,
				max: 1.5,
				step: .01,
				default: 1,
				group: "嘴巴"
			},
			{
				key: "fhAmp",
				label: "刘海摆动幅度",
				min: 0,
				max: 3,
				step: .01,
				default: 2,
				group: "发型"
			},
			{
				key: "fhSoft",
				label: "刘海柔软度",
				min: 0,
				max: 2,
				step: .01,
				default: .4,
				group: "发型"
			},
			{
				key: "bangL",
				label: "左侧刘海",
				min: -1,
				max: 1,
				step: .01,
				default: 0,
				group: "发型"
			},
			{
				key: "bangC",
				label: "中间刘海",
				min: -1,
				max: 1,
				step: .01,
				default: 0,
				group: "发型"
			},
			{
				key: "bangR",
				label: "右侧刘海",
				min: -1,
				max: 1,
				step: .01,
				default: 0,
				group: "发型"
			},
			{
				key: "body",
				label: "身体前倾",
				min: -1,
				max: 1,
				step: .01,
				default: 0,
				group: "身体物理"
			},
			{
				key: "armY",
				label: "手臂高低",
				min: -1,
				max: 1,
				step: .01,
				default: 0,
				group: "身体物理"
			},
			{
				key: "armPos",
				label: "手臂前后",
				min: -1,
				max: 1,
				step: .01,
				default: 0,
				group: "身体物理"
			},
			{
				key: "bust",
				label: "胸部摆动",
				min: 0,
				max: 5,
				step: .01,
				default: 2.5,
				group: "身体物理"
			},
			{
				key: "bustY",
				label: "胸部位置",
				min: -1,
				max: 3,
				step: .01,
				default: 1,
				group: "身体物理"
			},
			{
				key: "physAmp",
				label: "头发摆动幅度",
				min: 0,
				max: 3,
				step: .01,
				default: 2,
				group: "身体物理"
			},
			{
				key: "soft",
				label: "头发柔软度",
				min: 0,
				max: 2,
				step: .01,
				default: 2,
				group: "身体物理"
			}
		];
		//#endregion
		//#region src/client/index.ts
		/**
		* dsh-anime25d-pets 浏览器半区：挂载 2.5D 桌宠（Anime2.5DRig 渲染）+ 「桌宠配置」设置页。
		*
		* 架构（ADR-005 / 004，spike pkg-9 实证）：
		* - `shell.overlay` 注册零尺寸锚点（生命周期/设置锚点）
		* - 视觉层用 Popover API（top layer，零 z-index）渲染，旧浏览器回退 body + 最大 z-index
		* - 运行时脚本与预设模型走 Host 同源路由（/pet-assets/*），无 CDN 依赖
		* - agent 状态经 /api/anime25d-pet/events SSE 推送（首帧快照 + 变更推送，ADR-006）；
		*   标签页隐藏/窗口失焦暂停渲染循环，恢复时继续（spec §7）
		* - 点击/拖动按 6px 阈值判定；自由位置拖动，松手持久化（spec §4）
		* - 鼠标跟随：document 级 pointermove 调用 model.focus()，头/眼/身体看向鼠标；移出页面复位；
		*   非 idle 动作播放期间抑制 focus，避免动作关键帧被鼠标跟随叠加（spec §4）
		* - 配置（enabled/size/maxFps/debug/model）经状态推送运行时应用：开关→显隐+停启渲染、
		*   尺寸→重设画布与模型适配、帧率→ticker.maxFPS、调试→动态面板、模型→按 modelUrl 重载（spec §2/§6/§7）
		* @module dsh-anime25d-pets/client
		*/
		/** Anime2.5DRig 渲染器（ESM 模块导入，非全局 PIXI/Live2D）。 */
		/** 注入所需服务。 */
		const inject = ["slots"];
		/** 点击/拖动判定阈值（px）。 */
		const DRAG_THRESHOLD = 6;
		/** 点击互动防抖（ms）：仅挡同一次 pointer 误触双发，不等气泡播完（spec §4）。 */
		const TAP_DEBOUNCE_MS = 80;
		/** 瞬态气泡显示时长（ms）：到时自动隐藏或回落阶段文案。 */
		const BUBBLE_DISPLAY_MS = 2500;
		/** pixi-live2d-display MotionPriority（对应库内枚举：NONE=0, IDLE=1, NORMAL=2, FORCE=3）。 */
		const MotionPriority = {
			IDLE: 1,
			NORMAL: 2,
			FORCE: 3
		};
		/**
		* 阶段演进气泡（spec §3）：思考/等审批为长状态（可达数十秒以上），气泡与
		* 状态同生命周期**常驻**，文案按入态后耗时推进（afterMs 为距入态偏移），
		* 阶段切换时重播一次状态动作；状态一变即被新状态表现取代。
		* 文案取自当前人设台词表（thinking1..3 / waiting1..3，spec §3 人设化台词）。
		*/
		const STAGED_DELAYS = {
			thinking: [
				0,
				15e3,
				4e4
			],
			waiting: [
				0,
				3e4,
				9e4
			]
		};
		/** 长状态 → 台词池键（与 STAGED_DELAYS 下标对应）。 */
		const STAGED_COPY_KEYS = {
			thinking: [
				"thinking1",
				"thinking2",
				"thinking3"
			],
			waiting: [
				"waiting1",
				"waiting2",
				"waiting3"
			]
		};
		/** 短状态（瞬态气泡）→ 台词池键；无键的状态不冒泡。 */
		const TRANSIENT_COPY_KEYS = {
			idle: "idle",
			error: "error",
			done: "done"
		};
		/** vendor 运行时脚本（Host 同源路由，ADR-003）。
		*  使用 Anime2.5DRig 的 PSD 解析 + 自动装配 + 闭眼闭口差分，替代 Live2D SDK。 */
		const VENDOR_SCRIPTS = [
			"/pet-assets/vendor/ag-psd.min.js",
			"/pet-assets/lib/rigger.js",
			"/pet-assets/lib/genericparts.js"
		];
		const PET_API = "/api/anime25d-pet";
		/** 最近一次收到的 PetStateView（loadParamsStorage 默认数据源）。 */
		let currentViewRef = null;
		/** 命中区域名 → 部位分桶（正则容错：不同模型命名不一）；未匹配的命中区域归身体。 */
		const TAP_PART_MATCHERS = [
			{
				part: "head",
				re: /head|hair|face|头/i
			},
			{
				part: "leg",
				re: /leg|foot|feet|shoe|腿|脚/i
			},
			{
				part: "arm",
				re: /arm|hand|手/i
			}
		];
		/**
		* 按命中区域名优先级归类（头 > 腿 > 手 > 身体）；空列表返回 null。
		*/
		function classifyTapByName(hits) {
			if (hits.length === 0) return null;
			for (const { part, re } of TAP_PART_MATCHERS) if (hits.some((name) => re.test(name))) return part;
			return "body";
		}
		/**
		* 按点击在模型包围盒内的相对位置分档（spec §4：HitArea 不足时的空间回退）。
		* 五个矩形：头 / 身 / 腿（居中列）+ 左臂 / 右臂（侧列）；不落在任一矩形 → null。
		*/
		function classifyTapByPosition(localX, localY, bounds, tap) {
			if (!(bounds.width > 0 && bounds.height > 0)) return null;
			const nx = (localX - bounds.x) / bounds.width;
			const ny = (localY - bounds.y) / bounds.height;
			if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return null;
			if (ny < tap.headMaxNy && nx >= tap.headMinNx && nx <= tap.headMaxNx) return "head";
			if (ny > tap.legMinNy && nx >= tap.bodyMinNx && nx <= tap.bodyMaxNx) return "leg";
			if (ny >= tap.armMinNy && ny <= tap.legMinNy) {
				if (nx >= tap.armLeftMinNx && nx < tap.bodyMinNx) return "arm";
				if (nx > tap.bodyMaxNx && nx <= tap.armRightMaxNx) return "arm";
			}
			if (ny >= tap.headMaxNy && ny <= tap.legMinNy && nx >= tap.bodyMinNx && nx <= tap.bodyMaxNx) return "body";
			return null;
		}
		/**
		* 综合命中名与空间回退（spec §4）：
		* - 命中名为头/腿/手 → 直接采用
		* - 空命中或仅身体/未识别名 → 盒内按相对位置分档；盒外不响应
		*/
		function classifyTap(hits, localX, localY, bounds, tap) {
			const named = classifyTapByName(hits);
			if (named === "head" || named === "leg" || named === "arm") return named;
			if (bounds) {
				const spatial = classifyTapByPosition(localX, localY, bounds, tap);
				if (spatial !== null) return spatial;
			}
			return named;
		}
		/** 从台词池随机取一句；可选避开上一条（池 ≥2 时，spec §4）。 */
		function pickLine(pool, avoid) {
			if (pool.length === 0) return void 0;
			if (pool.length === 1) return pool[0];
			const candidates = avoid ? pool.filter((line) => line !== avoid) : pool;
			const list = candidates.length > 0 ? candidates : pool;
			return list[Math.floor(Math.random() * list.length)];
		}
		/** JSON 响应读取:非 2xx 抛错——错误响应不得当作合法视图/结果解析。 */
		async function readJson(res) {
			if (!res.ok) throw new Error(`http ${res.status}`);
			return await res.json();
		}
		const api = {
			state: () => fetch(`${PET_API}/state`).then((res) => readJson(res)),
			/** SSE 状态订阅（ADR-006）：每次推送回调最新快照；断线由 EventSource
			*  自动重连（服务端 retry 3s），重连后首帧即全量快照。返回退订函数。 */
			events: (onState, onError) => {
				const es = new EventSource(`${PET_API}/events`);
				es.onmessage = (ev) => {
					try {
						onState(JSON.parse(ev.data));
					} catch {}
				};
				es.onerror = onError;
				return () => es.close();
			},
			setDisplay: (patch) => fetch(`${PET_API}/set-display`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(patch)
			}).then((res) => readJson(res))
		};
		/** vendor 脚本加载去重：同一 src 只注入一次、只等待同一份结果
		* （boot 在 StrictMode/HMR 下会重复执行，避免二次注入与重复初始化）。 */
		const scriptPromises = /* @__PURE__ */ new Map();
		function loadScript(src) {
			let pending = scriptPromises.get(src);
			if (!pending) {
				pending = new Promise((resolve, reject) => {
					const s = document.createElement("script");
					s.src = src;
					s.onload = () => resolve();
					s.onerror = () => reject(/* @__PURE__ */ new Error(`script load failed: ${src}`));
					document.head.appendChild(s);
				});
				scriptPromises.set(src, pending);
			}
			return pending;
		}
		/** 零尺寸锚点组件：占位 shell.overlay 席位，实际渲染在 popover 顶层容器。 */
		function PetAnchor() {
			const ref = (0, react.useRef)(null);
			(0, react.useEffect)(() => boot(ref.current), []);
			return (0, react.createElement)("div", {
				ref,
				style: {
					width: 0,
					height: 0
				}
			});
		}
		/**
		* 读取当前 Anime2.5D 参数配置。
		* 数据来自 PetStateView.config（Host 从 settings.yaml 读取并推送）。
		* @param fromView 可选的 PetStateView，提供配置数据源（默认从最近一次快照 currentViewRef 读取）
		*/
		function loadParamsStorage(fromView) {
			const cfg = (fromView ?? currentViewRef)?.config;
			return {
				...cfg?.animeParams ?? {},
				talk: cfg?.talk ?? false,
				rand: cfg?.rand ?? false,
				flip: cfg?.flip ?? false
			};
		}
		/** 保存 Anime2.5D 参数配置到 DSH settings.yaml（通过 settings API 写入）。 */
		function saveParamsStorage(params, autos = {}, fromView) {
			const current = loadParamsStorage(fromView);
			const mergedParams = {
				...current,
				...params
			};
			delete mergedParams.talk;
			delete mergedParams.rand;
			delete mergedParams.flip;
			const talk = autos.talk ?? current.talk ?? false;
			const rand = autos.rand ?? current.rand ?? false;
			const flip = autos.flip ?? current.flip ?? false;
			fetch("/api/anime25d-pet/settings", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ ops: [
					{
						op: "set",
						path: ["animeParams"],
						value: mergedParams
					},
					{
						op: "set",
						path: ["talk"],
						value: talk
					},
					{
						op: "set",
						path: ["rand"],
						value: rand
					},
					{
						op: "set",
						path: ["flip"],
						value: flip
					}
				] })
			}).catch(() => {});
		}
		/** 清除 Anime2.5D 参数配置（重置为默认）。 */
		function clearParamsStorage() {
			fetch("/api/anime25d-pet/settings", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ ops: [
					{
						op: "set",
						path: ["animeParams"],
						value: {}
					},
					{
						op: "set",
						path: ["talk"],
						value: false
					},
					{
						op: "set",
						path: ["rand"],
						value: false
					},
					{
						op: "set",
						path: ["flip"],
						value: false
					}
				] })
			}).catch(() => {});
		}
		function boot(anchor) {
			if (!anchor) return void 0;
			const cleanup = [];
			const pushCleanup = (fn) => {
				cleanup.push(fn);
			};
			let disposed = false;
			pushCleanup(() => {
				disposed = true;
			});
			pushCleanup(() => {
				clearStages();
				clearBubbleHideTimer();
			});
			pushCleanup(() => {
				if (sizeRaf) {
					window.cancelAnimationFrame(sizeRaf);
					sizeRaf = 0;
				}
				pendingSize = null;
			});
			pushCleanup(() => {
				stopZoneLoop();
				showSpatialZones = false;
			});
			let box = null;
			let bubble = null;
			/** Anime2.5DRig 参数浮动画板。 */
			let paramsPanel = null;
			let paramsToggleBtn = null;
			/** 状态呼吸灯（纯展示，位置/大小同设置按钮）。 */
			let statusLightEl = null;
			let paramsPanelVisible = false;
			/** 指针是否悬停在互动区（宠物画布）或设置按钮上。 */
			let paramsHover = false;
			let debugEl = null;
			/** 调试面板状态文本容器。 */
			let debugTextEl = null;
			let canvas = null;
			/** 画布外包一层，便于绝对定位调试分区叠加层。 */
			let petLayer = null;
			let zoneOverlay = null;
			let showSpatialZones = false;
			/** 当前模型生效的空间回退阈值（SSE config.spatialTap；默认 DEFAULT_SPATIAL_TAP）。 */
			let spatialTap = { ...DEFAULT_SPATIAL_TAP };
			/** 当前模型生效的状态/互动动画映射（SSE config.motionMap；默认 DEFAULT_MOTION_MAP）。 */
			let motionMap = { ...DEFAULT_MOTION_MAP };
			let zoneRaf = 0;
			/** Anime2.5DRig 渲染器实例。 */
			let animeRenderer = null;
			let model = null;
			let hitAreas = [];
			let currentModelUrl = null;
			let fallbackShown = false;
			let fallbackEl = null;
			let baseModelW = 0;
			let baseModelH = 0;
			let pendingSize = null;
			let sizeRaf = 0;
			let lastTapAt = 0;
			/** 各点击台词池上一次抽中的句子（避开连抽同一句，spec §4）。 */
			const lastTapLine = {};
			/** 互动动作世代：新互动或新非 idle 状态动作会作废上一次互动的恢复回调。 */
			let interactionGen = 0;
			/** 动作启动世代：任何新动作都会使异步 fallback/旧启动失效，避免被 stopAllMotions 打断后继续启动。 */
			let motionSeq = 0;
			/** 是否正在播放互动动作（motionFinish 后据此恢复当前状态动作）。 */
			let interactionActive = false;
			/** 是否抑制鼠标跟随：非 idle 动作播放期间为 true（spec §4）。 */
			let focusSuppressed = false;
			/** 最近一次全局 pointermove 的 client 坐标；动作结束后用于立即恢复跟随。 */
			let lastPointerClient = null;
			/** 当前模型 motionManager 的 motionFinish 解绑函数（模型重载/卸载时清理）。 */
			let detachMotionFinish = null;
			let bubbleHideTimer;
			let stageTimers = [];
			let stagedState = null;
			let stageIndex = 0;
			let lastState = null;
			let demoState = null;
			let view = null;
			let pos = {
				right: 24,
				bottom: 20,
				size: 160
			};
			let enabled = true;
			let hidden = document.visibilityState !== "visible";
			let activePersonaId = DEFAULT_PERSONA_ID;
			let activeCopy = resolvePersonaCopy(DEFAULT_PERSONA_ID, []);
			let lastCustomPersonas = [];
			let personaDefsVersion = -1;
			/** 合并 enabled/隐藏/失焦状态，启停渲染循环（spec §7：暂停渲染保留最后画面）。 */
			function syncTicker() {
				if (!animeRenderer) return;
				if (enabled && !hidden) try {
					animeRenderer.resume();
				} catch {}
				else try {
					animeRenderer.pause();
				} catch {}
			}
			function clearBubbleHideTimer() {
				if (bubbleHideTimer !== void 0) {
					window.clearTimeout(bubbleHideTimer);
					bubbleHideTimer = void 0;
				}
			}
			/** 显示常驻气泡文案：取消瞬态隐藏计时，气泡保持可见直到被取代。 */
			function setBubbleText(text) {
				if (!bubble) return;
				clearBubbleHideTimer();
				bubble.textContent = text;
				bubble.style.opacity = "1";
			}
			/** 重绘当前阶段文案（阶段推进/瞬态气泡到时回落/拖拽结束后恢复）。 */
			function showStageText() {
				if (!stagedState) return;
				const key = STAGED_COPY_KEYS[stagedState]?.[stageIndex];
				if (!key) return;
				const line = pickLine(activeCopy[key]);
				if (line !== void 0) setBubbleText(line);
			}
			/**
			* 瞬态气泡（交互/短状态，spec §3/§4）：立刻换文案并重置隐藏计时（连点可打断）；
			* 到时隐藏——若正处于阶段演进状态则回落到当前阶段文案（交互短暂抢占常驻气泡，过后归还）。
			*/
			function showBubble(text) {
				if (!bubble) return;
				clearBubbleHideTimer();
				setBubbleText(text);
				bubbleHideTimer = window.setTimeout(() => {
					bubbleHideTimer = void 0;
					if (stagedState) showStageText();
					else if (bubble) bubble.style.opacity = "0";
				}, BUBBLE_DISPLAY_MS);
			}
			/** 退出阶段演进状态：取消全部阶段计时并复位标记。 */
			function clearStages() {
				for (const t of stageTimers) window.clearTimeout(t);
				stageTimers = [];
				stagedState = null;
				stageIndex = 0;
			}
			/** 进入阶段演进状态：立即显示阶段 0 并按偏移调度后续阶段（spec §3）。 */
			function enterStaged(state) {
				clearStages();
				const delays = STAGED_DELAYS[state];
				const keys = STAGED_COPY_KEYS[state];
				if (!delays || !keys || delays.length === 0) return;
				stagedState = state;
				stageIndex = 0;
				showStageText();
				for (let i = 1; i < delays.length; i++) stageTimers.push(window.setTimeout(() => {
					stageIndex = i;
					if (!dragging) {
						showStageText();
						playState(state);
					}
				}, delays[i]));
			}
			/** 按 client 坐标应用鼠标跟随（model.focus 吃 canvas 本地坐标）。 */
			function applyFocus(clientX, clientY) {
				if (!model || !canvas) return;
				const rect = canvas.getBoundingClientRect();
				model.focus(clientX - rect.left, clientY - rect.top);
			}
			/** 解除非 idle 动作期间的 focus 抑制；若有最近指针位置则立即恢复跟随。 */
			function releaseFocusSuppression() {
				if (!focusSuppressed) return;
				focusSuppressed = false;
				if (model && lastPointerClient && !dragging && enabled && !hidden) applyFocus(lastPointerClient.x, lastPointerClient.y);
			}
			/**
			* 取某状态/互动部位的播放候选动作组：
			* - 配置过动画映射 → 随机打乱后逐个尝试（多选=随机选择，不是优先级排序）
			* - 未配置 → 默认候选链（保持旧版有序 fallback）
			*/
			function motionNamesFor(slot) {
				const configured = motionMap[slot];
				if (configured && configured.length > 0) {
					const names = [...configured];
					for (let i = names.length - 1; i > 0; i--) {
						const j = Math.floor(Math.random() * (i + 1));
						[names[i], names[j]] = [names[j], names[i]];
					}
					const defaults = DEFAULT_MOTION_MAP[slot] ?? [];
					for (const name of defaults) if (!names.includes(name)) names.push(name);
					return names;
				}
				return DEFAULT_MOTION_MAP[slot] ?? [];
			}
			/**
			* 按候选动作链启动动作，统一处理优先级、重播前 stopAllMotions、布尔返回值 fallback。
			* - idle 用 IDLE 优先级；状态/互动用 FORCE（NORMAL 不能打断 NORMAL，无法满足状态立即切换）。
			* - 非 idle 动作启动时抑制 focus，并等 motionFinish 真正播完后再恢复。
			*/
			async function startMotionWithPriority(names, priority, options) {
				if (!model || names.length === 0) return false;
				const seq = ++motionSeq;
				const currentModel = model;
				if (options.suppressFocus) {
					focusSuppressed = true;
					currentModel.internalModel?.focusController?.focus(0, 0, true);
				} else releaseFocusSuppression();
				if (options.isInteraction) interactionActive = true;
				currentModel.internalModel?.motionManager?.stopAllMotions?.();
				for (const name of names) {
					if (seq !== motionSeq || !model) return false;
					try {
						const ok = await model.motion(name, void 0, priority);
						if (seq !== motionSeq || !model) return false;
						if (ok) return true;
					} catch {
						if (seq !== motionSeq || !model) return false;
					}
				}
				if (seq === motionSeq) {
					if (options.isInteraction) interactionActive = false;
					if (options.suppressFocus) releaseFocusSuppression();
				}
				return false;
			}
			function playState(state) {
				if (!model) return;
				const names = motionNamesFor(state);
				if (names.length === 0) return;
				interactionGen += 1;
				interactionActive = false;
				startMotionWithPriority(names, state === "idle" ? MotionPriority.IDLE : MotionPriority.FORCE, {
					suppressFocus: state !== "idle",
					isInteraction: false
				});
			}
			/** MotionManager.motionFinish：动作真正播完。互动结束后恢复当前状态动作并解除 focus 抑制。
			* 注意该事件在库内部 state.complete()/自动回 idle 之前同步触发，恢复动作需延到微任务，
			* 避免在 MotionManager.update 中间重入修改 MotionState。 */
			function handleMotionFinish() {
				const wasInteraction = interactionActive;
				const gen = interactionGen;
				const seq = motionSeq;
				interactionActive = false;
				queueMicrotask(() => {
					if (seq !== motionSeq) return;
					releaseFocusSuppression();
					if (wasInteraction && gen === interactionGen && !interactionActive && lastState) playState(lastState);
				});
			}
			/** 状态呼吸灯配色（纯展示）。 */
			const STATUS_LIGHT_COLORS = {
				idle: "#22c55e",
				thinking: "#f59e0b",
				error: "#ef4444",
				done: "#3b82f6",
				waiting: "#a855f7"
			};
			function updateStatusLight(state) {
				if (!statusLightEl) return;
				const dot = statusLightEl.firstElementChild;
				if (!dot) return;
				const color = STATUS_LIGHT_COLORS[state] ?? "#22c55e";
				dot.style.background = color;
				dot.style.boxShadow = `0 0 10px ${color}`;
			}
			function applyState(next) {
				const state = demoState ?? next?.state ?? "idle";
				const personaId = next?.config.persona || "tsundere";
				if (personaId !== activePersonaId || personaDefsVersion !== next?.version) {
					const customs = next?.customPersonas ?? [];
					if (personaId !== activePersonaId || customs.length !== lastCustomPersonas.length || customs.some((p, i) => p !== lastCustomPersonas[i])) {
						lastCustomPersonas = customs;
						activePersonaId = personaId;
						activeCopy = resolvePersonaCopy(personaId, customs);
						if (stagedState && !dragging) showStageText();
					}
					personaDefsVersion = next?.version ?? -1;
				}
				updateStatusLight(state);
				if (state !== lastState) {
					lastState = state;
					if (STAGED_DELAYS[state]) enterStaged(state);
					else {
						clearStages();
						const key = TRANSIENT_COPY_KEYS[state];
						const line = key ? pickLine(activeCopy[key]) : void 0;
						if (line !== void 0) showBubble(line);
					}
					playState(state);
				}
				if (debugTextEl) debugTextEl.textContent = `agent: ${next?.agent ?? "-"}  pet: ${state}  v${next?.version ?? "-"}\npersona: ${activePersonaId}  hitAreas: ${hitAreas.join(",") || "-"}\npos: ${Math.round(pos.right)},${Math.round(pos.bottom)}  size: ${pos.size}\nbounds: ${Math.round(baseModelW)}x${Math.round(baseModelH)}  canvas: ${canvas?.width ?? 0}x${canvas?.height ?? 0}`;
			}
			/** 静态头像降级（WebGL 不可用 / 模型加载失败，spec §7）。 */
			function showFallback() {
				if (!box || fallbackShown) return;
				fallbackShown = true;
				fallbackEl = document.createElement("div");
				fallbackEl.style.cssText = "pointer-events:auto;width:64px;height:64px;display:flex;align-items:center;justify-content:center;font-size:36px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:16px;color:#fff";
				fallbackEl.textContent = "🐾";
				box.appendChild(fallbackEl);
			}
			/** 移除静态头像占位（模型（重新）加载前调用，避免降级与画布叠加）。 */
			function removeFallback() {
				if (fallbackEl && fallbackEl.parentNode) fallbackEl.parentNode.removeChild(fallbackEl);
				fallbackEl = null;
				fallbackShown = false;
			}
			/**
			* 按“size = canvas 宽度”的规则计算画布尺寸：
			* 模型宽度撑满 size（留 8px 边距），高度按模型原始宽高比自适应。
			*/
			function modelCanvasSize(baseW, baseH, size) {
				if (!(baseW > 0 && baseH > 0)) return {
					width: size,
					height: Math.round(size * 1.2)
				};
				const scale = (size - 8) / baseW;
				return {
					width: size,
					height: Math.max(1, Math.round(baseH * scale + 8))
				};
			}
			/** 按当前尺寸重新适配模型（通过 CSS 缩放控制显示大小，保持 WebGL 内部分辨率不变）。 */
			function fitModel(size) {
				if (!model || !canvas || !animeRenderer) return;
				const canvasSize = modelCanvasSize(baseModelW, baseModelH, size);
				canvas.style.width = `${canvasSize.width}px`;
				canvas.style.height = `${canvasSize.height}px`;
			}
			/** 立即应用画布尺寸（通过 CSS 缩放控制显示大小）。 */
			function applySizeNow(nextSize) {
				if (canvas && animeRenderer) {
					const canvasSize = modelCanvasSize(baseModelW, baseModelH, nextSize);
					canvas.style.width = `${canvasSize.width}px`;
					canvas.style.height = `${canvasSize.height}px`;
					if (zoneOverlay) {
						zoneOverlay.width = canvasSize.width;
						zoneOverlay.height = canvasSize.height;
						zoneOverlay.style.width = `${canvasSize.width}px`;
						zoneOverlay.style.height = `${canvasSize.height}px`;
					}
					pos.size = nextSize;
					syncDebugPanelWidth();
					if (model) fitModel(nextSize);
				} else pos.size = nextSize;
			}
			/** 合并同帧/连发的尺寸变更：只落地最后一档（防 SSE 风暴卡死主线程）。 */
			function scheduleSize(nextSize) {
				if (nextSize === pos.size && pendingSize === null) return;
				pendingSize = nextSize;
				if (sizeRaf) return;
				sizeRaf = window.requestAnimationFrame(() => {
					sizeRaf = 0;
					const size = pendingSize;
					pendingSize = null;
					if (size !== null && size !== pos.size) applySizeNow(size);
				});
			}
			/** 销毁当前渲染层（renderer/canvas/模型引用/静态头像占位）。 */
			function teardownLayer() {
				motionSeq += 1;
				interactionGen += 1;
				interactionActive = false;
				focusSuppressed = false;
				lastPointerClient = null;
				detachMotionFinish?.();
				detachMotionFinish = null;
				if (sizeRaf) {
					window.cancelAnimationFrame(sizeRaf);
					sizeRaf = 0;
				}
				pendingSize = null;
				stopZoneLoop();
				if (animeRenderer) try {
					animeRenderer.destroy();
				} catch {}
				animeRenderer = null;
				model = null;
				hitAreas = [];
				baseModelW = 0;
				baseModelH = 0;
				if (zoneOverlay && zoneOverlay.parentNode) zoneOverlay.parentNode.removeChild(zoneOverlay);
				zoneOverlay = null;
				if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
				canvas = null;
				if (bubble && petLayer && bubble.parentNode === petLayer && box) box.appendChild(bubble);
				if (petLayer && petLayer.parentNode) petLayer.parentNode.removeChild(petLayer);
				petLayer = null;
				if (paramsToggleBtn && paramsToggleBtn.parentNode) paramsToggleBtn.parentNode.removeChild(paramsToggleBtn);
				paramsToggleBtn = null;
				if (statusLightEl && statusLightEl.parentNode) statusLightEl.parentNode.removeChild(statusLightEl);
				statusLightEl = null;
				if (paramsPanel && paramsPanel.parentNode) paramsPanel.parentNode.removeChild(paramsPanel);
				paramsPanel = null;
				paramsPanelVisible = false;
				removeFallback();
			}
			/** 加载/重载模型层：销毁旧层 → 新建画布 + Anime2.5DRig 渲染器 → 绑定指针事件。 */
			async function loadModelLayer(url) {
				teardownLayer();
				if (disposed) return;
				if (!url || !box) {
					showFallback();
					return;
				}
				try {
					petLayer = document.createElement("div");
					petLayer.style.cssText = "position:relative;display:inline-block;pointer-events:none";
					canvas = document.createElement("canvas");
					const size = pos.size;
					canvas.width = size;
					canvas.height = Math.round(size * 1.2);
					canvas.style.cssText = "pointer-events:auto;display:block";
					zoneOverlay = document.createElement("canvas");
					zoneOverlay.width = canvas.width;
					zoneOverlay.height = canvas.height;
					zoneOverlay.style.cssText = `position:absolute;left:0;top:0;width:${canvas.width}px;height:${canvas.height}px;pointer-events:none;z-index:2;display:${showSpatialZones ? "block" : "none"}`;
					petLayer.appendChild(canvas);
					petLayer.appendChild(zoneOverlay);
					if (bubble && bubble.parentNode !== petLayer) petLayer.appendChild(bubble);
					if (debugEl) {
						petLayer.style.marginTop = "36px";
						syncDebugPanelWidth();
					}
					box.appendChild(petLayer);
					const renderer = new Anime25DRenderer(canvas);
					animeRenderer = renderer;
					pushCleanup(() => {
						try {
							renderer.destroy();
						} catch {}
					});
					await renderer.loadFromUrl(url);
					if (disposed) {
						teardownLayer();
						return;
					}
					let loaded = {
						width: renderer.width,
						height: renderer.height,
						anchor: { set: () => {} },
						scale: { set: () => {} },
						position: { set: () => {} },
						motion: (name, _index, _priority) => renderer.motion(name),
						focus: (x, y, instant) => renderer.focus(x, y, !!instant),
						hitTest: (_x, _y) => renderer.hitTest(_x, _y),
						getBounds: () => renderer.getBounds(),
						internalModel: {
							hitAreas: {},
							focusController: { focus: (x, y, instant) => renderer.focus(x, y, !!instant) },
							motionManager: {
								on: (event, listener) => {
									if (event === "motionFinish") renderer.onMotionFinish = listener;
								},
								off: (event, _listener) => {
									if (event === "motionFinish") renderer.onMotionFinish = null;
								},
								stopAllMotions: () => renderer.stopAllMotions(),
								definitions: { ...DEFAULT_MOTION_PRESETS }
							}
						},
						renderer
					};
					model = loaded;
					baseModelW = renderer.width;
					baseModelH = renderer.height;
					hitAreas = [];
					const canvasSize = modelCanvasSize(baseModelW, baseModelH, pos.size);
					canvas.style.width = `${canvasSize.width}px`;
					canvas.style.height = `${canvasSize.height}px`;
					if (zoneOverlay) {
						zoneOverlay.width = canvasSize.width;
						zoneOverlay.height = canvasSize.height;
						zoneOverlay.style.width = `${canvasSize.width}px`;
						zoneOverlay.style.height = `${canvasSize.height}px`;
					}
					syncDebugPanelWidth();
					detachMotionFinish?.();
					loaded.internalModel?.motionManager?.on?.("motionFinish", handleMotionFinish);
					detachMotionFinish = () => {
						loaded.internalModel?.motionManager?.off?.("motionFinish", handleMotionFinish);
					};
					fitModel(pos.size);
					renderer.setAuto("idle", true);
					renderer.setAuto("blink", true);
					renderer.setAuto("mouse", true);
					renderer.setAuto("phys", true);
					renderer.setFpsLimit(view?.config.fpsLimit ?? 30);
					if (box) box.style.opacity = String(view?.config.opacity ?? 1);
					setupParamsPanel();
					if (lastState) playState(lastState);
					if (showSpatialZones) startZoneLoop();
					canvas.addEventListener("pointerdown", handlePointerDown);
					canvas.addEventListener("pointermove", handlePointerMove);
					canvas.addEventListener("pointerup", handlePointerUp);
					canvas.addEventListener("pointercancel", () => {
						down = null;
						dragging = false;
					});
					canvas.addEventListener("pointerenter", () => {
						paramsHover = true;
						updateSettingsBtnVisibility();
					});
					canvas.addEventListener("pointerleave", () => {
						paramsHover = false;
						updateSettingsBtnVisibility();
					});
				} catch {
					teardownLayer();
					if (!disposed) showFallback();
				}
			}
			/**
			* 同步浮动画板 UI 与当前 settings 配置。
			* 当 SSE 推送更新配置时调用，使滑块和开关反映最新的已保存值。
			*/
			function syncParamsPanelUI() {
				if (!paramsPanel) return;
				const saved = loadParamsStorage(view);
				const savedTalk = typeof saved.talk === "boolean" ? saved.talk : false;
				const savedRand = typeof saved.rand === "boolean" ? saved.rand : false;
				const savedFlip = typeof saved.flip === "boolean" ? saved.flip : false;
				const defsMap = new Map(ANIME_SLIDERS.map((d) => [d.key, d]));
				paramsPanel.querySelectorAll("input[type=\"range\"]").forEach((el) => {
					const input = el;
					const key = input.dataset.param;
					if (key && defsMap.has(key)) {
						const v = saved[key];
						if (typeof v === "number") {
							const pending = input.dataset.pendingValue;
							if (pending !== void 0) {
								if (Math.abs(Number(pending) - v) < 1e-4) delete input.dataset.pendingValue;
								else return;
							}
							input.value = String(v);
							const valLabel = input.parentElement?.querySelector(".param-val");
							if (valLabel) valLabel.textContent = v.toFixed(2);
						}
					}
				});
				paramsPanel.querySelectorAll("input[type=\"checkbox\"]").forEach((el) => {
					const cb = el;
					if (cb.dataset.param === "talk") cb.checked = savedTalk;
					if (cb.dataset.param === "rand") cb.checked = savedRand;
					if (cb.dataset.param === "flip") cb.checked = savedFlip;
				});
			}
			/** 创建 Anime2.5DRig 参数浮动画板（独立于 DSH 设置面板）。 */
			function setupParamsPanel() {
				if (!box || !animeRenderer) return;
				if (paramsToggleBtn) {
					paramsToggleBtn.remove();
					paramsToggleBtn = null;
				}
				if (statusLightEl) {
					statusLightEl.remove();
					statusLightEl = null;
				}
				if (paramsPanel) {
					paramsPanel.remove();
					paramsPanel = null;
				}
				paramsPanelVisible = false;
				paramsHover = false;
				const savedParams = loadParamsStorage(view);
				const savedTalk = typeof savedParams.talk === "boolean" ? savedParams.talk : false;
				const savedRand = typeof savedParams.rand === "boolean" ? savedParams.rand : false;
				const savedFlip = typeof savedParams.flip === "boolean" ? savedParams.flip : false;
				if (animeRenderer) {
					animeRenderer.setParams(savedParams);
					animeRenderer.setAuto("talk", savedTalk);
					animeRenderer.setAuto("rand", savedRand);
					animeRenderer.setFlip(savedFlip);
				}
				statusLightEl = document.createElement("div");
				statusLightEl.style.cssText = [
					"position:absolute",
					"bottom:6px",
					"right:6px",
					"width:24px",
					"height:24px",
					"border-radius:50%",
					"border:none",
					"background:transparent",
					"z-index:10",
					"pointer-events:none",
					"display:flex",
					"align-items:center",
					"justify-content:center",
					"opacity:1",
					"transition:opacity .15s ease"
				].join(";");
				const lightDot = document.createElement("div");
				lightDot.style.cssText = "width:14px;height:14px;border-radius:50%;background:#22c55e;box-shadow:0 0 10px #22c55e";
				statusLightEl.appendChild(lightDot);
				lightDot.animate([{
					opacity: .35,
					transform: "scale(0.75)"
				}, {
					opacity: 1,
					transform: "scale(1)"
				}], {
					duration: 2e3,
					iterations: Infinity,
					direction: "alternate",
					easing: "ease-in-out"
				});
				const statusLayer = petLayer ?? box;
				statusLayer.style.position = "relative";
				statusLayer.appendChild(statusLightEl);
				paramsToggleBtn = document.createElement("button");
				paramsToggleBtn.textContent = "⚙";
				paramsToggleBtn.title = "角色调节";
				paramsToggleBtn.style.cssText = [
					"position:absolute",
					"bottom:6px",
					"right:6px",
					"width:24px",
					"height:24px",
					"border-radius:6px",
					"border:1px solid rgba(128,128,128,.3)",
					"background:rgba(30,32,42,.9)",
					"color:#e8eaf0",
					"font-size:14px",
					"line-height:1",
					"cursor:pointer",
					"z-index:10",
					"pointer-events:none",
					"opacity:0",
					"transition:opacity .15s ease",
					"display:flex",
					"align-items:center",
					"justify-content:center",
					"padding:0"
				].join(";");
				const layer = petLayer ?? box;
				layer.style.position = "relative";
				layer.appendChild(paramsToggleBtn);
				paramsToggleBtn.addEventListener("click", (e) => {
					e.stopPropagation();
					toggleParamsPanel();
				});
				paramsToggleBtn.addEventListener("pointerenter", () => {
					paramsHover = true;
					updateSettingsBtnVisibility();
				});
				paramsToggleBtn.addEventListener("pointerleave", () => {
					paramsHover = false;
					updateSettingsBtnVisibility();
				});
				paramsPanel = document.createElement("div");
				paramsPanel.style.cssText = [
					"position:absolute",
					"bottom:0",
					"right:calc(100% + 6px)",
					"width:280px",
					"max-height:420px",
					"overflow-y:auto",
					"background:rgba(24,26,36,.97)",
					"color:#e8eaf0",
					"border:1px solid rgba(128,128,128,.25)",
					"border-radius:10px",
					"padding:12px 14px",
					"font:12px/1.5 ui-monospace,monospace",
					"box-shadow:0 6px 24px rgba(0,0,0,.5)",
					"z-index:100",
					"pointer-events:auto",
					"display:none"
				].join(";");
				const title = document.createElement("div");
				title.textContent = "角色调节";
				title.style.cssText = "font-size:13px;font-weight:600;color:#aeb8cc;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between";
				const closeBtn = document.createElement("button");
				closeBtn.textContent = "✕";
				closeBtn.style.cssText = "border:none;background:none;color:#888;cursor:pointer;font-size:12px;padding:2px 4px";
				closeBtn.addEventListener("click", () => toggleParamsPanel(false));
				title.appendChild(closeBtn);
				paramsPanel.appendChild(title);
				const resetRow = document.createElement("div");
				resetRow.style.cssText = "margin-bottom:8px;display:flex;gap:6px";
				const resetBtn = document.createElement("button");
				resetBtn.textContent = "恢复默认";
				resetBtn.style.cssText = "padding:4px 10px;border-radius:6px;cursor:pointer;font-size:11px;background:rgba(128,128,128,.15);color:#ccc;border:1px solid rgba(128,128,128,.25)";
				resetBtn.addEventListener("click", () => {
					if (!animeRenderer) return;
					animeRenderer.resetParams();
					animeRenderer.setAuto("talk", false);
					animeRenderer.setAuto("rand", false);
					animeRenderer.setFlip(false);
					clearParamsStorage();
					const inputs = paramsPanel?.querySelectorAll("input[type=\"range\"]") ?? [];
					const defs = new Map(ANIME_SLIDERS.map((d) => [d.key, d]));
					inputs.forEach((input) => {
						const el = input;
						const key = el.dataset.param;
						if (key && defs.has(key)) {
							const d = defs.get(key);
							el.value = String(d.default);
							const valLabel = el.parentElement?.querySelector(".param-val");
							if (valLabel) valLabel.textContent = d.default.toFixed(2);
						}
					});
					(paramsPanel?.querySelectorAll("input[type=\"checkbox\"]") ?? []).forEach((sw) => {
						sw.checked = false;
					});
				});
				resetRow.appendChild(resetBtn);
				const talkRow = document.createElement("div");
				talkRow.style.cssText = "display:flex;align-items:center;gap:8px;margin:6px 0 4px;padding:6px 8px;border-radius:6px;background:rgba(128,128,128,.08)";
				const talkLabel = document.createElement("span");
				talkLabel.textContent = "随机开口说话";
				talkLabel.style.cssText = "flex:1;font-size:12px;color:#ccc";
				talkRow.appendChild(talkLabel);
				const talkSwitch = document.createElement("input");
				talkSwitch.type = "checkbox";
				talkSwitch.dataset.param = "talk";
				talkSwitch.checked = savedTalk;
				talkSwitch.style.cssText = "width:16px;height:16px;cursor:pointer";
				talkSwitch.addEventListener("change", () => {
					if (animeRenderer) {
						animeRenderer.setAuto("talk", talkSwitch.checked);
						saveParamsStorage({}, { talk: talkSwitch.checked }, view);
					}
				});
				talkRow.appendChild(talkSwitch);
				paramsPanel.appendChild(talkRow);
				const randRow = document.createElement("div");
				randRow.style.cssText = "display:flex;align-items:center;gap:8px;margin:4px 0;padding:6px 8px;border-radius:6px;background:rgba(128,128,128,.08)";
				const randLabel = document.createElement("span");
				randLabel.textContent = "随机小动作";
				randLabel.style.cssText = "flex:1;font-size:12px;color:#ccc";
				randRow.appendChild(randLabel);
				const randSwitch = document.createElement("input");
				randSwitch.type = "checkbox";
				randSwitch.dataset.param = "rand";
				randSwitch.checked = savedRand;
				randSwitch.style.cssText = "width:16px;height:16px;cursor:pointer";
				randSwitch.addEventListener("change", () => {
					if (animeRenderer) {
						animeRenderer.setAuto("rand", randSwitch.checked);
						saveParamsStorage({}, { rand: randSwitch.checked }, view);
					}
				});
				randRow.appendChild(randSwitch);
				paramsPanel.appendChild(randRow);
				const flipRow = document.createElement("div");
				flipRow.style.cssText = "display:flex;align-items:center;gap:8px;margin:4px 0;padding:6px 8px;border-radius:6px;background:rgba(128,128,128,.08)";
				const flipLabel = document.createElement("span");
				flipLabel.textContent = "左右翻转桌宠";
				flipLabel.style.cssText = "flex:1;font-size:12px;color:#ccc";
				flipRow.appendChild(flipLabel);
				const flipSwitch = document.createElement("input");
				flipSwitch.type = "checkbox";
				flipSwitch.dataset.param = "flip";
				flipSwitch.checked = savedFlip;
				flipSwitch.style.cssText = "width:16px;height:16px;cursor:pointer";
				flipSwitch.addEventListener("change", () => {
					if (animeRenderer) {
						animeRenderer.setFlip(flipSwitch.checked);
						saveParamsStorage({}, { flip: flipSwitch.checked }, view);
					}
				});
				flipRow.appendChild(flipSwitch);
				paramsPanel.appendChild(flipRow);
				paramsPanel.appendChild(resetRow);
				const groups = /* @__PURE__ */ new Map();
				for (const def of ANIME_SLIDERS) {
					const list = groups.get(def.group) ?? [];
					list.push(def);
					groups.set(def.group, list);
				}
				for (const [groupName, defs] of groups) {
					const groupTitle = document.createElement("div");
					groupTitle.textContent = groupName;
					groupTitle.style.cssText = "font-size:11px;font-weight:600;color:#7f8aa0;margin:10px 0 4px";
					paramsPanel.appendChild(groupTitle);
					for (const def of defs) {
						const row = document.createElement("div");
						row.style.cssText = "display:flex;align-items:center;gap:6px;margin:3px 0";
						const label = document.createElement("span");
						label.textContent = def.label;
						label.style.cssText = "width:70px;font-size:11px;color:#aaa;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap";
						row.appendChild(label);
						const input = document.createElement("input");
						input.type = "range";
						input.min = String(def.min);
						input.max = String(def.max);
						input.step = String(def.step);
						const savedVal = savedParams[def.key];
						const initialVal = typeof savedVal === "number" ? savedVal : def.default;
						input.value = String(initialVal);
						input.dataset.param = String(def.key);
						input.style.cssText = "flex:1;height:14px;min-width:0";
						input.addEventListener("input", () => {
							const v = Number(input.value);
							if (animeRenderer) animeRenderer.setParam(def.key, v);
							const valLabel = row.querySelector(".param-val");
							if (valLabel) valLabel.textContent = v.toFixed(2);
						});
						input.addEventListener("change", () => {
							const v = Number(input.value);
							input.dataset.pendingValue = String(v);
							if (animeRenderer) {
								animeRenderer.setParam(def.key, v);
								saveParamsStorage({ [def.key]: v }, {}, view);
							}
						});
						row.appendChild(input);
						const val = document.createElement("span");
						val.textContent = initialVal.toFixed(2);
						val.className = "param-val";
						val.style.cssText = "width:38px;text-align:right;color:#888;font-size:11px";
						row.appendChild(val);
						paramsPanel.appendChild(row);
					}
				}
				(petLayer ?? box).appendChild(paramsPanel);
			}
			/** 更新设置按钮/状态灯可见性。
			* - 鼠标悬停互动区：显示设置按钮，隐藏呼吸灯
			* - 未悬停：显示呼吸灯，隐藏设置按钮
			*/
			function updateSettingsBtnVisibility() {
				const visible = paramsHover;
				if (paramsToggleBtn) {
					paramsToggleBtn.style.opacity = visible ? paramsPanelVisible ? "0.5" : "1" : "0";
					paramsToggleBtn.style.pointerEvents = visible ? "auto" : "none";
				}
				if (statusLightEl) {
					statusLightEl.style.opacity = visible ? "0" : "1";
					statusLightEl.style.pointerEvents = visible ? "none" : "none";
				}
			}
			/** 切换 Anime2.5D 参数面板显示/隐藏。 */
			function toggleParamsPanel(force) {
				paramsPanelVisible = force ?? !paramsPanelVisible;
				if (paramsPanel) paramsPanel.style.display = paramsPanelVisible ? "block" : "none";
				updateSettingsBtnVisibility();
			}
			/** 模型重载队列：串行执行，避免快速切换时并发加载。 */
			let modelLoadQueue = Promise.resolve();
			function queueModelLoad(url) {
				modelLoadQueue = modelLoadQueue.then(() => loadModelLayer(url)).catch(() => {});
			}
			/** 停止空间分区分帧重绘。 */
			function stopZoneLoop() {
				if (zoneRaf) {
					window.cancelAnimationFrame(zoneRaf);
					zoneRaf = 0;
				}
			}
			/** 绘制空间回退四档色块（与 spatialTap / classifyTapByPosition 一致）。 */
			function paintSpatialZones() {
				if (!showSpatialZones || !zoneOverlay || !canvas || !model) return;
				const cssW = canvas.style.width ? parseFloat(canvas.style.width) : canvas.width;
				const cssH = canvas.style.height ? parseFloat(canvas.style.height) : canvas.height;
				const w = cssW > 0 ? cssW : canvas.width;
				const h = cssH > 0 ? cssH : canvas.height;
				if (!(w > 0 && h > 0)) return;
				if (zoneOverlay.width !== Math.round(w)) zoneOverlay.width = Math.round(w);
				if (zoneOverlay.height !== Math.round(h)) zoneOverlay.height = Math.round(h);
				zoneOverlay.style.cssText = `position:absolute;left:0;top:0;width:${w}px;height:${h}px;pointer-events:none;z-index:2;display:block`;
				const ctx = zoneOverlay.getContext("2d");
				if (!ctx) return;
				ctx.clearRect(0, 0, w, h);
				let bounds = null;
				try {
					const b = model.getBounds?.();
					if (b && b.width > 0 && b.height > 0) bounds = {
						x: b.x,
						y: b.y,
						width: b.width,
						height: b.height
					};
				} catch {}
				if (!bounds) return;
				const { x: bx, y: by, width: bw, height: bh } = bounds;
				const fill = (color, x, y, rw, rh, label) => {
					if (!(rw > 0 && rh > 0)) return;
					ctx.fillStyle = color;
					ctx.fillRect(x, y, rw, rh);
					ctx.strokeStyle = "rgba(255,255,255,.55)";
					ctx.strokeRect(x + .5, y + .5, rw - 1, rh - 1);
					ctx.fillStyle = "rgba(255,255,255,.92)";
					ctx.font = "11px ui-monospace,monospace";
					ctx.fillText(label, x + 4, y + 14);
				};
				const rect = (minNx, maxNx, minNy, maxNy) => ({
					x: bx + bw * minNx,
					y: by + bh * minNy,
					w: bw * (maxNx - minNx),
					h: bh * (maxNy - minNy)
				});
				const head = rect(spatialTap.headMinNx, spatialTap.headMaxNx, 0, spatialTap.headMaxNy);
				const body = rect(spatialTap.bodyMinNx, spatialTap.bodyMaxNx, spatialTap.headMaxNy, spatialTap.legMinNy);
				const leg = rect(spatialTap.bodyMinNx, spatialTap.bodyMaxNx, spatialTap.legMinNy, 1);
				const armL = rect(spatialTap.armLeftMinNx, spatialTap.bodyMinNx, spatialTap.armMinNy, spatialTap.legMinNy);
				const armR = rect(spatialTap.bodyMaxNx, spatialTap.armRightMaxNx, spatialTap.armMinNy, spatialTap.legMinNy);
				fill("rgba(80,200,120,.22)", body.x, body.y, body.w, body.h, "body");
				fill("rgba(80,160,255,.28)", head.x, head.y, head.w, head.h, "head");
				fill("rgba(255,160,60,.28)", leg.x, leg.y, leg.w, leg.h, "leg");
				fill("rgba(255,220,60,.32)", armL.x, armL.y, armL.w, armL.h, "arm");
				fill("rgba(255,220,60,.32)", armR.x, armR.y, armR.w, armR.h, "arm");
				ctx.strokeStyle = "rgba(255,80,80,.85)";
				ctx.lineWidth = 1.5;
				ctx.strokeRect(bx, by, bw, bh);
			}
			function startZoneLoop() {
				stopZoneLoop();
				if (!showSpatialZones) return;
				const tick = () => {
					paintSpatialZones();
					zoneRaf = window.requestAnimationFrame(tick);
				};
				zoneRaf = window.requestAnimationFrame(tick);
			}
			function setSpatialZonesVisible(on) {
				showSpatialZones = on;
				if (zoneOverlay) zoneOverlay.style.display = on ? "block" : "none";
				if (on) startZoneLoop();
				else stopZoneLoop();
			}
			/** 让调试面板宽度与 canvas 同宽（canvas 尺寸变化/模型加载时同步）。 */
			function syncDebugPanelWidth() {
				if (!debugEl) return;
				const w = canvas?.width ?? pos.size;
				debugEl.style.width = `${w}px`;
				debugEl.style.boxSizing = "border-box";
			}
			/** 调试面板动态开关（spec §2）。 */
			function ensureDebugPanel(show) {
				if (show && !debugEl && box) {
					debugEl = document.createElement("div");
					debugEl.style.cssText = "pointer-events:auto;margin:6px 0 10px;padding:10px 12px;background:rgba(24,26,36,.94);color:#e8eaf0;border:1px solid rgba(128,128,128,.22);border-radius:10px;font:12px/1.5 ui-monospace,monospace;box-shadow:0 4px 16px rgba(0,0,0,.35)";
					const debugTitle = document.createElement("div");
					debugTitle.style.cssText = "font-size:12px;font-weight:600;color:#aeb8cc;letter-spacing:.3px;margin-bottom:2px";
					debugTitle.textContent = "调试面板";
					debugEl.appendChild(debugTitle);
					const sectionLabel = (text) => {
						const el = document.createElement("div");
						el.style.cssText = "margin:10px 0 4px;color:#7f8aa0;font-size:11px;font-weight:600;letter-spacing:.3px";
						el.textContent = text;
						return el;
					};
					const demoLabel = sectionLabel("状态演示");
					debugEl.appendChild(demoLabel);
					const demoRow = document.createElement("div");
					demoRow.style.cssText = "display:grid;grid-template-columns:repeat(5,1fr);gap:4px";
					for (const st of [
						"idle",
						"thinking",
						"waiting",
						"done",
						"error"
					]) {
						const btn = document.createElement("button");
						btn.textContent = st;
						btn.style.cssText = "padding:4px 0;border-radius:6px;border:1px solid rgba(128,128,128,.25);background:rgba(128,128,128,.1);color:#dbe2ef;font-size:11px;font-family:inherit;cursor:pointer;outline:none";
						btn.onmouseenter = () => {
							btn.style.background = "rgba(120,170,255,.22)";
						};
						btn.onmouseleave = () => {
							btn.style.background = "rgba(128,128,128,.1)";
						};
						btn.onclick = () => {
							demoState = demoState === st ? null : st;
							applyState(view);
						};
						demoRow.appendChild(btn);
					}
					debugEl.appendChild(demoRow);
					debugTextEl = document.createElement("div");
					debugTextEl.style.cssText = "margin-top:10px;padding-top:8px;border-top:1px solid rgba(128,128,128,.18);color:#9aa5b8;font-size:11px;white-space:pre-wrap;word-break:break-all";
					debugEl.appendChild(debugTextEl);
					syncDebugPanelWidth();
					if (petLayer) {
						box.insertBefore(debugEl, petLayer);
						petLayer.style.marginTop = "36px";
					} else box.appendChild(debugEl);
					applyState(view);
				} else if (!show && debugEl) {
					focusSuppressed = false;
					debugEl.parentNode?.removeChild(debugEl);
					debugEl = null;
					debugTextEl = null;
					if (petLayer) petLayer.style.marginTop = "";
				}
			}
			/** 运行时应用配置变化（spec §2/§6/§7）：开关 / 尺寸 / 帧率 / 调试 / 分区 / 模型。 */
			function applyConfig(next) {
				const cfg = next.config;
				if (box) box.style.display = cfg.enabled ? "" : "none";
				enabled = cfg.enabled;
				syncTicker();
				ensureDebugPanel(cfg.debug);
				setSpatialZonesVisible(!!cfg.showTapZones);
				if (cfg.spatialTap) spatialTap = { ...cfg.spatialTap };
				if (cfg.motionMap) motionMap = {
					...DEFAULT_MOTION_MAP,
					...cfg.motionMap
				};
				if (cfg.animeParams && animeRenderer) animeRenderer.setParams(cfg.animeParams);
				if (animeRenderer) {
					animeRenderer.setAuto("talk", cfg.talk ?? false);
					animeRenderer.setAuto("rand", cfg.rand ?? false);
					animeRenderer.setFlip(cfg.flip ?? false);
					animeRenderer.setFpsLimit(cfg.fpsLimit ?? 30);
				}
				if (box) box.style.opacity = String(cfg.opacity ?? 1);
				syncParamsPanelUI();
				const nextSize = cfg.size;
				if (nextSize !== pos.size) scheduleSize(nextSize);
				const nextUrl = cfg.modelUrl || null;
				if (nextUrl !== currentModelUrl) {
					currentModelUrl = nextUrl;
					queueModelLoad(nextUrl);
				}
			}
			let down = null;
			let dragging = false;
			function handlePointerDown(e) {
				down = {
					x: e.clientX,
					y: e.clientY,
					startRight: pos.right,
					startBottom: pos.bottom
				};
				dragging = false;
				canvas?.setPointerCapture(e.pointerId);
			}
			function handlePointerMove(e) {
				if (!down) return;
				const dx = e.clientX - down.x;
				const dy = e.clientY - down.y;
				if (!dragging && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
					dragging = true;
					if (bubble) bubble.style.opacity = "0";
				}
				if (dragging && box) {
					pos.right = Math.max(0, down.startRight - dx);
					pos.bottom = Math.max(0, down.startBottom - dy);
					box.style.right = `${Math.round(pos.right)}px`;
					box.style.bottom = `${Math.round(pos.bottom)}px`;
				}
			}
			function handlePointerUp(e) {
				if (!down) return;
				if (dragging) {
					api.setDisplay({
						right: Math.round(pos.right),
						bottom: Math.round(pos.bottom)
					}).catch(() => {});
					showStageText();
				} else handleTap(e);
				down = null;
				dragging = false;
			}
			function handleGlobalPointerMove(e) {
				lastPointerClient = {
					x: e.clientX,
					y: e.clientY
				};
				if (!model || !canvas || dragging || !enabled || hidden || focusSuppressed) return;
				applyFocus(e.clientX, e.clientY);
			}
			function handleGlobalMouseOut(e) {
				if (e.relatedTarget) return;
				lastPointerClient = null;
				if (!model || dragging || !enabled || hidden) return;
				if (!focusSuppressed) model.internalModel?.focusController?.focus(0, 0, true);
			}
			function handleTap(e) {
				if (!canvas || !model) return;
				const now = Date.now();
				if (now - lastTapAt < TAP_DEBOUNCE_MS) return;
				lastTapAt = now;
				try {
					const rect = canvas.getBoundingClientRect();
					const localX = e.clientX - rect.left;
					const localY = e.clientY - rect.top;
					const hits = model.hitTest(localX, localY);
					let bounds = null;
					try {
						const b = model.getBounds?.();
						if (b && b.width > 0 && b.height > 0) bounds = {
							x: b.x,
							y: b.y,
							width: b.width,
							height: b.height
						};
					} catch {}
					const part = classifyTap(hits, localX, localY, bounds, spatialTap);
					if (part === null) return;
					const poolKey = `tap${part[0].toUpperCase()}${part.slice(1)}`;
					const line = pickLine(activeCopy[poolKey], lastTapLine[poolKey]);
					if (line !== void 0) {
						lastTapLine[poolKey] = line;
						showBubble(line);
					}
					playInteractionMotion(motionNamesFor(part));
				} catch {}
			}
			/**
			* 播放互动动作（摸头/点身体）：FORCE 可打断状态动画与上一次互动；动作真正播完
			* （motionFinish）后恢复当前状态动画（spec §4）。motion() 的 Promise 只代表开始，
			* 因此不再用 Promise 完成时间或 3s 兜底来恢复。
			*/
			async function playInteractionMotion(names) {
				if (!model || names.length === 0) return;
				++interactionGen;
				await startMotionWithPriority(names, MotionPriority.FORCE, {
					suppressFocus: true,
					isInteraction: true
				});
			}
			(async () => {
				try {
					try {
						view = await api.state();
					} catch {}
					if (disposed) return;
					currentViewRef = view;
					if (view) pos = {
						...view.display,
						size: view.config.size
					};
					box = document.createElement("div");
					const popoverSupported = typeof box.showPopover === "function";
					box.style.cssText = `position:fixed;inset:auto;top:auto;left:auto;right:${pos.right}px;bottom:${pos.bottom}px;margin:0;padding:0;border:none;background:transparent;width:auto;height:auto;overflow:visible;pointer-events:none${popoverSupported ? "" : ";z-index:2147483647"}`;
					if (popoverSupported) box.setAttribute("popover", "manual");
					document.body.appendChild(box);
					if (popoverSupported) try {
						box.showPopover();
					} catch {}
					pushCleanup(() => {
						box?.parentNode?.removeChild(box);
					});
					bubble = document.createElement("div");
					bubble.style.cssText = "position:absolute;left:50%;bottom:100%;transform:translateX(-50%);margin-bottom:8px;padding:4px 10px;background:rgba(255,255,255,.95);color:#222;border-radius:999px;font:12px/1.5 sans-serif;white-space:nowrap;opacity:0;transition:opacity .2s;pointer-events:none";
					box.appendChild(bubble);
					for (const src of VENDOR_SCRIPTS) {
						await loadScript(src);
						if (disposed) return;
					}
					const initialUrl = view?.config.modelUrl || null;
					currentModelUrl = initialUrl;
					await loadModelLayer(initialUrl);
					if (disposed) return;
					const onGlobalPointerMove = handleGlobalPointerMove;
					const onGlobalMouseOut = handleGlobalMouseOut;
					document.addEventListener("pointermove", onGlobalPointerMove, { passive: true });
					document.addEventListener("mouseout", onGlobalMouseOut);
					pushCleanup(() => {
						document.removeEventListener("pointermove", onGlobalPointerMove);
						document.removeEventListener("mouseout", onGlobalMouseOut);
					});
					const handleState = (next) => {
						if (disposed) return;
						view = next;
						currentViewRef = next;
						pos = {
							right: next.display.right,
							bottom: next.display.bottom,
							size: pos.size
						};
						applyConfig(next);
						applyState(next);
					};
					let closeEvents;
					try {
						closeEvents = api.events(handleState, () => {});
					} catch {}
					const onVisibility = () => {
						hidden = document.visibilityState !== "visible";
						syncTicker();
					};
					const onBlur = () => {
						hidden = true;
						syncTicker();
					};
					const onFocus = () => {
						hidden = false;
						syncTicker();
					};
					document.addEventListener("visibilitychange", onVisibility);
					window.addEventListener("blur", onBlur);
					window.addEventListener("focus", onFocus);
					pushCleanup(() => {
						closeEvents?.();
						document.removeEventListener("visibilitychange", onVisibility);
						window.removeEventListener("blur", onBlur);
						window.removeEventListener("focus", onFocus);
					});
					if (view) {
						applyConfig(view);
						applyState(view);
					}
				} catch (error) {
					showFallback();
				}
			})();
			return () => {
				for (const fn of cleanup) try {
					fn();
				} catch {}
			};
		}
		/** 插件入口。 */
		function apply(ctx) {
			const slots = ctx.get("slots");
			if (slots === void 0) return;
			slots.inject("shell.overlay", () => slots.register({
				name: "shell.overlay",
				id: "anime25d-pet"
			}, () => (0, react.createElement)(PetAnchor)));
			const openPath = async (path) => {
				try {
					const workspaces = ctx.get("workspaces");
					if (!workspaces?.openPath) return false;
					await workspaces.openPath(path);
					return true;
				} catch {
					return false;
				}
			};
			slots.inject("settings.section", () => {
				const stopNavIcon = installPetSettingsNavIcon();
				const disposeSection = slots.register({
					name: "settings.section",
					id: "anime25d-pet",
					order: 200,
					label: () => "桌宠配置",
					icon: pawNavIcon
				}, () => (0, react.createElement)(PetSettingsSection, { openPath }));
				return () => {
					stopNavIcon();
					disposeSection();
				};
			});
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map