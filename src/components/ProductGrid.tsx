import { useState, useMemo, type ChangeEvent } from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  AlertTriangle,
  Package,
  Barcode,
  TrendingUp,
  Download,
  Upload,
  RefreshCw,
  Image as ImageIcon,
  Edit2,
  Trash2,
} from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  currency: string;
  onOpenAddModal: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onQuickAdjustStock: (id: string, delta: number) => void;
  onAddToCart?: (product: Product) => void;
  onExportData: () => void;
  onImportData: (e: ChangeEvent<HTMLInputElement>) => void;
  onResetSampleData: () => void;
}

export const ProductGrid = ({
  products,
  currency,
  onOpenAddModal,
  onEditProduct,
  onDeleteProduct,
  onQuickAdjustStock,
  onAddToCart,
  onExportData,
  onImportData,
  onResetSampleData,
}: ProductGridProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return ['الكل', ...Array.from(set)];
  }, [products]);

  // Calculations
  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stock <= p.minStockAlert).length;
  }, [products]);

  const totalInventoryValue = useMemo(() => {
    return products.reduce((acc, p) => acc + p.stock * p.purchasePrice, 0);
  }, [products]);

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
      const matchLowStock = !filterLowStock || p.stock <= p.minStockAlert;
      return matchCat && matchSearch && matchLowStock;
    });
  }, [products, searchQuery, selectedCategory, filterLowStock]);

  return (
    <div id="product-grid-section" className="space-y-6">
      {/* Top Inventory Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400">إجمالي المنتجات</span>
            <h3 className="text-2xl font-bold font-mono text-slate-100">{products.length}</h3>
          </div>
          <div className="p-3 bg-blue-950/80 text-blue-400 rounded-2xl border border-blue-800/50">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400">تنبيهات نقص المخزون</span>
            <h3
              className={`text-2xl font-bold font-mono ${
                lowStockCount > 0 ? 'text-amber-400' : 'text-slate-100'
              }`}
            >
              {lowStockCount}
            </h3>
          </div>
          <div className="p-3 bg-amber-950/80 text-amber-400 rounded-2xl border border-amber-800/50">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400">قيمة المخزون بسعر الشراء</span>
            <h3 className="text-xl font-bold font-mono text-slate-100">
              {totalInventoryValue.toLocaleString()} {currency}
            </h3>
          </div>
          <div className="p-3 bg-emerald-950/80 text-emerald-400 rounded-2xl border border-emerald-800/50">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400">القيمة المتوقعة بسعر البيع</span>
            <h3 className="text-xl font-bold font-mono text-blue-400">
              {totalSalesPotential.toLocaleString()} {currency}
            </h3>
          </div>
          <div className="p-3 bg-purple-950/80 text-purple-400 rounded-2xl border border-purple-800/50">
            <Package className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control & Filter Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-md">
        <div className="flex flex-1 flex-wrap gap-3 w-full items-center">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم، الباركود أو التصنيف..."
              className="w-full pl-3 pr-10 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Low Stock Toggle Button */}
          <button
            type="button"
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              filterLowStock
                ? 'bg-amber-800 text-white shadow-sm'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>نقص المخزون ({lowStockCount})</span>
          </button>
        </div>

        {/* View Mode & Add Product Button */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end shrink-0">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="عرض البطاقات والصور"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="عرض جدول التفاصيل"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Primary Action: Add Product with Image & Name */}
          <button
            type="button"
            onClick={onOpenAddModal}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة منتوج بالصورة</span>
          </button>
        </div>
      </div>

      {/* Main Products Display */}
      {filteredProducts.length === 0 ? (
        <div className="py-20 text-center text-slate-400 space-y-3 bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6">
          <div className="w-16 h-16 rounded-3xl bg-slate-800/60 flex items-center justify-center mx-auto text-slate-500 border border-slate-700/60">
            <ImageIcon className="w-8 h-8 stroke-1" />
          </div>
          <h4 className="text-base font-bold text-slate-200">لا توجد منتجات مطابقة للبحث</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            جرّب تغيير كلمة البحث أو قم بإضافة منتوج جديد مع الصورة واسم المنتوج.
          </p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة أول منتوج الآن</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW: High-Res Cards with Image + Name */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              currency={currency}
              onEdit={onEditProduct}
              onDelete={onDeleteProduct}
              onQuickAdjustStock={onQuickAdjustStock}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      ) : (
        /* TABLE VIEW: Detailed table with Photo avatar + Name */
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-medium">
                <tr>
                  <th className="py-3.5 px-4">صورة المنتوج</th>
                  <th className="py-3.5 px-4">اسم المنتوج</th>
                  <th className="py-3.5 px-4">الباركود</th>
                  <th className="py-3.5 px-4">التصنيف</th>
                  <th className="py-3.5 px-4">سعر الشراء</th>
                  <th className="py-3.5 px-4">سعر البيع</th>
                  <th className="py-3.5 px-4">الربح</th>
                  <th className="py-3.5 px-4 text-center">المخزون</th>
                  <th className="py-3.5 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredProducts.map((p) => {
                  const margin = p.sellingPrice - p.purchasePrice;
                  const isLow = p.stock <= p.minStockAlert;
                  const isOut = p.stock <= 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-850 transition-colors">
                      {/* Product Image Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-600" />
                          )}
                        </div>
                      </td>

                      {/* Product Name */}
                      <td className="py-3 px-4 font-bold text-slate-100 max-w-[200px]">
                        <div className="truncate" title={p.name}>
                          {p.name}
                        </div>
                        {p.description && (
                          <div className="text-[10px] text-slate-500 font-normal truncate mt-0.5">
                            {p.description}
                          </div>
                        )}
                      </td>

                      {/* Barcode */}
                      <td className="py-3 px-4 font-mono text-slate-400">
                        <div className="flex items-center gap-1">
                          <Barcode className="w-3.5 h-3.5 text-slate-500" />
                          <span>{p.barcode}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-slate-300">
                        <span className="bg-slate-800 px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-slate-700/60">
                          {p.category}
                        </span>
                      </td>

                      {/* Purchase Price */}
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {p.purchasePrice.toLocaleString()} {currency}
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-4 font-mono font-bold text-blue-400">
                        {p.sellingPrice.toLocaleString()} {currency}
                      </td>

                      {/* Margin */}
                      <td className="py-3 px-4 font-mono text-emerald-400">
                        +{margin.toLocaleString()} {currency}
                      </td>

                      {/* Stock Adjuster */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                          <button
                            type="button"
                            onClick={() => onQuickAdjustStock(p.id, -1)}
                            className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-mono cursor-pointer"
                            title="إنقاص -1"
                          >
                            -
                          </button>
                          <span
                            className={`px-2 py-0.5 rounded font-mono font-bold min-w-[48px] text-[11px] ${
                              isOut
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : isLow
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'text-slate-200'
                            }`}
                          >
                            {p.stock} {p.unit}
                          </span>
                          <button
                            type="button"
                            onClick={() => onQuickAdjustStock(p.id, 1)}
                            className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-mono cursor-pointer"
                            title="زيادة +1"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {onAddToCart && (
                            <button
                              type="button"
                              disabled={isOut}
                              onClick={() => onAddToCart(p)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                              title="إضافة للسلة"
                            >
                              <Plus className="w-3 h-3" />
                              <span>بيع</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onEditProduct(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-300 hover:bg-slate-800 transition cursor-pointer"
                            title="تعديل"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف المنتوج: "${p.name}"؟`)) {
                                onDeleteProduct(p.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Backup and Data Management Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-blue-400" />
          <span>إدارة وحفظ المنتجات محلياً في جهازك:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onExportData}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>تصدير نسخة احتياطية (JSON)</span>
          </button>
          <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition cursor-pointer border border-slate-700">
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>استرجاع نسخة</span>
            <input type="file" accept=".json" onChange={onImportData} className="hidden" />
          </label>
          <button
            type="button"
            onClick={() => {
              if (confirm('هل ترغب في إعادة تحميل المنتجات التجريبية الافتراضية؟')) {
                onResetSampleData();
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>إعادة تعيين النماذج</span>
          </button>
        </div>
      </div>
    </div>
  );
};
