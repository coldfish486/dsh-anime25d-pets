/**
 * PetService：宠物状态机 + 显示配置 + 持久化。
 * 状态源为 DSH 真实事件（Event.listEvents 实测）：
 *   agent/status（idle⇄running）、agent/error、agent/turn-stopping、approval/request。
 * 配置经 getConfig() 读取 settings 解析值（schema 默认 → base → 用户层）。
 * @module dsh-anime25d-pets/service
 */
import type { Context } from '@deepseek-ai/cordis';
import type { Config } from './index.ts';
import { type CustomModelEntry, type MotionMap, type SpatialTapConfig } from './models.ts';
import { CustomModelsStore, type CustomModelsFileView } from './custom-models.ts';
import { type PetDisplay } from './persist.ts';
import { PersonasStore, type PersonasFileView } from './personas.ts';
import { type CustomPersonaDef } from './persona-shared.ts';
export type PetState = 'idle' | 'thinking' | 'error' | 'done' | 'waiting';
export interface PetStateView {
    state: PetState;
    agent: string;
    config: {
        enabled: boolean;
        size: number;
        model: string;
        /** 解析后的 .psd URL（模型 id → URL，Anime2.5DRig 渲染，spec §6）。 */
        modelUrl: string | null;
        debug: boolean;
        /** 显示点击分区叠加层（空间回退色块）。 */
        showTapZones: boolean;
        /** 当前模型生效的空间回退完整阈值（自定义可覆盖；spec §4）。 */
        spatialTap: SpatialTapConfig;
        /** 当前模型生效的状态/互动动画映射（自定义/内置可覆盖；缺省 DEFAULT_MOTION_MAP）。 */
        motionMap: MotionMap;
        /** Anime2.5DRig 参数覆盖（浮动画板滑块，可覆盖默认参数）。 */
        animeParams: Record<string, number>;
        /** 随机开口说话开关。 */
        talk: boolean;
        /** 随机小动作开关。 */
        rand: boolean;
        /** 左右翻转桌宠（镜像显示）。 */
        flip: boolean;
        /** FPS 限制（30 / 60 / 0=无限制）。 */
        fpsLimit: number;
        /** 宠物透明度（0~1，含气泡）。 */
        opacity: number;
        /** 选中人设 id（内置或自定义；spec §3）。 */
        persona: string;
    };
    display: PetDisplay;
    /** 自定义人设原样定义（client 端与内置文案合并出完整台词池）。 */
    customPersonas: CustomPersonaDef[];
    /** 人设文件级/条目级问题（设置页内联提示；null 无异常）。 */
    personasError: string | null;
    /** 人设文件绝对路径（「自定义人设 ↗」openPath / 复制路径用）。 */
    personasFile: string;
    version: number;
}
/** 变化通知监听器（状态/显示/配置变化时触发，供 SSE 推送使用）。 */
type ChangeListener = () => void;
export declare class PetService {
    private readonly ctx;
    private readonly getConfig;
    private readonly personasStore?;
    private readonly customModelsStore?;
    private state;
    private agent;
    private version;
    private display;
    private doneTimerId;
    private listeners;
    constructor(ctx: Context, getConfig: () => Config, personasStore?: PersonasStore | undefined, customModelsStore?: CustomModelsStore | undefined);
    /** 立即切换状态；取消未完成的"完成"保持计时。 */
    private set;
    /** 进入"完成"并保持 DONE_HOLD_MS 后回空闲（客户端据此播庆祝动画）。 */
    private setDone;
    /** 浏览器轮询用的状态快照（配置实时读取 settings 解析值；人设文件每次现读，spec §2）。 */
    snapshot(): PetStateView;
    /** 重新读取人设文件并推送（设置页「↻ 重新读取」按钮；version 递增触发客户端感知）。 */
    reloadPersonas(): PersonasFileView;
    /** 用户自定义模型列表（设置面板模型列表的 custom 部分，Host 权威视图）。 */
    listCustomModels(): CustomModelEntry[];
    /** 自定义模型文件视图（路径/错误/列表），供设置面板与“打开配置文件”使用。 */
    customModelsFile(): CustomModelsFileView;
    /** 写回自定义模型列表（设置面板保存后调用），并推送配置变化。 */
    saveCustomModels(models: CustomModelEntry[]): CustomModelsFileView;
    /** 更新显示配置（拖动/尺寸）并持久化；数值在服务端按权威边界 clamp。 */
    setDisplay(patch: Partial<PetDisplay>): PetDisplay;
    /** 重置为默认显示配置（调试用）。 */
    resetDisplay(): PetDisplay;
    /** 订阅变化推送（状态/显示变化自动触发）；返回退订函数。 */
    onChange(listener: ChangeListener): () => void;
    /** 配置（settings 解析值）变化后由外部调用，触发一次推送（ADR-006）。 */
    notifyConfigChanged(): void;
    private emitChange;
}
export {};
