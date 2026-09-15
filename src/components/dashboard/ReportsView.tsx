import { useMemo } from 'react';
import { SaleInvoice, Product, Customer, StoreSettings } from '../../types/store';
import { formatMoney } from '../../utils/formatUtils';
import {
  TrendingUp,
  Banknote,
  Receipt,
  Package,
  AlertTriangle,
  Award,
  CreditCard,
  Calendar,
} from 'lucide-react';

interface ReportsViewProps {
  invoices: SaleInvoice[];
  products: Product[];
  customers: Customer[];
  settings: StoreSettings;
  onNavigateTab: (tab: 'pos' | 'inventory' | 'sales' | 'customers') => void;
}

export const ReportsView = ({
  invoices,
  products,
  customers,
  settings,
  onNavigateTab,
}: ReportsViewProps) => {
  const completedInvoices = useMemo(() => invoices.filter((i) => i.status === 'completed'), [invoices]);

  // Today's stats
  const todayStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayInvs = completedInvoices.filter((i) => i.date.slice(0, 10) === today);
    const sales = todayInvs.reduce((acc, i) => acc + i.grandTotal, 0);
    const profit = todayInvs.reduce((acc, i) => acc + i.profit, 0);
    return { count: todayInvs.length, sales, profit };
  }, [completedInvoices]);

  // All time stats
  const allTimeStats = useMemo(() => {
    const sales = completedInvoices.reduce((acc, i) => acc + i.grandTotal, 0);
    const profit = completedInvoices.reduce((acc, i) => acc + i.profit, 0);
    return { count: completedInvoices.length, sales, profit };
  }, [completedInvoices]);

  // Top selling products
  const topSelling = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    completedInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        if (!map[item.productId]) {
          map[item.productId] = { name: item.productName, qty: 0, revenue: 0 };
        }
        map[item.productId].qty += item.quantity;
        map[item.productId].revenue += item.total;
      });
    });

    return Object.values(map)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [completedInvoices]);

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    let cash = 0;
    let card = 0;
    let debt = 0;

    completedInvoices.forEach((inv) => {
      if (inv.paymentMethod === 'cash') cash += inv.grandTotal;
      else if (inv.paymentMethod === 'card') card += inv.grandTotal;
      else if (inv.paymentMethod === 'debt') debt += inv.grandTotal;
    });

    const total = cash + card + debt || 1;
    return {
      cash,
      card,
      debt,
      cashPct: Math.round((cash / total) * 100),
      cardPct: Math.round((card / total) * 100),
      debtPct: Math.round((debt / total) * 100),
    };
  }, [completedInvoices]);

  // Low stock products
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.stock <= p.minStockAlert);
  }, [products]);

  // Total customer debt
  const totalDebt = useMemo(() => {
    return customers.reduce((acc, c) => acc + c.totalDebt, 0);
  }, [customers]);

  return (
    <div id="reports-view" className="space-y-6">
      {/* Top Welcome / Store Info */}
      <div className="bg-gradient-to-l from-blue-900/40 via-slate-800 to-slate-900 border border-slate-700/80 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-right">
          <div className="flex items-center justify-center md:justify-start gap-2 text-blue-400 text-xs font-mono">
            <Calendar className="w-3.5 h-3.5" />
            <span>تقرير الأداء والمبيعات المالي</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
            لوحة الإحصائيات لـ {settings.storeName}
          </h2>
          <p className="text-xs text-slate-400">
            ملخص دقيق لحركة الكاشير، الأرباح المحققة، المنتجات الأكثر طلباً، وحالة المخزون.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('pos')}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-colors cursor-pointer"
        >
          <Receipt className="w-4 h-4" />
          <span>فتح نقطة البيع (الكاشير)</span>
        </button>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>مبيعات اليوم</span>
            <span className="p-2 bg-emerald-950/80 text-emerald-400 rounded-lg">
              <Banknote className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-bold font-mono text-emerald-400">
            {formatMoney(todayStats.sales, settings.currency, settings.currencyDecimals ?? 2)}
          </h3>
          <p className="text-xs text-slate-400">
            عدد فواتير اليوم: <strong className="text-slate-200">{todayStats.count}</strong>
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>أرباح اليوم الصافية</span>
            <span className="p-2 bg-blue-950/80 text-blue-400 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-bold font-mono text-blue-400">
            +{formatMoney(todayStats.profit, settings.currency, settings.currencyDecimals ?? 2)}
          </h3>
          <p className="text-xs text-slate-400">
            هامش الربح بعد خصم سعر الشراء
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>إجمالي المبيعات الكلية</span>
            <span className="p-2 bg-purple-950/80 text-purple-400 rounded-lg">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-bold font-mono text-slate-100">
            {formatMoney(allTimeStats.sales, settings.currency, settings.currencyDecimals ?? 2)}
          </h3>
          <p className="text-xs text-slate-400">
            أرباح كلية: <strong className="text-emerald-400">+{formatMoney(allTimeStats.profit, settings.currency, settings.currencyDecimals ?? 2)}</strong>
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>إجمالي الديون في السوق</span>
            <span className="p-2 bg-rose-950/80 text-rose-400 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-bold font-mono text-rose-400">
            {formatMoney(totalDebt, settings.currency, settings.currencyDecimals ?? 2)}
          </h3>
          <button
            type="button"
            onClick={() => onNavigateTab('customers')}
            className="text-xs text-blue-400 hover:underline"
          >
            فتح دفتر الزبائن والديون ←
          </button>
        </div>
      </div>

      {/* Two Column Section: Top Selling vs Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Selling Products (7 cols) */}
        <div className="lg:col-span-7 bg-slate-800/80 border border-slate-700/70 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>السلع الأكثر مبيعاً وطلباً</span>
            </h3>
            <span className="text-xs text-slate-400">ترتيب حسب الكميات المباعة</span>
          </div>

          {topSelling.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              لم تسجل أي مبيعات حتى الآن.
            </div>
          ) : (
            <div className="space-y-3">
              {topSelling.map((prod, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-900/70 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-bold flex items-center justify-center text-xs">
                      {idx + 1}
                    </span>
                    <div>
                      <h5 className="font-bold text-slate-200">{prod.name}</h5>
                      <span className="text-slate-400 text-[11px]">
                        مبيعات: {formatMoney(prod.revenue, settings.currency, settings.currencyDecimals ?? 2)}
                      </span>
                    </div>
                  </div>

                  <span className="px-3 py-1 bg-blue-950 text-blue-300 font-bold font-mono rounded-lg border border-blue-900">
                    {prod.qty} قطعة
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Methods Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700/70 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>توزيع طرق التحصيل والدفع</span>
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            {/* Cash */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>دفع نقدي (كاش)</span>
                </span>
                <span className="font-mono font-bold">
                  {formatMoney(paymentBreakdown.cash, settings.currency, settings.currencyDecimals ?? 2)} ({paymentBreakdown.cashPct}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${paymentBreakdown.cashPct}%` }}
                ></div>
              </div>
            </div>

            {/* Card */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span>بطاقات بنكية / إلكتروني</span>
                </span>
                <span className="font-mono font-bold">
                  {formatMoney(paymentBreakdown.card, settings.currency, settings.currencyDecimals ?? 2)} ({paymentBreakdown.cardPct}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${paymentBreakdown.cardPct}%` }}
                ></div>
              </div>
            </div>

            {/* Debt */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>آجل (ديون على الحساب)</span>
                </span>
                <span className="font-mono font-bold">
                  {formatMoney(paymentBreakdown.debt, settings.currency, settings.currencyDecimals ?? 2)} ({paymentBreakdown.debtPct}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${paymentBreakdown.debtPct}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-700/60 text-xs text-slate-400 space-y-1">
            <span className="font-bold text-slate-200 block">نصيحة مالية:</span>
            <p>
              تحصيل الديون بصورة دورية يحافظ على السيولة النقدية المطلوبة لتجديد مخزون السلع ذات الطلب المرتفع.
            </p>
          </div>
        </div>
      </div>

      {/* Low Stock Warning Section */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-950/30 border border-amber-800/60 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>تنبيه إعادة الطلب: توجد {lowStockProducts.length} سلع شارفت على النفاد</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('inventory')}
              className="text-xs text-amber-200 underline hover:text-amber-100"
            >
              عرض وإدارة المخزن ←
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            {lowStockProducts.slice(0, 6).map((p) => (
              <div
                key={p.id}
                className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-700/60 flex items-center justify-between"
              >
                <span className="font-semibold text-slate-200 truncate">{p.name}</span>
                <span className="font-mono font-bold text-rose-400 shrink-0">
                  متبقي {p.stock} {p.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
