import { useState, useMemo, useRef, useEffect, type FormEvent } from 'react';
import { Product, CartItem, Customer, StoreSettings, SaleInvoice } from '../../types/store';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Clock,
  User,
  ShoppingBag,
  RotateCcw,
  Check,
  AlertTriangle,
  ArrowRight,
  Package,
} from 'lucide-react';
import { playBeep } from '../../utils/audioBeep';
import { formatMoney } from '../../utils/formatUtils';

interface POSViewProps {
  products: Product[];
  customers: Customer[];
  settings: StoreSettings;
  onCompleteSale: (invoice: SaleInvoice, updatedProducts: Product[], updatedCustomers: Customer[]) => void;
}

export const POSView = ({ products, customers, settings, onCompleteSale }: POSViewProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [heldOrders, setHeldOrders] = useState<{ id: string; time: string; items: CartItem[]; customerId: string }[]>([]);

  // Checkout modal state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'debt'>('cash');
  const [tenderedAmount, setTenderedAmount] = useState<string>('');
  const [paidDebtAmount, setPaidDebtAmount] = useState<string>('0');
  const [saleNotes, setSaleNotes] = useState('');

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return ['الكل', ...Array.from(set)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchCategory = selectedCategory === 'الكل' || p.category === selectedCategory;
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  // Add to cart
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      if (settings.enableSoundAlerts) playBeep('warning');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          if (settings.enableSoundAlerts) playBeep('warning');
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { product, quantity: 1, discount: 0 }];
      }
    });

    if (settings.enableSoundAlerts) playBeep('beep');
  };

  // Handle direct barcode scanner submission (Enter key)
  const handleBarcodeSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const matched = products.find(
      (p) => p.barcode.toLowerCase() === searchQuery.trim().toLowerCase()
    );

    if (matched) {
      addToCart(matched);
      setSearchQuery('');
    }
  };

  // Update item quantity
  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) {
              if (settings.enableSoundAlerts) playBeep('warning');
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Remove single item from cart
  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Clear cart
  const clearCart = () => {
    if (cart.length === 0) return;
    setCart([]);
    setDiscount(0);
    setSelectedCustomerId('');
  };

  // Hold order
  const handleHoldOrder = () => {
    if (cart.length === 0) return;
    const newHold = {
      id: `hold-${Date.now()}`,
      time: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }),
      items: [...cart],
      customerId: selectedCustomerId,
    };
    setHeldOrders((prev) => [newHold, ...prev]);
    clearCart();
  };

  // Restore held order
  const restoreHeldOrder = (holdId: string) => {
    const held = heldOrders.find((h) => h.id === holdId);
    if (!held) return;
    setCart(held.items);
    setSelectedCustomerId(held.customerId);
    setHeldOrders((prev) => prev.filter((h) => h.id !== holdId));
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  }, [cart]);

  const taxAmount = useMemo(() => {
    if (!settings.taxRate || settings.taxRate <= 0) return 0;
    const afterDiscount = Math.max(0, subtotal - discount);
    return Math.round((afterDiscount * settings.taxRate) / 100);
  }, [subtotal, discount, settings.taxRate]);

  const grandTotal = useMemo(() => {
    const afterDiscount = Math.max(0, subtotal - discount);
    return afterDiscount + taxAmount;
  }, [subtotal, discount, taxAmount]);

  const totalCost = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.purchasePrice * item.quantity, 0);
  }, [cart]);

  const estimatedProfit = useMemo(() => {
    return Math.max(0, grandTotal - totalCost);
  }, [grandTotal, totalCost]);

  // Handle open payment modal
  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setTenderedAmount(grandTotal.toString());
    setPaidDebtAmount('0');
    setIsPaymentOpen(true);
  };

  // Finalize Sale
  const handleFinalizeSale = () => {
    if (cart.length === 0) return;

    const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

    let paid = grandTotal;
    let debt = 0;

    if (paymentMethod === 'debt') {
      const parsedPaid = parseFloat(paidDebtAmount) || 0;
      paid = Math.min(grandTotal, Math.max(0, parsedPaid));
      debt = Math.max(0, grandTotal - paid);
    }

    const saleInvoice: SaleInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString(),
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        barcode: item.product.barcode,
        quantity: item.quantity,
        unitPrice: item.product.sellingPrice,
        purchasePrice: item.product.purchasePrice,
        total: item.product.sellingPrice * item.quantity,
        imageUrl: item.product.imageUrl,
      })),
      subtotal,
      discount,
      taxPercent: settings.taxRate || 0,
      taxAmount,
      grandTotal,
      profit: estimatedProfit,
      paymentMethod,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      paidAmount: paid,
      remainingDebt: debt,
      status: 'completed',
      notes: saleNotes,
    };

    // 1. Decrement products stock
    const updatedProducts = products.map((p) => {
      const cartItem = cart.find((ci) => ci.product.id === p.id);
      if (cartItem) {
        return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
      }
      return p;
    });

    // 2. Update customer debt if applicable
    let updatedCustomers = [...customers];
    if (selectedCustomer) {
      updatedCustomers = customers.map((c) => {
        if (c.id === selectedCustomer.id) {
          const newDebt = c.totalDebt + debt;
          const newPurchases = c.totalPurchases + grandTotal;
          const historyEntry = debt > 0 ? [
            {
              id: `debt-${Date.now()}`,
              date: new Date().toISOString(),
              type: 'charge' as const,
              amount: debt,
              invoiceId: saleInvoice.invoiceNumber,
              notes: `باقي فاتورة رقم ${saleInvoice.invoiceNumber}`,
            },
          ] : [];
          return {
            ...c,
            totalDebt: newDebt,
            totalPurchases: newPurchases,
            debtHistory: [...historyEntry, ...c.debtHistory],
          };
        }
        return c;
      });
    }

    if (settings.enableSoundAlerts) playBeep('success');

    onCompleteSale(saleInvoice, updatedProducts, updatedCustomers);

    // Reset cart and checkout modal
    setCart([]);
    setDiscount(0);
    setSelectedCustomerId('');
    setSaleNotes('');
    setIsPaymentOpen(false);
  };

  const tenderedNum = parseFloat(tenderedAmount) || 0;
  const changeDue = Math.max(0, tenderedNum - grandTotal);

  return (
    <div id="pos-view" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* RIGHT SIDE: Products Catalog (Takes 7 cols on large screens in RTL) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Search & Barcode Bar */}
        <div className="bg-slate-800/90 border border-slate-700/70 p-4 rounded-2xl shadow-sm space-y-3">
          <form onSubmit={handleBarcodeSubmit} className="relative">
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              ref={barcodeInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم أو امسح الباركود واضغط Enter..."
              className="w-full pl-24 pr-11 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center gap-1.5 text-xs text-slate-400">
              <Barcode className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">ماسح الباركود</span>
            </div>
          </form>

          {/* Categories Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-900/80 text-slate-300 hover:bg-slate-700 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Held Orders quick bar if any */}
        {heldOrders.length > 0 && (
          <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-3 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>يوجد {heldOrders.length} طلب معلّق مؤقتاً:</span>
            </div>
            <div className="flex items-center gap-2">
              {heldOrders.map((h, i) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => restoreHeldOrder(h.id)}
                  className="px-2.5 py-1 bg-amber-800 hover:bg-amber-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                  طلب #{i + 1} ({h.time})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-3.5 max-h-[620px] overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 space-y-2">
              <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm">لم يتم العثور على أي منتج يطابق البحث.</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const inCart = cart.find((ci) => ci.product.id === product.id);
              const isLowStock = product.stock <= product.minStockAlert;
              const isOutOfStock = product.stock <= 0;

              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addToCart(product)}
                  disabled={isOutOfStock}
                  className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between min-h-[110px] relative cursor-pointer group ${
                    isOutOfStock
                      ? 'bg-slate-900/40 border-slate-800/80 opacity-50 cursor-not-allowed'
                      : inCart
                      ? 'bg-slate-800/90 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                      : 'bg-slate-800/70 border-slate-700/60 hover:border-slate-500 hover:bg-slate-800'
                  }`}
                >
                  {/* Top Row: Product image + Product Name + Category/Stock */}
                  <div className="flex items-start gap-2.5 w-full">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-700/80 bg-slate-900 shrink-0 group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-slate-500 shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[10px] text-slate-400 bg-slate-900/90 px-1.5 py-0.5 rounded truncate max-w-[80px]">
                          {product.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            isOutOfStock
                              ? 'bg-rose-950 text-rose-300'
                              : isLowStock
                              ? 'bg-amber-950 text-amber-300'
                              : 'bg-emerald-950 text-emerald-300'
                          }`}
                        >
                          {isOutOfStock ? 'نفد' : `${product.stock} ${product.unit}`}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-100 text-xs leading-tight line-clamp-2">
                        {product.name}
                      </h4>
                    </div>
                  </div>

                  {/* Bottom: Price & inCart indicator */}
                  <div className="flex items-center justify-between w-full pt-1.5 mt-1 border-t border-slate-700/40">
                    <span className="text-blue-400 font-bold font-mono text-xs">
                      {formatMoney(product.sellingPrice, settings.currency, settings.currencyDecimals ?? 2)}
                    </span>
                    {inCart && (
                      <span className="bg-blue-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center justify-center shadow-sm">
                        {inCart.quantity} في السلة
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* LEFT SIDE: Active Shopping Cart / Checkout Panel (Takes 5 cols) */}
      <div className="lg:col-span-5 bg-slate-800/95 border border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col space-y-4">
        {/* Cart Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-slate-100 text-base">سلة الفاتورة الحالية</h3>
            <span className="text-xs bg-slate-900 px-2 py-0.5 rounded-full text-slate-400 font-mono">
              {cart.reduce((s, i) => s + i.quantity, 0)} قطع
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {cart.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleHoldOrder}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-700 transition-colors cursor-pointer"
                  title="تعليق الطلب مؤقتاً"
                >
                  <Clock className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={clearCart}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors cursor-pointer"
                  title="إفراغ السلة"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Customer Select */}
        <div className="space-y-1">
          <label className="text-xs text-slate-400 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-blue-400" />
            <span>الزبون / العميل (اختياري):</span>
          </label>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">زبون عابر (دفع فوري)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.totalDebt > 0 ? `(عليه دين: ${formatMoney(c.totalDebt, settings.currency, settings.currencyDecimals ?? 2)})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Cart Items List */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {cart.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs space-y-2">
              <ShoppingBag className="w-8 h-8 text-slate-600 mx-auto opacity-60" />
              <p>السلة فارغة. اختر من المنتجات أو امسح الباركود للبدء.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  {item.product.imageUrl ? (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-700 bg-slate-950 shrink-0"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                      <Package className="w-4 h-4" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h5 className="font-semibold text-slate-200 truncate">{item.product.name}</h5>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span className="font-mono text-blue-300 font-bold">
                        {formatMoney(item.product.sellingPrice, settings.currency, settings.currencyDecimals ?? 2)}
                      </span>
                      <span>×</span>
                      <span className="font-mono font-semibold text-slate-300">{item.quantity}</span>
                    </div>
                  </div>
                </div>

                {/* Qty Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-bold text-slate-100 font-mono">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer mr-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & Discount Area */}
        <div className="pt-3 border-t border-slate-700 space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>المجموع الأولي:</span>
            <span className="font-mono">{formatMoney(subtotal, settings.currency, settings.currencyDecimals ?? 2)}</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400">الخصم (تخفيض):</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                value={discount || ''}
                onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0"
                className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-right text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
              />
              <span className="text-[11px] text-slate-500">{settings.currency}</span>
            </div>
          </div>

          {settings.taxRate > 0 && (
            <div className="flex justify-between text-slate-400">
              <span>الضريبة ({settings.taxRate}%):</span>
              <span className="font-mono">{formatMoney(taxAmount, settings.currency, settings.currencyDecimals ?? 2)}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-lg font-bold text-slate-100 pt-2 border-t border-slate-700/80">
            <span>المبلغ الصافي:</span>
            <span className="text-emerald-400 font-mono text-xl">
              {formatMoney(grandTotal, settings.currency, settings.currencyDecimals ?? 2)}
            </span>
          </div>
        </div>

        {/* Primary Checkout Button */}
        <button
          type="button"
          disabled={cart.length === 0}
          onClick={handleOpenPayment}
          className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            cart.length === 0
              ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 active:scale-[0.99]'
          }`}
        >
          <Banknote className="w-5 h-5" />
          <span>تأكيد الدفع وطباعة الفاتورة</span>
        </button>
      </div>

      {/* MODAL: Checkout / Payment Confirmation */}
      {isPaymentOpen && (
        <div
          id="pos-payment-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setIsPaymentOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-400" />
                <span>إتمام عملية البيع</span>
              </h3>
              <span className="text-xl font-bold text-emerald-400 font-mono">
                {formatMoney(grandTotal, settings.currency, settings.currencyDecimals ?? 2)}
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 block font-medium">طريقة الدفع:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                  <span>دفع نقدي</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'bg-blue-950/80 border-blue-500 text-blue-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>بطاقة بنكية</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('debt')}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'debt'
                      ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span>آجل (على الحساب)</span>
                </button>
              </div>
            </div>

            {/* Cash Tender Calculation */}
            {paymentMethod === 'cash' && (
              <div className="space-y-3 bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">المبلغ المستلم من المشتري:</span>
                  <input
                    type="number"
                    value={tenderedAmount}
                    onChange={(e) => setTenderedAmount(e.target.value)}
                    className="w-32 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-left text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Quick denomination pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[500, 1000, 2000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTenderedAmount(amt.toString())}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-mono text-slate-300 cursor-pointer"
                    >
                      {formatMoney(amt, settings.currency, settings.currencyDecimals ?? 2)}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTenderedAmount(grandTotal.toString())}
                    className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 rounded-lg text-xs text-emerald-300 font-bold cursor-pointer"
                  >
                    المبلغ بالمضبوط
                  </button>
                </div>

                <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-700">
                  <span className="text-slate-300">المتبقي للزبون (الصرف):</span>
                  <span className="font-bold text-amber-300 font-mono text-base">
                    {formatMoney(changeDue, settings.currency, settings.currencyDecimals ?? 2)}
                  </span>
                </div>
              </div>
            )}

            {/* Debt calculation */}
            {paymentMethod === 'debt' && (
              <div className="space-y-3 bg-amber-950/30 p-3.5 rounded-xl border border-amber-800/60 text-xs">
                {!selectedCustomerId ? (
                  <p className="text-amber-300 font-medium">
                    ⚠️ تنبيه: يرجى تحديد اسم العميل في السلة لتسجيل هذا الدين في حسابه.
                  </p>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">المدفوع نقداً الآن (إن وجد):</span>
                      <input
                        type="number"
                        min="0"
                        max={grandTotal}
                        value={paidDebtAmount}
                        onChange={(e) => setPaidDebtAmount(e.target.value)}
                        className="w-32 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-left font-mono text-slate-100"
                      />
                    </div>
                    <div className="flex justify-between text-rose-300 font-bold">
                      <span>المتبقي ديناً على الزبون:</span>
                      <span className="font-mono">
                        {formatMoney(Math.max(0, grandTotal - (parseFloat(paidDebtAmount) || 0)), settings.currency, settings.currencyDecimals ?? 2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">ملاحظة على الفاتورة (اختياري):</label>
              <input
                type="text"
                value={saleNotes}
                onChange={(e) => setSaleNotes(e.target.value)}
                placeholder="مثال: توصيل، زبون ورشة، طلبية خاصة..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPaymentOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleFinalizeSale}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <span>تأكيد وطباعة الفاتورة</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
