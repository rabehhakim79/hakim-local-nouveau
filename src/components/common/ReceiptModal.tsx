import { SaleInvoice, StoreSettings } from '../../types/store';
import { X, Printer, CheckCircle } from 'lucide-react';
import { formatMoney } from '../../utils/formatUtils';

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
        className="w-full max-w-md bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden my-auto border border-slate-200 flex flex-col print:shadow-none print:border-none print:m-0 print:w-full print:max-w-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Hidden when printing) */}
        <div className="p-3 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold">معاينة وطباعة الفاتورة</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة (Ctrl+P)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Receipt Body (Formatted like thermal POS receipt) */}
        <div id="printable-receipt" className="p-6 sm:p-8 space-y-4 font-mono text-sm">
          {/* Header */}
          <div className="text-center space-y-1 pb-3 border-b-2 border-dashed border-slate-300">
            <h2 className="text-xl font-bold font-sans text-slate-900">
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
              <span>فاتورة: </span>
              <strong className="text-slate-900">{invoice.invoiceNumber}</strong>
            </div>
            <div>{formattedDate}</div>
          </div>

          {/* Customer / Payment info */}
          <div className="text-xs text-slate-600 flex justify-between">
            <span>
              العميل: <strong className="text-slate-900">{invoice.customerName || 'زبون عابر'}</strong>
            </span>
            <span>
              طريقة الدفع: {' '}
              <strong className="text-slate-900">
                {invoice.paymentMethod === 'cash'
                  ? 'نقداً'
                  : invoice.paymentMethod === 'card'
                  ? 'بطاقة'
                  : 'آجل (دين)'}
              </strong>
            </span>
          </div>

          {/* Items Table */}
          <div className="space-y-2 pt-1 pb-3 border-b-2 border-dashed border-slate-300">
            <div className="grid grid-cols-12 text-xs font-bold text-slate-500 pb-1 border-b border-slate-200">
              <span className="col-span-6 text-right">المنتج</span>
              <span className="col-span-2 text-center">الكمية</span>
              <span className="col-span-2 text-center">السعر</span>
              <span className="col-span-2 text-left">المجموع</span>
            </div>

            {invoice.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 text-xs py-1.5 text-slate-800 items-center">
                <div className="col-span-6 font-sans flex items-center gap-2 min-w-0">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="w-6 h-6 rounded object-cover border border-slate-300 shrink-0 print:hidden"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <span className="truncate">{item.productName}</span>
                </div>
                <span className="col-span-2 text-center">{item.quantity}</span>
                <span className="col-span-2 text-center">{formatMoney(item.unitPrice, undefined, settings.currencyDecimals ?? 2)}</span>
                <span className="col-span-2 text-left font-bold">{formatMoney(item.total, undefined, settings.currencyDecimals ?? 2)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1.5 text-xs text-slate-700">
            <div className="flex justify-between">
              <span>المجموع الفرعي:</span>
              <span>{formatMoney(invoice.subtotal, settings.currency, settings.currencyDecimals ?? 2)}</span>
            </div>

            {invoice.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>الخصم:</span>
                <span>- {formatMoney(invoice.discount, settings.currency, settings.currencyDecimals ?? 2)}</span>
              </div>
            )}

            {invoice.taxAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>الضريبة ({invoice.taxPercent}%):</span>
                <span>+ {formatMoney(invoice.taxAmount, settings.currency, settings.currencyDecimals ?? 2)}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-bold text-slate-950 pt-2 border-t-2 border-slate-900">
              <span>الإجمالي الصافي:</span>
              <span>{formatMoney(invoice.grandTotal, settings.currency, settings.currencyDecimals ?? 2)}</span>
            </div>

            {invoice.paymentMethod === 'debt' && (
              <div className="pt-2 border-t border-dashed border-slate-300 space-y-1">
                <div className="flex justify-between text-emerald-700">
                  <span>المدفوع نقداً:</span>
                  <span>{formatMoney(invoice.paidAmount, settings.currency, settings.currencyDecimals ?? 2)}</span>
                </div>
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>المتبقي في ذمة الزبون (دين):</span>
                  <span>{formatMoney(invoice.remainingDebt, settings.currency, settings.currencyDecimals ?? 2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="text-center pt-4 border-t-2 border-dashed border-slate-300 space-y-1 text-xs text-slate-500 font-sans">
            <p className="font-medium text-slate-700">{settings.receiptFooter}</p>
            <p className="text-[10px] text-slate-400">تطبيق نقطة البيع وإدارة المحلات التجارية</p>
          </div>
        </div>
      </div>
    </div>
  );
};
