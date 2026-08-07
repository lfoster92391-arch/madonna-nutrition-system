/** Short success chirp when a badge barcode is read. */
export function playScanSuccessBeep() {
  if (typeof window === "undefined") return
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sine"
    osc.frequency.value = 880
    gain.gain.value = 0.08
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12)
    osc.stop(ctx.currentTime + 0.13)
    window.setTimeout(() => void ctx.close(), 200)
  } catch {
    // Audio is optional feedback — ignore autoplay / unsupported errors.
  }
}
