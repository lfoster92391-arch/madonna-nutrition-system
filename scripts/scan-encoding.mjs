import fs from "node:fs"
import path from "node:path"

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue
      walk(full, out)
    } else if (/\.(tsx?|jsx?|css|mjs)$/.test(entry.name)) {
      const buf = fs.readFileSync(full)
      const utf16Bom = buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe
      const hasNull = buf.includes(0)
      if (utf16Bom || hasNull) {
        out.push({ file: full, utf16Bom, hasNull, size: buf.length })
      }
    }
  }
  return out
}

const bad = walk(path.join(process.cwd(), "src"))
console.log(JSON.stringify(bad, null, 2))
