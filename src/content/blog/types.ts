export interface Post {
  slug: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  updated?: string;
  keywords: string[];
  /** HTML body. Product links use /card/<slug>. */
  html: string;
  faq?: { q: string; a: string }[];
  /** The post's own thumbnail (public/blog/<slug>.jpg, 1200×630): its link preview and the picture on its card. Absent: the site's share image. */
  image?: { src: string; alt: string };
}
