import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
// Copy the latest landing mockup to public/logo-mockup.png before running.
const src = path.join(root, "public", "logo-mockup.png")
const publicDir = path.join(root, "public")

if (!fs.existsSync(src)) {
  console.error("Missing source:", src)
  process.exit(1)
}

const meta = await sharp(src).metadata()
const { width, height } = meta
console.log("Source dimensions:", width, "x", height)

// Header branding: crest + FUEL THE DONS + tagline + divider + system name
const headerHeight = Math.round(height * 0.38)
await sharp(src)
  .extract({ left: 0, top: 0, width, height: headerHeight })
  .png()
  .toFile(path.join(publicDir, "logo.png"))

// Crest only (left emblem for header / sidebars / favicon)
const crestBox = {
  left: Math.round(width * 0.018),
  top: Math.round(height * 0.038),
  width: Math.round(width * 0.19),
  height: Math.round(height * 0.29),
}
await sharp(src)
  .extract(crestBox)
  .png()
  .toFile(path.join(publicDir, "crest.png"))

// Watermark crest from main content area (large faint emblem, right side)
const watermarkBox = {
  left: Math.round(width * 0.58),
  top: Math.round(height * 0.32),
  width: Math.round(width * 0.38),
  height: Math.round(height * 0.42),
}
await sharp(src)
  .extract(watermarkBox)
  .png()
  .toFile(path.join(publicDir, "watermark.png"))

// Square favicon from crest
const iconSize = Math.min(crestBox.width, crestBox.height)
const iconLeft = crestBox.left + Math.round((crestBox.width - iconSize) / 2)
const iconTop = crestBox.top + Math.round((crestBox.height - iconSize) * 0.15)
await sharp(src)
  .extract({ left: iconLeft, top: iconTop, width: iconSize, height: iconSize })
  .resize(512, 512)
  .png()
  .toFile(path.join(publicDir, "icon.png"))

console.log("Created public/logo.png, public/crest.png, public/watermark.png, public/icon.png")
