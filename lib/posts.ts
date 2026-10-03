// Keep the original helper module compatible while reading published MDX everywhere.
export {
  getAllPosts,
  getFeaturedPosts,
  getPostBySlug,
  getPostsByCategory,
  getPostsByTag,
  getRelatedPosts,
  searchPosts,
} from "./mdx";

import { getAllTags as getTagCounts } from "./mdx";
export function getAllTags(): string[] {
  return getTagCounts().map((tag) => tag.name);
}
