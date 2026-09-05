/**
 * 宠物 HTTP 路由：浏览器半区通过同源 JSON 端点（/api/live2d-pet/*）、
 * SSE 状态推送端点（/api/live2d-pet/events，ADR-006）与素材静态路由
 * （/pet-assets/*）通信——官方模式（dsh-pet routes.ts 同款，见 docs/adr/004）。
 * @module dsh-anime25d-pets/routes
 */
import type { WebRoute } from '@deepseek-ai/dsh-host-webserver';
import type { PetService } from './service.ts';
import type { SettingsPathOp } from '@deepseek-ai/dsh-settings';
/** 设置读写 API（Host 直连 ctx.settings；不走 wire 白名单，见 research/settings-tab.md）。 */
export interface SettingsRoutesApi {
    view(): {
        value: unknown;
        writable: boolean;
    };
    write(ops: readonly SettingsPathOp[]): Promise<void>;
}
/** 浏览器侧宠物 API 基路径。 */
export declare const PET_API_PREFIX = "/api/anime25d-pet";
/** 浏览器侧素材静态路由基路径（vendor 运行时脚本 + 预设模型）。 */
export declare const PET_ASSET_PREFIX = "/pet-assets";
/** 本地模型静态路由基路径（Host 按自定义模型 id 映射到用户本地路径）。 */
export declare const PET_LOCAL_MODELS_PREFIX = "/pet-local-models";
/** 包根目录（从本模块自身位置解析）。 */
export declare function petPackageRoot(importMetaUrl: string): string;
/** 构建完整路由族（API + SSE + 素材）供 ctx.webServer.register。 */
export declare function makePetRoutes(deps: {
    service: PetService;
    packageRoot: string;
    settings: SettingsRoutesApi;
    /** SSE 活跃流注册钩子：插件卸载时由调用方逐一 close（ADR-006）。 */
    onStream?: (close: () => void) => void;
}): WebRoute[];
