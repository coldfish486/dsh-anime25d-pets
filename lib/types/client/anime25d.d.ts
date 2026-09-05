/**
 * Anime2.5DRig WebGL 渲染引擎适配层
 *
 * 将 Anime2.5DRig 的 PSD 自动装配 + WebGL 2.5D 渲染核心封装为
 * 可在 dsh-anime25d-pets 客户端中替代 Live2D 模型的渲染器。
 *
 * 本模块从 Anime2.5DRig 的 index.html 中提取核心渲染代码，
 * 并适配 dsh-anime25d-pets 的 ModelLike 接口。
 */
/** 模型参数（对应 Anime2.5DRig 控制面板的底层参数集）。 */
export interface Anime25DParams {
    angleX: number;
    angleY: number;
    angleZ: number;
    eyeOpenL: number;
    eyeOpenR: number;
    eyeX: number;
    eyeY: number;
    brow: number;
    mouthOpen: number;
    mouthForm: number;
    mouthCY: number;
    body: number;
    physAmp: number;
    soft: number;
    browAngL: number;
    browAngR: number;
    browAngSym: number;
    bangL: number;
    bangC: number;
    bangR: number;
    armY: number;
    armPos: number;
    bust: number;
    bustY: number;
    irisScale: number;
    mouthEase: number;
    eyeEase: number;
    fhAmp: number;
    fhSoft: number;
    eyeCY: number;
    eyeCAng: number;
    mouthCAng: number;
    eyeScaleL: number;
    eyeScaleR: number;
    mouthScale: number;
}
/** 默认参数（与 Anime2.5DRig 一致）。 */
export declare const DEFAULT_PARAMS: Anime25DParams;
/** 状态/动作 → 表情参数预设。 */
export interface MotionPreset {
    /** 表情参数（覆盖默认值）。 */
    target?: Partial<Anime25DParams>;
    /** 动作持续时间（ms），0 = 持续到下一个动作。 */
    duration?: number;
    /** 是否抑制鼠标跟随。 */
    suppressFocus?: boolean;
}
/** 内置动作映射：状态/互动 → Anime2.5DRig 参数预设。 */
export declare const DEFAULT_MOTION_PRESETS: Record<string, MotionPreset>;
declare global {
    interface Window {
        agPsd?: any;
        Rigger?: any;
        GenericParts?: any;
    }
}
/** WebGL 渲染器 —— 封装 Anime2.5DRig 核心。 */
export declare class Anime25DRenderer {
    /** 目标画布。 */
    canvas: HTMLCanvasElement;
    /** WebGL 上下文。 */
    private gl;
    /** WebGL 着色器程序。 */
    private prog;
    private locPos;
    private locUV;
    private locRes;
    private locCut;
    private locAl;
    private locFlip;
    /** 渲染层数据。 */
    private layers;
    /** 锚点。 */
    private A;
    private CW;
    private CH;
    private FS;
    private NP;
    private BP;
    private FC;
    private CHEST;
    private bounce;
    /** 参数（目标值/当前值）。 */
    private P;
    private T;
    private cur;
    /** 用户手动设置过的参数集合（自动动画不会覆盖这些参数）。 */
    private manualSet;
    /** 自动动画开关。 */
    private auto;
    /** 动画状态。 */
    private blinkT;
    private nextBlink;
    private rnd;
    private nextRnd;
    private talkOn;
    private talkV;
    private talkTgt;
    private nextTalkState;
    private nextSyl;
    /** 鼠标状态。 */
    private mouse;
    /** 左右镜像翻转。 */
    private flipped;
    /** 动作定时器（清理用）。 */
    private motionTimer;
    /** 动画映射参数（当前动作的叠加目标）。 */
    private motionTarget;
    private motionStartTime;
    private motionDuration;
    private motionName;
    /** 帧循环控制。 */
    private rafId;
    private last;
    private lastFrame;
    private frameInterval;
    private disposed;
    private _onMotionFinish;
    /** 模型原始尺寸（用于适配）。 */
    private baseW;
    private baseH;
    /** 模型实际内容包围盒（所有图层的最小外接矩形）。 */
    private contentBounds;
    constructor(canvas: HTMLCanvasElement);
    /** 初始化 WebGL 上下文。 */
    private initWebGL;
    /** 初始化画布事件（鼠标跟随）。 */
    private initCanvasEvents;
    /** 纹理创建。 */
    private mkTex;
    /** 应用装配好的 rig 到 WebGL 层。 */
    private applyRig;
    /** 从 PSD 数据加载模型。 */
    loadPsdData(psdBuffer: ArrayBuffer): Promise<void>;
    /** 从 URL 加载 PSD 模型。 */
    loadFromUrl(url: string): Promise<void>;
    /** 计算通用闭眼/闭口差分选项。 */
    private genericOpts;
    private clamp;
    private smooth;
    private fadeAlpha;
    private deform;
    /** 播放动作（对应 Live2D 的 motion()）。 */
    motion(name: string, _index?: number, _priority?: number): Promise<boolean>;
    /** 停止所有动作。 */
    stopAllMotions(): void;
    /** 鼠标/视线跟随（对应 Live2D 的 focus()）。 */
    focus(x: number, y: number, instant?: boolean): void;
    /** 重置视线到正视前方。 */
    resetFocus(): void;
    /** 设置单个参数（用户手动调整时记录，自动动画不会覆盖）。 */
    setParam<K extends keyof Anime25DParams>(key: K, value: Anime25DParams[K]): void;
    /** 批量设置参数（用户手动调整时记录，自动动画不会覆盖）。 */
    setParams(params: Partial<Anime25DParams>): void;
    /** 重置为默认参数并清除手动跟踪。 */
    resetParams(): void;
    /** 设置左右镜像翻转。 */
    setFlip(on: boolean): void;
    /** 设置 FPS 上限（0 = 不限制）。 */
    setFpsLimit(fps: number): void;
    /** 设置自动动画开关。 */
    setAuto(key: keyof typeof this.auto, on: boolean): void;
    /** 获取模型原始尺寸。 */
    get width(): number;
    get height(): number;
    /**
     * 获取模型包围盒（基于实际图层内容，转换为 CSS 显示坐标系）。
     * 客户端传入的点击坐标是 CSS 坐标（相对于 canvas 显示区域），
     * 这里需要把 PSD 原始坐标换算为 CSS 坐标，保证空间分区计算正确。
     */
    getBounds(): {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    /** 命中测试（Anime2.5DRig 无实际 HitArea，返回空数组，由空间回退处理）。 */
    hitTest(_x: number, _y: number): string[];
    /** 设置动作完成回调。 */
    set onMotionFinish(fn: (() => void) | null);
    get onMotionFinish(): (() => void) | null;
    /** 销毁渲染器。 */
    destroy(): void;
    /** 暂停/恢复渲染循环。 */
    pause(): void;
    resume(): void;
    private tick;
    /** 实际执行 WebGL 渲染。 */
    private render;
}
/** Anime2.5DRig 滑块配置（用于设置面板）。 */
export interface SliderDef {
    key: keyof Anime25DParams;
    label: string;
    min: number;
    max: number;
    step: number;
    default: number;
    group: string;
}
/** Anime2.5DRig 全部滑块定义（按控制面板分组）。 */
export declare const ANIME_SLIDERS: SliderDef[];
