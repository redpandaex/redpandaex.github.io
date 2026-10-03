export const studioPalettes = [
  {
    id: "electric",
    name: "蓝莓汽水",
    colors: ["#3156e8", "#eb704c", "#9673df", "#abc849"],
  },
  {
    id: "papaya",
    name: "落日番石榴",
    colors: ["#b94629", "#e6779f", "#8755ba", "#cbaa42"],
  },
  {
    id: "mint",
    name: "薄荷游乐场",
    colors: ["#14786c", "#dc6689", "#527fc4", "#8caf44"],
  },
  {
    id: "berry",
    name: "葡萄放映室",
    colors: ["#8641b8", "#dd6470", "#385fb2", "#bd941a"],
  },
] as const;

export type StudioPalette = (typeof studioPalettes)[number];

export function readInkColors() {
  const style = getComputedStyle(document.documentElement);
  return studioPalettes[0].colors.map(
    (fallback, index) =>
      style.getPropertyValue(`--ink-${index + 1}`).trim() || fallback,
  );
}

export function hexToRgb(hex: string) {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}
