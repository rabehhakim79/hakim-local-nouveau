import React, { useState, useMemo } from 'react';
import { Product, StoreSettings, OnlineOrder, OnlineOrderItem, GeoLocation } from '../../types/store';
import {
  ShoppingBag,
  Search,
  Plus,
  Minus,
  Trash2,
  Truck,
  Store,
  Clock,
  Phone,
  MapPin,
  MessageCircle,
  Share2,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldCheck,
  Send,
  ExternalLink,
  Package,
  Crosshair,
  Navigation,
} from 'lucide-react';
import { LocationPickerModal } from '../maps/LocationPickerModal';
import { formatMoney } from '../../utils/formatUtils';

interface StorefrontViewProps {
  products: Product[];
  settings: StoreSettings;
  onBackToAdmin: () => void;
  onSubmitOrder: (order: OnlineOrder) => void;
  onOpenShareModal: () => void;
}

interface CartEntry {
  product: Product;
  quantity: number;
}

export const StorefrontView: React.FC<StorefrontViewProps> = ({
  products,
  settings,
  onBackToAdmin,
  onSubmitOrder,
  onOpenShareModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState<OnlineOrder | null>(null);

  // Checkout form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [customerLocation, setCustomerLocation] = useState<GeoLocation | undefined>();
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    cats.add('الكل');
    products.forEach((p) => cats.add(p.category));
    return Array.from(cats);
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'الكل' || p.category === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery);
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) return item;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartEntry[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.sellingPrice * item.quantity, 0);
  }, [cart]);

  const totalCartCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  const deliveryFee = deliveryType === 'delivery' ? (settings.deliveryFee || 0) : 0;
  const grandTotal = cartSubtotal + deliveryFee;

  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || cart.length === 0) return;
    if (deliveryType === 'delivery' && !deliveryAddress.trim()) return;

    const orderNumber = `ORD-${Math.floor(100 + Math.random() * 900)}`;
    const items: OnlineOrderItem[] = cart.map((c) => ({
      productId: c.product.id,
      productName: c.product.name,
      unitPrice: c.product.sellingPrice,
      quantity: c.quantity,
      unit: c.product.unit,
      total: c.product.sellingPrice * c.quantity,
      imageUrl: c.product.imageUrl,
    }));

    const newOrder: OnlineOrder = {
      id: `order-${Date.now()}`,
      orderNumber,
      date: new Date().toISOString(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryType,
      deliveryAddress: deliveryType === 'delivery' ? deliveryAddress.trim() : undefined,
      customerLocation: deliveryType === 'delivery' ? customerLocation : undefined,
      items,
      subtotal: cartSubtotal,
      deliveryFee,
      total: grandTotal,
      status: 'pending',
      notes: customerNotes.trim() || undefined,
    };

    onSubmitOrder(newOrder);
    setOrderCompleted(newOrder);
    setCart([]);
    setIsCheckoutOpen(false);
  };

  const sendOrderViaWhatsApp = (order: OnlineOrder) => {
    const merchantPhone = (settings.whatsappNumber || settings.phone).replace(/[^0-9]/g, '');
    let msg = `*طلب جديد من المتجر الإلكتروني:* (${order.orderNumber})\n`;
    msg += `👤 *الزبون:* ${order.customerName}\n`;
    msg += `📞 *الهاتف:* ${order.customerPhone}\n`;
    msg += `📍 *طريقة الاستلام:* ${order.deliveryType === 'delivery' ? `توصيل إلى (${order.deliveryAddress})` : 'استلام من المحل'}\n`;
    if (order.customerLocation && order.customerLocation.lat) {
      msg += `🗺️ *الموقع على الخريطة (GPS):* https://www.google.com/maps?q=${order.customerLocation.lat},${order.customerLocation.lng}\n`;
    }
    msg += `\n*قائمة الطلبات:*\n`;
    order.items.forEach((item, i) => {
      msg += `${i + 1}. ${item.productName} × ${item.quantity} ${item.unit} = ${formatMoney(item.total, settings.currency, settings.currencyDecimals ?? 2)}\n`;
    });
    if (order.deliveryFee > 0) {
      msg += `🚚 *رسوم التوصيل:* ${formatMoney(order.deliveryFee, settings.currency, settings.currencyDecimals ?? 2)}\n`;
    }
    msg += `\n💰 *المبلغ الإجمالي:* *${formatMoney(order.total, settings.currency, settings.currencyDecimals ?? 2)}*\n`;
    if (order.notes) {
      msg += `📝 *ملاحظات:* ${order.notes}\n`;
    }

    window.open(`https://api.whatsapp.com/send?phone=${merchantPhone}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28">
      {/* Top Admin Bar Switcher */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>أنت الآن في: <strong>واجهة المتجر الإلكتروني للزبائن (Storefront)</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenShareModal}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">مشاركة الرابط والـ QR</span>
          </button>
          <button
            type="button"
            onClick={onBackToAdmin}
            className="flex items-center gap-1.5 px-3.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-sm"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            <span>لوحة الإدارة والكاشير</span>
          </button>
        </div>
      </div>

      {/* Store Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-b from-blue-950/60 via-slate-900 to-slate-950 border-b border-slate-800/80 px-4 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-right">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-blue-500/20 shrink-0 border border-blue-400/30">
              <Store className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1.5">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {settings.storeName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>مفتوح للطلب أونلاين</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                {settings.storeBio || 'مرحباً بكم في متجرنا! تصفح أفضل المنتجات واطلب مباشرة للاستلام من المحل أو التوصيل.'}
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-400 mt-3">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>{settings.address}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{settings.workingHours || 'يومياً 08:00 ص - 10:00 م'}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span dir="ltr">{settings.phone}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const num = (settings.whatsappNumber || settings.phone).replace(/[^0-9]/g, '');
                window.open(`https://api.whatsapp.com/send?phone=${num}`, '_blank');
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>تواصل معنا عبر واتساب</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition"
            >
              <ShoppingBag className="w-4 h-4 text-blue-400" />
              <span>السلة ({totalCartCount})</span>
              {totalCartCount > 0 && (
                <span className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center animate-bounce">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        {/* Search & Categories Bar */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن أي منتج، ماركة، أو صنف بالمتجر..."
              className="w-full pl-4 pr-12 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
            />
          </div>

          {/* Categories Pill Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                    : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-200">
              {selectedCategory === 'الكل' ? 'جميع المنتجات المتوفرة' : selectedCategory} ({filteredProducts.length})
            </h2>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-semibold">لا توجد منتجات مطابقة لبحثك</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('الكل');
                }}
                className="mt-3 text-xs text-blue-400 hover:underline"
              >
                إعادة ضبط البحث
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
              {filteredProducts.map((product) => {
                const inCart = cart.find((c) => c.product.id === product.id);
                const isOutOfStock = product.stock <= 0;

                return (
                  <div
                    key={product.id}
                    className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition flex flex-col justify-between shadow-sm group"
                  >
                    <div>
                      {/* Product Image */}
                      <div className="relative w-full aspect-square sm:h-44 rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 mb-3 flex items-center justify-center">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-600 gap-1">
                            <Package className="w-10 h-10" />
                            <span className="text-[10px] text-slate-500">بدون صورة</span>
                          </div>
                        )}

                        {/* Stock & Category Badges */}
                        <div className="absolute top-2 right-2 left-2 flex items-center justify-between pointer-events-none">
                          <span className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-xs text-slate-200 text-[10px] font-semibold border border-slate-800">
                            {product.category}
                          </span>
                          {isOutOfStock ? (
                            <span className="px-1.5 py-0.5 rounded-md bg-rose-950/90 text-rose-300 text-[10px] font-bold border border-rose-800">
                              نفد
                            </span>
                          ) : product.stock <= product.minStockAlert ? (
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-950/90 text-amber-300 text-[10px] font-bold border border-amber-800">
                              متبقي {product.stock}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-950/90 text-emerald-300 text-[10px] font-bold border border-emerald-800">
                              متوفر
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Product Name */}
                      <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 min-h-[2.5rem] leading-snug">
                        {product.name}
                      </h3>

                      <div className="mt-1 text-[11px] text-slate-400">
                        <span>الوحدة: {product.unit}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-sm sm:text-base font-black text-blue-400 font-mono">
                          {formatMoney(product.sellingPrice, settings.currency, settings.currencyDecimals ?? 2)}
                        </span>
                      </div>

                      {inCart ? (
                        <div className="flex items-center gap-1.5 bg-slate-800 rounded-xl p-1 border border-slate-700">
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, -1)}
                            className="w-6 h-6 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-5 text-center">{inCart.quantity}</span>
                          <button
                            type="button"
                            disabled={inCart.quantity >= product.stock}
                            onClick={() => updateQuantity(product.id, 1)}
                            className="w-6 h-6 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 flex items-center justify-center text-white cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => addToCart(product)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Cart Bar */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-xl mx-auto">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-2xl flex items-center justify-between gap-3 border border-blue-400/30 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                {totalCartCount}
              </div>
              <div>
                <div className="text-xs text-blue-100">سلة التسوق ({totalCartCount} أصناف)</div>
                <div className="text-base font-black font-mono">
                  {formatMoney(cartSubtotal, settings)}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCheckoutOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-900 font-black text-xs hover:bg-blue-50 transition shadow-md cursor-pointer"
            >
              <span>متابعة الطلب ⭢</span>
            </button>
          </div>
        </div>
      )}

      {/* Cart Drawer Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 h-full p-6 flex flex-col justify-between border-r border-slate-800 shadow-2xl">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold text-base text-white">سلة التسوق</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-300 font-bold">
                    {totalCartCount}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                  <p className="text-xs">السلة فارغة حالياً</p>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {item.product.imageUrl ? (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-11 h-11 rounded-lg object-cover border border-slate-700 bg-slate-900 shrink-0"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-white truncate">{item.product.name}</h4>
                          <div className="text-[11px] text-blue-400 font-mono mt-0.5">
                            {formatMoney(item.product.sellingPrice * item.quantity, settings.currency, settings.currencyDecimals ?? 2)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-1 border border-slate-800">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="w-5 h-5 rounded flex items-center justify-center text-slate-300 hover:text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button
                            type="button"
                            disabled={item.quantity >= item.product.stock}
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="w-5 h-5 rounded flex items-center justify-center text-blue-400 hover:text-blue-300 disabled:opacity-40"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-slate-400 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-slate-800 pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">المجموع الفرعي:</span>
                  <span className="font-bold text-white font-mono">
                    {formatMoney(cartSubtotal, settings.currency, settings.currencyDecimals ?? 2)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-lg"
                >
                  إتمام الطلب الآن
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Form Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 relative my-8">
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 left-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">إتمام وتأكيد الطلب</h3>
                <p className="text-xs text-slate-400">أدخل معلوماتك لتأكيد إرسال الطلب للمتجر</p>
              </div>
            </div>

            <form onSubmit={handleConfirmOrder} className="space-y-4 text-xs">
              {/* Delivery method choice */}
              <div>
                <label className="text-slate-300 font-semibold mb-2 block">طريقة الاستلام والتسليم:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('pickup')}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 transition text-right ${
                      deliveryType === 'pickup'
                        ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400'
                    }`}
                  >
                    <Store className="w-4 h-4 text-blue-400 shrink-0" />
                    <div>
                      <div className="text-xs">استلام من المتجر</div>
                      <div className="text-[10px] text-slate-400">مجاني فور التجهيز</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType('delivery')}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 transition text-right ${
                      deliveryType === 'delivery'
                        ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400'
                    }`}
                  >
                    <Truck className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <div className="text-xs">توصيل للمنزل</div>
                      <div className="text-[10px] text-slate-400">
                        +{formatMoney(settings.deliveryFee || 0, settings.currency, settings.currencyDecimals ?? 2)}
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Customer Name */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">الاسم الكامل *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="مثال: يونس قدور"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Customer Phone */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">رقم الهاتف *</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="06XX XX XX XX"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Address if delivery */}
              {deliveryType === 'delivery' && (
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-300 font-semibold text-xs">عنوان التوصيل بالتفصيل *</label>
                      <button
                        type="button"
                        onClick={() => setIsLocationPickerOpen(true)}
                        className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{customerLocation ? 'تعديل على الخريطة' : 'تحديد الموقع بالخريطة (GPS)'}</span>
                      </button>
                    </div>
                    <textarea
                      required
                      rows={2}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="الحي، رقم العمارة، الطابق، أو أقرب معلم..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 text-xs"
                    />
                  </div>

                  {/* Location selected feedback badge */}
                  {customerLocation ? (
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-300 min-w-0">
                        <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div className="truncate">
                          <span className="font-bold block text-[11px]">تم تحديد موقع التوصيل على الخريطة ✓</span>
                          <span className="text-[10px] text-slate-300 font-mono">
                            {customerLocation.lat.toFixed(4)}, {customerLocation.lng.toFixed(4)}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsLocationPickerOpen(true)}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-medium shrink-0 cursor-pointer"
                      >
                        تغيير
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsLocationPickerOpen(true)}
                      className="w-full py-2 px-3 rounded-xl bg-blue-950/40 hover:bg-blue-900/50 border border-dashed border-blue-700/60 text-blue-300 text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Crosshair className="w-4 h-4 text-blue-400" />
                      <span>تحديد موقع بيتك على الخريطة بدقة (GPS) لتسريع التوصيل</span>
                    </button>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">ملاحظات خاصة بالطلب (اختياري)</label>
                <input
                  type="text"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="أي تعليمات خاصة بالطلب أو وقت الوصول..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Summary calculation */}
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>مجموع السلع ({totalCartCount}):</span>
                  <span className="font-mono">{formatMoney(cartSubtotal, settings.currency, settings.currencyDecimals ?? 2)}</span>
                </div>
                {deliveryType === 'delivery' && (
                  <div className="flex justify-between text-purple-300">
                    <span>رسوم التوصيل:</span>
                    <span className="font-mono">+{formatMoney(deliveryFee, settings.currency, settings.currencyDecimals ?? 2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-700">
                  <span>المبلغ الإجمالي للدفع:</span>
                  <span className="text-blue-400 font-mono text-base">{formatMoney(grandTotal, settings.currency, settings.currencyDecimals ?? 2)}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                >
                  رجوع
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-900/30 transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>تأكيد وإرسال الطلب للمتجر</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Success Modal */}
      {orderCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 text-center relative">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-black text-white">تم استلام طلبك بنجاح!</h3>
            <p className="text-xs text-slate-400 mt-1">
              شكراً لتسوقك من <strong>{settings.storeName}</strong>. رقم طلبك هو:
            </p>

            <div className="my-4 p-3 rounded-xl bg-slate-800 border border-slate-700 font-mono text-lg font-bold text-blue-400">
              {orderCompleted.orderNumber}
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              تم إرسال الطلب مباشرة إلى شاشة الكاشير في المحل وجاري مراجعته وتجهيزه.
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => sendOrderViaWhatsApp(orderCompleted)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>إرسال تفاصيل الطلب للمحل عبر واتساب</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderCompleted(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                مواصلة التسوق في المتجر
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Location Picker Modal */}
      {isLocationPickerOpen && (
        <LocationPickerModal
          isOpen={isLocationPickerOpen}
          onClose={() => setIsLocationPickerOpen(false)}
          initialLocation={customerLocation}
          title="تحديد موقع التوصيل على الخريطة"
          subtitle="حدد موقع بيتك أو محلك بدقة لتسهيل وصول سائق التوصيل إليك سريعاً"
          onConfirm={(loc) => {
            setCustomerLocation(loc);
            if (!deliveryAddress && loc.address) {
              setDeliveryAddress(loc.address);
            }
            setIsLocationPickerOpen(false);
          }}
        />
      )}
    </div>
  );
};
