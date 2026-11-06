// Dark by default (owner: "default dark theme"); a site can open light instead
// (SITE.theme.defaultMode). A visitor's own choice is remembered in
// localStorage and applied before first paint.
import { SITE } from "@/site.config";

export const THEME_KEY = "theme";
export const DEFAULT_MODE: "light" | "dark" = SITE.theme.defaultMode === "light" ? "light" : "dark";
const OTHER = DEFAULT_MODE === "light" ? "dark" : "light";
export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");document.documentElement.setAttribute("data-theme",t==="${OTHER}"?"${OTHER}":"${DEFAULT_MODE}")}catch(e){document.documentElement.setAttribute("data-theme","${DEFAULT_MODE}")}})();`;

export type Theme = "light" | "dark";
/** The theme an attribute value names (anything but "light" is dark, the default). */
export function themeFrom(value: string | null | undefined): Theme {
  return value === "light" ? "light" : "dark";
}
