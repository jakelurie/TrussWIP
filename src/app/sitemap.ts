import type { MetadataRoute } from "next";
import { SEO_ROLES, SEO_CITIES } from "@/lib/seo-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://trusswork.org";
  const now = new Date();

  const pages: MetadataRoute.Sitemap = [
    // Core pages
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/browse`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },

    // Content pages
    { url: `${base}/rates`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/learn`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/news`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/wiki`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/forum`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/venues`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/resources`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/tax-guide`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },

    // Tools
    { url: `${base}/tools/day-rate-calculator`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/tools/show-calculator`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/tools/power-calculator`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/tools/rf-coordination`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/tools/cable-bible`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/tools/signal-flow`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/tools/contract-templates`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },

    // SEO index pages
    { url: `${base}/hire`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/av-jobs`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },

    // Legal
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // SEO role index pages
  for (const role of SEO_ROLES) {
    pages.push({
      url: `${base}/hire/${role.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
    pages.push({
      url: `${base}/av-jobs/${role.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  // SEO landing pages (role x city)
  for (const role of SEO_ROLES) {
    for (const city of SEO_CITIES) {
      pages.push({
        url: `${base}/hire/${role.slug}/${city.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
      pages.push({
        url: `${base}/av-jobs/${role.slug}/${city.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  return pages;
}
