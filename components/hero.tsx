import { ArrowDown, ArrowUpRight } from "lucide-react";
import { AmbientSurface } from "@/components/ambient-surface";
import { HeroArt } from "@/components/hero-art";
import { MagneticLink } from "@/components/magnetic-link";
import { ParticleTitle } from "@/components/particle-title";
import { siteConfig } from "@/lib/config";
import type { PostSummary } from "@/lib/types";

export function Hero({
  latestPost,
}: {
  latestPost?: Pick<PostSummary, "slug" | "title">;
}) {
  return (
    <section aria-label="个人创意主页">
      <AmbientSurface
        kind="ink"
        id="studio"
        className="site-container studio-hero"
      >
        <div className="studio-topline">
          <span className="mono-label">REDPANDA / PERSONAL SPACE</span>
          <span className="studio-note">
            <span aria-hidden="true">*</span> 好奇心，持续生长中。
          </span>
        </div>
        <p className="studio-greeting">
          Hello, I'm <strong>{siteConfig.author.name}.</strong>
          <span>一个爱折腾的{siteConfig.author.role}。</span>
        </p>
        <div className="studio-title-stage">
          <ParticleTitle />
          <AmbientSurface kind="orbit" className="studio-sticker">
            <HeroArt />
            <span className="sticker-caption">my digital alter ego ↗</span>
          </AmbientSurface>
        </div>
        <div className="studio-bottomline">
          <p>
            {siteConfig.author.bio}
            <br />
            <span>把灵感变成可以触碰的东西。</span>
          </p>
          <div className="studio-links">
            <MagneticLink
              href={latestPost ? `/blog/${latestPost.slug}/` : "/blog"}
              articleTitle={latestPost?.title}
              className="primary-button"
            >
              翻开最新手稿 <ArrowUpRight size={19} />
            </MagneticLink>
            <MagneticLink href="/about" className="text-link">
              认识一下我 <ArrowUpRight size={18} />
            </MagneticLink>
          </div>
        </div>
        <div className="studio-footer">
          <span className="mono-label">
            01 / A LITTLE CORNER OF THE INTERNET
          </span>
          <a href="#content">
            还有一些思考在下面 <ArrowDown size={14} />
          </a>
        </div>
      </AmbientSurface>
    </section>
  );
}
