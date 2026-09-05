/**
 * 宠物显示偏好持久化：$DSH_HOME/anime25d-pet.json（拖动位置/尺寸）。
 * v0.1 采用简单同步读写；原子写入（dsh-atomic-write）留待后续。
 * @module dsh-anime25d-pets/persist
 */
export interface PetDisplay {
    right: number;
    bottom: number;
    size: number;
}
export declare const DEFAULT_DISPLAY: PetDisplay;
/** 归一化显示配置到合法边界（持久化读取与 API 写入共用同一权威规则）。 */
export declare function normalizeDisplay(display: PetDisplay): PetDisplay;
/** 读取持久化显示配置；不存在或损坏时回退默认值。 */
export declare function loadPetPersist(): PetDisplay;
/** 保存显示配置（尽力而为，失败不阻断交互）。 */
export declare function savePetPersist(display: PetDisplay): void;
