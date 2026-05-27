import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Глобальний ErrorBoundary, щоб помилки рендера не залишали користувача
 * наодинці з порожнім екраном. Показує читабельну плашку + кнопки.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // У dev це вже логує сам React, але дублюємо для надійності.
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = (): void => this.setState({ error: null });

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-mint-radial px-4 py-12">
          <div className="card flex max-w-lg flex-col items-center gap-3 text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 text-white shadow-mint">
              <AlertTriangle size={26} strokeWidth={2.5} />
            </span>
            <h1 className="font-display text-xl font-bold text-mint-900 dark:text-mint-100">
              Щось пішло не так
            </h1>
            <p className="text-sm text-slate-600 dark:text-mint-300">
              Сталася неочікувана помилка під час рендера сторінки. Спробуйте перезавантажити
              сторінку або повернутися на головну.
            </p>
            <details className="w-full rounded-2xl bg-mint-50 p-3 text-left text-xs font-mono text-mint-800 ring-1 ring-mint-100 dark:bg-mint-900/40 dark:text-mint-200 dark:ring-mint-800">
              <summary className="cursor-pointer font-semibold">Деталі помилки</summary>
              <pre className="mt-2 whitespace-pre-wrap break-all">
                {this.state.error.name}: {this.state.error.message}
              </pre>
            </details>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  this.reset();
                  window.location.reload();
                }}
                className="btn-primary"
              >
                <RefreshCw size={14} strokeWidth={2.5} /> Перезавантажити
              </button>
              <a href="/" className="btn-secondary">
                На головну
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
