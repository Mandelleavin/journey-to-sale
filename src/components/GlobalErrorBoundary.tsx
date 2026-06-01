import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: unknown;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error("GlobalErrorBoundary caught error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="max-w-md text-center">
            <h1 className="text-3xl font-bold text-foreground">Coś poszło nie tak</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Wystąpił nieoczekiwany błąd. Spróbuj odświeżyć stronę lub wrócić na stronę główną.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => {
                  this.handleReset();
                  if (typeof window !== "undefined") window.location.reload();
                }}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Odśwież stronę
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Strona główna
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
