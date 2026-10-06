/**
 * 桌宠「待交互」兼容层（DSH 0.2.0-rc.2）。
 *
 * 待交互数据的发布位置在 DSH 里改过两次：
 * - `0.1.0-rc.8` 及更早：挂在会话列表行上（`SessionSummary.pendingInteraction`）。
 * - `0.1.5` → `0.1.7`：行字段移除，改由客户端 `@deepseek-ai/dsh-client-ui-session`
 *   的 `uiSession.pendingInteractions` 根存储统一发布（`Map<sessionId, interaction>`）。
 * - `0.2.0-rc.2`：该 Map 又被 `uiSession.sessionStatus` 取代——一个
 *   `Map<sessionId, { running, pendingInteraction, completionUnread }>` 的只读快照，
 *   `pendingInteraction` 为 `undefined` 表示该会话当前无待交互。
 *
 * 桌宠原先把 waiting（等待审批）状态完全交给 Host 侧的 `approval/request` 事件，
 * 只能覆盖「审批」一种待交互，且与客户端的权威数据源不同步。这与
 * `@dsh-external/dsh-sound-cue`「需要操作」提示音静默失效是同一个根因。
 *
 * 本模块只做纯函数转换（不依赖 DOM / React），便于单测。
 * @module dsh-anime25d-pets/client/pending-state
 */

import type { PetState } from '../service.ts'

/** 待交互是否忽略子代理会话：与 dsh-sound-cue 的 `skipSubagents` 默认一致，
 *  避免后台 subagent 的待交互把桌宠长期顶在 waiting。 */
export const SKIP_SUBAGENT_PENDING = true

/** DSH client store 约定：不可变快照 + 同步订阅。 */
export interface ReadonlyStore<T> {
  getSnapshot(): T
  subscribe(listener: () => void): () => void
}

/** 单个会话的 UI 状态事实（`uiSession.sessionStatus` 值）。 */
export interface SessionStatusLike {
  readonly running?: boolean | undefined
  /** 当前最高优先级的待交互；`undefined` 表示该会话无待交互。 */
  readonly pendingInteraction?: unknown
  readonly completionUnread?: boolean | undefined
}

/** `uiSession` 服务（DSH 0.2.0-rc.2+）：暴露统一会话状态根存储。 */
export interface PendingInteractionsLike {
  sessionStatus?: ReadonlyStore<ReadonlyMap<string, SessionStatusLike>>
}

/** `sessions` 服务的列表快照（这里只用 `byId[*].origin` 过滤子代理会话）。 */
export interface SessionsListSnapshot {
  ids?: readonly string[]
  byId?: Record<string, { origin?: string } | undefined>
  current?: string
}

/** `sessions` 服务（列表 store）。 */
export interface SessionsLike {
  list?: ReadonlyStore<SessionsListSnapshot>
}

/**
 * 当前是否存在待用户操作的会话。
 *
 * - 无 `uiSession` / 无 `sessionStatus`（旧版 DSH）→ `false`，
 *   调用方回落到 Host 自己的 waiting 判定；
 * - 只统计 `pendingInteraction !== undefined` 的会话（`sessionStatus` 对每个
 *   已知会话都有一条记录，与旧的「Map 非空即有等待」语义不同）；
 * - `skipSubagents` 为 `true` 时忽略子代理会话。
 */
export function hasPendingInteraction(
  uiSession: PendingInteractionsLike | undefined,
  sessions: SessionsLike | undefined,
  skipSubagents: boolean = SKIP_SUBAGENT_PENDING,
): boolean {
  const store = uiSession?.sessionStatus
  if (store === undefined) return false
  const statuses = store.getSnapshot()
  if (statuses.size === 0) return false
  if (!skipSubagents) {
    for (const status of statuses.values()) {
      if (status?.pendingInteraction !== undefined) return true
    }
    return false
  }
  const list = sessions?.list?.getSnapshot()
  for (const [sessionId, status] of statuses) {
    if (status?.pendingInteraction === undefined) continue
    if (list?.byId?.[sessionId]?.origin === 'subagent') continue
    return true
  }
  return false
}

/** 待交互读取状态：`available === false` 表示客户端存储不可用（旧版 DSH）。 */
export interface PendingSignal {
  /** 客户端待交互存储是否存在。 */
  available: boolean
  /** 是否存在（未被过滤掉的）待交互。 */
  active: boolean
}

/**
 * 计算桌宠最终展示状态。
 *
 * Host（`PetService`）仍按 `agent/status` / `agent/error` / `agent/turn-stopping` /
 * `approval/request` 推送状态，但待交互已统一到客户端存储，因此：
 * - 调试态（`demo`）优先，保持原有「状态演示」行为；
 * - 客户端存储可用时，它是 waiting 的**权威来源**（覆盖 Host 状态，覆盖
 *   approval / question / plan-review 三种待交互）；
 * - 存储里已无待交互、但 Host 仍停在 `waiting` 时（`approval/request` 只在进入时置位，
 *   待交互解决后不一定再有 Host 状态事件）→ 按 agent 回落 `thinking` / `idle`，避免
 *   呼吸灯卡在紫色；
 * - 存储不可用（旧版 DSH）→ 完全沿用 Host 状态，行为与旧版一致。
 */
export function resolvePetState(
  host: PetState,
  agent: string,
  pending: PendingSignal,
  demo: PetState | null,
): PetState {
  if (demo !== null) return demo
  if (!pending.available) return host
  if (pending.active) return 'waiting'
  if (host === 'waiting') return agent === 'running' ? 'thinking' : 'idle'
  return host
}
