import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import {
  MonitorDown,
  CheckCircle2,
  X,
  Download,
  Laptop,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [copied, setCopied] = useState(false);

  const [selectedBrowser, setSelectedBrowser] = useState<'chrome' | 'safari' | 'firefox'>('chrome');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        setIsInIframe(window.self !== window.top);
      } catch {
        setIsInIframe(true);
      }
      
      const ua = window.navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod|macintosh/.test(ua) && !/chrome|crios/.test(ua)) {
        setSelectedBrowser('safari');
      } else if (/firefox/.test(ua)) {
        setSelectedBrowser('firefox');
      }
    }
  }, []);

  // If already installed in standalone desktop window
  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-semibold">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">برنامج سطح المكتب مفعل</span>
      </div>
    );
  }

  const getPublicUrl = () => {
    if (typeof window === 'undefined') return '';
    return window.location.href;
  };

  const handleOpenInNewTab = () => {
    const targetUrl = getPublicUrl();
    window.open(targetUrl, '_blank');
  };

  const handleCopyUrl = () => {
    const targetUrl = getPublicUrl();
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleButtonClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleButtonClick}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-white shadow-lg shadow-blue-900/30 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-700/40 active:scale-95 transition-all cursor-pointer border border-blue-400/30"
        title="تحميل وتثبيت البرنامج على الكمبيوتر"
      >
        <MonitorDown className="w-4 h-4 text-blue-100" />
        <span className="whitespace-nowrap">تثبيت على الكمبيوتر</span>
      </button>

      {/* Installation Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 relative my-8">
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 left-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Laptop className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">تثبيت واستخدام البرنامج في جميع المتصفحات</h3>
                <p className="text-xs text-slate-400">يعمل كبرنامج سطح مكتب وهاتف مستقل بدون إنترنت</p>
              </div>
            </div>

            {/* Offline Ready Badge */}
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 mb-4 flex items-center gap-2.5 text-xs text-emerald-300 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>دعم كامل بدون إنترنت (Offline):</strong> بعد أول زيارة، يتم تخزين كافة الملفات والفواتير والمنتجات محلياً وتستطيع استخدامه حتى عند انقطاع الاتصال بالكامل.
              </span>
            </div>

            {/* Browser Selector Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl mb-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectedBrowser('chrome')}
                className={`py-2 px-2.5 rounded-lg transition text-center cursor-pointer ${
                  selectedBrowser === 'chrome'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Chrome & Edge
              </button>
              <button
                type="button"
                onClick={() => setSelectedBrowser('safari')}
                className={`py-2 px-2.5 rounded-lg transition text-center cursor-pointer ${
                  selectedBrowser === 'safari'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Safari (آيفون وماك)
              </button>
              <button
                type="button"
                onClick={() => setSelectedBrowser('firefox')}
                className={`py-2 px-2.5 rounded-lg transition text-center cursor-pointer ${
                  selectedBrowser === 'firefox'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Firefox وغيرها
              </button>
            </div>

            {/* If inside iframe hint */}
            {isInIframe && (
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 mb-4 flex items-start gap-3 text-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <span className="font-bold block mb-1">سبب عدم ظهور زر التثبيت المباشر:</span>
                  أنت تتصفح التطبيق حالياً داخل نافذة المعاينة (داخل إطار)، ومتصفح كروم يمنع التثبيت التلقائي إلا عند فتح الصفحة في لسان مستقل.
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleOpenInNewTab}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>فتح في نافذة متصفح مستقلة أولاً</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Direct prompt button if available */}
            {isInstallable && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={async () => {
                    await install();
                    setShowGuideModal(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white shadow-lg transition text-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>بدء التثبيت التلقائي الآن</span>
                </button>
              </div>
            )}

            {/* Step-by-step Solution based on selected browser */}
            <div className="space-y-3 text-xs sm:text-sm text-slate-300">
              {selectedBrowser === 'chrome' && (
                <>
                  <div className="font-bold text-white text-xs border-b border-slate-800 pb-2">
                    خطوات التثبيت في Google Chrome و Microsoft Edge (تعمل على أي جهاز):
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                      1
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">فتح القائمة الجانبية (⋮)</h4>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        في أعلى يمين أو يسار متصفح كروم، اضغط على <strong>أيقونة النقاط الثلاث (⋮)</strong> بجانب شريط العنوان.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                      2
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">
                        اختيار: تثبيت الصفحة كتطبيق أو إنشاء اختصار
                      </h4>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        من القائمة: اختر <strong>تثبيت البرنامج (Install app)</strong> أو من <strong>حفظ ومشاركة</strong> اختر <strong>إنشاء اختصار (Create shortcut)</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/60 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                      ✓
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-300 mb-1">
                        تفعيل خيار: «فتح كـ نافذة» (Open as window)
                      </h4>
                      <p className="text-slate-300 text-xs leading-relaxed">
                        تأكد من وضع علامة صح على <strong>فتح كـ نافذة (Open as window)</strong> ليفتح البرنامج كبرنامج حاسوب مستقل بدون أشرطة المتصفح.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {selectedBrowser === 'safari' && (
                <>
                  <div className="font-bold text-white text-xs border-b border-slate-800 pb-2">
                    خطوات التثبيت في متصفح Safari (أجهزة Apple):
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                      1
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">على أجهزة iPhone و iPad:</h4>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        اضغط على زر <strong>المشاركة (Share)</strong> في شريط Safari بالأسفل (المربع بسهم متجه للأعلى)، ثم مرر للأسفل واضغط على <strong>«إضافة إلى الشاشة الرئيسية» (Add to Home Screen)</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                      2
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">على أجهزة Mac (حواسيب ماك):</h4>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        من شريط القوائم العلوي في Safari، اضغط على <strong>ملف (File)</strong> ثم اختر <strong>«إضافة إلى Dock» (Add to Dock)</strong>.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {selectedBrowser === 'firefox' && (
                <>
                  <div className="font-bold text-white text-xs border-b border-slate-800 pb-2">
                    خطوات الاستخدام في متصفح Firefox والمتصفحات الأخرى:
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                      1
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">حفظ الصفحة في العلامات المرجعية (Bookmarks)</h4>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        اضغط على أيقونة النجمة أو <strong>Ctrl + D</strong> لحفظ الصفحة والوصول إليها بنقرة واحدة دائماً.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                      ✓
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-300 mb-1">
                        العمل التلقائي بدون اتصال (Offline)
                      </h4>
                      <p className="text-slate-300 text-xs leading-relaxed">
                        متصفح Firefox يدعم التخزين المحلي التلقائي لجميع الفواتير والمخزون، وستتمكن من فتح الرابط وتشغيل الكاشير وإصدار الفواتير بدون اتصال بالإنترنت.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Quick URL Box */}
            <div className="mt-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs flex items-center justify-between gap-2">
              <span className="text-slate-400 truncate dir-ltr font-mono text-[11px]">
                {getPublicUrl()}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenInNewTab}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>فتح في نافذة</span>
                </button>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

