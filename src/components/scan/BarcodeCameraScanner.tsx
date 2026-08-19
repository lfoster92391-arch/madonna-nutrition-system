"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Camera, CameraOff, Flashlight, FlashlightOff, ScanBarcode } from "lucide-react"
import { cn } from "@/lib/utils"
import { playScanSuccessBeep } from "@/lib/scan/scan-feedback"

const DETECT_DEBOUNCE_MS = 1800
const NATIVE_POLL_MS = 120

const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: {
    facingMode: { ideal: "environment" },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  },
}

const NATIVE_FORMATS = [
  "code_128",
  "code_39",
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
] as const

type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>
}

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike

type BarcodeCameraScannerProps = {
  /** Called with the raw barcode text; parent runs the same lookup as the keypad. */
  onDetect: (raw: string) => void
  /** Pause decoding (e.g. while a student is already loaded). Stream may keep running. */
  paused?: boolean
  className?: string
  /** Start with the camera panel open. */
  defaultOpen?: boolean
}

function getBarcodeDetectorCtor(): BarcodeDetectorCtor | null {
  if (typeof window === "undefined") return null
  return (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector ?? null
}

async function pickSupportedNativeFormats(Detector: BarcodeDetectorCtor): Promise<string[]> {
  const getSupported = (
    Detector as unknown as { getSupportedFormats?: () => Promise<string[]> }
  ).getSupportedFormats
  if (!getSupported) return [...NATIVE_FORMATS]
  try {
    const supported = await getSupported.call(Detector)
    const picked = NATIVE_FORMATS.filter((f) => supported.includes(f))
    return picked.length > 0 ? picked : [...NATIVE_FORMATS]
  } catch {
    return [...NATIVE_FORMATS]
  }
}

function trackSupportsTorch(track: MediaStreamTrack | null | undefined): boolean {
  if (!track?.getCapabilities) return false
  const caps = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean }
  return Boolean(caps.torch)
}

export function BarcodeCameraScanner({
  onDetect,
  paused = false,
  className,
  defaultOpen = true,
}: BarcodeCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<BarcodeDetectorLike | null>(null)
  const zxingControlsRef = useRef<{ stop: () => void; switchTorch?: (on: boolean) => Promise<void> } | null>(
    null
  )
  const lastRawRef = useRef("")
  const lastAtRef = useRef(0)
  const pausedRef = useRef(paused)
  const onDetectRef = useRef(onDetect)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [open, setOpen] = useState(defaultOpen)
  const [starting, setStarting] = useState(false)
  const [active, setActive] = useState(false)
  const [error, setError] = useState("")
  const [torchOn, setTorchOn] = useState(false)
  const [torchAvailable, setTorchAvailable] = useState(false)
  const [engine, setEngine] = useState<"native" | "zxing" | "">("")
  const [flash, setFlash] = useState(false)
  const [hint, setHint] = useState("Point camera at badge barcode")

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    onDetectRef.current = onDetect
  }, [onDetect])

  const emitDetect = useCallback((raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed || pausedRef.current) return
    const now = Date.now()
    if (trimmed === lastRawRef.current && now - lastAtRef.current < DETECT_DEBOUNCE_MS) return
    lastRawRef.current = trimmed
    lastAtRef.current = now

    playScanSuccessBeep()
    setFlash(true)
    setHint(`Read: ${trimmed}`)
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    flashTimerRef.current = setTimeout(() => {
      setFlash(false)
      setHint("Point camera at badge barcode")
    }, 900)

    onDetectRef.current(trimmed)
  }, [])

  const stopCamera = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
    zxingControlsRef.current?.stop()
    zxingControlsRef.current = null
    detectorRef.current = null
    const stream = streamRef.current
    streamRef.current = null
    stream?.getTracks().forEach((t) => t.stop())
    const video = videoRef.current
    if (video) {
      video.srcObject = null
    }
    setActive(false)
    setTorchOn(false)
    setTorchAvailable(false)
    setEngine("")
    setStarting(false)
  }, [])

  const startNativeLoop = useCallback(
    (video: HTMLVideoElement, detector: BarcodeDetectorLike) => {
      detectorRef.current = detector
      setEngine("native")
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
      pollTimerRef.current = setInterval(() => {
        if (pausedRef.current || video.readyState < 2) return
        void detector
          .detect(video)
          .then((codes) => {
            const raw = codes.find((c) => c.rawValue?.trim())?.rawValue
            if (raw) emitDetect(raw)
          })
          .catch(() => undefined)
      }, NATIVE_POLL_MS)
    },
    [emitDetect]
  )

  const startZxing = useCallback(
    async (video: HTMLVideoElement, stream: MediaStream) => {
      const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
        import("@zxing/browser"),
        import("@zxing/library"),
      ])

      const hints = new Map()
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
      ])
      hints.set(DecodeHintType.TRY_HARDER, true)

      const reader = new BrowserMultiFormatReader(hints, {
        delayBetweenScanAttempts: 80,
        delayBetweenScanSuccess: DETECT_DEBOUNCE_MS,
      })

      const controls = await reader.decodeFromStream(stream, video, (result) => {
        if (result) emitDetect(result.getText())
      })
      zxingControlsRef.current = controls
      setEngine("zxing")
    },
    [emitDetect]
  )

  const startCamera = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Camera is not available in this browser. Use the keypad or a USB scanner.")
      return
    }

    setStarting(true)
    setError("")
    setHint("Point camera at badge barcode")
    stopCamera()

    try {
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS)
      } catch {
        // Fall back without min resolution / advanced focus (older devices).
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
      }

      streamRef.current = stream
      const video = videoRef.current
      if (!video) {
        stream.getTracks().forEach((t) => t.stop())
        setError("Camera preview failed to start.")
        setStarting(false)
        return
      }

      video.srcObject = stream
      video.setAttribute("playsinline", "true")
      video.muted = true
      await video.play().catch(() => undefined)

      const track = stream.getVideoTracks()[0]
      setTorchAvailable(trackSupportsTorch(track) || Boolean(zxingControlsRef.current?.switchTorch))

      const Detector = getBarcodeDetectorCtor()
      if (Detector) {
        try {
          const formats = await pickSupportedNativeFormats(Detector)
          const detector = new Detector({ formats })
          startNativeLoop(video, detector)
          setActive(true)
          setStarting(false)
          return
        } catch {
          // Fall through to ZXing.
        }
      }

      await startZxing(video, stream)
      setTorchAvailable(trackSupportsTorch(track) || Boolean(zxingControlsRef.current?.switchTorch))
      setActive(true)
      setStarting(false)
    } catch (err) {
      stopCamera()
      const name = err instanceof DOMException ? err.name : ""
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setError("Camera permission denied. Allow camera access, then try again.")
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setError("No camera found. Use the keypad or a USB scanner.")
      } else {
        setError("Could not start camera. Use the keypad or a USB scanner.")
      }
    }
  }, [startNativeLoop, startZxing, stopCamera])

  useEffect(() => {
    if (!open) {
      stopCamera()
      return
    }
    void startCamera()
    return () => stopCamera()
  }, [open, startCamera, stopCamera])

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
      stopCamera()
    }
  }, [stopCamera])

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0]
    const next = !torchOn
    try {
      if (zxingControlsRef.current?.switchTorch) {
        await zxingControlsRef.current.switchTorch(next)
        setTorchOn(next)
        return
      }
      if (trackSupportsTorch(track)) {
        await track!.applyConstraints({
          advanced: [{ torch: next } as MediaTrackConstraintSet],
        })
        setTorchOn(next)
      }
    } catch {
      setTorchAvailable(false)
    }
  }

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition sm:text-sm",
            open
              ? "border-[#041B52] bg-[#041B52] text-white"
              : "border-[#AEB6C2] bg-white text-[#041B52] hover:bg-[#F5F6F8]"
          )}
        >
          {open ? <CameraOff className="h-4 w-4" aria-hidden /> : <Camera className="h-4 w-4" aria-hidden />}
          {open ? "Close camera" : "Scan with camera"}
        </button>
        {open && torchAvailable && (
          <button
            type="button"
            onClick={() => void toggleTorch()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#AEB6C2] bg-white px-3 py-2 text-xs font-semibold text-[#041B52] transition hover:bg-[#F5F6F8] sm:text-sm"
            aria-pressed={torchOn}
          >
            {torchOn ? (
              <FlashlightOff className="h-4 w-4" aria-hidden />
            ) : (
              <Flashlight className="h-4 w-4" aria-hidden />
            )}
            {torchOn ? "Torch off" : "Torch"}
          </button>
        )}
        {open && engine ? (
          <span className="text-[10px] uppercase tracking-wide text-[#64748B] sm:text-xs">
            {engine === "native" ? "Native detector" : "ZXing"}
            {paused ? " · paused" : ""}
          </span>
        ) : null}
      </div>

      {open && (
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border-2 bg-black transition",
            flash ? "border-[#00A83E] ring-4 ring-[#00A83E]/40" : "border-[#041B52]/30"
          )}
        >
          <div className="relative h-[min(36svh,220px)] w-full sm:h-[min(38svh,260px)] md:h-[min(40svh,300px)] lg:h-auto lg:min-h-[280px] lg:aspect-[4/3]">
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              playsInline
              muted
              autoPlay
            />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div
                className={cn(
                  "h-[42%] w-[78%] max-w-[520px] rounded-xl border-2 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]",
                  flash ? "border-[#00A83E]" : "border-white/90"
                )}
                aria-hidden
              />
              <p className="mt-3 rounded-full bg-black/55 px-3 py-1 text-center text-xs font-semibold text-white sm:text-sm">
                <ScanBarcode className="mr-1.5 inline h-3.5 w-3.5 align-text-bottom" aria-hidden />
                {hint}
              </p>
            </div>
            {(starting || !active) && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-semibold text-white">
                Starting camera…
              </div>
            )}
          </div>
        </div>
      )}

      {error ? (
        <p role="status" className="rounded-xl border border-[#D62828] bg-[#FEF2F2] px-3 py-2 text-xs font-semibold text-[#D62828] sm:text-sm">
          {error}
        </p>
      ) : null}
    </div>
  )
}
