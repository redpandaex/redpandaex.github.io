export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  updatedAt?: string;
  tags: string[];
  category: string;
  readingTime: number;
  coverImage?: string;
  featured: boolean;
  slug: string;
}

export type PostSummary = Omit<BlogPost, "content" | "coverImage">;

export interface Author {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  email: string;
  social: {
    github?: string;
    twitter?: string;
    website?: string;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon?: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface NavigationItem {
  label: string;
  href: string;
  external?: boolean;
  children?: NavigationItem[];
}

export interface SiteConfig {
  name: string;
  description: string;
  url: string;
  author: Author;
  navigation: NavigationItem[];
  social: {
    github: string;
    twitter?: string;
  };
}

export interface AnimationConfig {
  duration: number;
  ease: string;
  delay?: number;
  stagger?: number;
}

export interface ScrollTriggerConfig {
  trigger: string;
  start: string;
  end?: string;
  scrub?: boolean | number;
  pin?: boolean;
  markers?: boolean;
}
