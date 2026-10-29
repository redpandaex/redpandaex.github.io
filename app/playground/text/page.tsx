import type { Metadata } from "next";
import { TextPlayground } from "./playground";

export const metadata: Metadata = {
  title: "文字游乐场",
  description: "移动鼠标扭曲文字，点一下让字母掉落，再把它们重新排好。",
  robots: { index: false, follow: false },
};

export default function TextPlaygroundPage() {
  return <TextPlayground />;
}
