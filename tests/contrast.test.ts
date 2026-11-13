// Words on a filled control can be read in BOTH themes. Found 2026-11-13, checking the minimal look with Lighthouse: the buy
// button was white on --open, and the dark theme (the default) makes --open a bright green: 2.0:1. The light theme's dark
// green hid it (5.7:1). No class name is pinned here: every rule in globals.css that fills with a colour and writes on it is
// measured from the tokens themselves, in each theme, so a new token value or a new button cannot bring it back.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import config from "../tailwind.config";

type Rgb = [number, number, number];

const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

/** WCAG 2 contrast of two colours, 1 to 21. */
function contrast(a: Rgb, b: Rgb): number {
  const lum = (c: Rgb) => {
    const [r, g, bl] = c.map((v) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** The `--name: r g b` colours that every block of one selector declares. */
function tokens(block: RegExp): Map<string, Rgb> {
  const out = new Map<string, Rgb>();
  for (const [, body] of css.matchAll(block)) for (const [, name, r, g, b] of body.matchAll(/--([a-z-]+):\s*(\d+) (\d+) (\d+)\s*;/g)) out.set(name, [+r, +g, +b]);
  return out;
}
const light = tokens(/(?:^|\n):root \{([^}]*)\}/g);
const dark = new Map([...light, ...tokens(/:root:not\(\[data-theme="light"\]\) \{([^}]*)\}/g)]);

/** Tailwind's colour names (tailwind.config.ts) → the token each one is: "surface" → "surface", "brand-ink" → "brand-ink", "buy" → "open". */
const names = new Map<string, string>();
for (const [name, value] of Object.entries((config.theme?.extend?.colors ?? {}) as unknown as Record<string, string | Record<string, string>>)) {
  for (const [shade, v] of typeof value === "string" ? [["DEFAULT", value]] : Object.entries(value)) {
    const token = /var\(--([a-z-]+)\)/.exec(v)?.[1];
    if (token) names.set(shade === "DEFAULT" ? name : `${name}-${shade}`, token);
  }
}

/** A colour class's value in one theme: a token's name, white, black or a literal [#rrggbb]; null for anything else (text-sm, bg-current…). */
function colour(name: string, theme: Map<string, Rgb>): Rgb | null {
  if (name === "white") return [255, 255, 255];
  if (name === "black") return [0, 0, 0];
  const hex = /^\[#([0-9a-f]{6})\]$/i.exec(name)?.[1];
  if (hex) return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;
  return theme.get(names.get(name) ?? "") ?? null;
}

/** Every rule that @applies a fill and words on it, without a variant (hover:, group-hover:…) or an opacity: its selector and the two classes. */
function filled(): Array<{ rule: string; bg: string; text: string }> {
  const out: Array<{ rule: string; bg: string; text: string }> = [];
  for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const classes = [...body.matchAll(/@apply ([^;]*);/g)].flatMap(([, list]) => list.trim().split(/\s+/));
    const pick = (prefix: string) => classes.filter((c) => c.startsWith(prefix)).map((c) => c.slice(prefix.length)).find((c) => colour(c, light));
    const [bg, text] = [pick("bg-"), pick("text-")];
    if (bg && text) out.push({ rule: selector.replace(/\/\*[\s\S]*?\*\//g, "").trim().replace(/\s+/g, " "), bg, text });
  }
  return out;
}

test("the two themes are read from the stylesheet: the dark theme is the default and makes the money green a bright one", () => {
  assert.deepEqual(light.get("open"), [20, 118, 56]);
  assert.deepEqual(dark.get("open"), [74, 206, 120]);
  assert.deepEqual(light.get("surface"), [255, 255, 255]);
  assert.deepEqual(dark.get("surface"), [23, 24, 29]);
  assert.equal(names.get("buy"), "open", "the old colour name is the same token");
  // The arithmetic, against the published pairs: black on white is 21:1, and the bug this file is for was 2.0:1.
  assert.equal(Math.round(contrast([0, 0, 0], [255, 255, 255])), 21);
  assert.equal(contrast([255, 255, 255], dark.get("open")!).toFixed(2), "2.02");
});

test("every filled control in the stylesheet reads at 4.5:1 or better in the light theme and in the dark one", () => {
  const rules = filled();
  // Nothing measured is a failure, not a pass: the buttons, the chips and the card's badge are all in this list.
  for (const name of [".btn-primary", ".btn-buy", ".btn-tcg", ".btn-ad", ".btn-amazon", ".chip-on", ".pc-badge"]) {
    assert.ok(rules.some((r) => r.rule === name), `${name} is measured`);
  }
  assert.ok(rules.length >= 12, `${rules.length} filled rules measured`);
  const hard = rules.flatMap(({ rule, bg, text }) =>
    ([["light", light], ["dark", dark]] as const)
      .map(([theme, t]) => ({ theme, ratio: contrast(colour(bg, t)!, colour(text, t)!) }))
      .filter(({ ratio }) => ratio < 4.5)
      .map(({ theme, ratio }) => `${rule}: text-${text} on bg-${bg} is ${ratio.toFixed(2)}:1 in the ${theme} theme`),
  );
  assert.deepEqual(hard, []);
});

test("the buy button is written in the surface colour, so its words turn dark when the green turns bright", () => {
  const buy = filled().find((r) => r.rule === ".btn-buy");
  assert.deepEqual(buy && [buy.bg, buy.text], ["open", "surface"]);
  assert.ok(contrast(dark.get("open")!, dark.get("surface")!) > 8.7, "dark theme: 8.77:1");
  assert.ok(contrast(light.get("open")!, light.get("surface")!) > 5.7, "light theme: 5.71:1, as it always was");
});
