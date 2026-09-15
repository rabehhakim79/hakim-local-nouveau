import React, { useState } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle, ShieldCheck, X, Database, Send } from 'lucide-react';
import { testFirestoreConnection, saveOrderToFirestore } from '../../services/storeSyncService';
import { OnlineOrder } from '../../types/store';

interface CloudDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCloudSynced: boolean;
  isCloudSyncing: boolean;
  databaseId?: string;
  projectId?: string;
}

export const CloudDiagnosticModal: React.FC<CloudDiagnosticModalProps> = ({
  isOpen,
  onClose,
  isCloudSynced,
  isCloudSyncing,
  databaseId = 'ai-studio-f1ac63c2-70fd-4736-8f8e-f5ae88af793a',
  projectId = 'gen-lang-client-0073653212',
}) => {
  const [isRunningPing, setIsRunningPing] = useState(false);
  const [pingResult, setPingResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);

  const [isSendingTestOrder, setIsSendingTestOrder] = useState(false);
  const [orderResult, setOrderResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleRunPing = async () => {
    setIsRunningPing(true);
    setPingResult(null);
    try {
      const res = await testFirestoreConnection();
      setPingResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setPingResult({ success: false, message: `خطأ أثناء الاتصال: ${msg}` });
    } finally {
      setIsRunningPing(false);
    }
  };

  const handleSendLiveTestOrder = async () => {
    setIsSendingTestOrder(true);
    setOrderResult(null);
    try {
      const testNum = Math.floor(1000 + Math.random() * 9000);
      const sampleOrder: OnlineOrder = {
        id: `order-test-${Date.now()}`,
        orderNumber: `TEST-${testNum}`,
        date: new Date().toISOString(),
        customerName: 'تجربة اتصال سحابي فوري',
        customerPhone: '0555000000',
        deliveryType: 'pickup',
        items: [
          {
            productId: 'test-item',
            productName: 'طلب تجريبي لفحص قاعدة البيانات',
            quantity: 1,
            unitPrice: 100,
            total: 100,
          },
        ],
        subtotal: 100,
        deliveryFee: 0,
        total: 100,
        status: 'pending',
        notes: 'تم إرسال هذا الطلب لفحص وصول البيانات لقاعدة بيانات Firebase بنجاح.',
      };

      await saveOrderToFirestore(sampleOrder);
      setOrderResult({
        success: true,
        message: `تم إرسال الطلب التجريبي (${sampleOrder.orderNumber}) وحفظه مباشرة في Firebase Firestore! ستجده الآن في شاشة "طلبات المنصة".`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setOrderResult({
        success: false,
        message: `تعذر حفظ الطلب: ${msg}`,
      });
    } finally {
      setIsSendingTestOrder(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">فحص والتحقق من قاعدة البيانات السحابية</h2>
              <p className="text-xs text-slate-400">التحقق المباشر من مزامنة متجرك مع Google Cloud / Firebase</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status summary box */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isCloudSyncing ? (
                <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
              ) : isCloudSynced ? (
                <Cloud className="w-6 h-6 text-emerald-400" />
              ) : (
                <CloudOff className="w-6 h-6 text-amber-400" />
              )}
              <div>
                <p className="text-xs text-slate-400">حالة المزامنة الحالية</p>
                <p className="text-sm font-bold text-white">
                  {isCloudSyncing
                    ? 'جاري المزامنة مع السحابة...'
                    : isCloudSynced
                    ? 'متصل بالقاعدة السحابية بنجاح'
                    : 'وضع التخزين المحلي فقط'}
                </p>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                isCloudSynced
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                  : 'bg-amber-950/80 text-amber-300 border-amber-700'
              }`}
            >
              {isCloudSynced ? 'سحابي نشط' : 'محلي'}
            </span>
          </div>

          {/* Database Specs */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1.5 text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Firebase Project:</span>
              <span className="text-blue-400 font-semibold">{projectId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Database ID:</span>
              <span className="text-emerald-400 font-semibold">{databaseId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Real-time Engine:</span>
              <span className="text-slate-200">Firestore Web SDK v11</span>
            </div>
          </div>

          {/* Action 1: Test Direct Ping */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">1. اختبار الاتصال بالنبضات (Ping)</span>
              <button
                type="button"
                onClick={handleRunPing}
                disabled={isRunningPing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition disabled:opacity-50 cursor-pointer shadow-md"
              >
                {isRunningPing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                <span>{isRunningPing ? 'جاري الفحص...' : 'فحص الاتصال الفوري'}</span>
              </button>
            </div>
            {pingResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  pingResult.success
                    ? 'bg-emerald-950/70 border-emerald-600/70 text-emerald-200'
                    : 'bg-rose-950/70 border-rose-600/70 text-rose-200'
                }`}
              >
                {pingResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">{pingResult.success ? 'تم الاتصال بنجاح!' : 'فشل الاختبار'}</p>
                  <p className="mt-0.5 text-slate-300">{pingResult.message}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action 2: Send live sample order */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 block">2. إرسال طلب تجريبي لقاعدة البيانات</span>
                <span className="text-[11px] text-slate-400 block">يقوم بكتابة طلب حقيقي في كولكشن online_orders</span>
              </div>
              <button
                type="button"
                onClick={handleSendLiveTestOrder}
                disabled={isSendingTestOrder}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition disabled:opacity-50 cursor-pointer shadow-md shrink-0"
              >
                {isSendingTestOrder ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{isSendingTestOrder ? 'جاري الإرسال...' : 'إرسال طلب تجريبي'}</span>
              </button>
            </div>
            {orderResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  orderResult.success
                    ? 'bg-emerald-950/70 border-emerald-600/70 text-emerald-200'
                    : 'bg-rose-950/70 border-rose-600/70 text-rose-200'
                }`}
              >
                {orderResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">{orderResult.success ? 'تم حفظ الطلب في Firestore!' : 'فشل الحفظ'}</p>
                  <p className="mt-0.5 text-slate-300">{orderResult.message}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-800/50 border-t border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
