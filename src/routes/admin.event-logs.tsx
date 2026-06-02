import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listServerErrorLogs, type ServerErrorLogRow } from "@/lib/error-logs.functions";
import { useAuth } from "@/lib/auth-context";
import { AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/event-logs")({
  component: AdminEventLogsPage,
});

function AdminEventLogsPage() {
  const { session } = useAuth();
  const fn = useServerFn(listServerErrorLogs);

  const q = useQuery({
    queryKey: ["admin-event-logs", session?.user.id],
    queryFn: async () => {
      const token = session?.access_token;
      if (!token) return { rows: [] as ServerErrorLogRow[] };
      try {
        return await fn({
          data: { limit: 200 },
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        console.error("Event logs query failed", error);
        toast.error("Nie udało się pobrać logów", {
          description: "Spróbuj odświeżyć stronę za chwilę.",
        });
        return { rows: [] as ServerErrorLogRow[] };
      }
    },
    enabled: !!session?.access_token,
  });

  const rows = q.data?.rows ?? [];

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-orange" />
            Logi zdarzeń
          </h1>
          <p className="text-muted-foreground mt-1">
            Ostatnie błędy z server functions (czas, nazwa funkcji, identyfikator żądania).
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => q.refetch()}
          disabled={q.isFetching}
        >
          {q.isFetching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span className="ml-2">Odśwież</span>
        </Button>
      </header>

      <section className="rounded-3xl border bg-card p-6 shadow-soft">
        {q.isLoading ? (
          <div className="py-8 text-center text-muted-foreground flex justify-center">
            <Loader2 className="animate-spin w-5 h-5" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            Brak zapisanych błędów. 🎉
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[170px]">Czas</TableHead>
                  <TableHead>Funkcja</TableHead>
                  <TableHead className="w-[90px]">Status</TableHead>
                  <TableHead>Wiadomość</TableHead>
                  <TableHead className="w-[260px]">Request ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} className="align-top">
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString("pl-PL")}
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-xs font-semibold">
                        {r.function_name ?? "—"}
                      </div>
                      {r.user_id && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          user: {r.user_id.slice(0, 8)}…
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {r.status ? (
                        <Badge
                          variant="outline"
                          className={
                            r.status >= 500
                              ? "border-red-500 text-red-600"
                              : r.status >= 400
                                ? "border-orange text-orange"
                                : ""
                          }
                        >
                          {r.status}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[420px]">
                      <div className="text-xs whitespace-pre-wrap break-words line-clamp-4">
                        {r.message}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-[10px] text-muted-foreground break-all">
                        {r.request_id ?? "—"}
                      </code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
