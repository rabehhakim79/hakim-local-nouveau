import { useRef, useState, useEffect } from 'react';
import { StoreTab, StoreSettings } from '../../types/store';
import {
  ShoppingBag,
  Package,
  Receipt,
  Users,
  TrendingUp,
  Settings,
  Store,
  Globe,
  Share2,
  BellRing,
  Lock,
  Unlock,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { CloudSyncIndicator } from './CloudSyncIndicator';
import { getLicenseStatus } from '../../utils/license';

interface StoreNavbarProps {
  currentTab: StoreTab;
  onSelectTab: (tab: StoreTab) => void;
  settings: StoreSettings;
  productsCount: number;
  lowStockCount: number;
  debtorsCount: number;
  pendingOrdersCount: number;
  isAdminUnlocked?: boolean;
  onLockAdmin?: () => void;
  onUnlockAdmin?: () => void;
  onOpenStorefront: () => void;
  onOpenShareModal: () => void;
  onOpenLicenseModal?: () => void;
  isCloudSynced?: boolean;
  isCloudSyncing?: boolean;
}

export const StoreNavbar = ({
  currentTab,
  onSelectTab,
  settings,
  productsCount,
  lowStockCount,
  debtorsCount,
  pendingOrdersCount,
  isAdminUnlocked = false,
  onLockAdmin,
  onUnlockAdmin,
  onOpenStorefront,
  onOpenShareModal,
  onOpenLicenseModal,
  isCloudSynced = true,
  isCloudSyncing = false,
}: StoreNavbarProps) => {
  const licenseStatus = getLicenseStatus(settings);
  const isProtected = settings.enableAdminProtection ?? true;

  // Horizontal scroll refs & state for desktop & mobile
  const desktopNavRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isNavOverflowing, setIsNavOverflowing] = useState(false);

  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateScrollState = () => {
    const el = desktopNavRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    // In RTL containers: scrollLeft can be negative or positive depending on the browser engine.
    // Normalized math:
    const maxScroll = scrollWidth - clientWidth;
    setIsNavOverflowing(maxScroll > 4);

    // RTL tolerance
    const absScroll = Math.abs(scrollLeft);
    setCanScrollLeft(absScroll < maxScroll - 4);
    setCanScrollRight(absScroll > 4);
  };

  useEffect(() => {
    updateScrollState();
    window.addEventListener('resize', updateScrollState);
    return () => {
      window.removeEventListener('resize', updateScrollState);
      stopContinuousScroll();
    };
  }, []);

  const scrollNav = (direction: 'left' | 'right', amount = 140) => {
    const el = desktopNavRef.current;
    if (!el) return;
    // In RTL, scrolling left moves towards higher indices (e.g. Settings/Reports)
    const delta = direction === 'left' ? -amount : amount;
    el.scrollBy({ left: delta, behavior: 'smooth' });
    setTimeout(updateScrollState, 150);
  };

  const startContinuousScroll = (direction: 'left' | 'right') => {
    stopContinuousScroll();
    const el = desktopNavRef.current;
    if (!el) return;
    scrollNav(direction, 40);
    scrollIntervalRef.current = setInterval(() => {
      const delta = direction === 'left' ? -18 : 18;
      el.scrollBy({ left: delta, behavior: 'auto' });
      updateScrollState();
    }, 40);
  };

  const stopContinuousScroll = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };

  const tabs = [
    {
      id: 'pos' as StoreTab,
      label: 'نقطة البيع (الكاشير)',
      icon: ShoppingBag,
      badge: null,
    },
    {
      id: 'orders' as StoreTab,
      label: 'طلبات المنصة',
      icon: BellRing,
      badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} جديد` : null,
      badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800 animate-pulse',
    },
    {
      id: 'inventory' as StoreTab,
      label: 'المخزون والمنتجات',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} نواقص` : null,
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-800',
    },
    {
      id: 'sales' as StoreTab,
      label: 'سجل الفواتير',
      icon: Receipt,
      badge: null,
    },
    {
      id: 'customers' as StoreTab,
      label: 'الزبائن والديون',
      icon: Users,
      badge: debtorsCount > 0 ? `${debtorsCount} مدينين` : null,
      badgeColor: 'bg-rose-950 text-rose-300 border-rose-800',
    },
    {
      id: 'reports' as StoreTab,
      label: 'التقارير والأرباح',
      icon: TrendingUp,
      badge: null,
      isLocked: isProtected && !isAdminUnlocked,
    },
    {
      id: 'settings' as StoreTab,
      label: 'الإعدادات',
      icon: Settings,
      badge: null,
      isLocked: isProtected && !isAdminUnlocked,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-950/40">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-bold text-slate-100 leading-tight">
                  {settings.storeName}
                </h1>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 border border-blue-800/80 text-blue-300 font-semibold hidden sm:inline">
                  منصة متجر متكاملة
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-none mt-0.5">
                {settings.activityType} • {productsCount} منتج
              </p>
            </div>
          </div>

          {/* Unified Desktop Navigation Container with Horizontal Scroll Controls */}
          <div className="hidden lg:flex items-center relative min-w-0 flex-1 justify-center px-1">
            {/* Scroll Right Trigger Button (reveals earlier tabs on hover or click) */}
            <button
              type="button"
              onClick={() => scrollNav('right', 150)}
              onMouseEnter={() => startContinuousScroll('right')}
              onMouseLeave={stopContinuousScroll}
              className={`p-1.5 rounded-lg bg-slate-800/95 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer shrink-0 z-10 mr-1 shadow-md ${
                isNavOverflowing ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              title="تمرير القائمة لليمين (مرر الفأرة فوق الزر للتمرير السريع)"
              aria-label="تمرير لليمين"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Scrollable Nav Items & Quick Actions (All scroll together smoothly) */}
            <nav
              ref={desktopNavRef}
              onScroll={updateScrollState}
              className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1 max-w-full"
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onSelectTab(tab.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                    {tab.isLocked && (
                      <Lock className="w-3 h-3 text-amber-400/80 shrink-0" title="محمي برمز سري" />
                    )}
                    {tab.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full border font-bold ${
                          tab.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Visual Divider inside scrollable track */}
              <div className="h-5 w-px bg-slate-800 shrink-0 mx-1" />

              {/* License Duration Badge Button (Included in scroll track) */}
              <button
                type="button"
                onClick={onOpenLicenseModal}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                  licenseStatus.isLifetime
                    ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/70'
                    : licenseStatus.isExpired
                    ? 'bg-rose-950 border-rose-700 text-rose-300 animate-pulse hover:bg-rose-900'
                    : licenseStatus.daysRemaining <= 10
                    ? 'bg-amber-950 border-amber-700 text-amber-300 hover:bg-amber-900'
                    : 'bg-slate-850 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="عرض حالة صلاحية وترخيص البرنامج وتمديد المدة"
              >
                {licenseStatus.isLifetime ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-[11px]">ترخيص دائم</span>
                  </>
                ) : (
                  <>
                    <Clock
                      className={`w-3.5 h-3.5 shrink-0 ${
                        licenseStatus.isExpired
                          ? 'text-rose-400'
                          : licenseStatus.daysRemaining <= 10
                          ? 'text-amber-400'
                          : 'text-blue-400'
                      }`}
                    />
                    <span className="text-[11px] font-mono">
                      {licenseStatus.isExpired ? 'منتهي الصلاحية' : `باقي ${licenseStatus.daysRemaining} يوم`}
                    </span>
                  </>
                )}
              </button>

              {/* Admin Lock Status Button (Included in scroll track) */}
              {isProtected && (
                <button
                  type="button"
                  onClick={isAdminUnlocked ? onLockAdmin : onUnlockAdmin}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                    isAdminUnlocked
                      ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/80'
                      : 'bg-slate-850 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title={
                    isAdminUnlocked
                      ? 'جلسة المدير مفتوحة (اضغط للقفل لحماية الإعدادات)'
                      : 'لوحة الإعدادات والتقارير مقفلة (اضغط لفتح القفل برمز PIN)'
                  }
                >
                  {isAdminUnlocked ? (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-[11px]">المدير متصل</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-[11px]">دخول المدير</span>
                    </>
                  )}
                </button>
              )}

              {/* Storefront Button (Included in scroll track) */}
              <button
                type="button"
                onClick={onOpenStorefront}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950/30 transition cursor-pointer whitespace-nowrap shrink-0"
                title="معاينة متجر الزبائن أونلاين"
              >
                <Globe className="w-4 h-4 text-emerald-100 shrink-0" />
                <span>متجر الزبائن أونلاين</span>
              </button>
            </nav>

            {/* Scroll Left Trigger Button (reveals hidden items on hover or click) */}
            <button
              type="button"
              onClick={() => scrollNav('left', 150)}
              onMouseEnter={() => startContinuousScroll('left')}
              onMouseLeave={stopContinuousScroll}
              className={`p-1.5 rounded-lg bg-slate-800/95 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer shrink-0 z-10 ml-1 shadow-md ${
                isNavOverflowing ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              title="تمرير القائمة لليسار (مرر الفأرة فوق الزر لإظهار باقي الأزرار)"
              aria-label="تمرير لليسار"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Utility Tools (Share, Sync & Install) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Cloud Real-time Status Indicator */}
            <CloudSyncIndicator isSynced={isCloudSynced} isSyncing={isCloudSyncing} />

            {/* Share QR Button */}
            <button
              type="button"
              onClick={onOpenShareModal}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
              title="مشاركة رابط المتجر وكود QR للزبائن"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Desktop / PWA Install Button */}
            <PWAInstallButton />
          </div>
        </div>

        {/* Tablet / Mobile Navigation Bar with Scroll Buttons */}
        <div className="lg:hidden flex items-center relative py-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              mobileNavRef.current?.scrollBy({ left: 100, behavior: 'smooth' });
            }}
            className="p-1 rounded-md bg-slate-800/90 text-slate-400 hover:text-white shrink-0 ml-1"
            title="تمرير"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <div
            ref={mobileNavRef}
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth flex-1 px-1"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                  {tab.isLocked && <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />}
                  {tab.badge && (
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded-full border font-bold ${
                        tab.badgeColor || 'bg-slate-700 text-slate-200 border-slate-600'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Mobile License Badge */}
            <button
              type="button"
              onClick={onOpenLicenseModal}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all whitespace-nowrap shrink-0 border ${
                licenseStatus.isLifetime
                  ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300'
                  : licenseStatus.isExpired
                  ? 'bg-rose-950 border-rose-700 text-rose-300'
                  : 'bg-slate-800/70 border-slate-700 text-slate-300'
              }`}
            >
              <Clock className="w-3 h-3 text-blue-400 shrink-0" />
              <span>{licenseStatus.isLifetime ? 'ترخيص دائم' : `باقي ${licenseStatus.daysRemaining} يوم`}</span>
            </button>

            {/* Mobile Admin Lock */}
            {isProtected && (
              <button
                type="button"
                onClick={isAdminUnlocked ? onLockAdmin : onUnlockAdmin}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all whitespace-nowrap shrink-0 border ${
                  isAdminUnlocked
                    ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300'
                    : 'bg-slate-800/70 border-slate-700 text-slate-300'
                }`}
              >
                {isAdminUnlocked ? (
                  <>
                    <Unlock className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>المدير متصل</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>دخول المدير</span>
                  </>
                )}
              </button>
            )}

            {/* Mobile Storefront Online */}
            <button
              type="button"
              onClick={onOpenStorefront}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white transition-all whitespace-nowrap shrink-0 shadow-sm"
            >
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span>متجر الزبائن أونلاين</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              mobileNavRef.current?.scrollBy({ left: -100, behavior: 'smooth' });
            }}
            className="p-1 rounded-md bg-slate-800/90 text-slate-400 hover:text-white shrink-0 mr-1"
            title="تمرير لإظهار باقي الأزرار"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
