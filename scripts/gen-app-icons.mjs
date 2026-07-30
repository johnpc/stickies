#!/usr/bin/env node
/**
 * Generate all app icons from the brand source art:
 *   assets/icon.png       — full-bleed light icon (spork on brand blue)
 *   assets/icon-dark.png  — full-bleed dark icon (glowing spork on charcoal)
 *
 * Produces, deterministically (no @capacitor/assets — it mangled paths/dark):
 *   • Favicons    → public/favicon{,-16,-32}.png + apple-touch-icon.png (browser tab)
 *   • PWA         → public/icons/icon-{48..512}.png + maskable-{192,512}.png
 *   • iOS         → AppIcon.appiconset light + dark + tinted (1024) + Contents.json
 *   • Android     → mipmap-<dpi> launcher + round + foreground (light & dark)
 *
 * Re-run after changing the source art:  node scripts/gen-app-icons.mjs
 * Not a shipped logic file (build script) — lives outside src/ + amplify/.
 */
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const LIGHT = join(ROOT, 'assets/icon.png');
const DARK = join(ROOT, 'assets/icon-dark.png');
const BRAND_BG = { r: 0x5b, g: 0x8d, b: 0xef };
const DARK_BG = { r: 0x10, g: 0x12, b: 0x18 };

const PWA_SIZES = [48, 72, 96, 128, 192, 256, 384, 512];
const ANDROID = [
  ['mdpi', 48],
  ['hdpi', 72],
  ['xhdpi', 96],
  ['xxhdpi', 144],
  ['xxxhdpi', 192],
];

const resizeTo = (src, size) => sharp(src).resize(size, size, { fit: 'cover' }).png();

/** Maskable: shrink the art to ~78% on a solid brand field (safe-zone padding). */
async function maskable(src, size, bg) {
  const inner = Math.round(size * 0.78);
  const art = await sharp(src).resize(inner, inner, { fit: 'cover' }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: art, gravity: 'center' }])
    .png()
    .toBuffer();
}

/** Browser-tab favicons + apple-touch-icon, from the same brand art as the PWA
 * icons — so the tab icon matches the installed-app icon. */
async function favicons() {
  const dir = join(ROOT, 'public');
  await resizeTo(LIGHT, 16).toFile(join(dir, 'favicon-16.png'));
  await resizeTo(LIGHT, 32).toFile(join(dir, 'favicon-32.png'));
  await resizeTo(LIGHT, 48).toFile(join(dir, 'favicon.png'));
  await resizeTo(LIGHT, 180).toFile(join(dir, 'apple-touch-icon.png'));
  console.log('Favicons: 16 + 32 + 48 + apple-touch (180)');
}

async function pwa() {
  const dir = join(ROOT, 'public/icons');
  mkdirSync(dir, { recursive: true });
  for (const s of PWA_SIZES) await resizeTo(LIGHT, s).toFile(join(dir, `icon-${s}.png`));
  for (const s of [192, 512]) {
    writeFileSync(join(dir, `maskable-${s}.png`), await maskable(LIGHT, s, BRAND_BG));
  }
  console.log(`PWA: ${PWA_SIZES.length} icons + 2 maskable`);
}

async function ios() {
  const dir = join(ROOT, 'ios/App/App/Assets.xcassets/AppIcon.appiconset');
  mkdirSync(dir, { recursive: true });
  await resizeTo(LIGHT, 1024).toFile(join(dir, 'AppIcon-512@2x.png'));
  await resizeTo(DARK, 1024).toFile(join(dir, 'AppIcon-512@2x-dark.png'));
  // Tinted: iOS renders a monochrome mask; a grayscale of the light art reads best.
  await sharp(LIGHT)
    .resize(1024, 1024, { fit: 'cover' })
    .grayscale()
    .png()
    .toFile(join(dir, 'AppIcon-512@2x-tinted.png'));
  const img = (filename, appearance) => ({
    idiom: 'universal',
    platform: 'ios',
    size: '1024x1024',
    filename,
    ...(appearance ? { appearances: [{ appearance: 'luminosity', value: appearance }] } : {}),
  });
  writeFileSync(
    join(dir, 'Contents.json'),
    JSON.stringify(
      {
        images: [
          img('AppIcon-512@2x.png'),
          img('AppIcon-512@2x-dark.png', 'dark'),
          img('AppIcon-512@2x-tinted.png', 'tinted'),
        ],
        info: { author: 'xcode', version: 1 },
      },
      null,
      2,
    ),
  );
  console.log('iOS: light + dark + tinted AppIcon');
}

async function android() {
  const base = join(ROOT, 'android/app/src/main/res');
  for (const [dpi, size] of ANDROID) {
    const dir = join(base, `mipmap-${dpi}`);
    mkdirSync(dir, { recursive: true });
    await resizeTo(LIGHT, size).toFile(join(dir, 'ic_launcher.png'));
    await resizeTo(LIGHT, size).toFile(join(dir, 'ic_launcher_round.png'));
    // Adaptive foreground is drawn at ~1.5x inside a safe canvas; the OS masks it.
    writeFileSync(
      join(dir, 'ic_launcher_foreground.png'),
      await maskable(LIGHT, size * 2, BRAND_BG),
    );
  }
  console.log(`Android: ${ANDROID.length} densities (launcher + round + foreground)`);
}

await favicons();
await pwa();
await ios();
await android();
console.log('✓ app icons generated');
