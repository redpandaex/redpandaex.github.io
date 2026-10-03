import createMDX from "@next/mdx";
import type { NextConfig } from "next";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import rehypeMdxCodeProps from "rehype-mdx-code-props";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeMdxCodeProps,
      [rehypeHighlight, { detect: true, ignoreMissing: true }],
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        { behavior: "wrap", properties: { className: ["anchor"] } },
      ],
    ],
  },
});
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  outputFileTracingRoot: process.cwd(),
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  experimental: { optimizePackageImports: ["lucide-react", "gsap"] },
};
// MDX's JavaScript plugins require Webpack; scripts opt in explicitly on Next 16.
export default withMDX(nextConfig);
