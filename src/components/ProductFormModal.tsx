import { useState, useRef, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { Product } from '../types';
import { PRESET_PRODUCT_IMAGES } from '../data/sampleProducts';
import {
  X,
  Upload,
  Camera,
  Link,
  Sparkles,
  Check,
  Package,
  Barcode,
  Coins,
  RefreshCw,
  Image as ImageIcon,
  Trash2,
  AlertCircle,
} from 'lucide-react';

interface ProductFormModalProps {
  productToEdit?: Product | null;
  categories: string[];
  currency: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
}

export const ProductFormModal = ({
  productToEdit,
  categories,
  currency,
  isOpen,
  onClose,
  onSave,
}: ProductFormModalProps) => {
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>(100);
  const [purchasePrice, setPurchasePrice] = useState<number | ''>(75);
  const [stock, setStock] = useState<number | ''>(20);
  const [minStockAlert, setMinStockAlert] = useState<number | ''>(5);
  const [unit, setUnit] = useState('قطعة');
  const [description, setDescription] = useState('');

  // Image mode tabs
  const [imageTab, setImageTab] = useState<'upload' | 'preset' | 'url' | 'camera'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setImage(productToEdit.image || '');
      setBarcode(productToEdit.barcode);
      setCategory(productToEdit.category);
      setSellingPrice(productToEdit.sellingPrice);
      setPurchasePrice(productToEdit.purchasePrice);
      setStock(productToEdit.stock);
      setMinStockAlert(productToEdit.minStockAlert);
      setUnit(productToEdit.unit);
      setDescription(productToEdit.description || '');
    } else {
      setName('');
      setImage(PRESET_PRODUCT_IMAGES[0]?.url || '');
      setBarcode(`613${Math.floor(100000000 + Math.random() * 900000000)}`);
      setCategory(categories[0] || 'مواد غذائية');
      setSellingPrice(150);
      setPurchasePrice(110);
      setStock(25);
      setMinStockAlert(5);
      setUnit('قطعة');
      setDescription('');
    }
    setErrorMsg('');
  }, [productToEdit, categories, isOpen]);

  // Clean up camera stream on unmount or tab change
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 640 } },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch {
      setErrorMsg('تعذر فتح الكاميرا، يرجى التحقق من الأذونات أو استخدام رفع الصور.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 480;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setImage(dataUrl);
      stopCamera();
      setImageTab('upload');
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('يرجى اختيار ملف صورة صالح (PNG, JPG, WebP).');
      return;
    }

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setImage(result);
        setErrorMsg('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    setImage(urlInput.trim());
    setUrlInput('');
  };

  const handleGenerateBarcode = () => {
    setBarcode(`613${Math.floor(100000000 + Math.random() * 900000000)}`);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('يرجى كتابة اسم المنتوج.');
      return;
    }

    const finalCategory = category === '__custom__' ? customCategory.trim() || 'عام' : category;

    const newProduct: Product = {
      id: productToEdit ? productToEdit.id : `prod-${Date.now()}`,
      name: name.trim(),
      image: image.trim(),
      barcode: barcode.trim() || `613${Math.floor(100000000 + Math.random() * 900000000)}`,
      category: finalCategory,
      sellingPrice: Number(sellingPrice) || 0,
      purchasePrice: Number(purchasePrice) || 0,
      stock: Number(stock) || 0,
      minStockAlert: Number(minStockAlert) || 0,
      unit: unit.trim() || 'قطعة',
      description: description.trim(),
      createdAt: productToEdit ? productToEdit.createdAt : new Date().toISOString(),
    };

    stopCamera();
    onSave(newProduct);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="product-form-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      onClick={() => {
        stopCamera();
        onClose();
      }}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto text-slate-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {productToEdit ? 'تعديل بيانات المنتوج والصورة' : 'إضافة منتوج جديد مع الصورة'}
              </h3>
              <p className="text-[11px] text-slate-400">
                أدخل اسم المنتوج، أرفق صورته، وحدد سعر البيع والشراء والمخزون
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto text-xs flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Product Name & Image Selection (Highlight of the user request) */}
          <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                <span>اسم وصورة المنتوج</span>
              </h4>
              <span className="text-[11px] text-blue-300 bg-blue-950/80 px-2.5 py-0.5 rounded-full border border-blue-800/50">
                المعلومات الأساسية
              </span>
            </div>

            {/* Product Name Input */}
            <div>
              <label className="text-slate-200 font-semibold block mb-1.5 text-xs">
                اسم المنتوج <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: زيت زيتون بكر ممتاز 1 لتر"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-blue-500 font-medium placeholder:text-slate-500"
              />
            </div>

            {/* Image Preview & Upload Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start pt-2">
              {/* Image Preview Box (5 cols) */}
              <div className="sm:col-span-5 flex flex-col items-center">
                <div className="w-full aspect-square max-w-[200px] rounded-2xl bg-slate-950 border-2 border-dashed border-slate-700 overflow-hidden relative group flex items-center justify-center shadow-inner">
                  {image ? (
                    <>
                      <img
                        src={image}
                        alt={name || 'صورة المنتوج'}
                        className="w-full h-full object-cover"
                        onError={() => {
                          setErrorMsg('تعذر تحميل رابط الصورة. يرجى تجربة صورة أخرى.');
                        }}
                      />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md transition cursor-pointer"
                          title="تغيير الصورة"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setImage('')}
                          className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md transition cursor-pointer"
                          title="حذف الصورة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4 text-slate-500 flex flex-col items-center justify-center gap-2">
                      <ImageIcon className="w-10 h-10 stroke-1 text-slate-600" />
                      <span className="text-[11px]">لا توجد صورة بعد</span>
                      <span className="text-[10px] text-slate-600">اختر من الطرق الجانبية</span>
                    </div>
                  )}
                </div>

                {image && (
                  <span className="text-[10px] text-emerald-400 mt-2 font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" /> تم تحديد صورة المنتوج بنجاح
                  </span>
                )}
              </div>

              {/* Image Source Selection (7 cols) */}
              <div className="sm:col-span-7 space-y-3">
                <label className="text-slate-300 font-medium block text-xs">
                  طريقة إضافة الصورة:
                </label>

                {/* Sub-tabs for image source */}
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setImageTab('upload');
                    }}
                    className={`py-1.5 rounded-lg transition text-center cursor-pointer ${
                      imageTab === 'upload' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    رفع ملف
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setImageTab('preset');
                    }}
                    className={`py-1.5 rounded-lg transition text-center cursor-pointer ${
                      imageTab === 'preset' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    نماذج جاهزة
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setImageTab('url');
                    }}
                    className={`py-1.5 rounded-lg transition text-center cursor-pointer ${
                      imageTab === 'url' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    رابط ويب
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImageTab('camera');
                      startCamera();
                    }}
                    className={`py-1.5 rounded-lg transition text-center cursor-pointer ${
                      imageTab === 'camera' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    كاميرا
                  </button>
                </div>

                {/* Tab 1: Upload File */}
                {imageTab === 'upload' && (
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 hover:bg-slate-950 hover:border-blue-500/70 transition cursor-pointer text-center space-y-1.5"
                    >
                      <Upload className="w-5 h-5 mx-auto text-blue-400" />
                      <div className="font-semibold text-slate-200 text-xs">
                        اضغط لاختيار صورة من جهازك
                      </div>
                      <p className="text-[10px] text-slate-500">
                        يدعم PNG, JPG, WebP (يتم حفظها تلقائياً بالمتصفح)
                      </p>
                    </div>
                  </div>
                )}

                {/* Tab 2: Preset Library */}
                {imageTab === 'preset' && (
                  <div className="space-y-2">
                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>اختر صورة مناسبة للمنتوج:</span>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1 bg-slate-950/50 rounded-xl border border-slate-800">
                      {PRESET_PRODUCT_IMAGES.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setImage(item.url)}
                          className={`group relative rounded-lg overflow-hidden border transition cursor-pointer aspect-square ${
                            image === item.url
                              ? 'border-blue-500 ring-2 ring-blue-500/40'
                              : 'border-slate-800 hover:border-slate-600'
                          }`}
                          title={item.name}
                        >
                          <img
                            src={item.url}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <span className="absolute inset-x-0 bottom-0 bg-slate-950/80 text-[9px] text-slate-200 py-0.5 text-center truncate px-1">
                            {item.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab 3: Image URL */}
                {imageTab === 'url' && (
                  <div className="space-y-2">
                    <div className="flex gap-1.5">
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://example.com/product.jpg"
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono text-left focus:outline-none focus:border-blue-500"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={handleApplyUrl}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition shrink-0 cursor-pointer"
                      >
                        تطبيق
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      يمكنك لصق أي رابط صورة مباشرة من الإنترنت
                    </p>
                  </div>
                )}

                {/* Tab 4: Camera Capture */}
                {imageTab === 'camera' && (
                  <div className="space-y-2">
                    <div className="relative rounded-xl overflow-hidden bg-black border border-slate-800 aspect-video flex items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {!isCameraActive && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 text-slate-400">
                          <span>جاري تشغيل الكاميرا...</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        disabled={!isCameraActive}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>التقاط الصورة الآن</span>
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Category */}
          <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-4">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-400" />
              <span>الأسعار والتصنيف</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">
                  سعر البيع ({currency}) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 font-mono text-base font-bold text-blue-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">
                  سعر الشراء ({currency})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 font-mono text-slate-300 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">التصنيف</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500 text-xs"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="__custom__">+ تصنيف جديد...</option>
                </select>
                {category === '__custom__' && (
                  <input
                    type="text"
                    required
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="اكتب اسم التصنيف الجديد"
                    className="w-full mt-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Inventory & Barcode */}
          <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-4">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Barcode className="w-4 h-4 text-purple-400" />
              <span>المخزون والباركود</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">الكمية المتوفرة</label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">تنبيه نفاد المخزون</label>
                <input
                  type="number"
                  min="0"
                  value={minStockAlert}
                  onChange={(e) => setMinStockAlert(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">الوحدة</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                >
                  <option value="قطعة">قطعة</option>
                  <option value="علبة">علبة</option>
                  <option value="قارورة">قارورة</option>
                  <option value="كغ">كغ</option>
                  <option value="لتر">لتر</option>
                  <option value="كيس">كيس</option>
                  <option value="كرتون">كرتون</option>
                  <option value="حبة">حبة</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium flex items-center justify-between">
                  <span>الباركود</span>
                  <button
                    type="button"
                    onClick={handleGenerateBarcode}
                    className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> توليد تلقائي
                  </button>
                </label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-100 text-xs"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-slate-300 block mb-1 font-medium">وصف أو ملاحظات (اختياري)</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف مختصر لمميزات أو صلاحية المنتوج..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 text-xs"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-bold text-white shadow-lg shadow-blue-900/40 flex items-center gap-2 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{productToEdit ? 'حفظ التعديلات' : 'إضافة المنتوج الآن'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
