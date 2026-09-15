import { useState, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { Product, StoreSettings } from '../../types/store';
import { formatMoney } from '../../utils/formatUtils';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Package,
  Barcode,
  TrendingUp,
  X,
  Check,
  RefreshCw,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
} from 'lucide-react';

interface InventoryViewProps {
  products: Product[];
  settings: StoreSettings;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onQuickAdjustStock: (id: string, delta: number) => void;
}

export const InventoryView = ({
  products,
  settings,
  onSaveProduct,
  onDeleteProduct,
  onQuickAdjustStock,
}: InventoryViewProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [minStockAlert, setMinStockAlert] = useState<number>(5);
  const [unit, setUnit] = useState('قطعة');
  const [imageUrl, setImageUrl] = useState('');
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');

  // Quick preset sample images
  const PRESET_SAMPLE_IMAGES = [
    { label: 'زيت وطبخ', url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&auto=format&fit=crop&q=80' },
    { label: 'سكر ومؤونة', url: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=300&auto=format&fit=crop&q=80' },
    { label: 'قهوة وشاي', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&auto=format&fit=crop&q=80' },
    { label: 'حليب وألبان', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop&q=80' },
    { label: 'جبن وأجبان', url: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300&auto=format&fit=crop&q=80' },
    { label: 'مشروب غازي', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=80' },
    { label: 'عصير طبيعي', url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=300&auto=format&fit=crop&q=80' },
    { label: 'مياه معدنية', url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=300&auto=format&fit=crop&q=80' },
    { label: 'منظفات وغسيل', url: 'https://images.unsplash.com/photo-1585837575652-267c041d77d4?w=300&auto=format&fit=crop&q=80' },
    { label: 'شوكولاتة وحلوى', url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300&auto=format&fit=crop&q=80' },
    { label: 'بسكويت ومخبوزات', url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&auto=format&fit=crop&q=80' },
    { label: 'أرز وحبوب', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=80' },
  ];

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return ['الكل', ...Array.from(set)];
  }, [products]);

  // Low stock count
  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stock <= p.minStockAlert).length;
  }, [products]);

  // Total inventory estimated value
  const totalInventoryValue = useMemo(() => {
    return products.reduce((acc, p) => acc + p.stock * p.purchasePrice, 0);
  }, [products]);

  // Total potential sales value
  const totalSalesPotential = useMemo(() => {
    return products.reduce((acc, p) => acc + p.stock * p.sellingPrice, 0);
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
      const matchLowStock = !showLowStockOnly || p.stock <= p.minStockAlert;
      return matchCat && matchSearch && matchLowStock;
    });
  }, [products, searchQuery, selectedCategory, showLowStockOnly]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    // Auto-generate realistic barcode
    setBarcode(`613${Math.floor(100000000 + Math.random() * 900000000)}`);
    setCategory(categories[1] || 'مواد غذائية');
    setPurchasePrice(100);
    setSellingPrice(130);
    setStock(20);
    setMinStockAlert(5);
    setUnit('قطعة');
    setImageUrl('');
    setImageInputMode('upload');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setBarcode(p.barcode);
    setCategory(p.category);
    setPurchasePrice(p.purchasePrice);
    setSellingPrice(p.sellingPrice);
    setStock(p.stock);
    setMinStockAlert(p.minStockAlert);
    setUnit(p.unit);
    setImageUrl(p.imageUrl || '');
    setImageInputMode(p.imageUrl?.startsWith('data:') ? 'upload' : 'url');
    setIsModalOpen(true);
  };

  const handleImageFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (JPG, PNG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setImageUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      name: name.trim(),
      barcode: barcode.trim(),
      category: category.trim() || 'عام',
      purchasePrice: Number(purchasePrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      stock: Number(stock) || 0,
      minStockAlert: Number(minStockAlert) || 0,
      unit: unit.trim() || 'قطعة',
      imageUrl: imageUrl.trim() || undefined,
    };

    onSaveProduct(newProduct);
    setIsModalOpen(false);
  };

  return (
    <div id="inventory-view" className="space-y-6">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400">إجمالي أصناف السلع</span>
            <h3 className="text-2xl font-bold font-mono text-slate-100">{products.length}</h3>
          </div>
          <div className="p-3 bg-blue-950/80 text-blue-400 rounded-xl border border-blue-800/50">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400">أصناف أوشكت على النفاد</span>
            <h3 className={`text-2xl font-bold font-mono ${lowStockCount > 0 ? 'text-amber-400' : 'text-slate-100'}`}>
              {lowStockCount}
            </h3>
          </div>
          <div className="p-3 bg-amber-950/80 text-amber-400 rounded-xl border border-amber-800/50">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400">قيمة رأس مال المخزون (الشراء)</span>
            <h3 className="text-xl font-bold font-mono text-slate-100">
              {formatMoney(totalInventoryValue, settings.currency, settings.currencyDecimals ?? 2)}
            </h3>
          </div>
          <div className="p-3 bg-emerald-950/80 text-emerald-400 rounded-xl border border-emerald-800/50">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400">قيمة المخزون عند البيع</span>
            <h3 className="text-xl font-bold font-mono text-blue-400">
              {formatMoney(totalSalesPotential, settings.currency, settings.currencyDecimals ?? 2)}
            </h3>
          </div>
          <div className="p-3 bg-purple-950/80 text-purple-400 rounded-xl border border-purple-800/50">
            <Package className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Action and Filter Bar */}
      <div className="bg-slate-800/90 border border-slate-700/70 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 flex-wrap gap-3 w-full items-center">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن منتج بالاسم أو الباركود..."
              className="w-full pl-3 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Low Stock Toggle */}
          <button
            type="button"
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              showLowStockOnly
                ? 'bg-amber-800 text-white'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>نواقص المخزن ({lowStockCount})</span>
          </button>
        </div>

        {/* Add Product Button */}
        <button
          type="button"
          onClick={handleOpenAdd}
          className="w-full md:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة منتج جديد</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-700 font-medium">
              <tr>
                <th className="py-3 px-4">المنتج / الاسم</th>
                <th className="py-3 px-4">الباركود</th>
                <th className="py-3 px-4">التصنيف</th>
                <th className="py-3 px-4">سعر الشراء</th>
                <th className="py-3 px-4">سعر البيع</th>
                <th className="py-3 px-4">هامش الربح</th>
                <th className="py-3 px-4 text-center">الرصيد في المخزن</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    لا توجد منتجات مطابقة لخيارات البحث الحالية.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const margin = p.sellingPrice - p.purchasePrice;
                  const isLow = p.stock <= p.minStockAlert;
                  const isOut = p.stock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-750/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-200">
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-700 bg-slate-900 shrink-0"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-100 text-sm leading-tight">{p.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono sm:hidden">{p.barcode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        <div className="flex items-center gap-1">
                          <Barcode className="w-3.5 h-3.5 text-slate-500" />
                          <span>{p.barcode}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <span className="bg-slate-900 px-2 py-0.5 rounded text-[11px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {formatMoney(p.purchasePrice, settings.currency, settings.currencyDecimals ?? 2)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-400">
                        {formatMoney(p.sellingPrice, settings.currency, settings.currencyDecimals ?? 2)}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-400">
                        +{formatMoney(margin, settings.currency, settings.currencyDecimals ?? 2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onQuickAdjustStock(p.id, -1)}
                            className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-mono cursor-pointer"
                            title="إنقاص 1"
                          >
                            -
                          </button>
                          <span
                            className={`px-2 py-0.5 rounded font-mono font-bold min-w-[45px] inline-block ${
                              isOut
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : isLow
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-slate-900 text-slate-200'
                            }`}
                          >
                            {p.stock} {p.unit}
                          </span>
                          <button
                            type="button"
                            onClick={() => onQuickAdjustStock(p.id, 1)}
                            className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-mono cursor-pointer"
                            title="زيادة 1"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-300 hover:bg-slate-700 transition-colors cursor-pointer"
                            title="تعديل المنتج"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف المنتج: "${p.name}"؟`)) {
                                onDeleteProduct(p.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors cursor-pointer"
                            title="حذف المنتج"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Modal Add / Edit Product */}
      {isModalOpen && (
        <div
          id="product-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-400" />
                <span>{editingProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج وسلعة جديدة'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Product Image Selection & Live Preview */}
              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-blue-400" />
                    <span>صورة المنتج</span>
                    <span className="text-[10px] font-normal text-slate-400">(اختياري - تظهر مع اسم المنتج في كل الواجهات)</span>
                  </label>

                  <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-700 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setImageInputMode('upload')}
                      className={`px-2 py-1 rounded font-semibold transition cursor-pointer ${
                        imageInputMode === 'upload' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      رفع ملف / كاميرا
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode('url')}
                      className={`px-2 py-1 rounded font-semibold transition cursor-pointer ${
                        imageInputMode === 'url' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      رابط ويب
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  {/* Thumbnail Preview */}
                  <div className="relative w-16 h-16 rounded-xl border border-slate-600 bg-slate-900 flex items-center justify-center shrink-0 overflow-hidden group">
                    {imageUrl ? (
                      <>
                        <img
                          src={imageUrl}
                          alt="معاينة المنتج"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="absolute inset-0 bg-black/70 text-rose-300 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-[10px] font-bold cursor-pointer"
                          title="حذف الصورة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="text-slate-500 flex flex-col items-center justify-center gap-1">
                        <ImageIcon className="w-6 h-6 text-slate-600" />
                        <span className="text-[9px] text-slate-500">لا توجد صورة</span>
                      </div>
                    )}
                  </div>

                  {/* Input controls based on mode */}
                  <div className="flex-1 space-y-1.5">
                    {imageInputMode === 'upload' ? (
                      <div>
                        <label className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl border-2 border-dashed border-slate-600 hover:border-blue-500 hover:bg-slate-700/40 text-slate-300 cursor-pointer transition">
                          <Upload className="w-4 h-4 text-blue-400" />
                          <span className="font-semibold text-xs">
                            {imageUrl ? 'تغيير صورة المنتج' : 'اختر صورة من جهازك أو التقط بالكاميرا'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="url"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="https://... رابط صورة المنتج المباشر"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                        />
                      </div>
                    )}

                    {/* Presets quick tags */}
                    <div className="flex items-center gap-1 overflow-x-auto pt-1 no-scrollbar">
                      <span className="text-[10px] text-slate-400 shrink-0">نماذج سريعة:</span>
                      {PRESET_SAMPLE_IMAGES.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setImageUrl(preset.url)}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-200 shrink-0 transition cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">اسم المنتج والسلعة *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: زيت المائدة 5 لتر، سكر أبيض 1 كغ..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">الباركود (كود السلعة)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => setBarcode(`613${Math.floor(100000000 + Math.random() * 900000000)}`)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-300"
                      title="توليد كود تلقائي"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-medium">التصنيف</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="مواد غذائية، منظفات..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">
                    سعر الشراء ({settings.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-medium">
                    سعر البيع للزبون ({settings.currency}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-blue-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">الكمية بالمخزن</label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-medium">تنبيه النقص عند</label>
                  <input
                    type="number"
                    min="0"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-medium">الوحدة</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                  >
                    <option value="قطعة">قطعة</option>
                    <option value="علبة">علبة</option>
                    <option value="كغ">كغ</option>
                    <option value="لتر">لتر</option>
                    <option value="قارورة">قارورة</option>
                    <option value="كيس">كيس</option>
                    <option value="كرتون">كرتون</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
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
                  <span>{editingProduct ? 'حفظ التعديلات' : 'إضافة السلعة'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
