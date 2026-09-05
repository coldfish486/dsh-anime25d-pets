# dsh-anime25d-pets 🐾

**Anime2.5DRig × DSH 桌宠：借助 see-through，只凭一张干净背景的图像，即可获得带自动装配、发丝物理、表情动画和状态镜像的桌宠。**

![Demo](assets/demo.gif)

---

## 功能特色

- 🎨 **一张图，自动成宠**：只需一张干净背景的角色图像，Anime2.5DRig 自动完成装配，无需 Live2D 模型或复杂的手工设置。
- 🌊 **发丝物理 & 表情动画**：自动装配后自带发丝物理、眨眼、随机小动作、随机开口说话和状态表情。
- 🖼️ **状态镜像**：真实反映 DSH Agent 的思考 / 空闲 / 出错 / 完成 / 等待审批五种状态。
- 💡 **状态呼吸灯**：右下角呼吸灯随状态变色（绿/黄/红/蓝/紫），一眼掌握 Agent 状态。
- 🔄 **左右翻转**：浮动面板一键镜像桌宠，同一个角色左右朝向自由切换。
- ⚙️ **轻量调节面板**：鼠标悬停显示设置按钮，浮动面板可实时调整 34 个 2.5D 参数，并支持随机说话 / 随机动作 / 镜像翻转。
- 🎛️ **性能与外观**：DSH 设置页可调整 FPS 限制（30 / 60 / 无限制）和透明度（0~1，含气泡）。
- 🐾 **多模型 & 人设**：支持内置预设模型与自定义 PSD 模型，并为人设配置台词与状态表现。

---

## 兼容性

| 项目 | 要求 |
|------|------|
| DeepSeek Harness (DSH) | 已验证 **DSH 0.1.2-rc.1** |
| Node.js | `^22.19.0 || >=24.0.0` |
| 包管理器 | pnpm / npm / bun |
| 浏览器 | Chrome / Edge / Firefox / Safari（需支持 WebGL） |
| 最后验证日期 | 2026-09-05 |

> **DSH 0.1.2-rc.1 兼容说明**：该版本移除了 `@deepseek-ai/dsh-settings` 的运行时导出
> `settingsNamespace`。本插件已改为直接使用 namespace 字符串，并保留类型层面的
> `SettingsNamespace` 兼容层；因此同时兼容 `0.1.0-rc.6` 与 `0.1.2-rc.1`。

---

## 安装与卸载

### 安装（推荐：从 GitHub 安装）

```bash
dsh plugin --profile web add github:coldfish486/dsh-anime25d-pets
```

> **注意：** DSH 安装（或安装后的 pnpm install）会**自动执行本插件的构建脚本**
> （`prepare`/`prepack`），必须在 `pnpm-workspace.yaml` 的 `allowBuilds` 中
> 允许本插件构建，否则不会生成 `lib/` 产物，插件运行时无法正常加载：

```yaml
allowBuilds:
  'dsh-anime25d-pets@xxxxxx': true
```

### 安装（源码开发）

```bash
git clone https://github.com/coldfish486/dsh-anime25d-pets.git
cd dsh-anime25d-pets
pnpm install
pnpm build
dsh plugin --profile web add /path/to/dsh-anime25d-pets
```

### 升级

```bash
# 从 GitHub 安装的可重新执行 add 拉取最新版，或进入插件目录后：
cd dsh-anime25d-pets
git pull
pnpm install
pnpm build
# 重新安装/重启 DSH
```

### 禁用

在 DSH 设置 →「桌宠配置」中关闭"启用桌宠"开关即可。

### 彻底移除

```bash
dsh plugin --profile web remove dsh-anime25d-pets
# 或手动删除：
# /root/.dsh/profiles/web/node_modules/dsh-anime25d-pets/
# 并从 /root/.dsh/profiles/web/package.json 中移除引用
```

---

## 快速开始

### 最小配置示例

1. **安装插件**（见上文）
2. **启动 DSH**，右下角出现默认宠物（内置 Anim2.5DRig 示例 PSD 模型）
3. **添加自己的 PSD 模型**：
   - 打开 DSH 设置 →「桌宠配置」→「我的模型」
   - 填写名称和 `.psd` 地址（支持 HTTP URL 或本地绝对路径）
   - 点击保存
4. **使用**：
   - 将鼠标移到桌宠上，右下角会浮出 **⚙** 设置按钮，点击打开角色调节面板
   - 拖动滑块实时调整头部/眼睛/眉毛/嘴巴/发型/身体参数
   - 切换"随机开口说话""随机小动作"和"左右翻转桌宠"开关
   - 在 DSH「桌宠配置」设置页可调整**帧率限制**（30/60/无限制）和**透明度**（含气泡）
   - 拖动桌宠到任意位置（自动保存）

### 可复现示例

```yaml
# settings.yaml 中 anime25d-pet 部分的参考配置
anime25d-pet:
  enabled: true
  size: 200
  model: sample            # 使用内置示例模型
  animeParams:
    angleX: 0.2            # 左右转头
    mouthOpen: 0.3         # 嘴巴张开
  talk: true               # 随机开口说话
  rand: false              # 随机小动作
  flip: false              # 左右镜像翻转
  fpsLimit: 30             # 帧率限制（30 / 60 / 0=无限制）
  opacity: 1.0             # 宠物透明度（0~1，含气泡）
  persona: tsundere
```

---

## 配置说明

### settings.yaml 配置项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `enabled` | boolean | `true` | 插件总开关 |
| `size` | number | `160` | 宠物尺寸（40~400 px） |
| `model` | string | `sample` | 模型 ID（内置 preset 或自定义模型 ID） |
| `animeParams` | object | `{}` | Anime2.5D 参数滑块（34 个参数） |
| `talk` | boolean | `false` | 随机开口说话 |
| `rand` | boolean | `false` | 随机小动作 |
| `flip` | boolean | `false` | 左右镜像翻转桌宠（浮动面板同步管理） |
| `fpsLimit` | number | `30` | 帧率限制（30 / 60 / 0=无限制） |
| `opacity` | number | `1` | 宠物透明度（0~1，含气泡，DSH 设置页可调） |
| `persona` | string | `tsundere` | 人设 ID |
| `developerMode` | boolean | `false` | 开发者模式 |
| `debug` | boolean | `false` | 调试面板 |
| `showTapZones` | boolean | `false` | 显示点击分区 |

### Anime2.5D 参数（34 个）

| 分组 | 参数 | 范围 | 默认 |
|------|------|------|------|
| 头部姿态 | `angleX` / `angleY` / `angleZ` | -1 ~ 1 | 0 |
| 眼睛 | `eyeOpenL` / `eyeOpenR` | 0 ~ 1 | 1 |
| 眼睛 | `eyeX` / `eyeY` | -1 ~ 1 | 0 |
| 眼睛 | `irisScale` | 0.5 ~ 1.3 | 1 |
| 眼睛 | `eyeScaleL` / `eyeScaleR` | 0.5 ~ 1.5 | 1 |
| 眼睛 | `eyeEase` | 0 ~ 1 | 0.3 |
| 眼睛 | `eyeCY` / `eyeCAng` | -1 ~ 1 | 0 |
| 眉毛 | `brow` | -1 ~ 1 | 0 |
| 眉毛 | `browAngSym` / `browAngL` / `browAngR` | -1 ~ 1 | 0 |
| 嘴巴 | `mouthOpen` | 0 ~ 1 | 0 |
| 嘴巴 | `mouthForm` | -1 ~ 1 | 0 |
| 嘴巴 | `mouthCY` / `mouthCAng` | -1 ~ 1 | 0 |
| 嘴巴 | `mouthEase` | 0 ~ 1 | 0.45 |
| 嘴巴 | `mouthScale` | 0.5 ~ 1.5 | 1 |
| 发型 | `fhAmp` | 0 ~ 3 | 2 |
| 发型 | `fhSoft` | 0 ~ 2 | 0.4 |
| 发型 | `bangL` / `bangC` / `bangR` | -1 ~ 1 | 0 |
| 身体物理 | `body` | -1 ~ 1 | 0 |
| 身体物理 | `armY` / `armPos` | -1 ~ 1 | 0 |
| 身体物理 | `bust` | 0 ~ 5 | 2.5 |
| 身体物理 | `bustY` | -1 ~ 3 | 1 |
| 身体物理 | `physAmp` | 0 ~ 3 | 2 |
| 身体物理 | `soft` | 0 ~ 2 | 2 |

### 环境变量

| 变量 | 说明 |
|------|------|
| `DSH_HOME` | DSH 配置目录（默认 `~/.dsh`） |

### 敏感项

无。本插件不存储凭据、不访问用户敏感数据。

---

## 权限与数据

| 数据/资源 | 访问方式 | 说明 |
|-----------|---------|------|
| 本地 PSD 文件 | `node:fs` 读取 | 仅在用户配置了本地模型路径时读取 |
| 设置配置 | DSH settings API | 读写 `settings.yaml` |
| 自定义模型配置 | `~/.dsh/anime25d-pet/custom-models.jsonc` | JSONC 格式 |
| 静态资源 | HTTP 同源路由 | `/pet-assets/*`、`/pet-local-models/*` |
| 网络访问 | 无 | 不发起外部网络请求（除非用户配置了远程 PSD URL） |
| 摄像头 | 无 | **不访问摄像头** |

---

## 常见问题排查

### 常见错误

| 现象 | 原因 | 解决 |
|------|------|------|
| 紫色 🐾 方块 | 模型加载失败 | 检查模型路径是否正确；检查 `assets/lib/` 是否存在 |
| 空白画面 | WebGL 渲染问题 | 检查浏览器是否支持 WebGL；检查 canvas 尺寸 |
| 参数不生效 | 自动动画覆盖 | 手动设置参数后自动动画会跳过；开启自动动画会释放手动锁定 |
| 重启后参数丢失 | 持久化失败 | 检查 `settings.yaml` 中 `anime25d-pet` 配置是否存在 |
| 点击分区不准确 | 坐标系不匹配 | 确认 `getBounds()` 使用 CSS 坐标系 |

### 日志位置

DSH Host 日志：`/var/log/dsh/dsh-web.log`

### 回滚

```bash
# 通过 DSH 插件系统移除
dsh plugin --profile web remove dsh-anime25d-pets

# 或手动删除插件目录
rm -rf /root/.dsh/profiles/web/node_modules/dsh-anime25d-pets/
```

---

## 开发指南

```bash
# 克隆仓库
git clone https://github.com/coldfish486/dsh-anime25d-pets.git
cd dsh-anime25d-pets

# 安装依赖
pnpm install

# 类型检查
pnpm run typecheck

# 测试
pnpm test

# 构建
pnpm build

# 构建产物在 lib/ 目录
```

### 项目结构

```
dsh-anime25d-pets/
├── src/
│   ├── index.ts           # Host 入口（插件 Config / 生命周期）
│   ├── service.ts         # 宠物状态机 / SSE 推送
│   ├── routes.ts          # HTTP 路由 / 静态资源
│   ├── models.ts          # 模型类型定义
│   ├── models-host.ts     # 模型 URL 解析
│   ├── local-models.ts    # 本地 PSD 路径映射
│   ├── presets/           # 内置模型清单
│   └── client/
│       ├── index.ts       # 桌宠主逻辑（加载/交互/面板）
│       ├── anime25d.ts    # Anime2.5D 渲染引擎适配
│       ├── settings.ts    # DSH 设置面板
│       └── personas.ts    # 人设台词
├── assets/
│   ├── vendor/            # ag-psd 等第三方库
│   ├── lib/               # rigger 等 Anime2.5DRig 资源
│   ├── models/            # 示例模型
│   ├── icons/             # 图标
│   └── demo.gif           # 效果演示图
├── lib/                   # 构建产物（pnpm build 生成）
├── shared/                # DSH 构建配置
├── package.json
└── tsconfig.json
```

### 贡献

欢迎提交 PR！请确保：
1. `pnpm run typecheck` 通过
2. `pnpm test` 通过
3. 修改用户可感知行为时更新 README

---

## 许可证与安全

### 许可证

本项目采用 **MIT License**（见 [LICENSE](LICENSE)）。

### 第三方组件许可

| 组件 | 用途 | 许可证 |
|------|------|--------|
| [Anime2.5DRig](https://github.com/852wa/Anime2.5DRig) | WebGL 渲染引擎 / 自动装配 | MIT |
| [ag-psd](https://github.com/Agamnentzar/ag-psd) | PSD 解析器 | MIT |
| [dsh-live2d-pets](https://github.com/cyanfish-x/dsh-live2d-pets) | 桌宠插件框架 | MIT |

### 版权声明

- **PSD 模型资产**：`assets/lib/eye_close.psd`、`assets/lib/mouth_close.psd`、`assets/models/sample.psd`
  来自 [Anime2.5DRig](https://github.com/852wa/Anime2.5DRig) 仓库（MIT License），
  但 **PSD 内的美术作品版权归各原作者所有**。发布或分发前请确认版权。
- **Live2D 官方模型**：原 dsh-live2d-pets 内置的 Hiyori/Haru 等模型不再分发。

### 安全

如发现安全问题，请通过 GitHub Issues 私密报告（不要公开漏洞详情）。

---
