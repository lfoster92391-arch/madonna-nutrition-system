import fs from "node:fs"
import path from "node:path"

const targets = [
  path.join(process.cwd(), "src"),
  path.join(process.cwd(), "scripts"),
]

function readText(filePath) {
  const buffer = fs.readFileSync(filePath)
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.toString("utf16le").replace(/^\uFEFF/, "")
  }
  if (buffer.includes(0)) {
    return buffer.toString("utf16le").replace(/^\uFEFF/, "")
  }
  return buffer.toString("utf8").replace(/^\uFEFF/, "")
}

function walk(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue
      walk(fullPath)
    } else if (/\.(tsx?|mjs|js|css)$/.test(entry.name)) {
      const text = readText(fullPath)
      fs.writeFileSync(fullPath, text, "utf8")
    }
  }
}

for (const target of targets) walk(target)
console.log("encoding normalized")