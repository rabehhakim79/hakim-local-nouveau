import { useState, useMemo } from 'react';
import { SaleInvoice, StoreSettings } from '../../types/store';
import { formatMoney } from '../../utils/formatUtils';
import {
  Search,
  Printer,
  RotateCcw,
  Receipt,
  CreditCard,
  Banknote,
  AlertTriangle,
  TrendingUp,
  FileText,
  Calendar,
} from 'lucide-react';

interface SalesHistoryViewProps {
  invoices: SaleInvoice[];
  settings: StoreSettings;
  onSelectInvoiceForReceipt: (invoice: SaleInvoice) => void;
  onRefundInvoice: (invoiceId: string) => void;
}

export const SalesHistoryView = ({
  invoices,
  settings,
  onSelectInvoiceForReceipt,
  onRefundInvoice,
}: SalesHistoryViewProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Metrics
  const totalSales = useMemo(() => {
    return invoices
      .filter((i) => i.status === 'completed')
      .reduce((sum, i) => sum + i.grandTotal, 0);
  }, [invoices]);

  const totalProfits = useMemo(() => {
    return invoices
      .filter((i) => i.status === 'completed')
      .reduce((sum, i) => sum + i.profit, 0);
  }, [invoices]);

  const completedCount = useMemo(() => {
    return invoices.filter((i) => i.status === 'completed').length;
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
      const matchStatus = filterStatus === 'all' || inv.status === filterStatus;

      return matchSearch && matchMethod && matchStatus;
    });
  }, [invoices, searchQuery, filterMethod, filterStatus]);

  return (
    <div id="sales-history-view" className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400">إجمالي عدد الفواتير</span>
            <h3 className="text-2xl font-bold font-mono text-slate-100">{completedCount}</h3>
          </div>
          <div className="p-3 bg-blue-950/80 text-blue-400 rounded-xl border border-blue-800/50">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400">إجمالي المداخيل والمبيعات</span>
            <h3 className="text-xl font-bold font-mono text-emerald-400">
              {formatMoney(totalSales, settings.currency, settings.currencyDecimals ?? 2)}
            </h3>
          </div>
          <div className="p-3 bg-emerald-950/80 text-emerald-400 rounded-xl border border-emerald-800/50">
            <Banknote className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400">صافي الأرباح المحققة</span>
            <h3 className="text-xl font-bold font-mono text-blue-400">
              {formatMoney(totalProfits, settings.currency, settings.currencyDecimals ?? 2)}
            </h3>
          </div>
          <div className="p-3 bg-purple-950/80 text-purple-400 rounded-xl border border-purple-800/50">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400">متوسط قيمة السلة (الفاتورة)</span>
            <h3 className="text-xl font-bold font-mono text-slate-100">
              {formatMoney(
                completedCount > 0 ? totalSales / completedCount : 0,
                settings.currency,
                settings.currencyDecimals ?? 2
              )}
            </h3>
          </div>
          <div className="p-3 bg-amber-950/80 text-amber-400 rounded-xl border border-amber-800/50">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-800/90 border border-slate-700/70 p-4 rounded-2xl flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث برقم الفاتورة، اسم الزبون، أو اسم سلعة..."
            className="w-full pl-3 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">كل طرق الدفع</option>
            <option value="cash">نقداً</option>
            <option value="card">بطاقة بنكية</option>
            <option value="debt">آجل (دين)</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">كل الحالات</option>
            <option value="completed">مكتملة</option>
            <option value="refunded">مسترجعة / ملغاة</option>
          </select>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-700 font-medium">
              <tr>
                <th className="py-3 px-4">رقم الفاتورة</th>
                <th className="py-3 px-4">التاريخ والوقت</th>
                <th className="py-3 px-4">الزبون / العميل</th>
                <th className="py-3 px-4">عدد الأصناف</th>
                <th className="py-3 px-4">طريقة الدفع</th>
                <th className="py-3 px-4 font-mono">المبلغ الإجمالي</th>
                <th className="py-3 px-4 font-mono">الربح</th>
                <th className="py-3 px-4 text-center">الحالة</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    لا توجد فواتير مطابقة للبحث.
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
                    <tr
                      key={inv.id}
                      className={`hover:bg-slate-750/50 transition-colors ${
                        inv.status === 'refunded' ? 'opacity-60 bg-slate-900/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold font-mono text-slate-200">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{dateFormatted}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-200 font-medium">
                        {inv.customerName || <span className="text-slate-500">زبون عابر</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <span className="bg-slate-900 px-2 py-0.5 rounded text-[11px]">
                          {inv.items.length} أصناف
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium inline-flex items-center gap-1 ${
                            inv.paymentMethod === 'cash'
                              ? 'bg-emerald-950 text-emerald-300'
                              : inv.paymentMethod === 'card'
                              ? 'bg-blue-950 text-blue-300'
                              : 'bg-amber-950 text-amber-300'
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
                              <span>آجل (دين)</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-100">
                        {formatMoney(inv.grandTotal, settings.currency, settings.currencyDecimals ?? 2)}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-400">
                        +{formatMoney(inv.profit, settings.currency, settings.currencyDecimals ?? 2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'completed'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {inv.status === 'completed' ? 'ناجحة' : 'مسترجعة'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectInvoiceForReceipt(inv)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-300 hover:bg-slate-700 transition-colors cursor-pointer"
                            title="معاينة وطباعة الفاتورة"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {inv.status === 'completed' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  confirm(
                                    `هل تريد استرجاع الفاتورة رقم ${inv.invoiceNumber}؟ سيتم إرجاع البضائع للمخزن وإلغاء حسابها.`
                                  )
                                ) {
                                  onRefundInvoice(inv.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors cursor-pointer"
                              title="إرجاع البضاعة وإلغاء الفاتورة"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
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
