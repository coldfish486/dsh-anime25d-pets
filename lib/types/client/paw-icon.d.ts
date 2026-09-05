/**
 * 设置导航爪印图标（用户提供的「动物足迹」SVG；currentColor 跟随侧栏主题色）。
 *
 * DSH `dsh-client-ui-settings-general` 当前按 section id 硬编码导航图标
 * （未知 id 一律齿轮），settings.section 的 `icon` 选项尚未接入投影。
 * 因此在导航出现「桌宠配置」时用爪印 SVG 替换齿轮，作为可随插件发布的兼容方案。
 * @module dsh-anime25d-pets/client/paw-icon
 */
import type { ReactElement, ReactNode } from 'react';
/** 填充式爪印 SVG（16–20px 侧栏清晰可读）。 */
export declare function PawPrintIcon(props: {
    size?: number;
    className?: string;
}): ReactElement;
/** 设置.section 注册用：按尺寸渲染爪印（待平台投影 icon 字段后可直接生效）。 */
export declare function pawNavIcon(size: number): ReactNode;
/**
 * 监视 DOM：把「桌宠配置」导航行上的默认齿轮换成爪印。
 * 返回停止函数（插件卸载 / section 退订时调用）。
 */
export declare function installPetSettingsNavIcon(): () => void;
