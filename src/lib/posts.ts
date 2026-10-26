import { POSTS } from "@/content/blog";
export const posts = () => POSTS.slice().sort((a, b) => b.date.localeCompare(a.date));
export const postBySlug = (s: string) => POSTS.find((p) => p.slug === s) ?? null;
