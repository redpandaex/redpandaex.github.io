# 依赖升级与博客改造验收

日期：2026-10-03。分支：feat/blog-creative-redesign。

## 最新修订：待用户手动验收

按用户反馈改为书脊式侧边目录 / 手机底部浮动导航；文章、分类、标签统一成文章库；独立的 Three.js 雕塑展示区已移除，改为直接组成首页 Code. Create. 的细密文字粒子。Three.js 版本为 0.186.1。

这一轮按用户明确要求不运行测试、构建或浏览器验收。下方结果属于此前版本，不覆盖最新布局、统一筛选和文字粒子。现有浏览器测试仍含旧界面的断言，需在用户确认最终交互后更新。

## 已执行的检查

| 检查 | 结果 |
| --- | --- |
| pnpm install --frozen-lockfile | 通过，锁文件与 manifest 一致 |
| pnpm typecheck | 通过 |
| pnpm lint | 通过，无诊断 |
| pnpm build | 通过，生成 27 个静态页面 |
| pnpm test:e2e | 18 项通过，桌面与手机各 9 项 |
| git diff --check | 通过 |

浏览器验收使用本机 Chrome 154；手机使用 iPhone 13 的 Chromium 设备模拟，不代表在真实 iOS Safari 上执行过测试。

覆盖：首页实际文章与图片、画布换色、搜索快捷键与焦点恢复、关键词和标签筛选、排序、主题持久化、目录定位、字号、实际代码复制、Canvas 参数与减少动态效果偏好、9 条页面路径的深浅主题与横向溢出、WebGL 启动/清空/退出、导航当前状态与手机菜单。

视觉检查：1440px 桌面、390px 手机、深浅色首页、文章阅读页。主视觉压缩为约 100 KB 的 WebP。没有进行 Lighthouse 性能评分，也没有在真实 Safari / Firefox 中执行验收。

## 兼容处理

Next.js 与 @next/mdx 同步升级到 16.3.8，React / React DOM 同步到 19.3.0。TypeScript 7.0.2、Tailwind 4.3.3、GSAP 3.15.0、Biome 2.5.15。Node 类型对齐 Node 24，而非选用 Node 26 类型。

现有 MDX JavaScript 插件需要 Webpack，因此 dev/build 显式指定 --webpack；移除不必要的手动分包与未安装的 SVG loader。保留 GitHub Pages 静态导出及文章、分类、标签的现有 URL。

读取文章统一使用 content/posts；项目页将原有示例项目和示例外链改为本仓库实际可运行的交互实验。Giscus 和现有 GA 配置保留。

代码尚未 commit / push；未执行部署。
