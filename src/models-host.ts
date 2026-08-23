/**
 * Host 侧模型清单读取与解析：内置 presets.jsonc（JSONC 支持注释）由 Node 读取。
 * 本模块不可被 client 打包引入（依赖 node:fs / node:path / node:url）。
 * 共享类型与默认值见 `models.ts`。
 * @module dsh-anime25d-pets/models-host
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DEFAULT_MOTION_MAP,
  isRemoteModelUrl,
  mergeSpatialTap,
  type BuiltinPreset,
  type CustomModelEntry,
  type MotionMap,
  type SpatialTapConfig,
} from './models.ts'
import { localModelUrlPath } from './local-models.ts'

/** 简易 JSONC 解析：去掉行注释和块注释（字符串内的注释保留）后 JSON.parse。 */
function parseJsonc(text: string): unknown {
  let out = ''
  let inString = false
  let quote = ''
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]
    if (inString) {
      out += ch
      if (ch === '\\') {
        out += next ?? ''
        i++
      } else if (ch === quote) {
        inString = false
      }
      continue
    }
    if (ch === '"' || ch === "'") {
      inString = true
      quote = ch
      out += ch
      continue
    }
    if (ch === '/' && next === '/') {
      while (i < text.length && text[i] !== '\n') i++
      continue
    }
    if (ch === '/' && next === '*') {
      i += 2
      while (i + 1 < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++
      i++
      continue
    }
    out += ch
  }
  return JSON.parse(out)
}

/** 包根目录（从本模块位置解析：源码测试时指向仓库根，构建后 lib/ 的上一级即包根）。 */
function packageRoot(): string {
  return fileURLToPath(new URL('../', import.meta.url))
}

const presetsData = parseJsonc(
  readFileSync(join(packageRoot(), 'src/presets/presets.jsonc'), 'utf8'),
) as { presets: BuiltinPreset[] }

/** 内置策展清单（只读，来自 presets.jsonc）。 */
export function listBuiltinPresets(): BuiltinPreset[] {
  return presetsData.presets
}

/**
 * 按当前选中模型解析生效空间阈值：
 * 自定义条目覆盖优先；否则内置 preset 的 `spatialTap`；再否则全局默认。
 */
export function resolveSpatialTap(model: string, customModels: CustomModelEntry[]): SpatialTapConfig {
  const custom = customModels.find((c) => c.id === model)
  if (custom?.spatialTap) return mergeSpatialTap(custom.spatialTap)
  const preset = presetsData.presets.find((p) => p.id === model)
  return mergeSpatialTap(preset?.spatialTap)
}

/**
 * 按当前选中模型解析生效动画映射：
 * 自定义条目 animationMap 优先；否则内置 preset 的 animationMap；再否则默认映射。
 * 只做浅合并：配置过的槽位覆盖，未配置槽位沿用默认。
 */
export function resolveMotionMap(model: string, customModels: CustomModelEntry[]): MotionMap {
  const custom = customModels.find((c) => c.id === model)
  if (custom?.animationMap) return { ...DEFAULT_MOTION_MAP, ...custom.animationMap }
  const preset = presetsData.presets.find((p) => p.id === model)
  if (preset?.animationMap) return { ...DEFAULT_MOTION_MAP, ...preset.animationMap }
  return { ...DEFAULT_MOTION_MAP }
}

/**
 * 把 `config.model` 解析为可加载的 `.psd` URL（Anime2.5DRig 模型）：
 * - 已是 http(s) URL → 原样返回
 * - preset id → presets.jsonc 匹配
 * - 自定义模型 id → settings 用户层 customModels 匹配
 * 支持 .psd / .model3.json 均可；未命中返回 null（客户端降级静态头像）。
 */
export function resolveModelUrl(model: string, customModels: CustomModelEntry[]): string | null {
  if (isRemoteModelUrl(model)) return model
  const preset = presetsData.presets.find((p) => p.id === model)
  if (preset) return preset.modelUrl
  const custom = customModels.find((c) => c.id === model)
  if (custom) {
    // 本地路径：转成 Host 同源虚拟 URL，浏览器通过 /pet-local-models/<id>/... 加载
    if (isRemoteModelUrl(custom.modelUrl)) return custom.modelUrl
    return localModelUrlPath(custom.id, custom.modelUrl)
  }
  return null
}
