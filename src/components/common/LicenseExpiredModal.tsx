import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import {
  Clock,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Phone,
  MessageCircle,
  Copy,
  Check,
} from 'lucide-react';
import { StoreSettings } from '../../types/store';
import { validateAndApplyCode, formatArabicDate, getLicenseStatus } from '../../utils/license';

interface LicenseExpiredModalProps {
  settings: StoreSettings;
  onRenewSuccess: (newSettings: StoreSettings) => void;
}

export const LicenseExpiredModal = ({
  settings,
  onRenewSuccess,
}: LicenseExpiredModalProps) => {
  const [inputCode, setInputCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedStoreInfo, setCopiedStoreInfo] = useState(false);

  const licenseStatus = getLicenseStatus(settings);

  const handleApplyCode = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsProcessing(true);

    const result = validateAndApplyCode(inputCode, settings);

    if (result.success) {
      setSuccessMsg(result.message);
      const updatedSettings: StoreSettings = {
        ...settings,
        licenseExpiryDate: result.newExpiryDate || settings.licenseExpiryDate,
        isLifetimeLicense: result.isLifetime ?? settings.isLifetimeLicense,
        isLicenseActive: true,
      };

      setTimeout(() => {
        setIsProcessing(false);
        onRenewSuccess(updatedSettings);
      }, 1200);
    } else {
      setIsProcessing(false);
      setErrorMsg(result.message);
    }
  };

  const copyStoreCode = () => {
    const info = `طلب تجديد ترخيص البرنامج:\nالمتجر: ${settings.storeName}\nالهاتف: ${settings.phone}\nتاريخ الانتهاء: ${formatArabicDate(licenseStatus.expiryDate)}`;
    navigator.clipboard.writeText(info);
    setCopiedStoreInfo(true);
    setTimeout(() => setCopiedStoreInfo(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-slate-900 border-2 border-rose-600/70 rounded-3xl shadow-2xl overflow-hidden"
        dir="rtl"
      >
        {/* Header Alert Banner */}
        <div className="bg-gradient-to-r from-rose-900/90 via-rose-800/80 to-amber-900/70 px-6 py-5 text-white border-b border-rose-700/60 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/30 border border-rose-400/40 flex items-center justify-center shrink-0 shadow-inner">
            <AlertTriangle className="w-6 h-6 text-rose-200" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">
              انتهت فترة صلاحية استخدام البرنامج
            </h3>
            <p className="text-xs text-rose-200 mt-0.5">
              لقد انقضت المدة المحددة لتشغيل النظام ({settings.licenseDurationDays || 60} يوماً).
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-slate-300">
          {/* Status Box */}
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-slate-400">
              <span>اسم المنشأة / المتجر:</span>
              <span className="font-bold text-slate-100">{settings.storeName}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>تاريخ بدء الترخيص:</span>
              <span className="font-mono text-slate-200">{formatArabicDate(licenseStatus.startDate)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>تاريخ انتهاء الصلاحية:</span>
              <span className="font-bold text-rose-400 font-mono">{formatArabicDate(licenseStatus.expiryDate)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 pt-2 border-t border-slate-700/60">
              <span>حالة البرنامج:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-950 border border-rose-800 text-rose-300 font-bold text-[11px] inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>مغلق مؤقتاً لحين إدخال كود التجديد</span>
              </span>
            </div>
          </div>

          <p className="text-slate-300 text-xs leading-relaxed">
            لإعادة فتح البرنامج واستئناف عمليات البيع والكاشير، يرجى إدخال <strong className="text-white">كود تفعيل التجديد (Renewal Key)</strong> الممنوح من قبل مالك ومطور النظام، أو إدخال رمز المطور الرئيسي.
          </p>

          {/* Form */}
          <form onSubmit={handleApplyCode} className="space-y-3.5">
            <div>
              <label className="block text-slate-200 font-semibold mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                <span>أدخل كود التجديد أو رمز المطور (Master Key)</span>
              </label>
              <input
                type="text"
                required
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="مثال: ACT-60D-8291 أو رمز المطور"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 font-mono tracking-wider text-sm focus:outline-none focus:border-blue-500 text-center"
                dir="ltr"
              />
            </div>

            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isProcessing || !inputCode.trim()}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg shadow-blue-900/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isProcessing ? 'جاري التحقق والتفعيل...' : 'تفعيل وتجديد الصلاحية الآن'}</span>
            </button>
          </form>

          {/* Contact Developer Actions */}
          <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={copyStoreCode}
              className="w-full sm:w-auto px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer text-xs"
            >
              {copiedStoreInfo ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedStoreInfo ? 'تم نسخ بيانات المتجر' : 'نسخ بيانات المتجر لإرسالها للمطور'}</span>
            </button>

            {settings.phone && (
              <a
                href={`tel:${settings.phone.replace(/[^0-9]/g, '')}`}
                className="w-full sm:w-auto px-3 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-300 transition flex items-center justify-center gap-1.5 text-xs text-center"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>الاتصال بمالك النظام</span>
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
