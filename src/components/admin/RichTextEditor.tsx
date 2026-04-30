import { useRef, useEffect } from "react";
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Heading2, Heading3, Quote, Undo, Redo } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
};

const cmd = (c: string, v?: string) => document.execCommand(c, false, v);

export function RichTextEditor({ value, onChange, placeholder, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Inicjalizacja tylko raz
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = (c: string, v?: string) => {
    ref.current?.focus();
    cmd(c, v);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const onInput = () => {
    if (ref.current) onChange(ref.current.innerHTML);
  };

  return (
    <div className={cn("rounded-xl border border-border bg-card", className)}>
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-border">
        <ToolBtn onClick={() => exec("bold")} title="Pogrubienie"><Bold className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("italic")} title="Kursywa"><Italic className="w-4 h-4" /></ToolBtn>
        <Sep />
        <ToolBtn onClick={() => exec("formatBlock", "h2")} title="Nagłówek 2"><Heading2 className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("formatBlock", "h3")} title="Nagłówek 3"><Heading3 className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("formatBlock", "blockquote")} title="Cytat"><Quote className="w-4 h-4" /></ToolBtn>
        <Sep />
        <ToolBtn onClick={() => exec("insertUnorderedList")} title="Lista"><List className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("insertOrderedList")} title="Lista numerowana"><ListOrdered className="w-4 h-4" /></ToolBtn>
        <Sep />
        <ToolBtn
          onClick={() => {
            const url = prompt("Wpisz URL:");
            if (url) exec("createLink", url);
          }}
          title="Link"
        >
          <LinkIcon className="w-4 h-4" />
        </ToolBtn>
        <Sep />
        <ToolBtn onClick={() => exec("undo")} title="Cofnij"><Undo className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("redo")} title="Ponów"><Redo className="w-4 h-4" /></ToolBtn>
      </div>
      <div
        ref={ref}
        contentEditable
        onInput={onInput}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        className="prose prose-sm max-w-none p-3 min-h-[140px] focus:outline-none [&_h2]:font-display [&_h2]:font-bold [&_h2]:text-xl [&_h2]:mt-3 [&_h3]:font-display [&_h3]:font-bold [&_h3]:text-lg [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-violet [&_blockquote]:pl-3 [&_blockquote]:italic [&_a]:text-violet [&_a]:underline empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground"
      />
    </div>
  );
}

function ToolBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className="h-8 w-8 grid place-items-center rounded-md hover:bg-muted text-foreground/80"
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-5 bg-border mx-0.5" />;
}
