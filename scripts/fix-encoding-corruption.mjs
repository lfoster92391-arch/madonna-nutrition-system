import fs from "node:fs"
import path from "node:path"

const roots = [path.join(process.cwd(), "src")]

function decodeMojibake(text) {
  const buf = Buffer.alloc(text.length * 2)
  for (let i = 0; i < text.length; i++) {
    buf.writeUInt16LE(text.charCodeAt(i), i * 2)
  }
  return buf.toString("utf8")
}

function readText(filePath) {
  const buffer = fs.readFileSync(filePath)
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return { text: buffer.toString("utf16le").replace(/^\uFEFF/, ""), kind: "utf16-bom" }
  }
  if (buffer.includes(0)) {
    return { text: buffer.toString("utf16le").replace(/^\uFEFF/, ""), kind: "utf16-null" }
  }
  const utf8 = buffer.toString("utf8").replace(/^\uFEFF/, "")
  if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(utf8) && /\bimport\b/.test(utf8) && /\bfrom\b/.test(utf8)) {
    const decoded = decodeMojibake(utf8)
    if (/^["']use client["']|^import |^export /.test(decoded.trim())) {
      return { text: decoded, kind: "mojibake" }
    }
  }
  return null
}

function walk(dir, fixed) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue
      walk(fullPath, fixed)
    } else if (/\.(tsx?|jsx?|mjs|css)$/.test(entry.name)) {
      const result = readText(fullPath)
      if (result) {
        fs.writeFileSync(fullPath, result.text, "utf8")
        fixed.push({ file: path.relative(process.cwd(), fullPath), kind: result.kind })
      }
    }
  }
}

const fixed = []
for (const root of roots) walk(root, fixed)
console.log(JSON.stringify(fixed, null, 2))
