import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import type { BlogPost, Category } from "./types";

const postsDirectory = path.join(process.cwd(), "content/posts");
const categoriesPath = path.join(process.cwd(), "content/data/categories.json");

// 读取分类数据
export function getCategories(): Category[] {
  if (fs.existsSync(categoriesPath)) {
    const categoriesData = fs.readFileSync(categoriesPath, "utf8");
    return JSON.parse(categoriesData);
  }
  return [];
}

// 根据分类 slug 获取分类信息
export function getCategoryBySlug(slug: string): Category | undefined {
  const categories = getCategories();
  return categories.find((category) => category.slug === slug);
}

// 获取所有文章的文件名
export function getPostSlugs(): string[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }
  return fs
    .readdirSync(postsDirectory)
    .filter((name) => name.endsWith(".md") || name.endsWith(".mdx"))
    .map((name) => name.replace(/\.(md|mdx)$/, ""));
}

// 根据 slug 获取文章数据
export function getPostBySlug(slug: string): BlogPost | null {
  try {
    const decodedSlug = decodeURIComponent(slug);
    const fullPath = path.join(postsDirectory, `${decodedSlug}.mdx`);
    const fallbackPath = path.join(postsDirectory, `${decodedSlug}.md`);

    let fileContents = "";
    let actualPath = "";

    if (fs.existsSync(fullPath)) {
      fileContents = fs.readFileSync(fullPath, "utf8");
      actualPath = fullPath;
    } else if (fs.existsSync(fallbackPath)) {
      fileContents = fs.readFileSync(fallbackPath, "utf8");
      actualPath = fallbackPath;
    } else {
      return null;
    }

    const { data, content } = matter(fileContents);
    const stats = readingTime(content);
    const stat = fs.statSync(actualPath);

    return {
      id: slug,
      slug,
      title: data.title || "Untitled",
      excerpt: data.excerpt || "",
      content,
      author: data.author || "Anonymous",
      publishedAt:
        data.publishedAt || stat.birthtime.toISOString().split("T")[0],
      updatedAt: data.updatedAt,
      tags: data.tags || [],
      category: data.category || "uncategorized",
      readingTime: Math.ceil(stats.minutes),
      coverImage: data.coverImage,
      featured: data.featured || false,
    };
  } catch (error) {
    console.error(`Error reading post ${slug}:`, error);
    return null;
  }
}

// 获取所有文章
export function getAllPosts(): BlogPost[] {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug))
    .filter((post): post is BlogPost => post !== null)
    .sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.publishedAt).getTime();
      const bTime = new Date(b.updatedAt || b.publishedAt).getTime();
      return bTime - aTime;
    });

  return posts;
}

// 获取特色文章
export function getFeaturedPosts(): BlogPost[] {
  return getAllPosts().filter((post) => post.featured);
}

// 根据分类获取文章
export function getPostsByCategory(categorySlug: string): BlogPost[] {
  return getAllPosts().filter((post) => post.category === categorySlug);
}

// 根据标签获取文章
export function getPostsByTag(tag: string): BlogPost[] {
  return getAllPosts().filter((post) =>
    post.tags.some((postTag) => postTag.toLowerCase() === tag.toLowerCase()),
  );
}

// 获取所有标签及其文章数量
export function getAllTags(): Array<{
  name: string;
  count: number;
  slug: string;
}> {
  const posts = getAllPosts();
  const tagCounts = new Map<string, number>();

  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  return Array.from(tagCounts.entries())
    .map(([name, count]) => ({
      name,
      count,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
    }))
    .sort((a, b) => b.count - a.count);
}

// 搜索文章
export function searchPosts(query: string): BlogPost[] {
  const posts = getAllPosts();
  const lowercaseQuery = query.toLowerCase();

  return posts.filter(
    (post) =>
      post.title.toLowerCase().includes(lowercaseQuery) ||
      post.excerpt.toLowerCase().includes(lowercaseQuery) ||
      post.content.toLowerCase().includes(lowercaseQuery) ||
      post.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery)) ||
      post.author.toLowerCase().includes(lowercaseQuery),
  );
}

// 获取相关文章
export function getRelatedPosts(currentPost: BlogPost, limit = 3): BlogPost[] {
  const allPosts = getAllPosts().filter((post) => post.id !== currentPost.id);

  const related = allPosts
    .map((post) => ({
      post,
      score: calculateRelevanceScore(currentPost, post),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.post);

  return related;
}

// 计算文章相关性得分
function calculateRelevanceScore(post1: BlogPost, post2: BlogPost): number {
  let score = 0;

  // 相同分类加分
  if (post1.category === post2.category) {
    score += 10;
  }

  // 相同标签加分
  const commonTags = post1.tags.filter((tag) => post2.tags.includes(tag));
  score += commonTags.length * 5;

  // 发布时间接近加分（30天内）
  const timeDiff = Math.abs(
    new Date(post1.publishedAt).getTime() -
      new Date(post2.publishedAt).getTime(),
  );
  const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
  if (daysDiff < 30) {
    score += 3;
  }

  return score;
}

// 获取分类统计信息
export function getCategoryStats(): Array<{
  category: Category;
  count: number;
}> {
  const posts = getAllPosts();
  const categories = getCategories();

  return categories
    .map((category) => ({
      category,
      count: posts.filter((post) => post.category === category.slug).length,
    }))
    .filter((stat) => stat.count > 0);
}

// 分页获取文章
export function getPostsWithPagination(page = 1, limit = 10) {
  const posts = getAllPosts();
  const totalPosts = posts.length;
  const totalPages = Math.ceil(totalPosts / limit);
  const offset = (page - 1) * limit;
  const paginatedPosts = posts.slice(offset, offset + limit);

  return {
    posts: paginatedPosts,
    pagination: {
      currentPage: page,
      totalPages,
      totalPosts,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// 获取最近更新的文章
export function getRecentlyUpdatedPosts(limit = 5): BlogPost[] {
  return getAllPosts()
    .filter((post) => post.updatedAt)
    .sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.publishedAt).getTime();
      const bTime = new Date(b.updatedAt || b.publishedAt).getTime();
      return bTime - aTime;
    })
    .slice(0, limit);
}

// 获取文章存档（按年月分组）
export function getPostsArchive(): Record<string, Record<string, BlogPost[]>> {
  const posts = getAllPosts();
  const archive: Record<string, Record<string, BlogPost[]>> = {};

  posts.forEach((post) => {
    const date = new Date(post.publishedAt);
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");

    if (!archive[year]) {
      archive[year] = {};
    }
    if (!archive[year][month]) {
      archive[year][month] = [];
    }

    archive[year][month].push(post);
  });

  return archive;
}
