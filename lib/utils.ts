import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { BlogPost, PostSummary } from "./types";

export function summarizePost(post: BlogPost): PostSummary {
  const { content: _content, coverImage: _coverImage, ...summary } = post;
  return summary;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
