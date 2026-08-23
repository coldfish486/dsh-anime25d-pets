/**
 * 宠物显示偏好持久化：$DSH_HOME/anime25d-pet.json（拖动位置/尺寸）。
 * v0.1 采用简单同步读写；原子写入（dsh-atomic-write）留待后续。
 * @module dsh-anime25d-pets/persist
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

export interface PetDisplay {
  right: number
  bottom: number
  size: number
}

export const DEFAULT_DISPLAY: PetDisplay = { right: 24, bottom: 20, size: 160 }

const DISPLAY_MIN = 40
const DISPLAY_MAX = 400
const INSET_MAX = 4000

function clamp(value: number, min: number, max: number): number {
  if (Number.isFinite(value)) return Math.min(max, Math.max(min, value))
  return min
}

/** 归一化显示配置到合法边界（持久化读取与 API 写入共用同一权威规则）。 */
export function normalizeDisplay(display: PetDisplay): PetDisplay {
  return {
    right: clamp(display.right, 0, INSET_MAX),
    bottom: clamp(display.bottom, 0, INSET_MAX),
    size: clamp(display.size, DISPLAY_MIN, DISPLAY_MAX),
  }
}

function petHomeDir(): string {
  return process.env.DSH_HOME ?? join(homedir(), '.dsh')
}

function petFile(): string {
  return join(petHomeDir(), 'live2d-pet.json')
}

/** 读取持久化显示配置；不存在或损坏时回退默认值。 */
export function loadPetPersist(): PetDisplay {
  try {
    const raw = JSON.parse(readFileSync(petFile(), 'utf8')) as Partial<PetDisplay>
    return normalizeDisplay({
      right: raw.right ?? DEFAULT_DISPLAY.right,
      bottom: raw.bottom ?? DEFAULT_DISPLAY.bottom,
      size: raw.size ?? DEFAULT_DISPLAY.size,
    })
  } catch {
    return { ...DEFAULT_DISPLAY }
  }
}

/** 保存显示配置（尽力而为，失败不阻断交互）。 */
export function savePetPersist(display: PetDisplay): void {
  try {
    writeFileSync(petFile(), JSON.stringify(display, null, 2), 'utf8')
  } catch {
    // 忽略持久化失败；下次启动回退默认值。
  }
}
