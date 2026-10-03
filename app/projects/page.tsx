import type { Metadata } from "next";
import { StudioRedirect } from "@/components/studio-redirect";
export const metadata: Metadata = {
  title: "创意主页",
  description: "引力、弹性网格与流体色彩已经融入主页的实际交互。",
  alternates: { canonical: "/" },
};
export default function ProjectsPage() {
  return <StudioRedirect />;
}
