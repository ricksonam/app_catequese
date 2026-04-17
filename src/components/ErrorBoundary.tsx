import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[iCatequese] Erro capturado pelo ErrorBoundary:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
          <div className="w-20 h-20 rounded-3xl overflow-hidden mb-6 shadow-lg border border-primary/10">
            <img src="/app-logo.png" alt="iCatequese" className="w-full h-full object-contain p-2" />
          </div>

          <h1 className="text-2xl font-black text-foreground mb-2">Ops! Algo deu errado</h1>
          <p className="text-sm text-muted-foreground max-w-xs mb-8 leading-relaxed">
            Ocorreu um erro inesperado. Tente novamente ou recarregue a página.
          </p>

          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="px-6 py-3 rounded-2xl bg-primary text-white font-black text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all"
            >
              Tentar Novamente
            </button>
            <button
              onClick={this.handleReload}
              className="px-6 py-3 rounded-2xl bg-muted text-foreground font-bold text-sm hover:bg-muted/80 active:scale-95 transition-all"
            >
              Recarregar
            </button>
          </div>

          {this.state.error && (
            <details className="mt-8 max-w-sm text-left">
              <summary className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest cursor-pointer">
                Detalhes técnicos
              </summary>
              <pre className="mt-2 text-[10px] text-destructive bg-destructive/5 rounded-xl p-3 overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
