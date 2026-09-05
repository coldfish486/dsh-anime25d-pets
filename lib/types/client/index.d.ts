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
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
/** 注入所需服务。 */
export declare const inject: string[];
/** 插件入口。 */
export declare function apply(ctx: ClientContext): void;
