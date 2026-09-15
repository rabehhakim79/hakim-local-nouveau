import { useState, useMemo, useRef, type FormEvent } from 'react';
import { Product, CartItem, SaleInvoice, StoreSettings } from '../types';
import {
  Search,
  Barcode,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Banknote,
  CreditCard,
  AlertTriangle,
  RotateCcw,
  Check,
  ArrowRight,
  User,
  Image as ImageIcon,
} from 'lucide-react';

interface POSScreenProps {
  products: Product[];
  settings: StoreSettings;
  onCompleteSale: (invoice: SaleInvoice, updatedProducts: Product[]) => void;
  onSelectProductForReceipt: (invoice: SaleInvoice) => void;
  onSoundTrigger?: (type: 'beep' | 'success') => void;
}

export const POSScreen = ({
  products,
  settings,
  onCompleteSale,
  onSoundTrigger,
}: POSScreenProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState<number>(0);

  // Payment Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'debt'>('cash');
  const [tenderedAmount, setTenderedAmount] = useState<string>('');
  const [saleNotes, setSaleNotes] = useState('');

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return ['الكل', ...Array.from(set)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat = selectedCategory === 'الكل' || p.category === selectedCategory;
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  // Add to cart
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

    onSoundTrigger?.('beep');
  };

  // Barcode scanner submission
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

  // Adjust item quantity in cart
  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) return item;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setCustomerName('');
  };

  // Totals calculations
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

  const profit = Math.max(0, grandTotal - totalCost);

  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setTenderedAmount(grandTotal.toString());
    setIsCheckoutOpen(true);
  };

  const handleFinalizeSale = () => {
    if (cart.length === 0) return;

    const invoice: SaleInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString(),
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        productImage: item.product.image,
        quantity: item.quantity,
        unitPrice: item.product.sellingPrice,
        purchasePrice: item.product.purchasePrice,
        total: item.product.sellingPrice * item.quantity,
      })),
      subtotal,
      discount,
      taxAmount,
      grandTotal,
      profit,
      paidAmount: paymentMethod === 'debt' ? 0 : grandTotal,
      paymentMethod,
      customerName: customerName.trim() || undefined,
      notes: saleNotes.trim() || undefined,
    };

    // Decrement stock from products
    const updatedProducts = products.map((p) => {
      const cartItem = cart.find((ci) => ci.product.id === p.id);
      if (cartItem) {
        return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
      }
      return p;
    });

    onSoundTrigger?.('success');
    onCompleteSale(invoice, updatedProducts);

    setCart([]);
    setDiscount(0);
    setCustomerName('');
    setSaleNotes('');
    setIsCheckoutOpen(false);
  };

  const tenderedNum = parseFloat(tenderedAmount) || 0;
  const changeDue = Math.max(0, tenderedNum - grandTotal);

  return (
    <div id="pos-screen" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Product Catalog Grid with Images (7 cols on large screens) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Search & Barcode Bar */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-sm space-y-3">
          <form onSubmit={handleBarcodeSubmit} className="relative">
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              ref={barcodeInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="امسح الباركود أو ابحث باسم المنتوج..."
              className="w-full pl-24 pr-11 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center gap-1.5 text-xs text-slate-400">
              <Barcode className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">مسح ضوئي</span>
            </div>
          </form>

          {/* Categories Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Visual Tiles (Image + Name prominent display) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[640px] overflow-y-auto pr-1">
          {filteredProducts.map((product) => {
            const inCart = cart.find((ci) => ci.product.id === product.id);
            const isOutOfStock = product.stock <= 0;

            return (
              <button
                key={product.id}
                type="button"
                disabled={isOutOfStock}
                onClick={() => addToCart(product)}
                className={`p-2.5 rounded-2xl border text-right transition-all flex flex-col justify-between h-44 relative cursor-pointer group overflow-hidden ${
                  isOutOfStock
                    ? 'bg-slate-900/40 border-slate-800/80 opacity-50 cursor-not-allowed'
                    : inCart
                    ? 'bg-slate-850 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                {/* Image */}
                <div className="w-full h-24 rounded-xl bg-slate-950 overflow-hidden relative mb-2 shrink-0">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <ImageIcon className="w-6 h-6 stroke-1" />
                    </div>
                  )}

                  {/* Stock tag */}
                  <span
                    className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-md ${
                      isOutOfStock
                        ? 'bg-rose-950/90 text-rose-300'
                        : product.stock <= product.minStockAlert
                        ? 'bg-amber-950/90 text-amber-300'
                        : 'bg-slate-950/80 text-slate-200'
                    }`}
                  >
                    {isOutOfStock ? 'نفد' : `${product.stock}`}
                  </span>

                  {/* inCart Badge */}
                  {inCart && (
                    <span className="absolute bottom-1.5 left-1.5 w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                      {inCart.quantity}
                    </span>
                  )}
                </div>

                {/* Product Name & Price */}
                <div className="flex-1 flex flex-col justify-between w-full">
                  <h4 className="text-xs font-bold text-slate-100 line-clamp-1 group-hover:text-blue-400 transition-colors">
                    {product.name}
                  </h4>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-sm font-black text-blue-400 font-mono">
                      {product.sellingPrice.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400">{settings.currency}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cart & Billing Checkout Panel (5 cols) */}
      <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col space-y-4">
        {/* Cart Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-slate-100 text-base">سلة الفاتورة الحالية</h3>
            <span className="text-xs bg-slate-950 px-2.5 py-0.5 rounded-full text-blue-300 font-mono font-bold border border-slate-800">
              {cart.reduce((s, i) => s + i.quantity, 0)} عنصر
            </span>
          </div>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
              title="إفراغ السلة"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Customer Name input */}
        <div>
          <label className="text-slate-400 text-xs block mb-1 flex items-center gap-1 font-medium">
            <User className="w-3.5 h-3.5 text-blue-400" />
            <span>اسم العميل (اختياري):</span>
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="عميل نقدي / الاسم..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Cart Items List */}
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {cart.length === 0 ? (
            <div className="py-14 text-center text-slate-500 text-xs space-y-2">
              <ShoppingBag className="w-10 h-10 text-slate-700 mx-auto" />
              <p>السلة فارغة حالياً</p>
              <p className="text-[11px] text-slate-600">اضغط على أي منتوج لإضافته إلى الفاتورة</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
              >
                {/* Product Thumbnail & Name */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0">
                    {item.product.image ? (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="truncate">
                    <h5 className="font-bold text-slate-100 truncate">{item.product.name}</h5>
                    <div className="text-[11px] text-blue-300 font-mono">
                      {item.product.sellingPrice.toLocaleString()} {settings.currency} × {item.quantity} ={' '}
                      <strong className="text-white font-bold">
                        {(item.product.sellingPrice * item.quantity).toLocaleString()} {settings.currency}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Qty Controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-bold text-white font-mono">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Calculations */}
        <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>المجموع الجزئي:</span>
            <span className="font-mono">{subtotal.toLocaleString()} {settings.currency}</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400">الخصم / التخفيض:</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                value={discount || ''}
                onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0"
                className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-right text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
              />
              <span className="text-[11px] text-slate-500">{settings.currency}</span>
            </div>
          </div>

          {settings.taxRate > 0 && (
            <div className="flex justify-between text-slate-400">
              <span>الضريبة ({settings.taxRate}%):</span>
              <span className="font-mono">{taxAmount.toLocaleString()} {settings.currency}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-lg font-bold text-white pt-2 border-t border-slate-800">
            <span>الإجمالي النهائي:</span>
            <span className="text-emerald-400 font-mono text-2xl font-black">
              {grandTotal.toLocaleString()} {settings.currency}
            </span>
          </div>
        </div>

        {/* Checkout CTA */}
        <button
          type="button"
          disabled={cart.length === 0}
          onClick={handleOpenCheckout}
          className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            cart.length === 0
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl shadow-emerald-950/40 active:scale-[0.99]'
          }`}
        >
          <Banknote className="w-5 h-5" />
          <span>تأكيد وطباعة الفاتورة ({grandTotal.toLocaleString()} {settings.currency})</span>
        </button>
      </div>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div
          id="checkout-payment-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setIsCheckoutOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 space-y-5 text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-400" />
                <span>إتمام عملية البيع</span>
              </h3>
              <span className="text-xl font-black text-emerald-400 font-mono">
                {grandTotal.toLocaleString()} {settings.currency}
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2 text-xs">
              <label className="text-slate-400 block font-medium">اختر طريقة الدفع:</label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                  <span>نقداً</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'bg-blue-950/80 border-blue-500 text-blue-300 ring-1 ring-blue-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>بطاقة بنكية</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('debt')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'debt'
                      ? 'bg-amber-950/80 border-amber-500 text-amber-300 ring-1 ring-amber-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span>بالدين / آجل</span>
                </button>
              </div>
            </div>

            {/* Cash Tender Calculation */}
            {paymentMethod === 'cash' && (
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">المبلغ المدفوع من العميل:</span>
                  <input
                    type="number"
                    value={tenderedAmount}
                    onChange={(e) => setTenderedAmount(e.target.value)}
                    className="w-32 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-left text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Quick denomination pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[500, 1000, 2000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTenderedAmount(amt.toString())}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-slate-300 cursor-pointer"
                    >
                      {amt.toLocaleString()} {settings.currency}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTenderedAmount(grandTotal.toString())}
                    className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 rounded-lg text-xs text-emerald-300 font-bold cursor-pointer"
                  >
                    المبلغ بالتمام
                  </button>
                </div>

                <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-800">
                  <span className="text-slate-300">الباقي للزبون (الصرف):</span>
                  <span className="font-bold text-amber-300 font-mono text-base">
                    {changeDue.toLocaleString()} {settings.currency}
                  </span>
                </div>
              </div>
            )}

            {/* Note */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">ملاحظة الفاتورة:</label>
              <input
                type="text"
                value={saleNotes}
                onChange={(e) => setSaleNotes(e.target.value)}
                placeholder="ملاحظات اختيارية..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs text-slate-400 hover:bg-slate-800 transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleFinalizeSale}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transition cursor-pointer"
              >
                <span>تأكيد وحفظ البيع</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
