import { Product } from '../types';
import {
  Edit2,
  Trash2,
  Plus,
  Minus,
  Barcode,
  Image as ImageIcon,
  Check,
} from 'lucide-react';

interface ProductCardProps {
  key?: string;
  product: Product;
  currency: string;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onQuickAdjustStock: (id: string, delta: number) => void;
  onAddToCart?: (product: Product) => void;
  inCartCount?: number;
}

export const ProductCard = ({
  product,
  currency,
  onEdit,
  onDelete,
  onQuickAdjustStock,
  onAddToCart,
  inCartCount = 0,
}: ProductCardProps) => {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock <= product.minStockAlert;
  const margin = product.sellingPrice - product.purchasePrice;

  return (
    <div
      id={`product-card-${product.id}`}
      className={`group rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden bg-slate-900/90 ${
        isOutOfStock
          ? 'border-rose-900/40 opacity-75'
          : inCartCount > 0
          ? 'border-blue-500 shadow-lg ring-1 ring-blue-500/50'
          : 'border-slate-800 hover:border-slate-700 hover:shadow-md'
      }`}
    >
      {/* Product Image Section */}
      <div className="relative aspect-4/3 w-full bg-slate-950 overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-1 bg-slate-950/80">
            <ImageIcon className="w-8 h-8 stroke-1" />
            <span className="text-[10px]">بدون صورة</span>
          </div>
        )}

        {/* Floating Category Badge */}
        <div className="absolute top-2.5 right-2.5">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-950/85 backdrop-blur-md text-slate-200 border border-slate-700/60 shadow-sm">
            {product.category}
          </span>
        </div>

        {/* Floating Stock Status Badge */}
        <div className="absolute top-2.5 left-2.5">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md border shadow-sm ${
              isOutOfStock
                ? 'bg-rose-950/90 text-rose-300 border-rose-800'
                : isLowStock
                ? 'bg-amber-950/90 text-amber-300 border-amber-800 animate-pulse'
                : 'bg-emerald-950/90 text-emerald-300 border-emerald-800'
            }`}
          >
            {isOutOfStock ? 'نفد المخزون' : `${product.stock} ${product.unit}`}
          </span>
        </div>

        {/* inCart indicator overlay */}
        {inCartCount > 0 && (
          <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-lg flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            <span>في السلة: {inCartCount}</span>
          </div>
        )}
      </div>

      {/* Product Content / Name & Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Product Name - Prominently Displayed */}
          <h3
            className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Barcode & Unit */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 font-mono">
            <span className="flex items-center gap-1 truncate max-w-[140px]">
              <Barcode className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{product.barcode}</span>
            </span>
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
              {product.unit}
            </span>
          </div>
        </div>

        {/* Pricing Block */}
        <div className="pt-2 border-t border-slate-800 flex items-baseline justify-between">
          <div>
            <span className="text-lg font-black text-blue-400 font-mono">
              {product.sellingPrice.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 mr-1 font-medium">{currency}</span>
          </div>
          {margin > 0 && (
            <span className="text-[11px] text-emerald-400 font-mono" title="هامش الربح التقريبي">
              +{margin.toLocaleString()} {currency}
            </span>
          )}
        </div>

        {/* Stock Adjuster & Action Buttons */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
          {/* Quick Stock Controls */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => onQuickAdjustStock(product.id, -1)}
              className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs transition cursor-pointer"
              title="إنقاص الكمية -1"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-8 text-center font-mono font-bold text-xs text-slate-200">
              {product.stock}
            </span>
            <button
              type="button"
              onClick={() => onQuickAdjustStock(product.id, 1)}
              className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs transition cursor-pointer"
              title="زيادة الكمية +1"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1">
            {onAddToCart && (
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => onAddToCart(product)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm transition cursor-pointer"
                title="إضافة إلى الفاتورة"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>بيع</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onEdit(product)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-300 hover:bg-slate-800 transition cursor-pointer"
              title="تعديل المنتوج والصورة"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm(`هل أنت متأكد من حذف المنتوج: "${product.name}"؟`)) {
                  onDelete(product.id);
                }
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
              title="حذف المنتوج"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
