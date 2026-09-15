import React, { useState, useMemo } from 'react';
import { OnlineOrder, StoreSettings, GeoLocation } from '../../types/store';
import {
  ShoppingBag,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Store,
  Phone,
  MessageCircle,
  ArrowRightCircle,
  AlertCircle,
  Filter,
  Check,
  Calendar,
  Package,
  MapPin,
  Navigation,
  Share2,
  ExternalLink,
  Edit3,
} from 'lucide-react';
import { CustomerLocationModal } from '../maps/CustomerLocationModal';
import { AllDeliveryOrdersMapModal } from '../maps/AllDeliveryOrdersMapModal';
import { LocationPickerModal } from '../maps/LocationPickerModal';
import {
  calculateDistanceKm,
  getGoogleMapsDirectionsUrl,
  getWhatsAppLocationMessage,
} from '../../utils/mapUtils';
import { formatMoney } from '../../utils/formatUtils';

interface OnlineOrdersViewProps {
  orders: OnlineOrder[];
  settings: StoreSettings;
  onUpdateOrderStatus: (orderId: string, status: OnlineOrder['status']) => void;
  onConvertOrderToInvoice: (order: OnlineOrder) => void;
  onOpenStorefront: () => void;
  onOpenShareModal: () => void;
  onUpdateOrderLocation?: (orderId: string, location: GeoLocation) => void;
}

export const OnlineOrdersView: React.FC<OnlineOrdersViewProps> = ({
  orders,
  settings,
  onUpdateOrderStatus,
  onConvertOrderToInvoice,
  onOpenStorefront,
  onOpenShareModal,
  onUpdateOrderLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OnlineOrder['status']>('all');

  // Map state
  const [selectedOrderForLocation, setSelectedOrderForLocation] = useState<OnlineOrder | null>(null);
  const [isAllOrdersMapOpen, setIsAllOrdersMapOpen] = useState(false);
  const [orderForLocationPicker, setOrderForLocationPicker] = useState<OnlineOrder | null>(null);

  const deliveryWithLocationCount = orders.filter(
    (o) => o.deliveryType === 'delivery' && o.customerLocation && o.customerLocation.lat
  ).length;

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerPhone.includes(searchQuery);

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const preparingCount = orders.filter((o) => o.status === 'preparing').length;
  const completedCount = orders.filter((o) => o.status === 'completed').length;

  const handleWhatsAppCustomer = (order: OnlineOrder) => {
    const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `مرحباً ${order.customerName}،\nنود إعلامكم بأن طلبكم رقم *${order.orderNumber}* في متجر *${settings.storeName}* بمبلغ *${formatMoney(order.total, settings)}*:\nحالة الطلب: ${
        order.status === 'pending'
          ? 'تم استلامه وجاري مراجعته'
          : order.status === 'preparing'
          ? 'قيد التجهيز والتغليف'
          : order.status === 'completed'
          ? 'جاهز للاستلام / تم تسليمه'
          : 'ملغي'
      }\nشكراً لثقتكم بنا!`
    );
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${message}`, '_blank');
  };

  const getStatusBadge = (status: OnlineOrder['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            <span>قيد الانتظار</span>
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-950/80 text-blue-300 border border-blue-800/60">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>قيد التجهيز</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>مكتمل</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60">
            <XCircle className="w-3.5 h-3.5" />
            <span>ملغي</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Storefront Portal Promo */}
      <div className="bg-gradient-to-r from-blue-900/50 via-indigo-900/40 to-slate-900 border border-blue-800/50 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>منصة المتجر الإلكتروني للزبائن</span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                نشطة وجاهزة
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              يمكن لزبائنك تصفح سلع المتجر والطلب أونلاين بالهاتف. تصل الطلبات هنا لحظياً لتجهيزها وتحويلها لفاتورة مبيعات.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenShareModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition"
          >
            <span>مشاركة رابط المتجر والـ QR</span>
          </button>
          <button
            type="button"
            onClick={onOpenStorefront}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md transition"
          >
            <span>معاينة متجر الزبائن ⭢</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setStatusFilter('pending')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-amber-950/40 border-amber-500/80 shadow-lg'
              : 'bg-slate-800/70 border-slate-700/60 hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-xs font-semibold">طلبات جديدة بالانتظار</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white">{pendingCount}</div>
        </div>

        <div
          onClick={() => setStatusFilter('preparing')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'preparing'
              ? 'bg-blue-950/40 border-blue-500/80 shadow-lg'
              : 'bg-slate-800/70 border-slate-700/60 hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between text-blue-400 mb-1">
            <span className="text-xs font-semibold">قيد التجهيز</span>
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white">{preparingCount}</div>
        </div>

        <div
          onClick={() => setStatusFilter('completed')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'completed'
              ? 'bg-emerald-950/40 border-emerald-500/80 shadow-lg'
              : 'bg-slate-800/70 border-slate-700/60 hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-xs font-semibold">طلبات مكتملة</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white">{completedCount}</div>
        </div>

        <div
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-slate-800 border-blue-500 shadow-lg'
              : 'bg-slate-800/70 border-slate-700/60 hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between text-slate-300 mb-1">
            <span className="text-xs font-semibold">إجمالي الطلبات</span>
            <Filter className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white">{orders.length}</div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث برقم الطلب، اسم الزبون، أو الهاتف..."
            className="w-full pl-3 pr-10 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto py-1">
          {/* All Delivery Orders Interactive Map Button */}
          <button
            type="button"
            onClick={() => setIsAllOrdersMapOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-900/30 transition cursor-pointer shrink-0"
            title="فتح خريطة التوصيل المباشرة"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>خريطة التوصيل المباشرة</span>
            <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-mono">
              {deliveryWithLocationCount}
            </span>
          </button>

          <div className="h-5 w-px bg-slate-700 mx-1 hidden sm:block shrink-0" />

          {[
            { id: 'all', label: 'الكل' },
            { id: 'pending', label: 'قيد الانتظار' },
            { id: 'preparing', label: 'قيد التجهيز' },
            { id: 'completed', label: 'مكتمل' },
            { id: 'cancelled', label: 'ملغي' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-800/40 border border-slate-700/60 text-slate-400">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <h3 className="text-base font-bold text-slate-200">لا توجد طلبات واردة حالياً</h3>
          <p className="text-xs text-slate-400 mt-1">
            عندما يطلب الزبائن من واجهة متجرك الإلكتروني، ستظهر طلباتهم هنا مباشرة.
          </p>
          <button
            type="button"
            onClick={onOpenStorefront}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition inline-flex items-center gap-2 cursor-pointer"
          >
            <span>فتح متجر الزبائن وإنشاء طلب تجريبي</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredOrders.map((order) => {
            const isPending = order.status === 'pending';
            const isPreparing = order.status === 'preparing';

            return (
              <div
                key={order.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isPending
                    ? 'bg-slate-800/90 border-amber-600/50 shadow-md shadow-amber-950/20'
                    : 'bg-slate-800/70 border-slate-700/70'
                }`}
              >
                <div>
                  {/* Order Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-700/70 pb-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white font-mono">{order.orderNumber}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {new Date(order.date).toLocaleDateString('ar-DZ', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="text-left">
                      <span className="text-base font-black text-blue-400 block">
                        {formatMoney(order.total, settings)}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold inline-flex items-center gap-1 ${
                          order.deliveryType === 'delivery'
                            ? 'bg-purple-950/80 text-purple-300 border border-purple-800/50'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {order.deliveryType === 'delivery' ? (
                          <>
                            <Truck className="w-3 h-3" />
                            <span>توصيل للمنزل</span>
                          </>
                        ) : (
                          <>
                            <Store className="w-3 h-3" />
                            <span>استلام من المحل</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs mb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-200">{order.customerName}</div>
                        <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5" dir="ltr">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{order.customerPhone}</span>
                        </div>
                        {order.deliveryAddress && (
                          <div className="text-[11px] text-purple-300 mt-1 flex items-start gap-1">
                            <Truck className="w-3 h-3 shrink-0 mt-0.5" />
                            <span>{order.deliveryAddress}</span>
                          </div>
                        )}
                      </div>

                      {/* Quick WhatsApp & Call */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleWhatsAppCustomer(order)}
                          className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition"
                          title="مراسلة عبر واتساب"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="p-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition"
                          title="اتصال هاتفي"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                    {/* Customer Location & GPS Navigation Block */}
                    {order.deliveryType === 'delivery' && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                        {order.customerLocation && order.customerLocation.lat ? (
                          <div className="p-2 rounded-lg bg-blue-950/40 border border-blue-800/40 text-xs space-y-1.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-1 text-blue-300 font-semibold">
                                <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                <span>موقع الزبون محدد (GPS)</span>
                              </div>
                              {settings.storeLocation && (
                                <span className="font-mono text-blue-300 font-bold bg-blue-900/60 px-1.5 py-0.5 rounded text-[10px]">
                                  {calculateDistanceKm(
                                    settings.storeLocation.lat,
                                    settings.storeLocation.lng,
                                    order.customerLocation.lat,
                                    order.customerLocation.lng
                                  )}{' '}
                                  كم من المحل
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-300 truncate">
                              {order.customerLocation.address || order.deliveryAddress}
                            </div>

                            <div className="flex items-center gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => setSelectedOrderForLocation(order)}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition cursor-pointer shadow-xs"
                              >
                                <Navigation className="w-3 h-3" />
                                <span>عرض الخريطة والملاحة</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const encoded = getWhatsAppLocationMessage(
                                    order.customerName,
                                    order.customerPhone,
                                    order.orderNumber,
                                    order.total,
                                    settings.currency,
                                    order.customerLocation!.lat,
                                    order.customerLocation!.lng,
                                    order.deliveryAddress
                                  );
                                  window.open(`https://wa.me/?text=${encoded}`, '_blank');
                                }}
                                className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                                title="إرسال موقع الزبون لسائق التوصيل عبر واتساب"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>

                              <a
                                href={getGoogleMapsDirectionsUrl(
                                  order.customerLocation.lat,
                                  order.customerLocation.lng,
                                  settings.storeLocation?.lat,
                                  settings.storeLocation?.lng
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
                                title="فتح مباشر في Google Maps"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>

                              <button
                                type="button"
                                onClick={() => setOrderForLocationPicker(order)}
                                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition cursor-pointer"
                                title="تعديل وتحديد الموقع"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 border border-dashed border-slate-700 text-xs">
                            <span className="text-[11px] text-slate-400">إحداثيات GPS غير محددة بعد</span>
                            <button
                              type="button"
                              onClick={() => setOrderForLocationPicker(order)}
                              className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                            >
                              <MapPin className="w-3 h-3" />
                              <span>تحديد على الخريطة</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Order Items Table */}
                  <div className="space-y-1.5 my-3 max-h-40 overflow-y-auto pr-1">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-1.5 border-b border-slate-700/40 last:border-none gap-2"
                      >
                        <div className="flex items-center gap-2 text-slate-300 min-w-0 flex-1">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.productName}
                              className="w-7 h-7 rounded-md object-cover border border-slate-700 bg-slate-900 shrink-0"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                              <Package className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <div className="truncate min-w-0">
                            <span className="font-semibold">{item.productName}</span>
                            <span className="text-[11px] text-slate-400 mr-2">
                              × {item.quantity} {item.unit}
                            </span>
                          </div>
                        </div>
                        <div className="font-mono text-slate-200 shrink-0">
                          {formatMoney(item.total, settings)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {order.deliveryFee > 0 && (
                    <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-700/60">
                      <span>رسوم التوصيل:</span>
                      <span className="font-mono">
                        {formatMoney(order.deliveryFee, settings)}
                      </span>
                    </div>
                  )}

                  {order.notes && (
                    <div className="mt-2 p-2 rounded-lg bg-amber-950/20 border border-amber-800/30 text-[11px] text-amber-300 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>ملاحظة الزبون: {order.notes}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => onUpdateOrderStatus(order.id, 'preparing')}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition cursor-pointer"
                      >
                        بدء التجهيز
                      </button>
                    )}

                    {(isPending || isPreparing) && (
                      <button
                        type="button"
                        onClick={() => onUpdateOrderStatus(order.id, 'cancelled')}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 text-xs font-semibold transition cursor-pointer"
                      >
                        إلغاء الطلب
                      </button>
                    )}
                  </div>

                  {/* Convert to POS Invoice Button */}
                  {order.status !== 'completed' && order.status !== 'cancelled' ? (
                    <button
                      type="button"
                      onClick={() => onConvertOrderToInvoice(order)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30 transition cursor-pointer"
                    >
                      <ArrowRightCircle className="w-4 h-4" />
                      <span>إتمام وتحويل لفاتورة كاشير</span>
                    </button>
                  ) : (
                    <div className="text-[11px] text-slate-500">
                      {order.status === 'completed' ? '✓ تم إتمام الطلب وفاتورته' : '✕ طلب ملغي'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 1. Single Customer Location & Route Modal */}
      {selectedOrderForLocation && selectedOrderForLocation.customerLocation && (
        <CustomerLocationModal
          isOpen={!!selectedOrderForLocation}
          onClose={() => setSelectedOrderForLocation(null)}
          location={selectedOrderForLocation.customerLocation}
          customerName={selectedOrderForLocation.customerName}
          customerPhone={selectedOrderForLocation.customerPhone}
          orderNumber={selectedOrderForLocation.orderNumber}
          totalAmount={selectedOrderForLocation.total}
          currency={settings.currency}
          storeLocation={settings.storeLocation}
          deliveryAddress={selectedOrderForLocation.deliveryAddress}
        />
      )}

      {/* 2. All Orders Live Map Modal */}
      {isAllOrdersMapOpen && (
        <AllDeliveryOrdersMapModal
          isOpen={isAllOrdersMapOpen}
          onClose={() => setIsAllOrdersMapOpen(false)}
          orders={orders}
          settings={settings}
        />
      )}

      {/* 3. Location Picker Modal */}
      {orderForLocationPicker && (
        <LocationPickerModal
          isOpen={!!orderForLocationPicker}
          onClose={() => setOrderForLocationPicker(null)}
          initialLocation={orderForLocationPicker.customerLocation}
          title={`تحديد موقع الزبون: ${orderForLocationPicker.customerName} (${orderForLocationPicker.orderNumber})`}
          subtitle="حدد المكان بدقة لتسهيل وصول سيارة التوصيل والملاحة"
          onConfirm={(loc) => {
            if (onUpdateOrderLocation && orderForLocationPicker) {
              onUpdateOrderLocation(orderForLocationPicker.id, loc);
            }
            setOrderForLocationPicker(null);
          }}
        />
      )}
    </div>
  );
};
