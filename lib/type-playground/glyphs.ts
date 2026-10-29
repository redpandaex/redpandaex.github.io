export type Glyph = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  baseline: number;
  font: string;
  fontSize: string;
  fontFamily: string;
  fontWeight: string;
  letterSpacing: string;
  lineHeight: string;
  color: string;
  accent: boolean;
};

export function measureGlyphs(stage: HTMLElement, title: HTMLElement): Glyph[] {
  const origin = stage.getBoundingClientRect();
  return Array.from(title.querySelectorAll<HTMLElement>("[data-glyph]")).map(
    (element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const baseline = element.parentElement
        ?.querySelector<HTMLElement>("[data-baseline]")
        ?.getBoundingClientRect().top;
      return {
        text: element.textContent ?? "",
        x: rect.left - origin.left,
        y: rect.top - origin.top,
        width: rect.width,
        height: rect.height,
        baseline: (baseline ?? rect.bottom) - origin.top,
        font: `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
        fontSize: style.fontSize,
        fontFamily: style.fontFamily,
        fontWeight: style.fontWeight,
        letterSpacing: style.letterSpacing,
        lineHeight: style.lineHeight,
        color: style.color,
        accent: element.parentElement?.hasAttribute("data-accent") ?? false,
      };
    },
  );
}
