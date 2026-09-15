import { SaleInvoice, StoreSettings } from '../types';
import { X, Printer, CheckCircle } from 'lucide-react';

interface ReceiptModalProps {
  invoice: SaleInvoice | null;
  settings: StoreSettings;
  onClose: () => void;
}

export const ReceiptModal = ({ invoice, settings, onClose }: ReceiptModalProps) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(invoice.date).toLocaleDateString('ar-DZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      id="receipt-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden my-auto border border-slate-200 flex flex-col print:shadow-none print:border-none print:m-0 print:w-full print:max-w-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Hidden on print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold">فاتورة المبيعات</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة (Ctrl+P)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Thermal Receipt */}
        <div id="printable-receipt" className="p-6 sm:p-8 space-y-4 font-mono text-sm">
          {/* Header */}
          <div className="text-center space-y-1 pb-3 border-b-2 border-dashed border-slate-300">
            <h2 className="text-xl font-black font-sans text-slate-900">
              {settings.storeName}
            </h2>
            <p className="text-xs text-slate-600 font-sans">{settings.activityType}</p>
            {settings.phone && (
              <p className="text-xs text-slate-600">الهاتف: {settings.phone}</p>
            )}
            {settings.address && (
              <p className="text-xs text-slate-600 font-sans">{settings.address}</p>
            )}
          </div>

          {/* Invoice Meta */}
          <div className="flex justify-between items-center text-xs text-slate-600 pb-2 border-b border-dashed border-slate-200">
            <div>
              <span>رقم الفاتورة: </span>
              <strong className="text-slate-900">{invoice.invoiceNumber}</strong>
            </div>
            <div>{formattedDate}</div>
          </div>

          {/* Customer / Payment info */}
          <div className="text-xs text-slate-600 flex justify-between">
            <span>
              العميل: <strong className="text-slate-900">{invoice.customerName || 'عميل نقدي'}</strong>
            </span>
            <span>
              الدفع:{' '}
              <strong className="text-slate-900">
                {invoice.paymentMethod === 'cash'
                  ? 'نقداً'
                  : invoice.paymentMethod === 'card'
                  ? 'بطاقة بنكية'
                  : 'بالدين / آجل'}
              </strong>
            </span>
          </div>

          {/* Items Table */}
          <div className="space-y-2 pt-1 pb-3 border-b-2 border-dashed border-slate-300">
            <div className="grid grid-cols-12 text-xs font-bold text-slate-500 pb-1 border-b border-slate-200">
              <span className="col-span-6 text-right">المنتوج</span>
              <span className="col-span-2 text-center">الكمية</span>
              <span className="col-span-2 text-center">السعر</span>
              <span className="col-span-2 text-left">المجموع</span>
            </div>
            {invoice.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 text-xs py-1 text-slate-800">
                <span className="col-span-6 font-sans truncate">{item.productName}</span>
                <span className="col-span-2 text-center">{item.quantity}</span>
                <span className="col-span-2 text-center">{item.unitPrice}</span>
                <span className="col-span-2 text-left font-bold">
                  {item.total.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1.5 text-xs text-slate-700">
            <div className="flex justify-between">
              <span>المجموع الفرعي:</span>
              <span>{invoice.subtotal.toLocaleString()} {settings.currency}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>الخصم:</span>
                <span>- {invoice.discount.toLocaleString()} {settings.currency}</span>
              </div>
            )}
            {invoice.taxAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>الضريبة:</span>
                <span>+ {invoice.taxAmount.toLocaleString()} {settings.currency}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-slate-950 pt-2 border-t-2 border-slate-900">
              <span>المبلغ الإجمالي:</span>
              <span>{invoice.grandTotal.toLocaleString()} {settings.currency}</span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-4 border-t-2 border-dashed border-slate-300 space-y-1 text-xs text-slate-600 font-sans">
            <p className="font-semibold">{settings.receiptFooter}</p>
            <p className="text-[10px] text-slate-400">نظام إدارة المنتجات ونقاط البيع</p>
          </div>
        </div>
      </div>
    </div>
  );
};
