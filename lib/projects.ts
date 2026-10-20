export const projects = [
  {
    slug: "sonahop",
    name: "SonaHop",
    category: "跨设备音频",
    description:
      "让电脑和手机互相共享声音。通过局域网连接，共享系统音频，或把手机用作电脑的麦克风。",
    platforms: "Windows / Android",
    stack: "Rust · Tauri",
    image: "/images/projects/sonahop.png",
    imageAlt: "SonaHop 项目图标",
    imageWidth: 256,
    imageHeight: 256,
    features: [
      "局域网发现与手动连接",
      "共享系统声音与手机麦克风",
      "Windows 托盘控制",
    ],
  },
  {
    slug: "ssr2clash",
    name: "SSR2Clash",
    category: "订阅转换",
    description:
      "把 SSR 订阅转换成完整的 Clash 配置。支持本地订阅服务、冻结快照和 YAML 导出。",
    platforms: "Windows",
    stack: "Rust · Tauri",
    image: "/images/projects/ssr2clash-workbench.png",
    imageAlt: "SSR2Clash 工作台，使用虚构订阅数据的项目官方截图",
    imageWidth: 1200,
    imageHeight: 800,
    features: [
      "节点、策略组与规则转换",
      "本地托管与冻结快照",
      "便携版与安装版",
    ],
  },
  {
    slug: "glimtray",
    name: "GlimTray",
    category: "显示器亮度",
    description:
      "在 Windows 托盘里调节外接显示器亮度。通过 DDC/CI 控制，支持多屏独立调整。",
    platforms: "Windows",
    stack: "Rust · Slint",
    image: "/images/projects/glimtray.svg",
    imageAlt: "GlimTray 微光项目图标",
    imageWidth: 64,
    imageHeight: 64,
    features: [
      "多台显示器独立调光",
      "托盘浮层与系统主题适配",
      "便携运行与登录自启动",
    ],
  },
] as const;
