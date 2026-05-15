import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

type Props = {
  taskId: string | null;
  taskTitle?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmitted?: () => void;
};

function playFanfare() {
  try {
    const Ctx =
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.45);
    });
  } catch {
    /* noop */
  }
}

export function SubmitTaskDialog({ taskId, taskTitle, open, onOpenChange, onSubmitted }: Props) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fanfare, setFanfare] = useState(false);

  const submit = async () => {
    if (!user || !taskId) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.from("task_submissions").insert({
      task_id: taskId,
      user_id: user.id,
      content,
      attachment_url: link || null,
      status: "pending",
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setContent("");
    setLink("");
    onSubmitted?.();
    onOpenChange(false);
    playFanfare();
    setFanfare(true);
    window.setTimeout(() => setFanfare(false), 3500);
  };

  const colors = ["#a855f7", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444"];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Prześlij wykonanie</DialogTitle>
            <DialogDescription>{taskTitle ?? "Opisz, co zrobiłaś/eś"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Twoja praca</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Wklej tekst, opis lub odpowiedź..."
                className="mt-1 min-h-[140px]"
              />
            </div>
            <div>
              <Label>Link (opcjonalnie)</Label>
              <Input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
                className="mt-1"
              />
            </div>
            {error && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <Button
              onClick={submit}
              disabled={busy || !content.trim()}
              className="w-full rounded-xl bg-gradient-violet text-primary-foreground"
            >
              {busy ? "Wysyłam..." : "Prześlij do oceny"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {fanfare && (
        <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
          <style>{`@keyframes taskConfetti { 0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; } 100% { transform: translateY(110vh) rotate(720deg); opacity: 0; } }`}</style>
          {Array.from({ length: 60 }).map((_, i) => {
            const left = Math.random() * 100;
            const delay = Math.random() * 0.6;
            const duration = 2.5 + Math.random() * 1.5;
            const size = 6 + Math.random() * 8;
            const color = colors[i % colors.length];
            return (
              <span
                key={i}
                style={{
                  position: "absolute",
                  left: `${left}%`,
                  top: 0,
                  width: size,
                  height: size,
                  background: color,
                  borderRadius: i % 2 ? "50%" : "2px",
                  animation: `taskConfetti ${duration}s ${delay}s ease-in forwards`,
                }}
              />
            );
          })}
          <div className="absolute inset-0 grid place-items-center">
            <div className="rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500 px-6 py-4 text-white font-display font-extrabold text-xl shadow-2xl animate-scale-in">
              🎉 Zadanie wysłane!
            </div>
          </div>
        </div>
      )}
    </>
  );
}
