import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mic, Square, Play, Pause, RotateCcw, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createItem, keys, uploadMedia } from "@/lib/vision/api";
import { MOODS } from "@/lib/vision/types";
import { cn } from "@/lib/utils";

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VoiceRecorder({
  sectionId,
  open,
  onOpenChange,
  zIndex,
}: {
  sectionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zIndex: number;
}) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"idle" | "recording" | "recorded">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [title, setTitle] = useState("");
  const [moods, setMoods] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const startedAtRef = useRef(0);

  const cleanupStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    void audioCtxRef.current?.close();
    audioCtxRef.current = null;
  };

  const reset = () => {
    cleanupStream();
    recorderRef.current = null;
    chunksRef.current = [];
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setBlob(null);
    setStatus("idle");
    setElapsed(0);
    setLevel(0);
    setPlaying(false);
  };

  useEffect(() => {
    if (!open) {
      reset();
      setTitle("");
      setMoods([]);
    }
    return () => cleanupStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const b = new Blob(chunksRef.current, { type: "audio/webm" });
        setBlob(b);
        setPreviewUrl(URL.createObjectURL(b));
        setStatus("recorded");
        cleanupStream();
      };
      recorderRef.current = rec;
      rec.start(250);
      startedAtRef.current = Date.now();
      setStatus("recording");
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((Date.now() - startedAtRef.current) / 1000), 200);

      // Live level meter
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = ((data[i] ?? 128) - 128) / 128;
          sum += v * v;
        }
        setLevel(Math.min(1, Math.sqrt(sum / data.length) * 3));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      toast.error("Microphone access was blocked. Allow it to record a voice note.");
    }
  };

  const stop = () => {
    recorderRef.current?.stop();
  };

  const togglePreview = () => {
    const el = audioElRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  const save = async () => {
    if (!blob) return;
    setSaving(true);
    try {
      const path = await uploadMedia(blob, { ext: "webm", folder: "audio" });
      await createItem({
        section_id: sectionId,
        type: "audio",
        title: title || `Voice note · ${new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
        media_path: path,
        mime_type: "audio/webm",
        file_size: blob.size,
        duration_seconds: Math.round(elapsed),
        moods,
        x: 220 + Math.random() * 200,
        y: 200 + Math.random() * 200,
        w: 320,
        h: 150,
        rotation: 0,
        z_index: zIndex,
      });
      toast.success("Voice note added");
      void queryClient.invalidateQueries({ queryKey: keys.items(sectionId) });
      void queryClient.invalidateQueries({ queryKey: keys.allItems });
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save voice note");
    } finally {
      setSaving(false);
    }
  };

  const rings = [0, 1, 2];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-w-md border-glass-border">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Voice note <span className="italic-accent">— speak your dream</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5 py-2">
          <div className="relative grid h-40 w-40 place-items-center">
            {rings.map((r) => (
              <span
                key={r}
                className={cn(
                  "absolute rounded-full border border-rose/30 transition-transform duration-150",
                  status !== "recording" && "opacity-0",
                )}
                style={{
                  inset: 8 + r * 10,
                  transform: `scale(${1 + level * (0.35 + r * 0.25)})`,
                  opacity: status === "recording" ? 0.6 - r * 0.15 : 0,
                }}
              />
            ))}
            <button
              type="button"
              onClick={status === "recording" ? stop : status === "idle" ? start : togglePreview}
              className={cn(
                "relative z-10 grid h-20 w-20 place-items-center rounded-full transition-transform hover:scale-105",
                status === "recording" ? "bg-rose text-midnight shadow-glow-rose" : "chrome-surface",
              )}
              aria-label={status === "recording" ? "Stop recording" : status === "idle" ? "Start recording" : "Preview"}
            >
              {status === "recording" ? (
                <Square className="h-6 w-6" strokeWidth={1.5} fill="currentColor" />
              ) : status === "idle" ? (
                <Mic className="h-7 w-7" strokeWidth={1.5} />
              ) : playing ? (
                <Pause className="h-6 w-6" strokeWidth={1.5} />
              ) : (
                <Play className="ml-1 h-6 w-6" strokeWidth={1.5} />
              )}
            </button>
          </div>

          <p className="font-display text-3xl tabular-nums text-foreground">{fmt(elapsed)}</p>
          <p className="-mt-3 text-xs text-muted-foreground">
            {status === "idle" && "Tap to start recording"}
            {status === "recording" && "Listening… tap to stop"}
            {status === "recorded" && "Preview, then add it to your board"}
          </p>

          {previewUrl && (
            <audio
              ref={audioElRef}
              src={previewUrl}
              onEnded={() => setPlaying(false)}
              className="hidden"
            />
          )}

          {status === "recorded" && (
            <div className="flex w-full flex-col gap-3 animate-fade-up">
              <Input placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
              <div className="flex flex-wrap gap-1.5">
                {MOODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMoods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]))}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px]",
                      moods.includes(m) ? "bg-rose/25 text-accent" : "glass text-muted-foreground",
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-full" onClick={reset}>
                  <RotateCcw className="h-3.5 w-3.5" /> Re-record
                </Button>
                <Button variant="chrome" className="flex-1 rounded-full" onClick={save} disabled={saving}>
                  <Check className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Add to board"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
