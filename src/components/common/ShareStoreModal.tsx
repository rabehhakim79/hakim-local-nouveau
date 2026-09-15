import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Share2, Printer, ExternalLink, MessageCircle, Store } from 'lucide-react';
import { StoreSettings } from '../../types/store';

interface ShareStoreModalProps {
  settings: StoreSettings;
  onClose: () => void;
  onOpenStorefront: () => void;
}

export const ShareStoreModal: React.FC<ShareStoreModalProps> = ({
  settings,
  onClose,
  onOpenStorefront,
}) => {
  const [copied, setCopied] = useState(false);

  // Derive store URL cleanly from current origin and path
  const getCleanStoreUrl = () => {
    if (typeof window === 'undefined') return 'https://mystore.app?view=store';
    const base = (window.location.origin + window.location.pathname).replace(/\/+$/, '');
    return `${base}?view=store`;
  };

  const storeUrl = getCleanStoreUrl();

  const handleCopy = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `مرحباً بكم في متجر *${settings.storeName}*! 🛒\nيمكنكم الآن تصفح منتجاتنا، معرفة الأسعار والطلب أونلاين مباشرة عبر الرابط:\n${storeUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>رمز QR - ${settings.storeName}</title>
          <style>
            body {
              font-family: 'Cairo', Arial, sans-serif;
              text-align: center;
              padding: 40px 20px;
              color: #0f172a;
              background: #ffffff;
            }
            .card {
              max-width: 400px;
              margin: 0 auto;
              border: 3px dashed #cbd5e1;
              padding: 30px;
              border-radius: 24px;
            }
            h1 { margin: 0 0 8px 0; font-size: 26px; color: #1e3a8a; }
            p { margin: 0 0 20px 0; font-size: 14px; color: #64748b; }
            .qr-box { margin: 20px auto; display: inline-block; padding: 16px; border: 1px solid #e2e8f0; border-radius: 16px; }
            .scan-hint { font-size: 16px; font-weight: bold; color: #0284c7; margin-top: 15px; }
            .footer { font-size: 12px; color: #94a3b8; margin-top: 20px; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>${settings.storeName}</h1>
            <p>${settings.activityType} - ${settings.address}</p>
            <div class="qr-box">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(storeUrl)}" width="220" height="220" alt="QR Code" />
            </div>
            <div class="scan-hint">امسح الرمز بكاميرا هاتفك للطلب أونلاين</div>
            <div class="footer">${storeUrl}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">مشاركة منصة المتجر</h3>
            <p className="text-xs text-slate-400">رابط مخصص لزبائنك للطلب والتسوق أونلاين</p>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white text-slate-900 my-4 shadow-inner">
          <div className="text-center mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 block">
              {settings.storeName}
            </span>
            <span className="text-[11px] text-slate-500">امسح الرمز لفتح المتجر الإلكتروني</span>
          </div>

          <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200">
            <QRCodeSVG
              value={storeUrl}
              size={180}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: '/pwa-192x192.png',
                x: undefined,
                y: undefined,
                height: 36,
                width: 36,
                excavate: true,
              }}
            />
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintQR}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة الرمز للمحل</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenStorefront();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>معاينة المتجر</span>
            </button>
          </div>
        </div>

        {/* Link Copy Box */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-slate-300 block">رابط المتجر المباشر للزبائن:</label>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800 border border-slate-700">
            <input
              type="text"
              readOnly
              value={storeUrl}
              className="w-full bg-transparent text-xs text-blue-300 font-mono focus:outline-none px-2 text-left"
              dir="ltr"
            />
            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ الرابط</span>
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-900/20"
          >
            <MessageCircle className="w-4 h-4" />
            <span>مشاركة عبر الواتساب مع الزبائن</span>
          </button>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>الطلبات تصل مباشرة للوحة الكاشير</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
