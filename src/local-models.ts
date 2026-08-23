/**
 * 本地模型文件支持：用户填写的本地绝对路径由 Host 映射为同源 HTTP 路由
 * `/pet-local-models/<customId>/<fileName>`，浏览器无需访问 file://。
 * @module dsh-anime25d-pets/local-models
 */

import { existsSync, readdirSync, statSync } from 'node:fs'
import { basename, dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { isLocalModelPath } from './models.ts'

/** 本地路径解析结果：模型文件所在目录 + 入口 .psd 文件名（Anime2.5DRig 支持 .psd/.model3.json）。 */
export interface LocalModelTarget {
  root: string
  fileName: string
}

/**
 * 解析用户填写的本地模型位置：
 * - 文件路径 → 目录 + 文件名
 * - 目录路径 → 目录 + 目录内第一个 .psd（找不到再找 .model3.json）
 */
export function localModelTarget(modelUrl: string): LocalModelTarget | null {
  if (!isLocalModelPath(modelUrl)) return null
  const p = modelUrl.trim()
  try {
    const st = statSync(p)
    if (st.isDirectory()) {
      let files = readdirSync(p).filter((f) => f.toLowerCase().endsWith('.psd'))
      if (files.length === 0) {
        files = readdirSync(p).filter((f) => f.toLowerCase().endsWith('.model3.json'))
      }
      if (files.length === 0) return null
      return { root: p, fileName: files[0] }
    }
    if (st.isFile()) {
      return { root: dirname(p), fileName: basename(p) }
    }
  } catch {
    return null
  }
  return null
}

/** 生成浏览器可访问的本地模型入口 URL。 */
export function localModelUrlPath(customId: string, modelUrl: string): string | null {
  const target = localModelTarget(modelUrl)
  if (!target) return null
  return `/pet-local-models/${encodeURIComponent(customId)}/${target.fileName.split(/[\\/]/).map(encodeURIComponent).join('/')}`
}

/** 把本地模型路由的相对路径安全解析为真实文件路径；越界返回 null。 */
export function resolveLocalModelFile(modelUrl: string, relativePath: string): string | null {
  const target = localModelTarget(modelUrl)
  if (!target) return null
  const root = resolve(target.root)
  const file = resolve(root, relativePath)
  const rel = relative(root, file)
  if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) return null
  if (!existsSync(file)) return null
  return file
}

/** 路径分隔符导出（路由/测试用）。 */
export const PATH_SEP = sep
