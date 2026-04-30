import { useRef } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Video, FileText, Paperclip, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "./RichTextEditor";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ContentBlock =
  | { id: string; type: "video"; title?: string; url: string }
  | { id: string; type: "richtext"; html: string }
  | { id: string; type: "text"; text: string }
  | { id: string; type: "file"; title: string; url: string; file_type?: string };

const newBlock = (type: ContentBlock["type"]): ContentBlock => {
  const id = crypto.randomUUID();
  switch (type) {
    case "video":
      return { id, type, url: "" };
    case "richtext":
      return { id, type, html: "" };
    case "text":
      return { id, type, text: "" };
    case "file":
      return { id, type, title: "", url: "" };
  }
};

type Props = {
  value: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
};

export function ContentBlocksEditor({ value, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadingFor = useRef<string | null>(null);

  const update = (id: string, patch: Partial<ContentBlock>) => {
    onChange(value.map((b) => (b.id === id ? ({ ...b, ...patch } as ContentBlock) : b)));
  };
  const remove = (id: string) => onChange(value.filter((b) => b.id !== id));
  const move = (id: string, dir: -1 | 1) => {
    const i = value.findIndex((b) => b.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = (type: ContentBlock["type"]) => onChange([...value, newBlock(type)]);

  const triggerUpload = (blockId: string) => {
    uploadingFor.current = blockId;
    fileInputRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const blockId = uploadingFor.current;
    e.target.value = "";
    if (!file || !blockId) return;
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage
      .from("course-files")
      .upload(path, file, { upsert: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    const { data } = supabase.storage.from("course-files").getPublicUrl(path);
    update(blockId, {
      url: data.publicUrl,
      file_type: file.type,
      title: file.name,
    } as Partial<ContentBlock>);
    toast.success("Plik wgrany");
  };

  return (
    <div className="space-y-3">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFile} />

      {value.length === 0 && (
        <div className="text-sm text-muted-foreground text-center py-6 border border-dashed border-border rounded-xl">
          Brak bloków. Dodaj pierwszy poniżej.
        </div>
      )}

      {value.map((b, idx) => (
        <div key={b.id} className="rounded-xl border border-border bg-muted/20 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              {b.type === "video" && (
                <>
                  <Video className="w-3.5 h-3.5" /> Wideo
                </>
              )}
              {b.type === "richtext" && (
                <>
                  <FileText className="w-3.5 h-3.5" /> Tekst bogaty
                </>
              )}
              {b.type === "text" && (
                <>
                  <Type className="w-3.5 h-3.5" /> Tekst
                </>
              )}
              {b.type === "file" && (
                <>
                  <Paperclip className="w-3.5 h-3.5" /> Plik
                </>
              )}
              <span className="text-foreground/60">#{idx + 1}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => move(b.id, -1)}
                disabled={idx === 0}
                className="h-7 w-7 grid place-items-center rounded hover:bg-muted disabled:opacity-30"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(b.id, 1)}
                disabled={idx === value.length - 1}
                className="h-7 w-7 grid place-items-center rounded hover:bg-muted disabled:opacity-30"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => remove(b.id)}
                className="h-7 w-7 grid place-items-center rounded hover:bg-destructive/10 text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {b.type === "video" && (
            <div className="space-y-2">
              <Input
                placeholder="Tytuł (opcjonalnie)"
                value={b.title ?? ""}
                onChange={(e) => update(b.id, { title: e.target.value })}
              />
              <Input
                placeholder="URL YouTube/Vimeo lub link do wideo"
                value={b.url}
                onChange={(e) => update(b.id, { url: e.target.value })}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => triggerUpload(b.id)}
                >
                  Wgraj plik wideo
                </Button>
              </div>
            </div>
          )}
          {b.type === "richtext" && (
            <RichTextEditor
              value={b.html}
              onChange={(html) => update(b.id, { html })}
              placeholder="Napisz treść lekcji..."
            />
          )}
          {b.type === "text" && (
            <Textarea
              value={b.text}
              onChange={(e) => update(b.id, { text: e.target.value })}
              placeholder="Zwykły tekst..."
              rows={4}
            />
          )}
          {b.type === "file" && (
            <div className="space-y-2">
              <Input
                placeholder="Nazwa pliku"
                value={b.title}
                onChange={(e) => update(b.id, { title: e.target.value })}
              />
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="URL pliku (lub wgraj)"
                  value={b.url}
                  onChange={(e) => update(b.id, { url: e.target.value })}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => triggerUpload(b.id)}
                >
                  Wgraj
                </Button>
              </div>
              {b.url && (
                <a
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-violet underline"
                >
                  Podgląd
                </a>
              )}
            </div>
          )}
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => add("video")}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Wideo
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => add("richtext")}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Tekst bogaty
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => add("text")}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Tekst
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => add("file")}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Plik / PDF
        </Button>
      </div>
    </div>
  );
}
