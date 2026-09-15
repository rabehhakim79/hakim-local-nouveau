import { useState, useEffect, useMemo, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Product,
  SaleInvoice,
  Customer,
  StoreSettings,
  StoreTab,
  OnlineOrder,
  GeoLocation,
} from './types/store';
import {
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_INVOICES,
  INITIAL_SETTINGS,
  INITIAL_ONLINE_ORDERS,
} from './data/initialStoreData';
import { StoreNavbar } from './components/common/StoreNavbar';
import { POSView } from './components/pos/POSView';
import { InventoryView } from './components/inventory/InventoryView';
import { SalesHistoryView } from './components/sales/SalesHistoryView';
import { CustomersView } from './components/customers/CustomersView';
import { ReportsView } from './components/dashboard/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { OnlineOrdersView } from './components/orders/OnlineOrdersView';
import { StorefrontView } from './components/storefront/StorefrontView';
import { ShareStoreModal } from './components/common/ShareStoreModal';
import { ReceiptModal } from './components/common/ReceiptModal';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { AdminPinModal } from './components/common/AdminPinModal';
import { LicenseExpiredModal } from './components/common/LicenseExpiredModal';
import { LicenseInfoModal } from './components/common/LicenseInfoModal';
import { getLicenseStatus } from './utils/license';
import {
  subscribeToOrders,
  subscribeToProducts,
  subscribeToSettings,
  subscribeToCustomers,
  subscribeToInvoices,
  saveOrderToFirestore,
  updateOrderStatusInFirestore,
  saveProductToFirestore,
  deleteProductFromFirestore,
  saveSettingsToFirestore,
  saveCustomerToFirestore,
  saveInvoiceToFirestore,
  seedInitialProductsIfEmpty,
} from './services/storeSyncService';
import { isFirebaseConfigured } from './services/firebase';

const STORAGE_KEY_PRODUCTS = 'pos_store_products_v1';
const STORAGE_KEY_INVOICES = 'pos_store_invoices_v1';
const STORAGE_KEY_CUSTOMERS = 'pos_store_customers_v1';
const STORAGE_KEY_SETTINGS = 'pos_store_settings_v1';
const STORAGE_KEY_ORDERS = 'pos_store_online_orders_v1';

export default function App() {
  const [currentTab, setCurrentTab] = useState<StoreTab>('pos');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Check if opened via ?view=store
  const [viewMode, setViewMode] = useState<'admin' | 'storefront'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'store') return 'storefront';
    }
    return 'admin';
  });

  // 1. Products state
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p) => {
            if (!p.imageUrl) {
              const matchedInitial = INITIAL_PRODUCTS.find((init) => init.id === p.id);
              if (matchedInitial?.imageUrl) {
                return { ...p, imageUrl: matchedInitial.imageUrl };
              }
            }
            return p;
          });
        }
      }
      return INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  // 2. Invoices state
  const [invoices, setInvoices] = useState<SaleInvoice[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INVOICES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return INITIAL_INVOICES;
    } catch {
      return INITIAL_INVOICES;
    }
  });

  // 3. Customers state
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((cust: Customer) => {
            if (!cust.location) {
              const matched = INITIAL_CUSTOMERS.find((init) => init.id === cust.id);
              if (matched?.location) {
                return { ...cust, location: matched.location, address: cust.address || matched.address };
              }
            }
            return cust;
          });
        }
      }
      return INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  });

  // 4. Settings state
  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...INITIAL_SETTINGS,
            ...parsed,
            storeLocation: parsed.storeLocation || INITIAL_SETTINGS.storeLocation,
          };
        }
      }
      return INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // 5. Online Orders state
  const [onlineOrders, setOnlineOrders] = useState<OnlineOrder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ORDERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((ord: OnlineOrder) => {
            if (!ord.customerLocation) {
              const matched = INITIAL_ONLINE_ORDERS.find((init) => init.id === ord.id);
              if (matched?.customerLocation) {
                return { ...ord, customerLocation: matched.customerLocation };
              }
            }
            return ord;
          });
        }
      }
      return INITIAL_ONLINE_ORDERS;
    } catch {
      return INITIAL_ONLINE_ORDERS;
    }
  });

  // Active Receipt Modal
  const [activeReceiptInvoice, setActiveReceiptInvoice] = useState<SaleInvoice | null>(null);

  // Cloud Synchronization Status
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(isFirebaseConfigured);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  // Real-time Cloud Synchronization Subscriptions (Firestore)
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    // Seed products if cloud database is empty
    seedInitialProductsIfEmpty(INITIAL_PRODUCTS).catch(console.warn);

    setIsCloudSyncing(true);

    // 1. Subscribe to online orders
    const unsubOrders = subscribeToOrders((cloudOrders) => {
      setOnlineOrders(cloudOrders);
      setIsCloudSynced(true);
      setIsCloudSyncing(false);
    });

    // 2. Subscribe to products
    const unsubProducts = subscribeToProducts((cloudProds) => {
      setProducts(cloudProds);
      setIsCloudSynced(true);
    });

    // 3. Subscribe to store settings
    const unsubSettings = subscribeToSettings((cloudSettings) => {
      setSettings((prev) => ({ ...prev, ...cloudSettings }));
      setIsCloudSynced(true);
    });

    // 4. Subscribe to customers
    const unsubCustomers = subscribeToCustomers((cloudCustomers) => {
      setCustomers(cloudCustomers);
      setIsCloudSynced(true);
    });

    // 5. Subscribe to invoices
    const unsubInvoices = subscribeToInvoices((cloudInvoices) => {
      setInvoices(cloudInvoices);
      setIsCloudSynced(true);
    });

    return () => {
      unsubOrders();
      unsubProducts();
      unsubSettings();
      unsubCustomers();
      unsubInvoices();
    };
  }, []);

  // License Management & 60-Day Expiry State
  const [isLicenseInfoOpen, setIsLicenseInfoOpen] = useState(false);
  const licenseStatus = useMemo(() => getLicenseStatus(settings), [settings]);

  // Admin PIN Authentication State
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('pos_store_admin_auth_v1') === 'true';
    }
    return false;
  });
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [pinModalTitle, setPinModalTitle] = useState('التحقق من هوية المدير');
  const [pinModalDesc, setPinModalDesc] = useState('يرجى إدخال الرمز السري للوصول إلى الإعدادات والتقارير المالية.');

  const unlockAdminSession = () => {
    setIsAdminUnlocked(true);
    try {
      sessionStorage.setItem('pos_store_admin_auth_v1', 'true');
    } catch {
      // Ignore
    }
  };

  const lockAdminSession = () => {
    setIsAdminUnlocked(false);
    try {
      sessionStorage.removeItem('pos_store_admin_auth_v1');
    } catch {
      // Ignore
    }
    if (currentTab === 'settings' || currentTab === 'reports') {
      setCurrentTab('pos');
    }
  };

  const handlePinSuccess = () => {
    unlockAdminSession();
    setIsPinModalOpen(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handleSelectTab = (tab: StoreTab) => {
    const isSensitive = tab === 'settings' || tab === 'reports';
    if (isSensitive && (settings.enableAdminProtection ?? true) && !isAdminUnlocked) {
      setPinModalTitle(tab === 'settings' ? 'قفل إعدادات المتجر' : 'قفل تقارير الأرباح والمبيعات');
      setPinModalDesc(
        tab === 'settings'
          ? 'يرجى إدخال الرمز السري للمدير للتحكم في الإعدادات والأسعار وحماية المتجر.'
          : 'يرجى إدخال الرمز السري للمدير للاطلاع على كشف الأرباح والمبيعات المالية.'
      );
      setPendingAction(() => () => setCurrentTab(tab));
      setIsPinModalOpen(true);
      return;
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToAdminFromStorefront = () => {
    if ((settings.enableAdminProtection ?? true) && !isAdminUnlocked) {
      setPinModalTitle('دخول لوحة إدارة المتجر والكاشير');
      setPinModalDesc('هذه المنطقة مخصصة لإدارة المحل فقط. يرجى إدخال رمز PIN للمدير للمتابعة.');
      setPendingAction(() => () => setViewMode('admin'));
      setIsPinModalOpen(true);
      return;
    }
    setViewMode('admin');
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
    } catch {
      // Ignore
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(invoices));
    } catch {
      // Ignore
    }
  }, [invoices]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
    } catch {
      // Ignore
    }
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {
      // Ignore
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(onlineOrders));
    } catch {
      // Ignore
    }
  }, [onlineOrders]);

  // Derived counts for navbar badges
  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stock <= p.minStockAlert).length;
  }, [products]);

  const debtorsCount = useMemo(() => {
    return customers.filter((c) => c.totalDebt > 0).length;
  }, [customers]);

  const pendingOrdersCount = useMemo(() => {
    return onlineOrders.filter((o) => o.status === 'pending').length;
  }, [onlineOrders]);

  // Sound chime notification
  const playAlertSound = (freq = 800) => {
    if (!settings.enableSoundAlerts) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Ignore
    }
  };

  // Handlers for Online Orders
  const handleSubmitOnlineOrder = (newOrder: OnlineOrder) => {
    setOnlineOrders((prev) => [newOrder, ...prev]);
    saveOrderToFirestore(newOrder).catch(console.warn);
    playAlertSound(950);
  };

  const handleUpdateOrderStatus = (orderId: string, status: OnlineOrder['status']) => {
    setOnlineOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    updateOrderStatusInFirestore(orderId, status).catch(console.warn);
  };

  const handleUpdateOrderLocation = (orderId: string, location: GeoLocation) => {
    setOnlineOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updated = { ...o, customerLocation: location };
          saveOrderToFirestore(updated).catch(console.warn);
          return updated;
        }
        return o;
      })
    );
  };

  const handleConvertOrderToInvoice = (order: OnlineOrder) => {
    // 1. Deduct stock from products
    const updatedProducts = products.map((prod) => {
      const orderItem = order.items.find((item) => item.productId === prod.id);
      if (orderItem) {
        const updated = {
          ...prod,
          stock: Math.max(0, prod.stock - orderItem.quantity),
        };
        saveProductToFirestore(updated).catch(console.warn);
        return updated;
      }
      return prod;
    });

    // 2. Create POS invoice
    const newInvoice: SaleInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString(),
      items: order.items.map((it) => {
        const matchingProd = products.find((p) => p.id === it.productId);
        return {
          productId: it.productId,
          productName: it.productName,
          barcode: matchingProd?.barcode || '',
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          purchasePrice: matchingProd?.purchasePrice || it.unitPrice * 0.75,
          total: it.total,
          imageUrl: it.imageUrl || matchingProd?.imageUrl,
        };
      }),
      subtotal: order.subtotal,
      discount: 0,
      taxPercent: 0,
      taxAmount: 0,
      grandTotal: order.total,
      profit: order.items.reduce((acc, it) => {
        const matchingProd = products.find((p) => p.id === it.productId);
        const purchase = matchingProd?.purchasePrice || it.unitPrice * 0.75;
        return acc + (it.unitPrice - purchase) * it.quantity;
      }, 0),
      paymentMethod: 'cash',
      paidAmount: order.total,
      remainingDebt: 0,
      customerName: order.customerName,
      status: 'completed',
    };

    // 3. Update state & Firestore
    setProducts(updatedProducts);
    setInvoices((prev) => [newInvoice, ...prev]);
    saveInvoiceToFirestore(newInvoice).catch(console.warn);

    setOnlineOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: 'completed' } : o))
    );
    updateOrderStatusInFirestore(order.id, 'completed').catch(console.warn);

    // Open receipt modal
    setActiveReceiptInvoice(newInvoice);
    playAlertSound(1100);
  };

  // Handlers for POS Sale Completion
  const handleCompleteSale = (
    newInvoice: SaleInvoice,
    updatedProducts: Product[],
    updatedCustomers: Customer[]
  ) => {
    setInvoices((prev) => [newInvoice, ...prev]);
    setProducts(updatedProducts);
    setCustomers(updatedCustomers);

    // Save to Firestore
    saveInvoiceToFirestore(newInvoice).catch(console.warn);
    updatedProducts.forEach((p) => saveProductToFirestore(p).catch(console.warn));
    updatedCustomers.forEach((c) => saveCustomerToFirestore(c).catch(console.warn));

    // Automatically open receipt for print / preview
    setActiveReceiptInvoice(newInvoice);
    playAlertSound(1000);
  };

  // Handlers for Inventory
  const handleSaveProduct = (product: Product) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = product;
        return next;
      }
      return [product, ...prev];
    });
    saveProductToFirestore(product).catch(console.warn);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    deleteProductFromFirestore(id).catch(console.warn);
  };

  const handleQuickAdjustStock = (id: string, delta: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, stock: Math.max(0, p.stock + delta) };
          saveProductToFirestore(updated).catch(console.warn);
          return updated;
        }
        return p;
      })
    );
  };

  // Handlers for Invoices
  const handleRefundInvoice = (invoiceId: string) => {
    const target = invoices.find((i) => i.id === invoiceId);
    if (!target || target.status === 'refunded') return;

    // 1. Mark as refunded
    setInvoices((prev) =>
      prev.map((i) => {
        if (i.id === invoiceId) {
          const updated = { ...i, status: 'refunded' as const };
          saveInvoiceToFirestore(updated).catch(console.warn);
          return updated;
        }
        return i;
      })
    );

    // 2. Return items to stock
    setProducts((prev) =>
      prev.map((p) => {
        const item = target.items.find((it) => it.productId === p.id);
        if (item) {
          const updated = { ...p, stock: p.stock + item.quantity };
          saveProductToFirestore(updated).catch(console.warn);
          return updated;
        }
        return p;
      })
    );

    // 3. If it had debt, remove debt from customer
    if (target.paymentMethod === 'debt' && target.customerId && target.remainingDebt > 0) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === target.customerId) {
            const updated = {
              ...c,
              totalDebt: Math.max(0, c.totalDebt - target.remainingDebt),
              debtHistory: [
                {
                  id: `refund-${Date.now()}`,
                  date: new Date().toISOString(),
                  type: 'payment' as const,
                  amount: target.remainingDebt,
                  notes: `استرجاع وإلغاء دين الفاتورة رقم ${target.invoiceNumber}`,
                },
                ...c.debtHistory,
              ],
            };
            saveCustomerToFirestore(updated).catch(console.warn);
            return updated;
          }
          return c;
        })
      );
    }
  };

  // Handlers for Customers & Debt Settlement
  const handleSaveCustomer = (customer: Customer) => {
    setCustomers((prev) => {
      const idx = prev.findIndex((c) => c.id === customer.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = customer;
        return next;
      }
      return [...prev, customer];
    });
    saveCustomerToFirestore(customer).catch(console.warn);
  };

  const handleSettleDebt = (customerId: string, amount: number, note: string) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const newDebt = Math.max(0, c.totalDebt - amount);
          const historyEntry = {
            id: `settle-${Date.now()}`,
            date: new Date().toISOString(),
            type: 'payment' as const,
            amount,
            notes: note || 'تسديد دفعة دين نقدية',
          };
          const updated = {
            ...c,
            totalDebt: newDebt,
            debtHistory: [historyEntry, ...c.debtHistory],
          };
          saveCustomerToFirestore(updated).catch(console.warn);
          return updated;
        }
        return c;
      })
    );
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSaveSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
    saveSettingsToFirestore(newSettings).catch(console.warn);
  };

  // Backup & Restore Handlers
  const handleExportData = () => {
    const data = {
      products,
      invoices,
      customers,
      settings,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `store-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.products && Array.isArray(parsed.products)) setProducts(parsed.products);
        if (parsed.invoices && Array.isArray(parsed.invoices)) setInvoices(parsed.invoices);
        if (parsed.customers && Array.isArray(parsed.customers)) setCustomers(parsed.customers);
        if (parsed.settings) setSettings(parsed.settings);
        alert('تم استيراد واسترجاع بيانات المحل بنجاح!');
      } catch {
        alert('الملف غير صالح، يرجى التأكد من اختيار ملف JSON صحيح.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemoData = () => {
    setProducts(INITIAL_PRODUCTS);
    setCustomers(INITIAL_CUSTOMERS);
    setInvoices(INITIAL_INVOICES);
    setSettings(INITIAL_SETTINGS);
  };

  if (viewMode === 'storefront') {
    return (
      <div id="storefront-root" className="min-h-screen bg-slate-950 font-['Cairo',sans-serif]">
        <StorefrontView
          products={products}
          settings={settings}
          onBackToAdmin={handleBackToAdminFromStorefront}
          onSubmitOrder={handleSubmitOnlineOrder}
          onOpenShareModal={() => setIsShareModalOpen(true)}
        />
        {isShareModalOpen && (
          <ShareStoreModal
            settings={settings}
            onClose={() => setIsShareModalOpen(false)}
            onOpenStorefront={() => setViewMode('storefront')}
          />
        )}
        {/* Admin PIN Verification Modal inside Storefront */}
        {isPinModalOpen && (
          <AdminPinModal
            correctPin={settings.adminPin || '1234'}
            title={pinModalTitle}
            description={pinModalDesc}
            onSuccess={handlePinSuccess}
            onClose={() => {
              setIsPinModalOpen(false);
              setPendingAction(null);
            }}
          />
        )}
        <OfflineIndicator />
      </div>
    );
  }

  return (
    <div
      id="pos-app-root"
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo',sans-serif]"
    >
      {/* Navbar */}
      <StoreNavbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        settings={settings}
        productsCount={products.length}
        lowStockCount={lowStockCount}
        debtorsCount={debtorsCount}
        pendingOrdersCount={pendingOrdersCount}
        isAdminUnlocked={isAdminUnlocked}
        onLockAdmin={lockAdminSession}
        onUnlockAdmin={() => {
          setPinModalTitle('دخول لوحة المدير');
          setPinModalDesc('يرجى إدخال الرمز السري للمدير لفتح جلسة التحكم الكامل.');
          setPendingAction(() => () => setIsAdminUnlocked(true));
          setIsPinModalOpen(true);
        }}
        onOpenStorefront={() => setViewMode('storefront')}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenLicenseModal={() => setIsLicenseInfoOpen(true)}
        isCloudSynced={isCloudSynced}
        isCloudSyncing={isCloudSyncing}
      />

      {/* Main Screen Content */}
      <main id="store-main-viewport" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {currentTab === 'pos' && (
              <POSView
                products={products}
                customers={customers}
                settings={settings}
                onCompleteSale={handleCompleteSale}
              />
            )}

            {currentTab === 'orders' && (
              <OnlineOrdersView
                orders={onlineOrders}
                settings={settings}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onConvertOrderToInvoice={handleConvertOrderToInvoice}
                onOpenStorefront={() => setViewMode('storefront')}
                onOpenShareModal={() => setIsShareModalOpen(true)}
                onUpdateOrderLocation={handleUpdateOrderLocation}
              />
            )}

            {currentTab === 'inventory' && (
              <InventoryView
                products={products}
                settings={settings}
                onSaveProduct={handleSaveProduct}
                onDeleteProduct={handleDeleteProduct}
                onQuickAdjustStock={handleQuickAdjustStock}
              />
            )}

            {currentTab === 'sales' && (
              <SalesHistoryView
                invoices={invoices}
                settings={settings}
                onSelectInvoiceForReceipt={(inv) => setActiveReceiptInvoice(inv)}
                onRefundInvoice={handleRefundInvoice}
              />
            )}

            {currentTab === 'customers' && (
              <CustomersView
                customers={customers}
                settings={settings}
                onSaveCustomer={handleSaveCustomer}
                onSettleDebt={handleSettleDebt}
                onDeleteCustomer={handleDeleteCustomer}
              />
            )}

            {currentTab === 'reports' && (
              <ReportsView
                invoices={invoices}
                products={products}
                customers={customers}
                settings={settings}
                onNavigateTab={(tab) => setCurrentTab(tab)}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsView
                settings={settings}
                onSaveSettings={handleSaveSettings}
                onExportData={handleExportData}
                onImportData={handleImportData}
                onResetDemoData={handleResetDemoData}
                onOpenStorefront={() => setViewMode('storefront')}
                onOpenShareModal={() => setIsShareModalOpen(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-4 px-4 sm:px-8 text-slate-500 text-xs text-center print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {settings.storeName} — نظام إدارة المحلات التجارية ونقاط البيع السريعة
          </span>
          <span className="font-mono text-[11px] text-slate-500">
            تخزين آمن ومحلي • جاهز للعمل دون انقطاع
          </span>
        </div>
      </footer>

      {/* Share Store Modal */}
      {isShareModalOpen && (
        <ShareStoreModal
          settings={settings}
          onClose={() => setIsShareModalOpen(false)}
          onOpenStorefront={() => {
            setIsShareModalOpen(false);
            setViewMode('storefront');
          }}
        />
      )}

      {/* Printable Thermal Receipt Modal */}
      {activeReceiptInvoice && (
        <ReceiptModal
          invoice={activeReceiptInvoice}
          settings={settings}
          onClose={() => setActiveReceiptInvoice(null)}
        />
      )}

      {/* Offline Status Connectivity Banner */}
      <OfflineIndicator />

      {/* Admin PIN Verification Modal */}
      {isPinModalOpen && (
        <AdminPinModal
          correctPin={settings.adminPin || '1234'}
          title={pinModalTitle}
          description={pinModalDesc}
          onSuccess={handlePinSuccess}
          onClose={() => {
            setIsPinModalOpen(false);
            setPendingAction(null);
          }}
        />
      )}

      {/* License Info Modal */}
      {isLicenseInfoOpen && (
        <LicenseInfoModal
          settings={settings}
          onClose={() => setIsLicenseInfoOpen(false)}
          onRenewSuccess={(newSettings) => {
            setSettings(newSettings);
            setIsLicenseInfoOpen(false);
          }}
        />
      )}

      {/* License Expired Blocking Modal (Activates when 60-day period expires) */}
      {licenseStatus.isExpired && (
        <LicenseExpiredModal
          settings={settings}
          onRenewSuccess={(newSettings) => {
            setSettings(newSettings);
          }}
        />
      )}
    </div>
  );
}
