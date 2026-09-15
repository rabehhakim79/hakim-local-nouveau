import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  props: Props;
  state: State = {
    hasError: false,
    error: null,
  };

  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in POS Application:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHardReset = () => {
    try {
      // Clear app state in localStorage and unregister service workers
      localStorage.removeItem('pos_store_products_v1');
      localStorage.removeItem('pos_store_invoices_v1');
      localStorage.removeItem('pos_store_customers_v1');
      localStorage.removeItem('pos_store_settings_v1');
      localStorage.removeItem('pos_store_online_orders_v1');
      sessionStorage.clear();
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) {
            reg.unregister();
          }
        });
      }
    } catch {
      // Ignore
    }
    window.location.href = window.location.pathname;
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4" dir="rtl">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">تنبيه في تشغيل البرنامج</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                حدث خطأ غير متوقع أثناء تحميل البيانات. قد يكون ذلك بسبب ملفات تخزين مؤقتة قديمة في المتصفح.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-right overflow-x-auto text-[11px] font-mono text-rose-300">
                {this.state.error.message || 'Unknown Error'}
              </div>
            )}

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-900/30 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة تحميل الصفحة الآن</span>
              </button>

              <button
                type="button"
                onClick={this.handleHardReset}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>مسح الذاكرة المؤقتة وإعادة الضبط السليم</span>
              </button>

              <a
                href={window.location.pathname}
                className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition pt-2"
              >
                <Home className="w-3.5 h-3.5" />
                <span>العودة للرئيسية</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
