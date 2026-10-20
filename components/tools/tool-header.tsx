import { ArrowLeft, LockKeyhole } from "lucide-react";
import { PageLink } from "@/components/page-motion";

export function ToolHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="tool-page-heading">
      <PageLink href="/tools" direction="back" className="tool-back">
        <ArrowLeft size={16} />
        全部工具
      </PageLink>
      <h1>{title}</h1>
      <p>{description}</p>
      <span className="tool-privacy">
        <LockKeyhole size={14} />
        本地处理，无需上传
      </span>
    </header>
  );
}
