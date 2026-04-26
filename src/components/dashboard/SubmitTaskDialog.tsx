import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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

export function SubmitTaskDialog({ taskId, taskTitle, open, onOpenChange, onSubmitted }: Props) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  };

  return (
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
          {error && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
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
  );
}
