"use client";
// Reliable images (owner's UX review, 2026-11-23, P1 15: "two guide thumbnails were blank on first load ... reserve image
// dimensions, show a skeleton and fall back to a placeholder"). Tiles and plates reserve their box in CSS already (.plate, .pc-plate)
// and their grey plate is the skeleton. An image that fails is tried once more after 1.5 s (a share card drawn on first request
// can time out), then shows the site's mark on its plate instead of a broken picture. Mounted once in the root layout.
import { useEffect } from "react";

export function ImageFallback() {
  useEffect(() => {
    const onError = (e: Event) => {
      const img = e.target;
      if (!(img instanceof HTMLImageElement) || img.dataset.fallback === "1") return;
      if (img.dataset.retried !== "1") {
        img.dataset.retried = "1";
        const src = img.currentSrc || img.src;
        if (!src) return;
        window.setTimeout(() => {
          img.removeAttribute("srcset");
          img.src = src + (src.includes("?") ? "&" : "?") + "r=1";
        }, 1500);
        return;
      }
      img.dataset.fallback = "1";
      // Padding in pixels of the image's own box: a percentage would be of the containing block's width and blow up a small thumb.
      const pad = Math.round(Math.min(img.clientWidth, img.clientHeight || img.clientWidth) * 0.18);
      img.removeAttribute("srcset");
      img.src = "/icon.svg";
      img.style.objectFit = "contain";
      img.style.padding = `${pad}px`;
      img.style.boxSizing = "border-box";
      img.style.opacity = "0.35";
    };
    window.addEventListener("error", onError, true);
    return () => window.removeEventListener("error", onError, true);
  }, []);
  return null;
}
