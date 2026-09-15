import { useState, useMemo, type FormEvent } from 'react';
import { Customer, StoreSettings, GeoLocation } from '../../types/store';
import {
  Users,
  Search,
  Plus,
  Phone,
  AlertTriangle,
  CheckCircle,
  FileText,
  DollarSign,
  X,
  Check,
  Calendar,
  MapPin,
  Navigation,
  ExternalLink,
  Edit3,
} from 'lucide-react';
import { LocationPickerModal } from '../maps/LocationPickerModal';
import { CustomerLocationModal } from '../maps/CustomerLocationModal';
import { calculateDistanceKm, getGoogleMapsDirectionsUrl } from '../../utils/mapUtils';
import { formatMoney } from '../../utils/formatUtils';

interface CustomersViewProps {
  customers: Customer[];
  settings: StoreSettings;
  onSaveCustomer: (customer: Customer) => void;
  onSettleDebt: (customerId: string, amount: number, note: string) => void;
  onDeleteCustomer: (id: string) => void;
}

export const CustomersView = ({
  customers,
  settings,
  onSaveCustomer,
  onSettleDebt,
  onDeleteCustomer,
}: CustomersViewProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDebtOnly, setFilterDebtOnly] = useState(false);

  // Selected customer for viewing debt statement
  const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [customerLocation, setCustomerLocation] = useState<GeoLocation | undefined>();
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);

  // Active customer for single location viewing modal
  const [activeLocationCustomer, setActiveLocationCustomer] = useState<Customer | null>(null);
  // Target customer for picking/updating location directly from customer card
  const [pickerTargetCustomer, setPickerTargetCustomer] = useState<Customer | null>(null);

  // Settle Debt Modal
  const [settleModalCustomer, setSettleModalCustomer] = useState<Customer | null>(null);
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settleNote, setSettleNote] = useState('');

  // Total debts sum
  const totalMarketDebt = useMemo(() => {
    return customers.reduce((sum, c) => sum + c.totalDebt, 0);
  }, [customers]);

  // Debtors count
  const debtorsCount = useMemo(() => {
    return customers.filter((c) => c.totalDebt > 0).length;
  }, [customers]);

  // Filtered
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return customers.filter((c) => {
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.notes && c.notes.toLowerCase().includes(q));

      const matchDebt = !filterDebtOnly || c.totalDebt > 0;
      return matchSearch && matchDebt;
    });
  }, [customers, searchQuery, filterDebtOnly]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setNotes('');
    setCustomerLocation(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setNotes(c.notes || '');
    setCustomerLocation(c.location);
    setIsModalOpen(true);
  };

  const handleSaveCustomer = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updated: Customer = {
      id: editingCustomer ? editingCustomer.id : `cust-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
      location: customerLocation,
      totalDebt: editingCustomer ? editingCustomer.totalDebt : 0,
      totalPurchases: editingCustomer ? editingCustomer.totalPurchases : 0,
      debtHistory: editingCustomer ? editingCustomer.debtHistory : [],
    };

    onSaveCustomer(updated);
    setIsModalOpen(false);
  };

  const handleOpenSettle = (c: Customer) => {
    setSettleModalCustomer(c);
    setSettleAmount(c.totalDebt);
    setSettleNote('تسديد دفعة نقدية');
  };

  const handleConfirmSettle = (e: FormEvent) => {
    e.preventDefault();
    if (!settleModalCustomer || settleAmount <= 0) return;

    onSettleDebt(settleModalCustomer.id, settleAmount, settleNote);
    setSettleModalCustomer(null);
  };

  return (
    <div id="customers-view" className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400">إجمالي ديون الزبائن المستحقة</span>
            <h3 className="text-2xl font-bold font-mono text-rose-400">
              {formatMoney(totalMarketDebt, settings)}
            </h3>
          </div>
          <div className="p-3 bg-rose-950/80 text-rose-400 rounded-xl border border-rose-800/50">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400">الزبائن الذين عليهم ديون</span>
            <h3 className="text-2xl font-bold font-mono text-amber-400">
              {debtorsCount} <span className="text-xs font-normal text-slate-400">زبائن</span>
            </h3>
          </div>
          <div className="p-3 bg-amber-950/80 text-amber-400 rounded-xl border border-amber-800/50">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400">إجمالي سجل الزبائن المسجلين</span>
            <h3 className="text-2xl font-bold font-mono text-slate-100">{customers.length}</h3>
          </div>
          <div className="p-3 bg-blue-950/80 text-blue-400 rounded-xl border border-blue-800/50">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Add Bar */}
      <div className="bg-slate-800/90 border border-slate-700/70 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 flex-wrap gap-3 w-full items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن زبون بالاسم أو الهاتف..."
              className="w-full pl-3 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setFilterDebtOnly(!filterDebtOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              filterDebtOnly
                ? 'bg-rose-900 text-white'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>عرض المدينين فقط ({debtorsCount})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="w-full md:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة زبون جديد</span>
        </button>
      </div>

      {/* Customers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 space-y-2">
            <Users className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm">لا يوجد زبائن يطابقون خيارات البحث.</p>
          </div>
        ) : (
          filteredCustomers.map((customer) => {
            const hasDebt = customer.totalDebt > 0;

            return (
              <div
                key={customer.id}
                className={`p-5 rounded-2xl border bg-slate-800/80 transition-all flex flex-col justify-between space-y-4 ${
                  hasDebt ? 'border-rose-900/60 hover:border-rose-700' : 'border-slate-700/60 hover:border-slate-500'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-100 text-base">{customer.name}</h4>
                      {customer.phone && (
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span className="font-mono">{customer.phone}</span>
                        </div>
                      )}
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                        hasDebt
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {hasDebt ? `${formatMoney(customer.totalDebt, settings)} دين` : 'خالص'}
                    </span>
                  </div>

                  {customer.notes && (
                    <p className="text-xs text-slate-400 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      {customer.notes}
                    </p>
                  )}

                  {/* Customer Location & GPS Navigation */}
                  <div className="pt-1">
                    {customer.location && customer.location.lat ? (
                      <div className="p-2 rounded-xl bg-blue-950/30 border border-blue-900/50 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1 text-blue-300 font-semibold truncate">
                            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span className="truncate">{customer.location.address || 'موقع محدد بالخريطة'}</span>
                          </div>
                          {settings.storeLocation && (
                            <span className="font-mono text-blue-300 text-[10px] bg-blue-900/60 px-1 py-0.5 rounded shrink-0">
                              {calculateDistanceKm(
                                settings.storeLocation.lat,
                                settings.storeLocation.lng,
                                customer.location.lat,
                                customer.location.lng
                              )}{' '}
                              كم
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setActiveLocationCustomer(customer)}
                            className="flex-1 py-1 px-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                          >
                            <Navigation className="w-3 h-3" />
                            <span>عرض الخريطة</span>
                          </button>

                          <a
                            href={getGoogleMapsDirectionsUrl(
                              customer.location.lat,
                              customer.location.lng,
                              settings.storeLocation?.lat,
                              settings.storeLocation?.lng
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                            title="فتح مباشر في خرائط Google"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <button
                            type="button"
                            onClick={() => setPickerTargetCustomer(customer)}
                            className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                            title="تعديل موقع الزبون"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between py-1 text-[11px]">
                        <span className="text-slate-500 text-[10px]">موقع GPS غير مسجل</span>
                        <button
                          type="button"
                          onClick={() => setPickerTargetCustomer(customer)}
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold text-[11px] cursor-pointer"
                        >
                          <MapPin className="w-3 h-3" />
                          <span>تحديد على الخريطة</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-700/60">
                    <span>إجمالي المشتريات:</span>
                    <span className="font-mono font-bold text-slate-200">
                      {formatMoney(customer.totalPurchases, settings)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-700/50 text-xs">
                  <button
                    type="button"
                    onClick={() => setStatementCustomer(customer)}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                    title="كشف حساب الديون"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span>كشف الحساب</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {hasDebt && (
                      <button
                        type="button"
                        onClick={() => handleOpenSettle(customer)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="تسديد دفعة من الدين"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>تسديد دفعة</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(customer)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                      title="تعديل بيانات الزبون"
                    >
                      تعديل
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Customer Statement / Debt History */}
      {statementCustomer && (
        <div
          id="statement-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setStatementCustomer(null)}
        >
          <div
            className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-base">
                  كشف حساب الزبون: {statementCustomer.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono">{statementCustomer.phone}</p>
              </div>
              <button
                type="button"
                onClick={() => setStatementCustomer(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex justify-between items-center text-xs">
              <span className="text-slate-300">الرصيد المتبقي المطلوب سداده:</span>
              <span className="text-lg font-bold font-mono text-rose-400">
                {formatMoney(statementCustomer.totalDebt, settings)}
              </span>
            </div>

            {/* History Records */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {statementCustomer.debtHistory.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  لا توجد حركات ديون أو سداد مسجلة لهذا الزبون.
                </div>
              ) : (
                statementCustomer.debtHistory.map((rec) => {
                  const isPayment = rec.type === 'payment';
                  const dateStr = new Date(rec.date).toLocaleDateString('ar-DZ', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={rec.id}
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        isPayment
                          ? 'bg-emerald-950/30 border-emerald-900/50'
                          : 'bg-rose-950/30 border-rose-900/50'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold">
                          {isPayment ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-300">تسديد دفعة نقدية</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                              <span className="text-rose-300">إضافة دين مشتريات</span>
                            </>
                          )}
                        </div>
                        {rec.notes && <p className="text-slate-400 text-[11px]">{rec.notes}</p>}
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Calendar className="w-3 h-3" />
                          <span>{dateStr}</span>
                        </div>
                      </div>

                      <span
                        className={`font-mono font-bold text-sm ${
                          isPayment ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPayment ? '-' : '+'}
                        {formatMoney(rec.amount, settings)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Settle Debt */}
      {settleModalCustomer && (
        <div
          id="settle-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSettleModalCustomer(null)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <span>تسديد دفعة دين</span>
              </h3>
              <button
                type="button"
                onClick={() => setSettleModalCustomer(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSettle} className="space-y-4 text-xs">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex justify-between">
                <span className="text-slate-400">الزبون:</span>
                <strong className="text-slate-100">{settleModalCustomer.name}</strong>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex justify-between text-rose-400">
                <span>إجمالي الدين الحالي:</span>
                <strong className="font-mono">{formatMoney(settleModalCustomer.totalDebt, settings)}</strong>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">
                  المبلغ المدفوع نقداً الآن ({settings.currency}) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={settleModalCustomer.totalDebt}
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 font-mono text-base text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">ملاحظات السند / الإيصال</label>
                <input
                  type="text"
                  value={settleNote}
                  onChange={(e) => setSettleNote(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSettleModalCustomer(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>تأكيد استلام الدفعة</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Customer */}
      {isModalOpen && (
        <div
          id="customer-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span>{editingCustomer ? 'تعديل بيانات الزبون' : 'إضافة زبون جديد للدفتر'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">اسم الزبون / العميل *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: خالد بلقاسم، محل النور..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">رقم الهاتف</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0661..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">ملاحظات وعنوان</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="الورشة المقابلة، يسدد شهرياً..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              {/* Customer GPS Location Picker */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium text-xs flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    <span>موقع الزبون على الخريطة (GPS)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsLocationPickerOpen(true)}
                    className="text-blue-400 hover:text-blue-300 text-xs font-semibold cursor-pointer"
                  >
                    {customerLocation ? 'تعديل على الخريطة' : '+ تحديد على الخريطة'}
                  </button>
                </div>

                {customerLocation ? (
                  <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-850">
                    <span className="truncate max-w-[200px]">
                      {customerLocation.address || `${customerLocation.lat.toFixed(4)}, ${customerLocation.lng.toFixed(4)}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomerLocation(undefined)}
                      className="text-rose-400 hover:text-rose-300 text-[11px] cursor-pointer"
                    >
                      إزالة
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    يمكنك تحديد موقع دقيق لمنزل أو متجر الزبون على الخريطة لتسهيل التوصيل.
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingCustomer ? 'حفظ التعديل' : 'إضافة الزبون'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Location & Route Modal */}
      {activeLocationCustomer && activeLocationCustomer.location && (
        <CustomerLocationModal
          isOpen={!!activeLocationCustomer}
          onClose={() => setActiveLocationCustomer(null)}
          location={activeLocationCustomer.location}
          customerName={activeLocationCustomer.name}
          customerPhone={activeLocationCustomer.phone}
          totalAmount={activeLocationCustomer.totalDebt}
          currency={settings.currency}
          storeLocation={settings.storeLocation}
          deliveryAddress={activeLocationCustomer.notes}
        />
      )}

      {/* Location Picker in Customer Edit Form */}
      {isLocationPickerOpen && (
        <LocationPickerModal
          isOpen={isLocationPickerOpen}
          onClose={() => setIsLocationPickerOpen(false)}
          initialLocation={customerLocation}
          title={`تحديد موقع: ${name || 'الزبون'}`}
          subtitle="انقر على الخريطة أو استخدم GPS لتحديد المكان"
          onConfirm={(loc) => {
            setCustomerLocation(loc);
            setIsLocationPickerOpen(false);
          }}
        />
      )}

      {/* Direct Location Picker from Customer Card */}
      {pickerTargetCustomer && (
        <LocationPickerModal
          isOpen={!!pickerTargetCustomer}
          onClose={() => setPickerTargetCustomer(null)}
          initialLocation={pickerTargetCustomer.location}
          title={`تحديد موقع الزبون: ${pickerTargetCustomer.name}`}
          subtitle="حدد المكان بدقة لتسهيل وصول سيارة التوصيل والملاحة"
          onConfirm={(loc) => {
            const updated = {
              ...pickerTargetCustomer,
              location: loc,
            };
            onSaveCustomer(updated);
            setPickerTargetCustomer(null);
          }}
        />
      )}
    </div>
  );
};
