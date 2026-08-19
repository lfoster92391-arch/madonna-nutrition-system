/**
 * Minimal Code 128B barcode to SVG.
 * Encodes printable ASCII (32-126).
 */

const CODE128B_START = 104
const CODE128_STOP = 106

const PATTERNS: string[] = [
  "212222","222122","222221","121223","121322","131222","122213","122312","132212","221213",
  "221312","231212","112232","122132","122231","113222","123122","123221","223211","221132",
  "221231","213212","223112","312131","311222","321122","321221","312212","322112","322211",
  "212123","212321","232121","111323","131123","131321","112313","132113","132311","211313",
  "231113","231311","112133","112331","132131","113123","113321","133121","313121","211331",
  "231131","213113","213311","213131","311123","311321","331121","312113","312311","332111",
  "314111","221411","431111","111224","111422","121124","121421","141122","141221","112214",
  "112412","122114","122411","142112","142211","241211","221114","413111","241112","134111",
  "111242","121142","121241","114212","124112","124211","411212","421112","421211","212141",
  "214121","412121","111143","111341","131141","114113","114311","411113","411311","113141",
  "114131","311141","411131","211412","211214","211232","2331112",
]

function charToCode(ch: string): number {
  const code = ch.charCodeAt(0)
  if (code < 32 || code > 126) {
    throw new Error("Code128B cannot encode character")
  }
  return code - 32
}

function encodeValue(value: string): number[] {
  const codes: number[] = [CODE128B_START]
  let checksum = CODE128B_START
  for (let i = 0; i < value.length; i++) {
    const code = charToCode(value[i]!)
    codes.push(code)
    checksum += code * (i + 1)
  }
  codes.push(checksum % 103)
  codes.push(CODE128_STOP)
  return codes
}

function widthsForCodes(codes: number[]): number[] {
  const widths: number[] = []
  for (const code of codes) {
    const pattern = PATTERNS[code]
    if (!pattern) throw new Error("Missing Code128 pattern")
    for (const digit of pattern) {
      widths.push(Number(digit))
    }
  }
  return widths
}

function sanitizeForCode128(value: string): string {
  let out = ""
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i)
    if (c >= 32 && c <= 126) out += value[i]
  }
  return out
}

export function buildCode128Svg(
  rawValue: string,
  options?: { height?: number; moduleWidth?: number; quietModules?: number }
): { svg: string; encoded: string } | null {
  const value = rawValue.trim()
  if (!value) return null

  const height = options?.height ?? 48
  const moduleWidth = options?.moduleWidth ?? 1.6
  const quiet = options?.quietModules ?? 10

  let codes: number[]
  try {
    codes = encodeValue(value)
  } catch {
    const sanitized = sanitizeForCode128(value)
    if (!sanitized) return null
    try {
      codes = encodeValue(sanitized)
    } catch {
      return null
    }
  }

  const widths = widthsForCodes(codes)
  const totalModules = widths.reduce((sum, w) => sum + w, 0) + quiet * 2
  const width = totalModules * moduleWidth

  let x = quiet * moduleWidth
  const rects: string[] = []
  let bar = true
  for (const w of widths) {
    const bw = w * moduleWidth
    if (bar) {
      rects.push(
        `<rect x="${x.toFixed(2)}" y="0" width="${bw.toFixed(2)}" height="${height}" fill="#000"/>`
      )
    }
    x += bw
    bar = !bar
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width.toFixed(2)}" height="${height}" viewBox="0 0 ${width.toFixed(2)} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Barcode ${value}">${rects.join("")}</svg>`
  return { svg, encoded: value }
}
