import {
  ArticleExplorer,
  type LibraryView,
} from "@/components/article-explorer";
import { getAllPosts } from "@/lib/mdx";
import { summarizePost } from "@/lib/utils";

export function WritingLibrary({
  initialView = "articles",
}: {
  initialView?: LibraryView;
}) {
  const posts = getAllPosts().map(summarizePost);
  return (
    <div className="site-container inner-page writing-library-page">
      <header className="library-heading">
        <span className="mono-label">02 / THE WRITING ROOM</span>
        <h1>
          写下来，
          <br />
          <span>才算想明白。</span>
          <span className="library-star" aria-hidden="true">
            *
          </span>
        </h1>
        <p>
          技术、实践和那些值得折腾的想法。
          <br />
          按文章、分类或标签探索，都在这里。
        </p>
      </header>
      <ArticleExplorer posts={posts} initialView={initialView} />
    </div>
  );
}
