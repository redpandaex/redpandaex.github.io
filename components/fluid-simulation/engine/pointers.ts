/**
 * 指针（鼠标/触摸）交互管理
 */

import { generateColor } from "./config";
import type { Pointer } from "./types";

// 根据像素比例缩放
export function scaleByPixelRatio(value: number): number {
  return Math.floor(
    value * (typeof window !== "undefined" ? window.devicePixelRatio : 1),
  );
}

// 创建默认指针
export function createPointer(): Pointer {
  const color = generateColor();
  return {
    id: -1,
    texcoordX: 0,
    texcoordY: 0,
    prevTexcoordX: 0,
    prevTexcoordY: 0,
    deltaX: 0,
    deltaY: 0,
    down: false,
    moved: false,
    color,
  };
}

// 更新指针颜色
export function updatePointerColor(pointer: Pointer): void {
  pointer.color = generateColor();
}

// 更新指针移动数据
export function updatePointerMoveData(
  pointer: Pointer,
  posX: number,
  posY: number,
  canvasWidth: number,
  canvasHeight: number,
): void {
  pointer.prevTexcoordX = pointer.texcoordX;
  pointer.prevTexcoordY = pointer.texcoordY;
  pointer.texcoordX = posX / canvasWidth;
  pointer.texcoordY = 1.0 - posY / canvasHeight;
  pointer.deltaX = correctDeltaX(
    pointer.texcoordX - pointer.prevTexcoordX,
    canvasWidth,
    canvasHeight,
  );
  pointer.deltaY = correctDeltaY(
    pointer.texcoordY - pointer.prevTexcoordY,
    canvasWidth,
    canvasHeight,
  );
  pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
}

// 更新指针按下数据
export function updatePointerDownData(
  pointer: Pointer,
  id: number,
  posX: number,
  posY: number,
  canvasWidth: number,
  canvasHeight: number,
): void {
  pointer.id = id;
  pointer.down = true;
  pointer.moved = false;
  pointer.texcoordX = posX / canvasWidth;
  pointer.texcoordY = 1.0 - posY / canvasHeight;
  pointer.prevTexcoordX = pointer.texcoordX;
  pointer.prevTexcoordY = pointer.texcoordY;
  pointer.deltaX = 0;
  pointer.deltaY = 0;
  pointer.color = generateColor();
}

// 更新指针抬起数据
export function updatePointerUpData(pointer: Pointer): void {
  pointer.down = false;
}

// 修正 X 方向的 delta（考虑画布宽高比）
function correctDeltaX(
  delta: number,
  canvasWidth: number,
  canvasHeight: number,
): number {
  const aspectRatio = canvasWidth / canvasHeight;
  if (aspectRatio < 1) {
    delta *= aspectRatio;
  }
  return delta;
}

// 修正 Y 方向的 delta（考虑画布宽高比）
function correctDeltaY(
  delta: number,
  canvasWidth: number,
  canvasHeight: number,
): number {
  const aspectRatio = canvasWidth / canvasHeight;
  if (aspectRatio > 1) {
    delta /= aspectRatio;
  }
  return delta;
}

// 从触摸事件列表中查找指针
export function findPointerById(
  pointers: Pointer[],
  id: number,
): Pointer | null {
  for (const pointer of pointers) {
    if (pointer.id === id) {
      return pointer;
    }
  }
  return null;
}

// 计算飞溅力度
export function calculateSplatForce(
  deltaX: number,
  deltaY: number,
  splatForce: number,
): { dx: number; dy: number } {
  return {
    dx: deltaX * splatForce,
    dy: deltaY * splatForce,
  };
}
