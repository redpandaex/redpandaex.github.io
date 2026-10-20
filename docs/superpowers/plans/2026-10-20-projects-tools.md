# Projects and Tools Implementation Plan

> **For agentic workers:** Use the approved scope and implement each independent task, then integrate and verify. The user subsequently authorized committing and pushing this change on 2026-10-20.

**Goal:** 展示三个 GitHub 项目，并提供本地文本对比、图片压缩和独立的图片格式转换。

**Architecture:** 保留静态导出；项目内容由本地数据驱动，工具为独立客户端叶组件。计算放在 Worker，路由、导航和页脚保持现有结构。

**Tech Stack:** Next.js 16.3.8 / React 19.3 / TypeScript / 原生 Canvas、Worker / jsdiff / Playwright。

**Spec:** `docs/superpowers/specs/2026-10-20-projects-tools.md`

## Global Constraints

- 在 main 修改；未经用户确认不提交、推送。用户已于 2026-10-20 确认本次提交与推送。
- 文本和图片不上传，不写入 URL 或持久化存储。
- 保留减少动态效果、暗色主题和已隐藏的邮箱。
- 工具与 Worker 加载完成后支持断网处理。

## Review Focus

- 输入或文件变更后，旧任务不能覆盖新内容。
- 超限、损坏文件分别报错，其他可用文件仍可处理。
- PNG/WebP 透明区域保留，JPEG 转换使用白底。
- 大文本限制运算和 DOM 数量，取消后界面恢复可用。
- 五项手机导航不溢出；长文件名和错误信息不撑宽页面。

## Task 1: 项目展示

- [x] 新增 `lib/projects.ts`、`components/project-showcase.tsx`、`app/projects/projects.css`，修改 `app/projects/page.tsx`。导出 `ProjectShowcase({ compact?: boolean })`。
- [x] 使用核验过的项目说明和真实资源，三个项目各附仓库及 Releases 链接。
- [x] 验证实际项目路由、链接和桌面/手机布局。

## Task 2: 图片工具

- [x] 新增 `components/tools/image-compressor.tsx`、`lib/tools/image-compression.ts` 与 Worker。导出 `ImageCompressor`。
- [x] 顺序压缩、输入校验、取消、过期任务保护及资源释放；遵守规格中的限制。
- [x] 浏览器生成图片，检查输出 MIME/尺寸、透明度和下载，断网后重复处理。

## Task 3: 文本工具与整合

- [x] 先在 `tests/tools.spec.ts` 写可观察用户行为的测试，旧导出应因缺少页面失败。
- [x] 新增 `components/tools/text-diff.tsx`、`lib/tools/text-diff.worker.ts` 与 `lib/tools/text-diff.ts`。使用 `diff` 包，Worker 预热、2 秒限时、取消及 500 行预览。
- [x] 新增三个工具路由与 `app/tools/tools.css`；整合配置、五项导航、首页项目预览、sitemap 和 README。
- [x] 运行 lint、typecheck、build、聚焦浏览器用例；扫描产物中的邮箱和旧开关。记录验证限制。

## Task 4: 追加图片格式转换

- [x] 使用真实 WASM 能力生成 23 种输入 / 20 种输出列表；单独路由与 Worker，不影响其他页面首次加载。
- [x] 批量原尺寸转换、格式/质量设置、PNG 预览及下载，输入限额、取消、过期保护、资源释放。
- [x] 缓存 WASM 和编译后 Worker 的分块依赖，断网后取消并重建线程仍可转换真实 HEIC / HEIF。
- [x] 独立审查发现并修复 GIF 逻辑画布及 ICC 颜色转换问题，加入真实像素回归。
- [x] 核心 41 项测试通过；桌面/手机完整 30 项浏览器回归通过，最终构建后复验受影响转换页。
