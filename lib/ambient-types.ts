export type AmbientKind = "ink" | "grid" | "orbit";
export interface AmbientEngine {
  setActive: (active: boolean) => void;
  move: (x: number, y: number) => void;
  leave: () => void;
  dispose: () => void;
}
