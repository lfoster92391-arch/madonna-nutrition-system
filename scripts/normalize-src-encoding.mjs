import fs from "node:fs"
import path from "node:path"

const root = path.join(process.cwd(), "src")

function readText(filePath) {
  const buffer = fs.readFileSync(filePath)
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.toString("utf16le").replace(/^\uFEFF/, "")
  }
  if (buffer.length >= 2 && buffer[1] === 0x00 && buffer[0] < 0x80) {
    return buffer.toString("utf16le").replace(/^\uFEFF/, "")
  }
  return buffer.toString("utf8").replace(/^\uFEFF/, "")
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue
      walk(full)
      continue
    }
    if (!/\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) continue
    const text = readText(full)
    fs.writeFileSync(full, text.replace(/\r?\n/g, "\n"), "utf8")
  }
}

walk(root)
console.log("src encoding normalized")
