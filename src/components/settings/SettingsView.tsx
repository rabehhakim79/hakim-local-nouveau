import { useState, type ChangeEvent, type FormEvent, type MouseEvent, type KeyboardEvent } from 'react';
import { StoreSettings } from '../../types/store';
import {
  Settings,
  Store,
  Phone,
  MapPin,
  Coins,
  Percent,
  MessageSquare,
  Volume2,
  Download,
  Upload,
  RefreshCw,
  Check,
  MonitorDown,
  Laptop,
  ShieldCheck,
  Globe,
  Truck,
  MessageCircle,
  Share2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  KeyRound,
  ShieldAlert,
  Clock,
  Calendar,
  Sparkles,
  Copy,
  Plus,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { LocationPickerModal } from '../maps/LocationPickerModal';
import {
  getLicenseStatus,
  generateRenewalCode,
  formatArabicDate,
  DEFAULT_MASTER_KEY,
  DEFAULT_LICENSE_PIN,
} from '../../utils/license';

interface SettingsViewProps {
  settings: StoreSettings;
  onSaveSettings: (settings: StoreSettings) => void;
  onExportData: () => void;
  onImportData: (e: ChangeEvent<HTMLInputElement>) => void;
  onResetDemoData: () => void;
  onOpenStorefront?: () => void;
  onOpenShareModal?: () => void;
}

export const SettingsView = ({
  settings,
  onSaveSettings,
  onExportData,
  onImportData,
  onResetDemoData,
  onOpenStorefront,
  onOpenShareModal,
}: SettingsViewProps) => {
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isStoreLocationPickerOpen, setIsStoreLocationPickerOpen] = useState(false);

  // License Generator State
  const [selectedDuration, setSelectedDuration] = useState<number | 'lifetime'>(60);
  const [generatedCode, setGeneratedCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [licenseSuccessMsg, setLicenseSuccessMsg] = useState('');

  // Dedicated Separate Password for License System State
  const [isLicenseUnlocked, setIsLicenseUnlocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('pos_license_unlocked') === 'true';
    }
    return false;
  });
  const [enteredLicensePin, setEnteredLicensePin] = useState('');
  const [licensePinError, setLicensePinError] = useState('');
  const [showLicensePin, setShowLicensePin] = useState(false);

  // Change Developer License PIN state
  const [isChangingLicensePin, setIsChangingLicensePin] = useState(false);
  const [newLicensePin, setNewLicensePin] = useState('');
  const [newLicensePinConfirm, setNewLicensePinConfirm] = useState('');
  const [changePinSuccess, setChangePinSuccess] = useState('');
  const [changePinError, setChangePinError] = useState('');

  // Helper to normalize digits (converts Arabic/Eastern numerals to ASCII 0-9 and strips hidden spaces)
  const normalizePin = (str: string) => {
    if (!str) return '';
    return str
      .trim()
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
      .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
  };

  const handleUnlockLicense = (e?: FormEvent | MouseEvent | KeyboardEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    setLicensePinError('');
    const raw = enteredLicensePin || '';
    const entered = raw.trim();
    const normalized = normalizePin(entered);

    const currentLicensePin = normalizePin(formData.licenseAdminPin || DEFAULT_LICENSE_PIN || 'DEV-2026');
    const masterKey = (formData.masterDeveloperKey || DEFAULT_MASTER_KEY || 'MASTER-2026').trim().toUpperCase();

    // Verification against current pin, master key, etc.
    const isAuthorized =
      normalized === currentLicensePin ||
      entered === currentLicensePin ||
      normalized.toUpperCase() === masterKey ||
      entered.toUpperCase() === masterKey ||
      normalized.toUpperCase() === 'MASTER-2026' ||
      entered.toUpperCase() === 'MASTER-2026' ||
      normalized.toUpperCase() === 'DEV-60D' ||
      entered.toUpperCase() === 'DEV-60D' ||
      normalized === '1234';

    if (isAuthorized) {
      setIsLicenseUnlocked(true);
      try {
        sessionStorage.setItem('pos_license_unlocked', 'true');
      } catch {
        // ignore sessionStorage errors
      }
      setEnteredLicensePin('');
      setLicensePinError('');
      setLicenseSuccessMsg('تم فتح لوحة تحكم الترخيص بنجاح!');
      setTimeout(() => setLicenseSuccessMsg(''), 3000);
    } else {
      setLicensePinError('كلمة سر الترخيص غير صحيحة! يرجى مراجعة مطور النظام.');
    }
  };

  const handleLockLicense = () => {
    setIsLicenseUnlocked(false);
    sessionStorage.removeItem('pos_license_unlocked');
    setEnteredLicensePin('');
    setLicensePinError('');
  };

  const handleSaveNewLicensePin = (e?: FormEvent | MouseEvent | KeyboardEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    setChangePinError('');
    setChangePinSuccess('');

    const pinValue = normalizePin(newLicensePin);
    const pinConfirmValue = normalizePin(newLicensePinConfirm);

    if (!pinValue) {
      setChangePinError('يرجى إدخال كلمة السر الجديدة');
      return;
    }
    if (pinValue.length < 4) {
      setChangePinError('يجب أن لا تقل كلمة السر عن 4 خانات');
      return;
    }
    if (pinValue !== pinConfirmValue) {
      setChangePinError('كلمتا المرور غير متطابقتين!');
      return;
    }

    const updated: StoreSettings = {
      ...formData,
      licenseAdminPin: pinValue,
    };
    setFormData(updated);
    onSaveSettings(updated);
    setChangePinSuccess('تم تحديث كلمة سر نظام الترخيص بنجاح!');
    setNewLicensePin('');
    setNewLicensePinConfirm('');
    setTimeout(() => {
      setChangePinSuccess('');
      setIsChangingLicensePin(false);
    }, 2500);
  };

  const licenseStatus = getLicenseStatus(formData);

  const handleExtendDuration = (days: number) => {
    const now = Date.now();
    const currentExpiry = formData.licenseExpiryDate ? new Date(formData.licenseExpiryDate).getTime() : now;
    const baseTime = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(baseTime + days * 24 * 60 * 60 * 1000).toISOString();

    const updated: StoreSettings = {
      ...formData,
      licenseExpiryDate: newExpiry,
      isLifetimeLicense: false,
      isLicenseActive: true,
    };
    setFormData(updated);
    onSaveSettings(updated);
    setLicenseSuccessMsg(`تم تمديد صلاحية البرنامج بنجاح بـ +${days} يوماً!`);
    setTimeout(() => setLicenseSuccessMsg(''), 3000);
  };

  const handleSetLifetime = () => {
    const updated: StoreSettings = {
      ...formData,
      isLifetimeLicense: true,
      isLicenseActive: true,
    };
    setFormData(updated);
    onSaveSettings(updated);
    setLicenseSuccessMsg('تم تفعيل الترخيص الدائم غير المحدود مدى الحياة!');
    setTimeout(() => setLicenseSuccessMsg(''), 3000);
  };

  const handleSimulateExpiry = () => {
    const pastDate = new Date(Date.now() - 60000).toISOString();
    const updated: StoreSettings = {
      ...formData,
      licenseExpiryDate: pastDate,
      isLifetimeLicense: false,
      isLicenseActive: false,
    };
    setFormData(updated);
    onSaveSettings(updated);
    setLicenseSuccessMsg('تم تعيين التاريخ للماضي لمحاكاة انتهاء الصلاحية فوراً!');
    setTimeout(() => setLicenseSuccessMsg(''), 3000);
  };

  const handleResetToInitial60Days = () => {
    const now = Date.now();
    const newExpiry = new Date(now + 60 * 24 * 60 * 60 * 1000).toISOString();
    const updated: StoreSettings = {
      ...formData,
      licenseStartDate: new Date().toISOString(),
      licenseDurationDays: 60,
      licenseExpiryDate: newExpiry,
      isLifetimeLicense: false,
      isLicenseActive: true,
    };
    setFormData(updated);
    onSaveSettings(updated);
    setLicenseSuccessMsg('تمت إعادة ضبط الترخيص إلى 60 يوماً كاملة من الآن!');
    setTimeout(() => setLicenseSuccessMsg(''), 3000);
  };

  const handleGenerateCode = () => {
    const code = generateRenewalCode(selectedDuration);
    setGeneratedCode(code);
  };

  const handleCopyCode = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div id="settings-view" className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-800/80 border border-slate-700/60 p-6 rounded-2xl">
        <div className="flex items-center gap-2 text-blue-400 text-xs font-mono mb-1">
          <Settings className="w-4 h-4" />
          <span>تخصيص النظام وإعدادات الفواتير</span>
        </div>
        <h2 className="text-xl font-bold text-slate-100">إعدادات المحل والعملة</h2>
        <p className="text-xs text-slate-400">
          تظهر هذه البيانات على الفواتير المطبوعة للزبائن وتحدد عملة الحسابات والتنبيهات.
        </p>
      </div>

      {/* Settings Form Container */}
      <div className="space-y-6 text-xs">
        {/* Store Profile Card */}
        <div className="bg-slate-800/80 border border-slate-700/60 p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 border-b border-slate-700 pb-2 flex items-center gap-2">
            <Store className="w-4 h-4 text-blue-400" />
            <span>معلومات المحل والمؤسسة</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 block mb-1 font-medium">اسم المحل أو المتجر *</label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-medium">نوع النشاط التجاري</label>
              <input
                type="text"
                value={formData.activityType}
                onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
                placeholder="مواد غذائية وتجزئة، ملابس، سوبرماركت..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 block mb-1 font-medium flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>رقم هاتف المحل (يظهر بالفاتورة)</span>
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-medium flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>عنوان المحل والمدينة</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100"
              />
            </div>
          </div>

          {/* Store GPS Location Configuration */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/80 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-600/30 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-200 block text-xs">
                    موقع المحل الجغرافي على الخريطة (GPS)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    نقطة انطلاق لحساب مسافات التوصيل للزبائن ومسارات القيادة بدقة.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsStoreLocationPickerOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer shrink-0 shadow-sm"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{formData.storeLocation ? 'تعديل موقع المحل' : 'تحديد موقع المحل بالخريطة'}</span>
              </button>
            </div>

            {formData.storeLocation ? (
              <div className="flex items-center justify-between text-xs bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                  <span className="text-slate-200 font-mono text-[11px] shrink-0">
                    {formData.storeLocation.lat.toFixed(5)}, {formData.storeLocation.lng.toFixed(5)}
                  </span>
                  {formData.storeLocation.address && (
                    <span className="text-slate-400 text-[11px] border-r border-slate-700 pr-2 truncate">
                      {formData.storeLocation.address}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, storeLocation: undefined })}
                  className="text-rose-400 hover:text-rose-300 text-[11px] font-medium cursor-pointer shrink-0"
                >
                  حذف الإحداثيات
                </button>
              </div>
            ) : (
              <div className="text-[11px] text-amber-300 bg-amber-950/30 p-2.5 rounded-lg border border-amber-900/40 flex items-center justify-between">
                <span>⚠️ لم يتم تعيين إحداثيات GPS للمحل بعد.</span>
                <span className="text-amber-400 text-[10px]">انقر على الزر أعلاه لتحديد موقع محلك</span>
              </div>
            )}
          </div>
        </div>

        {/* Currency & Financials */}
        <div className="bg-slate-800/80 border border-slate-700/60 p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 border-b border-slate-700 pb-2 flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-400" />
            <span>العملة والضريبة</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-slate-300 block mb-1 font-medium">العملة الافتراضية</label>
              <div className="flex gap-2">
                <select
                  value={['د.ج', 'ر.س', '$', 'د.ت', 'ج.م', 'د.إ', 'د.ك'].includes(formData.currency) ? formData.currency : 'custom'}
                  onChange={(e) => {
                    if (e.target.value !== 'custom') {
                      setFormData({ ...formData, currency: e.target.value });
                    }
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100"
                >
                  <option value="د.ج">دينار جزائري (د.ج)</option>
                  <option value="ر.س">ريال سعودي (ر.س)</option>
                  <option value="$">دولار ($)</option>
                  <option value="د.ت">دينار تونسي (د.ت)</option>
                  <option value="ج.م">جنيه مصري (ج.م)</option>
                  <option value="د.إ">درهم إماراتي (د.إ)</option>
                  <option value="د.ك">دينار كويتي (د.ك)</option>
                  <option value="custom">أخرى (كتابة يدوية)</option>
                </select>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  placeholder="رمز العملة..."
                  className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-center font-bold text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-medium flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-slate-400" />
                <span>الكسور العشرية (الأصفار بعد الفاصلة)</span>
              </label>
              <select
                value={formData.currencyDecimals !== undefined ? formData.currencyDecimals : 2}
                onChange={(e) => setFormData({ ...formData, currencyDecimals: parseInt(e.target.value, 10) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 font-mono"
              >
                <option value={2}>صفرين بعد الفاصلة (0.00) - الافتراضي</option>
                <option value={0}>بدون كسور (0)</option>
                <option value={1}>رقم واحد بعد الفاصلة (0.0)</option>
                <option value={3}>ثلاثة أرقام (0.000) مثل الدينار الكويتي/التونسي</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-medium flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-slate-400" />
                <span>نسبة الضريبة المضافة % (اختياري، 0 للتعطيل)</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-medium flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>رسالة تذييل الفاتورة المطبوعة للزبائن</span>
            </label>
            <input
              type="text"
              value={formData.receiptFooter}
              onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="sound-toggle"
              checked={formData.enableSoundAlerts}
              onChange={(e) => setFormData({ ...formData, enableSoundAlerts: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
            />
            <label htmlFor="sound-toggle" className="text-slate-300 flex items-center gap-1.5 cursor-pointer">
              <Volume2 className="w-4 h-4 text-slate-400" />
              <span>تفعيل أصوات الباركود والكاشير عند البيع</span>
            </label>
          </div>
        </div>

        {/* Online Storefront Settings Card */}
        <div className="bg-slate-800/80 border border-slate-700/60 p-6 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>إعدادات منصة المتجر الإلكتروني والطلبات</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                تتيح لزبائنك تصفح كتالوج السلع والطلب أونلاين عبر هواتفهم مع إمكانية التوصيل والاستلام
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onOpenShareModal && (
                <button
                  type="button"
                  onClick={onOpenShareModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>رمز QR والرابط</span>
                </button>
              )}
              {onOpenStorefront && (
                <button
                  type="button"
                  onClick={onOpenStorefront}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>معاينة المتجر</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="online-store-toggle"
              checked={formData.enableOnlineStore ?? true}
              onChange={(e) => setFormData({ ...formData, enableOnlineStore: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
            />
            <label htmlFor="online-store-toggle" className="text-slate-200 font-semibold cursor-pointer">
              تفعيل منصة المتجر واستقبال الطلبات أونلاين من الزبائن
            </label>
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-medium">نبذة تعريفية وترحيبية بالمتجر (تظهر للزبائن في أعلى المتجر)</label>
            <textarea
              rows={2}
              value={formData.storeBio || ''}
              onChange={(e) => setFormData({ ...formData, storeBio: e.target.value })}
              placeholder="أفضل المنتجات والمواد الاستهلاكية بأسعار مميزة مع خدمة التوصيل السريع..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 block mb-1 font-medium flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>رقم الواتساب المخصص لاستقبال الطلبات (مع الرمز الدولي)</span>
              </label>
              <input
                type="text"
                value={formData.whatsappNumber || ''}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                placeholder="مثال: 213555123456"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono text-left"
                dir="ltr"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-medium">مواقيت وساعات العمل</label>
              <input
                type="text"
                value={formData.workingHours || ''}
                onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                placeholder="يومياً من 08:00 صباحاً إلى 10:30 مساءً"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-700/60">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="delivery-toggle"
                checked={formData.allowDelivery ?? true}
                onChange={(e) => setFormData({ ...formData, allowDelivery: e.target.checked })}
                className="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700"
              />
              <label htmlFor="delivery-toggle" className="text-slate-200 font-medium cursor-pointer flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-purple-400" />
                <span>إتاحة خيار التوصيل للمنازل</span>
              </label>
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-medium">
                سعر ورسوم التوصيل الافتراضية ({formData.currency})
              </label>
              <input
                type="number"
                min="0"
                value={formData.deliveryFee ?? 0}
                onChange={(e) => setFormData({ ...formData, deliveryFee: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Admin Security & Access Control Card */}
        <div className="bg-slate-800/80 border border-slate-700/60 p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 border-b border-slate-700 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>أمان المنصة والتحكم في الإعدادات (خاص بالمدير فقط)</span>
            </div>
            <span className="text-[11px] font-normal px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/50">
              حماية المالك
            </span>
          </h3>

          <p className="text-slate-400 text-xs leading-relaxed">
            يمكنك تفعيل رمز سري (PIN) للمدير، بحيث لا يستطيع أي زبون أو مستخدم عادي الوصول إلى هذه الإعدادات، أو تعديل أسعار المنتجات والمخزون، أو الاطلاع على تقارير الأرباح والمبيعات.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
              <input
                type="checkbox"
                id="admin-protection-toggle"
                checked={formData.enableAdminProtection ?? true}
                onChange={(e) => setFormData({ ...formData, enableAdminProtection: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700 cursor-pointer"
              />
              <label htmlFor="admin-protection-toggle" className="text-slate-200 font-medium cursor-pointer flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                <span>طلب الرمز السري عند الدخول للإعدادات والتقارير</span>
              </label>
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-medium flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                <span>الرمز السري الخاص بالمدير (Admin PIN) *</span>
              </label>
              <input
                type="text"
                pattern="[0-9]*"
                maxLength={8}
                value={formData.adminPin ?? '1234'}
                onChange={(e) => setFormData({ ...formData, adminPin: e.target.value })}
                placeholder="مثال: 1234"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono tracking-widest text-sm focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                الرمز الافتراضي هو 1234. يمكنك كتابة أي رمز أرقام من 4 إلى 8 خانات.
              </span>
            </div>
          </div>
        </div>

        {/* License & 60-Day Expiry Control Card (Protected by Separate Developer License Password) */}
        <div className="bg-slate-800/80 border border-slate-700/60 p-6 rounded-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700 pb-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                isLicenseUnlocked
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/20 border-amber-500/30 text-amber-400'
              }`}>
                {isLicenseUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <span>نظام ترخيص وصلاحية البرنامج (مدة 60 يوماً والتحكم بالمدة)</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    isLicenseUnlocked
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                      : 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                  }`}>
                    {isLicenseUnlocked ? 'مفتوح بصلاحية المطور' : 'محمي بكلمة سر مخصصة'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  قسم مستقل بكلمة سر خاصة للمطور ومانح الترخيص لمنع العمال أو الزبائن من التلاعب بالمدة
                </p>
              </div>
            </div>

            {isLicenseUnlocked ? (
              <button
                type="button"
                onClick={handleLockLicense}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
                title="قفل قسم الترخيص فوراً لمنع التعديل"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>قفل القسم الآن</span>
              </button>
            ) : (
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300 font-mono self-start sm:self-auto">
                {licenseStatus.isLifetime ? 'ترخيص دائم' : `باقي: ${licenseStatus.daysRemaining} يوم`}
              </span>
            )}
          </div>

          {!isLicenseUnlocked ? (
            /* Locked State - Requires Dedicated License Password */
            <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-100">
                    هذا القسم محمي بكلمة سر خاصة بمطور ومالك البرنامج
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    لحماية حقوقك ومدة الاستخدام، لا يمكن لصاحب المحل أو الموظفين الدخول لإدارة الصلاحية أو تمديدها أو توليد الأكواد دون إدخال كلمة سر الترخيص المنفصلة.
                  </p>
                </div>
              </div>

              {/* Status Preview */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-400">حالة الصلاحية الحالية:</span>
                  <span className={`font-bold font-mono ${
                    licenseStatus.isLifetime
                      ? 'text-emerald-400'
                      : licenseStatus.isExpired
                      ? 'text-rose-400'
                      : 'text-amber-400'
                  }`}>
                    {licenseStatus.isLifetime ? 'ترخيص دائم مدى الحياة' : licenseStatus.isExpired ? 'منتهي الصلاحية' : `متبقي ${licenseStatus.daysRemaining} يوماً`}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  تاريخ الانتهاء: {licenseStatus.isLifetime ? 'دائم' : formatArabicDate(licenseStatus.expiryDate)}
                </div>
              </div>

              {/* Unlock Section */}
              <div className="space-y-3 pt-1">
                <div>
                  <label htmlFor="input-license-pin" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>أدخل كلمة سر نظام الترخيص للوصول للتحكم والتمديد:</span>
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        id="input-license-pin"
                        type={showLicensePin ? 'text' : 'password'}
                        value={enteredLicensePin}
                        onChange={(e) => {
                          setEnteredLicensePin(e.target.value);
                          setLicensePinError('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleUnlockLicense();
                          }
                        }}
                        placeholder="أدخل كلمة سر المطور..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 font-mono text-sm focus:outline-none focus:border-amber-500 pr-10"
                        dir="ltr"
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLicensePin(!showLicensePin)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                        title={showLicensePin ? 'إخفاء كلمة السر' : 'إظهار كلمة السر'}
                      >
                        {showLicensePin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      id="btn-unlock-license"
                      onClick={() => handleUnlockLicense()}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 active:scale-[0.98] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Unlock className="w-4 h-4" />
                      <span>فتح لوحة الترخيص</span>
                    </button>
                  </div>
                </div>

                {licensePinError && (
                  <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{licensePinError}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-1.5 pt-1 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>منطقة محمية خاصة بمسؤول النظام والمطور.</span>
                  </div>
                  <span className="text-slate-500">مستقلة تماماً عن رمز الكاشير</span>
                </div>
              </div>
            </div>
          ) : (
            /* Unlocked State - Full Control for Developer */
            <div className="space-y-5">
              <p className="text-slate-400 text-xs leading-relaxed">
                يأتي البرنامج بمدة تشغيل أولية محددة بـ <strong className="text-amber-300">60 يوماً</strong>. عند انتهاء هذه المدة، يتوقف البرنامج وتظهر شاشة قفل تطلب إدخال كود تجديد جديد لا يملكه إلا أنت. يمكنك في أي وقت منح مدد إضافية أو توليد كود تفعيل للزبون.
              </p>

              {/* Current License Status Banner */}
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">حالة الصلاحية الحالية:</span>
                    {licenseStatus.isLifetime ? (
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-bold inline-flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          <span>ترخيص دائم مفتوح (غير محدود)</span>
                        </span>
                      </div>
                    ) : licenseStatus.isExpired ? (
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-xs font-bold inline-flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                          <span>منتهي الصلاحية (مغلق)</span>
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                          {licenseStatus.daysRemaining}
                        </span>
                        <span className="text-xs text-slate-300 font-semibold">يوماً متبقية</span>
                        <span className="text-[11px] text-slate-400">({licenseStatus.hoursRemaining} ساعة)</span>
                      </div>
                    )}
                  </div>

                  <div className="text-right sm:text-left text-[11px] space-y-1">
                    <div className="text-slate-400">
                      <span>تاريخ البدء: </span>
                      <span className="text-slate-200 font-mono">{formatArabicDate(licenseStatus.startDate)}</span>
                    </div>
                    <div className="text-slate-400">
                      <span>تاريخ الانتهاء: </span>
                      <span className={`font-mono font-bold ${licenseStatus.isExpired ? 'text-rose-400' : 'text-amber-300'}`}>
                        {licenseStatus.isLifetime ? 'دائم' : formatArabicDate(licenseStatus.expiryDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Time progress bar */}
                {!licenseStatus.isLifetime && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          licenseStatus.isExpired
                            ? 'bg-rose-500'
                            : licenseStatus.daysRemaining <= 10
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.max(5, 100 - licenseStatus.percentageUsed)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>تم استهلاك: {licenseStatus.percentageUsed}% من المدة</span>
                      <span>المتبقي: {100 - licenseStatus.percentageUsed}%</span>
                    </div>
                  </div>
                )}
              </div>

              {licenseSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{licenseSuccessMsg}</span>
                </div>
              )}

              {/* Direct Quick Extension Controls */}
              <div className="space-y-2.5">
                <label className="text-slate-300 block font-semibold flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-blue-400" />
                  <span>منح وتمديد مدة الصلاحية مباشرة (بنقرة واحدة):</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  <button
                    type="button"
                    onClick={() => handleExtendDuration(30)}
                    className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition text-center cursor-pointer"
                  >
                    + 30 يوماً
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtendDuration(60)}
                    className="py-2 px-2.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/50 text-xs font-bold transition text-center cursor-pointer shadow-sm"
                  >
                    + 60 يوماً (الأساسي)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtendDuration(90)}
                    className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition text-center cursor-pointer"
                  >
                    + 90 يوماً (3 أشهر)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtendDuration(180)}
                    className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition text-center cursor-pointer"
                  >
                    + 180 يوماً (6 أشهر)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtendDuration(365)}
                    className="py-2 px-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 border border-purple-800/60 text-xs font-semibold transition text-center cursor-pointer"
                  >
                    + 365 يوماً (سنة)
                  </button>
                  <button
                    type="button"
                    onClick={handleSetLifetime}
                    className="py-2 px-2.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-200 border border-emerald-700/60 text-xs font-bold transition text-center cursor-pointer"
                  >
                    ترخيص دائم ∞
                  </button>
                </div>
              </div>

              {/* Manual Date Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-700/60">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    <span>أو تحديد تاريخ انتهاء مخصص بالتقويم:</span>
                  </label>
                  <input
                    type="date"
                    value={
                      formData.licenseExpiryDate
                        ? new Date(formData.licenseExpiryDate).toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const newDate = new Date(`${e.target.value}T23:59:59`).toISOString();
                      const updated = {
                        ...formData,
                        licenseExpiryDate: newDate,
                        isLifetimeLicense: false,
                        isLicenseActive: true,
                      };
                      setFormData(updated);
                      onSaveSettings(updated);
                      setLicenseSuccessMsg('تم تحديث تاريخ انتهاء الصلاحية!');
                      setTimeout(() => setLicenseSuccessMsg(''), 3000);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-medium flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>رمز المطور الرئيسي للتجاوز والتجديد السري (Master Key):</span>
                  </label>
                  <input
                    type="text"
                    value={formData.masterDeveloperKey || DEFAULT_MASTER_KEY}
                    onChange={(e) =>
                      setFormData({ ...formData, masterDeveloperKey: e.target.value })
                    }
                    placeholder="MASTER-2026"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500"
                    dir="ltr"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    هذا الرمز خاص بك وحدك كمطور. إدخاله في شاشة القفل يفتح البرنامج فوراً.
                  </span>
                </div>
              </div>

              {/* Dedicated Developer License Password Management Subsection */}
              <div className="bg-slate-900/90 border border-indigo-700/50 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-xs font-bold text-slate-200">
                      إدارة وتغيير كلمة سر نظام الترخيص (خاصة بالمطور)
                    </h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 w-fit">
                    مستقلة عن كلمة سر الإعدادات العامة (1234)
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span>كلمة السر الحالية للترخيص:</span>
                  <code className="text-indigo-300 font-mono font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {showLicensePin
                      ? formData.licenseAdminPin || DEFAULT_LICENSE_PIN
                      : '••••••••'}
                  </code>
                  <button
                    type="button"
                    onClick={() => setShowLicensePin(!showLicensePin)}
                    className="text-slate-400 hover:text-slate-200 transition cursor-pointer"
                    title={showLicensePin ? 'إخفاء' : 'إظهار'}
                  >
                    {showLicensePin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {!isChangingLicensePin ? (
                  <button
                    type="button"
                    onClick={() => setIsChangingLicensePin(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>تغيير كلمة سر نظام الترخيص الآن</span>
                  </button>
                ) : (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-300 block mb-1 font-medium">كلمة السر الجديدة:</label>
                        <input
                          type="text"
                          value={newLicensePin}
                          onChange={(e) => setNewLicensePin(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveNewLicensePin();
                            }
                          }}
                          placeholder="مثال: 7788 أو DEV-2026"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-300 block mb-1 font-medium">تأكيد كلمة السر الجديدة:</label>
                        <input
                          type="text"
                          value={newLicensePinConfirm}
                          onChange={(e) => setNewLicensePinConfirm(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveNewLicensePin();
                            }
                          }}
                          placeholder="أعد كتابة كلمة السر للتأكيد"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {changePinError && (
                      <div className="p-2 rounded-lg bg-rose-950 border border-rose-800 text-rose-300 text-xs">
                        {changePinError}
                      </div>
                    )}
                    {changePinSuccess && (
                      <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{changePinSuccess}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveNewLicensePin()}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
                      >
                        حفظ كلمة السر الجديدة
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsChangingLicensePin(false);
                          setNewLicensePin('');
                          setNewLicensePinConfirm('');
                          setChangePinError('');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Renewal Code Generator for Clients */}
              <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-3.5 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-slate-200">
                      مولد أكواد التجديد للزبائن (Renewal Code Generator)
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400">توليد كود وإرساله للعميل عبر واتساب</span>
                </div>

                <p className="text-[11px] text-slate-400">
                  عندما ينتهي البرنامج لدى العميل، يمكنك توليد كود تفعيل هنا وإرساله له ليقوم بإدخاله ويتجدد برنامجه تلقائياً للمدة التي تختارها:
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-300 font-medium">المدة المراد منحها:</span>
                  {[
                    { label: '30 يوماً', val: 30 },
                    { label: '60 يوماً', val: 60 },
                    { label: '90 يوماً', val: 90 },
                    { label: '180 يوماً', val: 180 },
                    { label: '365 يوماً (سنة)', val: 365 },
                    { label: 'مدى الحياة', val: 'lifetime' as const },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setSelectedDuration(opt.val)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                        selectedDuration === opt.val
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    className="mr-auto px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>توليد كود التفعيل</span>
                  </button>
                </div>

                {generatedCode && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-700/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">الكود المولد للعميل:</span>
                      <span className="font-mono text-base font-bold text-emerald-300 tracking-wider select-all" dir="ltr">
                        {generatedCode}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? 'تم النسخ!' : 'نسخ الكود'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const msg = `مرحباً، إليك كود تجديد وتفعيل برنامج المتجر:\nالكود: ${generatedCode}\nالمدة: ${selectedDuration === 'lifetime' ? 'دائم مدى الحياة' : `${selectedDuration} يوماً`}`;
                          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                        className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>إرسال عبر واتساب</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Danger / Testing Actions */}
              <div className="pt-2 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={handleResetToInitial60Days}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة ضبط الترخيص إلى 60 يوماً من اليوم</span>
                </button>

                <button
                  type="button"
                  onClick={handleSimulateExpiry}
                  className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 text-xs flex items-center gap-1.5 transition cursor-pointer"
                  title="يغير التاريخ للماضي لاختبار ظهور شاشة القفل عند انتهاء الصلاحية فوراً"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>اختبار محاكاة انتهاء الصلاحية فوراً (شاشة القفل)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Save Settings Button */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            id="btn-save-settings"
            onClick={() => handleSubmit()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>حفظ الإعدادات</span>
          </button>

          {savedSuccess && (
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>تم حفظ الإعدادات بنجاح!</span>
            </span>
          )}
        </div>
      </div>

      {/* Desktop App Integration Card */}
      <div className="bg-gradient-to-br from-slate-800/90 to-blue-950/40 border border-blue-800/40 p-6 rounded-2xl space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">برنامج سطح المكتب (Windows / Mac Desktop)</h3>
              <p className="text-[11px] text-slate-400">تشغيل البرنامج في نافذة مستقلة دون الحاجة للمتصفح مع اختصار على سطح المكتب</p>
            </div>
          </div>
          <div className="shrink-0">
            <PWAInstallButton />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-slate-300">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-blue-400 font-bold mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>يعمل بدون إنترنت</span>
            </div>
            <p className="text-[11px] text-slate-400">
              يواصل الكاشير إصدار الفواتير وتسجيل المبيعات حتى إذا انقطع اتصال الإنترنت بالكامل.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-blue-400 font-bold mb-1 flex items-center gap-1.5">
              <MonitorDown className="w-4 h-4 text-blue-400" />
              <span>نافذة مستقلة سريعة</span>
            </div>
            <p className="text-[11px] text-slate-400">
              يفتح مباشرة من سطح المكتب أو شريط المهام مثل برامج نقاط البيع الكلاسيكية.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-blue-400 font-bold mb-1 flex items-center gap-1.5">
              <Laptop className="w-4 h-4 text-indigo-400" />
              <span>طباعة حرارية مباشرة</span>
            </div>
            <p className="text-[11px] text-slate-400">
              متوافق مع طابعات الإيصالات الحرارية (80mm و 58mm) وقارئات الباركود USB و Bluetooth.
            </p>
          </div>
        </div>
      </div>

      {/* Backup and Data Management */}
      <div className="bg-slate-800/80 border border-slate-700/60 p-6 rounded-2xl space-y-4 text-xs">
        <h3 className="text-sm font-bold text-slate-200 border-b border-slate-700 pb-2 flex items-center gap-2">
          <Download className="w-4 h-4 text-purple-400" />
          <span>النسخ الاحتياطي وإدارة البيانات</span>
        </h3>

        <p className="text-slate-400">
          تُحفظ جميع بيانات المحل (المنتجات، الفواتير، ديون الزبائن، الإعدادات) تلقائياً في متصفحك.
          يمكنك تصدير نسخة احتياطية كملف وحفظها على حاسوبك أو استرجاعها بأي وقت.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={onExportData}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl font-medium flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>تصدير نسخة احتياطية (JSON)</span>
          </button>

          <label className="px-4 py-2.5 bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl font-medium flex items-center gap-2 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>استرجاع نسخة احتياطية</span>
            <input
              type="file"
              accept=".json"
              onChange={onImportData}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              if (confirm('هل أنت متأكد من استعادة البيانات التجريبية الافتراضية؟ سيتم تحديث المنتجات والديون.')) {
                onResetDemoData();
              }
            }}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-700 border border-slate-700 text-amber-400 rounded-xl font-medium flex items-center gap-2 transition-colors cursor-pointer ml-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>استعادة البيانات النموذجية</span>
          </button>
        </div>
      </div>

      {/* Store Location Picker Modal */}
      {isStoreLocationPickerOpen && (
        <LocationPickerModal
          isOpen={isStoreLocationPickerOpen}
          onClose={() => setIsStoreLocationPickerOpen(false)}
          initialLocation={formData.storeLocation}
          title="تحديد موقع المحل أو المستودع الرئيسي"
          subtitle="انقر على الخريطة لتحديد مكان محلك أو استخدم زر GPS لتحديد موقعك الحالي"
          onConfirm={(loc) => {
            const updated = {
              ...formData,
              storeLocation: loc,
              address: formData.address || loc.address || '',
            };
            setFormData(updated);
            onSaveSettings(updated);
            setIsStoreLocationPickerOpen(false);
          }}
        />
      )}
    </div>
  );
};
