import { describe, expect, it } from 'vitest'
import { hasPendingInteraction, resolvePetState, type PendingSignal } from './pending-state.ts'

/** 构造最小 store 桩。 */
function store<T>(initial: T) {
  let value = initial
  const listeners = new Set<() => void>()
  return {
    getSnapshot: () => value,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    set: (next: T) => {
      value = next
      for (const listener of listeners) listener()
    },
  }
}

const OLD_DSH: PendingSignal = { available: false, active: false }
const READY: PendingSignal = { available: true, active: false }
const WAITING: PendingSignal = { available: true, active: true }

describe('hasPendingInteraction', () => {
  it('无 uiSession（旧版 DSH）返回 false', () => {
    expect(hasPendingInteraction(undefined, undefined, true)).toBe(false)
  })

  it('空待交互 Map 返回 false', () => {
    const uiSession = { pendingInteractions: store(new Map<string, unknown>()) }
    expect(hasPendingInteraction(uiSession, undefined, true)).toBe(false)
  })

  it('存在待交互时返回 true', () => {
    const uiSession = { pendingInteractions: store(new Map([['s1', { kind: 'question' }]])) }
    expect(hasPendingInteraction(uiSession, undefined, true)).toBe(true)
  })

  it('skipSubagents=true 时忽略子代理会话', () => {
    const pending = new Map([['sub', {}], ['main', {}]])
    const uiSession = { pendingInteractions: store(pending) }
    const sessions = {
      list: store({ byId: { sub: { origin: 'subagent' }, main: { origin: 'user' } } }),
    }
    expect(hasPendingInteraction(uiSession, sessions, true)).toBe(true)

    const onlySub = { pendingInteractions: store(new Map([['sub', {}]])) }
    expect(hasPendingInteraction(onlySub, sessions, true)).toBe(false)
  })

  it('skipSubagents=false 时子代理待交互同样生效', () => {
    const uiSession = { pendingInteractions: store(new Map([['sub', {}]])) }
    const sessions = { list: store({ byId: { sub: { origin: 'subagent' } } }) }
    expect(hasPendingInteraction(uiSession, sessions, false)).toBe(true)
  })
})

describe('resolvePetState', () => {
  it('存储不可用时完全沿用 Host 状态（含 waiting）', () => {
    expect(resolvePetState('waiting', 'running', OLD_DSH, null)).toBe('waiting')
    expect(resolvePetState('thinking', 'running', OLD_DSH, null)).toBe('thinking')
  })

  it('有待交互时覆盖 Host 状态为 waiting', () => {
    expect(resolvePetState('thinking', 'running', WAITING, null)).toBe('waiting')
    expect(resolvePetState('done', 'idle', WAITING, null)).toBe('waiting')
    expect(resolvePetState('error', 'idle', WAITING, null)).toBe('waiting')
  })

  it('待交互清空后，Host 残留的 waiting 回落到 thinking/idle', () => {
    expect(resolvePetState('waiting', 'running', READY, null)).toBe('thinking')
    expect(resolvePetState('waiting', 'idle', READY, null)).toBe('idle')
  })

  it('存储可用且无待交互时正常显示 Host 状态', () => {
    expect(resolvePetState('thinking', 'running', READY, null)).toBe('thinking')
    expect(resolvePetState('idle', 'idle', READY, null)).toBe('idle')
  })

  it('调试态（demo）优先级最高', () => {
    expect(resolvePetState('thinking', 'running', WAITING, 'error')).toBe('error')
    expect(resolvePetState('waiting', 'running', READY, 'done')).toBe('done')
  })
})
