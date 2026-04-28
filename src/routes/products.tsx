import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Mój produkt — 90 Dni" },
      { name: "description", content: "Zarządzaj swoimi produktami i ofertami w drodze do pierwszej sprzedaży." },
    ],
  }),
  component: ProductsPage,
});

type Status = "idea" | "building" | "active" | "paused";
type Product = {
  id: string;
  name: string;
  description: string | null;
  price_pln: number | null;
  status: Status;
  link: string | null;
};

const statusLabel: Record<Status, string> = {
  idea: "Pomysł",
  building: "W budowie",
  active: "Aktywny",
  paused: "Wstrzymany",
};

const statusClass: Record<Status, string> = {
  idea: "border-blue/40 text-blue",
  building: "border-orange/40 text-orange",
  active: "border-green/40 text-green",
  paused: "border-muted-foreground/40 text-muted-foreground",
};

function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("user_products")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setProducts((data ?? []) as Product[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const remove = async (id: string) => {
    if (!confirm("Usunąć produkt?")) return;
    const { error } = await supabase.from("user_products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Usunięto");
      load();
    }
  };

  return (
    <PageShell title="Mój produkt" subtitle="Buduj swoją ofertę — od pomysłu do aktywnego produktu.">
      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div>
            <h2 className="font-display font-bold text-lg">Twoje produkty</h2>
            <p className="text-xs text-muted-foreground">{products.length} produktów</p>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="bg-gradient-violet text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-1" />
            Dodaj produkt
          </Button>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Ładowanie...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Nie masz jeszcze żadnego produktu. Dodaj swój pierwszy pomysł!
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {products.map((p) => (
              <div key={p.id} className="rounded-2xl border border-border p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm">{p.name}</h3>
                  <Badge variant="outline" className={cn("text-[10px]", statusClass[p.status])}>
                    {statusLabel[p.status]}
                  </Badge>
                </div>
                {p.description && <p className="text-xs text-muted-foreground line-clamp-3">{p.description}</p>}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold">{p.price_pln != null ? `${p.price_pln} zł` : "—"}</span>
                  {p.link && (
                    <a href={p.link} target="_blank" rel="noreferrer" className="text-violet inline-flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> Otwórz
                    </a>
                  )}
                </div>
                <div className="flex gap-2 mt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(p);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Edytuj
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => remove(p.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ProductDialog open={open} onOpenChange={setOpen} product={editing} onSaved={load} />
    </PageShell>
  );
}

function ProductDialog({
  open,
  onOpenChange,
  product,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product: Product | null;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState<Status>("idea");
  const [link, setLink] = useState("");

  useEffect(() => {
    if (open) {
      setName(product?.name ?? "");
      setDescription(product?.description ?? "");
      setPrice(product?.price_pln != null ? String(product.price_pln) : "");
      setStatus(product?.status ?? "idea");
      setLink(product?.link ?? "");
    }
  }, [open, product]);

  const save = async () => {
    if (!name.trim() || !user) return toast.error("Podaj nazwę");
    const payload = {
      name,
      description: description || null,
      price_pln: price ? Number(price) : null,
      status,
      link: link || null,
    };
    const { error } = product
      ? await supabase.from("user_products").update(payload).eq("id", product.id)
      : await supabase.from("user_products").insert({ ...payload, user_id: user.id });
    if (error) return toast.error(error.message);
    toast.success(product ? "Zaktualizowano" : "Dodano produkt");
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? "Edycja produktu" : "Nowy produkt"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nazwa</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="np. Mentoring 1:1" />
          </div>
          <div>
            <Label>Opis</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[100px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Cena (zł)</Label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="idea">Pomysł</SelectItem>
                  <SelectItem value="building">W budowie</SelectItem>
                  <SelectItem value="active">Aktywny</SelectItem>
                  <SelectItem value="paused">Wstrzymany</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Link (opcjonalny)</Label>
            <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Anuluj</Button>
          <Button onClick={save} className="bg-gradient-violet text-primary-foreground">
            {product ? "Zapisz" : "Dodaj"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
