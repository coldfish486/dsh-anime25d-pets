/**
 * 自定义人设文件（$DSH_HOME/anime25d-pet/personas.jsonc，JSONC）：
 * 首次启动原样落地模板（此后只读不写）、按需现读解析（无缓存——
 * 刷新页面/点「重新读取」即生效）、解析失败保留上一份好结果。
 * 自定义人设零接触 DSH settings yaml 体系（插件独有文件，ADR-007）。
 * @module dsh-anime25d-pets/personas
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'
import {
  COPY_KEYS,
  PERSONAS_TEMPLATE,
  BUILTIN_PERSONA_IDS,
  type CopyTable,
  type CustomPersonaDef,
} from './persona-shared.ts'

/** 人设文件名（$DSH_HOME/anime25d-pet 下）。 */
export const PERSONAS_FILENAME = 'personas.jsonc'

/** 人设文件读取结果。 */
export interface PersonasFileView {
  /** 解析通过的自定义人设（文件级失败时为上一份好结果，可能为空数组）。 */
  personas: CustomPersonaDef[]
  /** 文件级错误（解析失败/读取失败）；条目级坏行会被跳过并记入此消息。 */
  error: string | null
  /** 文件绝对路径（设置页「自定义人设 ↗」打开/复制用）。 */
  path: string
}

/** DSH home 目录（与 persist.ts 同一规则）。 */
function petHomeDir(): string {
  return process.env.DSH_HOME ?? join(homedir(), '.dsh')
}

/** 插件私有数据目录：$DSH_HOME/anime25d-pet。 */
function petDataDir(): string {
  return join(petHomeDir(), 'anime25d-pet')
}

/**
 * 剥离 JSONC 注释（行注释与块注释），字符串字面量内的注释符原样保留。
 * 不做任何修复/改写，只去注释——保证「落地模板后插件只读不写」的承诺。
 */
export function stripJsonComments(text: string): string {
  let out = ''
  let i = 0
  let inString = false
  while (i < text.length) {
    const ch = text[i]
    const next = text[i + 1]
    if (inString) {
      out += ch
      if (ch === '\\') {
        // 转义字符：连下一个字符一起原样保留
        if (i + 1 < text.length) out += next
        i += 2
        continue
      }
      if (ch === '"') inString = false
      i += 1
      continue
    }
    if (ch === '"') {
      inString = true
      out += ch
      i += 1
      continue
    }
    if (ch === '/' && next === '/') {
      // 行注释：跳到行尾
      i += 2
      while (i < text.length && text[i] !== '\n') i += 1
      continue
    }
    if (ch === '/' && next === '*') {
      // 块注释：跳到 */（保留一个换行，避免行拼接改变语义）
      i += 2
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i += 1
      i = Math.min(i + 2, text.length)
      out += ' '
      continue
    }
    out += ch
    i += 1
  }
  return out
}

/** 校验并归一化单个自定义人设条目；非法时返回 null（调用方跳过）。 */
export function normalizeCustomPersona(raw: unknown): CustomPersonaDef | null {
  if (typeof raw !== 'object' || raw === null) return null
  const record = raw as Record<string, unknown>
  const id = typeof record.id === 'string' ? record.id.trim() : ''
  // id 必须是非空英文安全标识，且不得撞内置 id（内置优先）
  if (!id || !/^[a-z][a-z0-9_-]*$/i.test(id)) return null
  if ((BUILTIN_PERSONA_IDS as readonly string[]).includes(id)) return null
  const def: CustomPersonaDef = { id }
  if (typeof record.name === 'string' && record.name.trim() !== '') def.name = record.name.trim()
  if (typeof record.base === 'string' && record.base.trim() !== '') def.base = record.base.trim()
  if (typeof record.copy === 'object' && record.copy !== null) {
    const copy: Partial<Record<string, string[]>> = {}
    for (const [key, value] of Object.entries(record.copy as Record<string, unknown>)) {
      // 只收白名单键 + 非空字符串数组；其余整池忽略（条目保留）
      if (!(COPY_KEYS as readonly string[]).includes(key)) continue
      if (
        Array.isArray(value)
        && value.length > 0
        && value.every((line) => typeof line === 'string' && line.trim() !== '')
      ) {
        copy[key] = value as string[]
      }
    }
    if (Object.keys(copy).length > 0) def.copy = copy as Partial<CopyTable>
  }
  return def
}

/** id 去重（后到忽略）。 */
function dedupeById(defs: CustomPersonaDef[]): CustomPersonaDef[] {
  const seen = new Set<string>()
  const out: CustomPersonaDef[] = []
  for (const def of defs) {
    if (seen.has(def.id)) continue
    seen.add(def.id)
    out.push(def)
  }
  return out
}

/**
 * 人设文件存取器：构造时落地模板（不存在才写，仅此一次），
 * 之后 load() 每次现读——无缓存，改完文件点「重新读取」/刷新页面即生效。
 */
export class PersonasStore {
  readonly path: string
  private lastGood: CustomPersonaDef[] = []
  private lastError: string | null = null

  constructor(path?: string) {
    this.path = path ?? join(petDataDir(), PERSONAS_FILENAME)
    try {
      mkdirSync(dirname(this.path), { recursive: true })
    } catch {
      // 目录创建失败：后续读写会报错，按空清单处理
    }
    // 旧路径迁移：$DSH_HOME/anime25d-pet-personas.json → $DSH_HOME/anime25d-pet/personas.jsonc
    const legacyPath = join(petHomeDir(), 'anime25d-pet-personas.json')
    try {
      if (!existsSync(this.path) && existsSync(legacyPath)) copyFileSync(legacyPath, this.path)
    } catch {
      // 迁移失败不阻塞：仍按新路径空模板处理
    }
    // 首次落地：不存在才写模板；此后本插件绝不写此文件（注释永存）
    try {
      if (!existsSync(this.path)) writeFileSync(this.path, PERSONAS_TEMPLATE, 'utf8')
    } catch {
      // 落地失败（权限/只读 home）：后续读不到文件按空清单处理
    }
  }

  /** 现读并解析；失败时沿用上一份好结果并给出错误消息。 */
  load(): PersonasFileView {
    let text: string
    try {
      text = readFileSync(this.path, 'utf8')
    } catch (error) {
      this.lastError = `无法读取 ${this.path}：${error instanceof Error ? error.message : String(error)}`
      return { personas: this.lastGood, error: this.lastError, path: this.path }
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(stripJsonComments(text))
    } catch (error) {
      this.lastError = `JSONC 解析失败（沿用上次结果）：${error instanceof Error ? error.message : String(error)}`
      return { personas: this.lastGood, error: this.lastError, path: this.path }
    }
    const rawList = (parsed as { personas?: unknown })?.personas
    if (rawList !== undefined && !Array.isArray(rawList)) {
      this.lastError = 'JSONC 结构错误："personas" 必须是数组（沿用上次结果）'
      return { personas: this.lastGood, error: this.lastError, path: this.path }
    }
    const defs = Array.isArray(rawList) ? rawList : []
    const good: CustomPersonaDef[] = []
    const bad: string[] = []
    for (const raw of defs) {
      const def = normalizeCustomPersona(raw)
      if (def === null) {
        bad.push(typeof (raw as { id?: unknown })?.id === 'string' ? String((raw as { id: string }).id) : '?')
        continue
      }
      good.push(def)
    }
    this.lastGood = dedupeById(good)
    this.lastError = bad.length > 0 ? `已跳过 ${bad.length} 个非法条目（id：${bad.join('、')}）` : null
    return { personas: this.lastGood, error: this.lastError, path: this.path }
  }
}
