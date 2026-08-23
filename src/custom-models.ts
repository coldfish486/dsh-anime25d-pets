/**
 * 自定义模型文件（$DSH_HOME/anime25d-pet/custom-models.jsonc，JSONC）：
 * 用户自定义模型不再混入 DSH settings.yaml，而是像自定义人设一样放到插件私有目录。
 * 首次启动落地模板；UI 保存时由插件写回（保留文件头注释）。
 * @module dsh-anime25d-pets/custom-models
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'
import type { CustomModelEntry, MotionMap, SpatialTapOverride } from './models.ts'
import { isSupportedModelLocation } from './models.ts'
import { stripJsonComments } from './personas.ts'

/** 自定义模型文件名（$DSH_HOME/anime25d-pet 下）。 */
export const CUSTOM_MODELS_FILENAME = 'custom-models.jsonc'

/** 自定义模型文件读取结果。 */
export interface CustomModelsFileView {
  models: CustomModelEntry[]
  error: string | null
  path: string
}

/** DSH home 目录（与 persist.ts / personas.ts 同一规则）。 */
function petHomeDir(): string {
  return process.env.DSH_HOME ?? join(homedir(), '.dsh')
}

/** 文件头注释：每次写回时保留，提示用户这是插件私有配置。 */
const CUSTOM_MODELS_HEADER = `// 自定义模型配置文件（插件私有，JSONC 支持注释）。
// 路径：$DSH_HOME/anime25d-pet/custom-models.jsonc
// 建议通过设置面板「我的模型」增删改；直接编辑后刷新页面/重开设置即可生效。
// 字段：id / name / modelUrl / spatialTap / animationMap`

function serializeCustomModels(models: CustomModelEntry[]): string {
  return `${CUSTOM_MODELS_HEADER}\n${JSON.stringify({ models }, null, 2)}\n`
}

const CUSTOM_MODELS_TEMPLATE = serializeCustomModels([])

/** 校验并归一化单个自定义模型条目；非法时返回 null（调用方跳过）。 */
export function normalizeCustomModel(raw: unknown): CustomModelEntry | null {
  if (typeof raw !== 'object' || raw === null) return null
  const record = raw as Record<string, unknown>
  const id = typeof record.id === 'string' ? record.id.trim() : ''
  const name = typeof record.name === 'string' ? record.name.trim() : ''
  const modelUrl = typeof record.modelUrl === 'string' ? record.modelUrl.trim() : ''
  if (!id || !/^[a-z][a-z0-9_-]*$/i.test(id)) return null
  if (!name) return null
  if (!isSupportedModelLocation(modelUrl)) return null
  const entry: CustomModelEntry = { id, name, modelUrl }
  if (record.spatialTap && typeof record.spatialTap === 'object') {
    entry.spatialTap = record.spatialTap as SpatialTapOverride
  }
  if (record.animationMap && typeof record.animationMap === 'object') {
    entry.animationMap = record.animationMap as MotionMap
  }
  return entry
}

/** id 去重（后到忽略）。 */
function dedupeById(models: CustomModelEntry[]): CustomModelEntry[] {
  const seen = new Set<string>()
  const out: CustomModelEntry[] = []
  for (const model of models) {
    if (seen.has(model.id)) continue
    seen.add(model.id)
    out.push(model)
  }
  return out
}

/**
 * 自定义模型文件存取器：构造时确保目录存在并落地模板（不存在才写），
 * 之后 load() 每次现读；write() 由设置面板保存时调用。
 */
export class CustomModelsStore {
  readonly path: string
  private lastGood: CustomModelEntry[] = []
  private lastError: string | null = null

  constructor(path?: string) {
    this.path = path ?? join(petHomeDir(), 'anime25d-pet', CUSTOM_MODELS_FILENAME)
    try {
      mkdirSync(dirname(this.path), { recursive: true })
    } catch {
      // 目录创建失败：后续读写会报错，按空清单处理
    }
    try {
      if (!existsSync(this.path)) writeFileSync(this.path, CUSTOM_MODELS_TEMPLATE, 'utf8')
    } catch {
      // 落地失败（权限/只读 home）：后续读不到文件按空清单处理
    }
  }

  /** 现读并解析；失败时沿用上一份好结果并给出错误消息。 */
  load(): CustomModelsFileView {
    let text: string
    try {
      text = readFileSync(this.path, 'utf8')
    } catch (error) {
      this.lastError = `无法读取 ${this.path}：${error instanceof Error ? error.message : String(error)}`
      return { models: this.lastGood, error: this.lastError, path: this.path }
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(stripJsonComments(text))
    } catch (error) {
      this.lastError = `JSONC 解析失败（沿用上次结果）：${error instanceof Error ? error.message : String(error)}`
      return { models: this.lastGood, error: this.lastError, path: this.path }
    }
    const rawList = (parsed as { models?: unknown })?.models
    if (rawList !== undefined && !Array.isArray(rawList)) {
      this.lastError = 'JSONC 结构错误："models" 必须是数组（沿用上次结果）'
      return { models: this.lastGood, error: this.lastError, path: this.path }
    }
    const list = Array.isArray(rawList) ? rawList : []
    const good: CustomModelEntry[] = []
    const bad: string[] = []
    for (const raw of list) {
      const model = normalizeCustomModel(raw)
      if (model === null) {
        bad.push(typeof (raw as { id?: unknown })?.id === 'string' ? String((raw as { id: string }).id) : '?')
        continue
      }
      good.push(model)
    }
    this.lastGood = dedupeById(good)
    this.lastError = bad.length > 0 ? `已跳过 ${bad.length} 个非法条目（id：${bad.join('、')}）` : null
    return { models: this.lastGood, error: this.lastError, path: this.path }
  }

  /** 写回自定义模型列表（设置面板保存用；保留文件头注释）。 */
  write(models: CustomModelEntry[]): CustomModelsFileView {
    const normalized = dedupeById(models.map(normalizeCustomModel).filter((m): m is CustomModelEntry => m !== null))
    try {
      writeFileSync(this.path, serializeCustomModels(normalized), 'utf8')
      this.lastGood = normalized
      this.lastError = null
    } catch (error) {
      this.lastError = `写入失败 ${this.path}：${error instanceof Error ? error.message : String(error)}`
    }
    return this.load()
  }
}
