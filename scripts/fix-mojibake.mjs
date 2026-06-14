import fs from "node:fs"
import path from "node:path"

function decodeMojibake(text) {
  const buf = Buffer.alloc(text.length * 2)
  for (let i = 0; i < text.length; i++) {
    buf.writeUInt16LE(text.charCodeAt(i), i * 2)
  }
  return buf.toString("utf8")
}

function looksLikeCode(text) {
  const t = text.trim()
  return (
    /^["']use client["']/.test(t) ||
    /^import /.test(t) ||
    /^export /.test(t) ||
    (t.includes("import ") && t.includes("from "))
  )
}

function walk(dir, fixed) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue
      walk(fullPath, fixed)
    } else if (/\.(tsx?|jsx?|css|mjs)$/.test(entry.name)) {
      const text = fs.readFileSync(fullPath, "utf8")
      if (looksLikeCode(text)) continue
      const decoded = decodeMojibake(text)
      if (looksLikeCode(decoded)) {
        fs.writeFileSync(fullPath, decoded.replace(/\r?\n/g, "\n"), "utf8")
        fixed.push(path.relative(process.cwd(), fullPath))
      }
    }
  }
}

const fixed = []
walk(path.join(process.cwd(), "src"), fixed)
console.log(JSON.stringify(fixed, null, 2))
