import { Component, type ReactNode } from "react";
import { reportLovableError } from "@/lib/lovable-error-reporting";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class GlobalErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("[GlobalErrorBoundary]", error, info);
    try {
      reportLovableError(error, { boundary: "global_react_error_boundary" });
    } catch {
      // never let reporting itself crash
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center rounded-2xl border border-border bg-card p-8 shadow-pop">
          <h1 className="text-2xl font-semibold tracking-tight text-gradient-brand">
            Something went off-script
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            A part of the page ran into an unexpected error. The rest of the app is fine — you can head home or try again.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              onClick={this.reset}
              className="rounded-xl bg-gradient-brand px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow"
            >
              Try again
            </button>
            <a
              href="/"
              className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Go back home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
