import type { Metadata } from "next";
import { StudioRedirect } from "@/components/studio-redirect";
export const metadata: Metadata = {
  title: "创意主页",
  description: "流体色彩已经融入首页的指针轨迹，旧链接会带你回到主页。",
  alternates: { canonical: "/" },
};
export default function FluidPage() {
  return <StudioRedirect />;
}
