"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function StudioRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/#studio");
  }, [router]);
  return (
    <div className="site-container inner-page">
      <p>这些小实验，已经搬进主页。</p>
      <Link href="/#studio" className="text-link">
        回到主页，随手探索 <ArrowUpRight size={18} />
      </Link>
    </div>
  );
}
