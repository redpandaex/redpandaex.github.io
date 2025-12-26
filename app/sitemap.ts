import type { MetadataRoute } from "next";
export const dynamic = "force-static";
const baseURL = "https://redpandaex.github.io/";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: baseURL,
      lastModified: "2025-12-26",
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${baseURL}blog/`,
      lastModified: "2025-12-26",
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseURL}categories/`,
      lastModified: "2025-12-26",
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseURL}tags/`,
      lastModified: "2025-12-26",
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseURL}about/`,
      lastModified: "2025-12-26",
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseURL}projects/`,
      lastModified: "2025-12-26",
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
