import { ArrowDown, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { HeroArt } from "@/components/hero-art";
import { ParticleTitle } from "@/components/particle-title";

export function Hero() {
  return (
    <section id="studio" className="site-container studio-hero">
      <div className="studio-topline">
        <span className="mono-label">REDPANDA / PERSONAL SPACE</span>
        <span className="studio-note">
          <span aria-hidden="true">*</span> 好奇心，持续生长中。
        </span>
      </div>
      <p className="studio-greeting">
        Hello, I'm <strong>LXW.</strong>
        <span>一个爱折腾的前端工程师。</span>
      </p>
      <div className="studio-title-stage">
        <ParticleTitle />
        <div className="studio-sticker">
          <HeroArt />
          <span className="sticker-caption">my digital alter ego ↗</span>
        </div>
      </div>
      <div className="studio-bottomline">
        <p>
          把灵感写成代码，
          <br />
          <span>把好奇心变成可以触碰的东西。</span>
        </p>
        <div className="studio-links">
          <Link href="/blog" className="primary-button">
            翻翻我的文章 <ArrowUpRight size={19} />
          </Link>
          <Link href="/projects" className="text-link">
            去实验室转转 <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>
      <div className="studio-footer">
        <span className="mono-label">01 / A LITTLE CORNER OF THE INTERNET</span>
        <a href="#content">
          还有一些思考在下面 <ArrowDown size={14} />
        </a>
      </div>
    </section>
  );
}
