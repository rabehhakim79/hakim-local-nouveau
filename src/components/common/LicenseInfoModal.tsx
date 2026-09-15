import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import {
  Clock,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { StoreSettings } from '../../types/store';
import { getLicenseStatus, validateAndApplyCode, formatArabicDate } from '../../utils/license';

interface LicenseInfoModalProps {
  settings: StoreSettings;
  onClose: () => void;
  onRenewSuccess: (newSettings: StoreSettings) => void;
}

export const LicenseInfoModal = ({
  settings,
  onClose,
  onRenewSuccess,
}: LicenseInfoModalProps) => {
  const [inputCode, setInputCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">حالة ترخيص وصلاحية البرنامج</h3>
              <p className="text-[11px] text-slate-400">مدة الاستخدام المحددة والتحكم بها</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-slate-300">
          {/* Main Badge Card */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900 border border-slate-700/80 rounded-2xl p-4 text-center space-y-3">
            <div className="flex items-center justify-center">
              {licenseStatus.isLifetime ? (
                <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ترخيص دائم مدى الحياة (غير محدود)</span>
                </span>
              ) : licenseStatus.isExpired ? (
                <span className="px-3 py-1 rounded-full bg-rose-950/80 border border-rose-700/80 text-rose-300 text-xs font-bold inline-flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>منتهي الصلاحية - مطلوب التجديد</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-blue-950/80 border border-blue-700/80 text-blue-300 text-xs font-bold inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>الترخيص نشط وصالح للاستخدام</span>
                </span>
              )}
            </div>

            {!licenseStatus.isLifetime && (
              <div>
                <div className="text-3xl font-black text-slate-100 tracking-tight font-mono">
                  {licenseStatus.daysRemaining}
                  <span className="text-sm font-normal text-slate-400 mr-1.5">يوماً متبقية</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  (حوالي {licenseStatus.hoursRemaining} ساعة تشغيل متاحة)
                </p>

                {/* Progress bar */}
                <div className="mt-3.5 space-y-1">
                  <div className="w-full h-2 rounded-full bg-slate-700/60 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        licenseStatus.daysRemaining <= 10 ? 'bg-amber-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.max(5, 100 - licenseStatus.percentageUsed)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>انقضى: {licenseStatus.percentageUsed}%</span>
                    <span>المتبقي: {100 - licenseStatus.percentageUsed}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dates info */}
          <div className="space-y-2 bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-[11px]">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>تاريخ التثبيت والبدء:</span>
              </span>
              <span className="text-slate-200 font-mono">{formatArabicDate(licenseStatus.startDate)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>تاريخ انتهاء المدة:</span>
              </span>
              <span className="text-slate-200 font-mono font-bold">
                {licenseStatus.isLifetime ? 'غير محدود' : formatArabicDate(licenseStatus.expiryDate)}
              </span>
            </div>
          </div>

          {/* Extend with code form */}
          <form onSubmit={handleApplyCode} className="space-y-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                <span>تمديد أو تجديد الصلاحية بكود تفعيل:</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="كود التجديد (مثال: ACT-60D-8291)"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-center text-xs focus:outline-none focus:border-emerald-500"
                  dir="ltr"
                />
                <button
                  type="submit"
                  disabled={isProcessing || !inputCode.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold transition shrink-0 cursor-pointer"
                >
                  {isProcessing ? 'تفعيل...' : 'تطبيق'}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
};
