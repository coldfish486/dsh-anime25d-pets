/**
 * 桌宠配置设置页（`settings.section` 注册体，spec §2）。
 * 设置项：开关 / 尺寸滑杆 / Anime2.5DRig 参数滑块 / 人设 / 模型列表（内置只读 + 自定义增删改）/ 调试模式。
 * 读写经插件自己的同源 API `/api/anime25d-pet/settings`（Host 直连 ctx.settings，
 * 持久化到 settings.yaml 用户层）——不走 client settingsScope wire，因为
 * dsh-host-apiproxy 只把内置 allowlist 的 namespace 暴露给浏览器
 * （见 docs/research/settings-tab.md「设置服务不可用」根因）。
 * 不引入任何非平台模块值导入。
 * @module dsh-anime25d-pets/client/settings
 */
import type { ReactNode } from 'react';
/** settings namespace 的解析值（与 Host Config 对齐）。 */
export interface PetSettingsValue {
    enabled: boolean;
    size: number;
    model: string;
    /** 开发者选项总开关：开启后显示调试面板/点击分区等开发者入口。 */
    developerMode: boolean;
    /** 调试面板：显示调试面板（开发用）。 */
    debug: boolean;
    /** 显示点击分区叠加层（空间回退色块）。 */
    showTapZones: boolean;
    persona: string;
    /** FPS 限制（30 / 60 / 0=无限制）。 */
    fpsLimit: number;
    /** 宠物透明度（0~1，含气泡）。 */
    opacity: number;
}
/** 「自定义人设 ↗」直达打开（由插件入口注入；返回是否成功，失败走弹层兜底）。 */
export interface PetSettingsProps {
    openPath?: (path: string) => Promise<boolean>;
}
export declare function PetSettingsSection(props: PetSettingsProps): ReactNode;
