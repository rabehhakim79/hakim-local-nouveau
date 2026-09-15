import { useState, useMemo } from 'react';
import { SaleInvoice, StoreSettings } from '../types';
import {
  Search,
  Printer,
  Receipt,
  CreditCard,
  Banknote,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Image as ImageIcon,
} from 'lucide-react';

interface SalesHistoryViewProps {
  invoices: SaleInvoice[];
  settings: StoreSettings;
  onSelectInvoiceForReceipt: (invoice: SaleInvoice) => void;
}

export const SalesHistoryView = ({
  invoices,
  settings,
  onSelectInvoiceForReceipt,
}: SalesHistoryViewProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState<string>('all');

  const totalSales = useMemo(() => {
    return invoices.reduce((sum, i) => sum + i.grandTotal, 0);
  }, [invoices]);

  const totalProfits = useMemo(() => {
    return invoices.reduce((sum, i) => sum + i.profit, 0);
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return invoices.filter((inv) => {
      const matchSearch =
        !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.customerName && inv.customerName.toLowerCase().includes(q)) ||
        inv.items.some((it) => it.productName.toLowerCase().includes(q));
      const matchMethod = filterMethod === 'all' || inv.paymentMethod === filterMethod;
      return matchSearch && matchMethod;
    });
  }, [invoices, searchQuery, filterMethod]);

  return (
    <div id="sales-history-view" className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400">عدد الفواتير المنفذة</span>
            <h3 className="text-2xl font-bold font-mono text-slate-100">{invoices.length}</h3>
          </div>
          <div className="p-3 bg-blue-950/80 text-blue-400 rounded-2xl border border-blue-800/50">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400">إجمالي المبيعات</span>
            <h3 className="text-xl font-bold font-mono text-emerald-400">
              {totalSales.toLocaleString()} {settings.currency}
            </h3>
          </div>
          <div className="p-3 bg-emerald-950/80 text-emerald-400 rounded-2xl border border-emerald-800/50">
            <Banknote className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400">إجمالي الأرباح الصافية</span>
            <h3 className="text-xl font-bold font-mono text-blue-400">
              +{totalProfits.toLocaleString()} {settings.currency}
            </h3>
          </div>
          <div className="p-3 bg-purple-950/80 text-purple-400 rounded-2xl border border-purple-800/50">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-wrap gap-3 items-center justify-between shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث برقم الفاتورة، اسم العميل أو المنتوج..."
            className="w-full pl-3 pr-10 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">كل طرق الدفع</option>
            <option value="cash">نقداً</option>
            <option value="card">بطاقة بنكية</option>
            <option value="debt">آجل / دين</option>
          </select>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-medium">
              <tr>
                <th className="py-3.5 px-4">رقم الفاتورة</th>
                <th className="py-3.5 px-4">التاريخ والوقت</th>
                <th className="py-3.5 px-4">العميل</th>
                <th className="py-3.5 px-4">المنتجات المباعة</th>
                <th className="py-3.5 px-4">طريقة الدفع</th>
                <th className="py-3.5 px-4 font-mono">الإجمالي</th>
                <th className="py-3.5 px-4 font-mono">الربح</th>
                <th className="py-3.5 px-4 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-slate-500">
                    لا توجد فواتير مبيعات مسجلة بعد
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const dateFormatted = new Date(inv.date).toLocaleDateString('ar-DZ', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={inv.id} className="hover:bg-slate-850 transition-colors">
                      <td className="py-3.5 px-4 font-bold font-mono text-slate-200">
                        {inv.invoiceNumber}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{dateFormatted}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-200 font-medium">
                        {inv.customerName || <span className="text-slate-500">عميل نقدي</span>}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {inv.items.slice(0, 3).map((it, idx) => (
                            <span
                              key={idx}
                              className="bg-slate-950 px-2 py-0.5 rounded-md text-[11px] border border-slate-800 flex items-center gap-1"
                            >
                              {it.productImage ? (
                                <img
                                  src={it.productImage}
                                  alt=""
                                  className="w-3.5 h-3.5 rounded object-cover"
                                />
                              ) : (
                                <ImageIcon className="w-3 h-3 text-slate-600" />
                              )}
                              <span>{it.productName} ({it.quantity})</span>
                            </span>
                          ))}
                          {inv.items.length > 3 && (
                            <span className="text-[10px] text-slate-400">
                              +{inv.items.length - 3} أخرى
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium inline-flex items-center gap-1 ${
                            inv.paymentMethod === 'cash'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : inv.paymentMethod === 'card'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {inv.paymentMethod === 'cash' ? (
                            <>
                              <Banknote className="w-3 h-3" />
                              <span>نقداً</span>
                            </>
                          ) : inv.paymentMethod === 'card' ? (
                            <>
                              <CreditCard className="w-3 h-3" />
                              <span>بطاقة</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3" />
                              <span>آجل / دين</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-100">
                        {inv.grandTotal.toLocaleString()} {settings.currency}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-emerald-400">
                        +{inv.profit.toLocaleString()} {settings.currency}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => onSelectInvoiceForReceipt(inv)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer mx-auto border border-slate-700/60"
                        >
                          <Printer className="w-3.5 h-3.5 text-blue-400" />
                          <span>عرض وطباعة</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
