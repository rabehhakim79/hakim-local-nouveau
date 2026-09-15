export interface Product {
  id: string;
  name: string;
  barcode: string;
  category: string;
  purchasePrice: number; // سعر الشراء لتحديد الأرباح بدقة
  sellingPrice: number;  // سعر البيع
  stock: number;         // الرصيد في المخزون
  minStockAlert: number; // حد التنبيه بنقص المخزون
  unit: string;          // قطعة، علبة، كغ، لتر...
  imageUrl?: string;     // رابط أو كود صورة المنتج
  image?: string;        // مرادف لـ imageUrl للتوافق
  description?: string;  // وصف اختياري للمنتج
  createdAt?: string;    // تاريخ إنشاء المنتج
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount?: number; // خصم خاص بالبند
}

export interface SaleItemSummary {
  productId: string;
  productName: string;
  barcode?: string;
  quantity: number;
  unitPrice: number;
  purchasePrice: number;
  total: number;
  imageUrl?: string;
  image?: string;
  productImage?: string;
}

export interface SaleInvoice {
  id: string;
  invoiceNumber: string;
  date: string; // ISO
  items: SaleItemSummary[];
  subtotal: number;
  discount: number;
  taxPercent?: number;
  taxAmount: number;
  grandTotal: number;
  profit: number;
  paymentMethod: 'cash' | 'card' | 'debt';
  customerId?: string;
  customerName?: string;
  paidAmount: number;
  remainingDebt?: number;
  status?: 'completed' | 'refunded';
  notes?: string;
}

export interface CustomerDebtRecord {
  id: string;
  date: string;
  type: 'charge' | 'payment'; // charge = إضافة دين من فاتورة، payment = تسديد دفعة
  amount: number;
  invoiceId?: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  location?: GeoLocation;
  totalDebt: number;
  totalPurchases: number;
  notes?: string;
  debtHistory: CustomerDebtRecord[];
}

export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
}

export interface OnlineOrderItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  total: number;
  imageUrl?: string;
}

export interface OnlineOrder {
  id: string;
  orderNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  deliveryType: 'pickup' | 'delivery';
  deliveryAddress?: string;
  customerLocation?: GeoLocation;
  items: OnlineOrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: 'pending' | 'preparing' | 'completed' | 'cancelled';
  notes?: string;
}

export interface StoreSettings {
  storeName: string;
  activityType: string; // بقالة، مواد غذائية، ملابس، مواد بناء، إلكترونيات...
  phone: string;
  address: string;
  storeLocation?: GeoLocation;
  googleMapsApiKey?: string;
  currency: string;
  currencyDecimals?: number; // عدد الأصفار بعد الفاصلة (الافتراضي 2)
  taxRate: number; // نسبة الضريبة المئوية
  receiptFooter: string;
  enableSoundAlerts?: boolean;
  soundEnabled?: boolean;
  // إعدادات منصة المتجر الإلكتروني
  whatsappNumber?: string;
  storeBio?: string;
  enableOnlineStore?: boolean;
  allowDelivery?: boolean;
  deliveryFee?: number;
  workingHours?: string;
  // أمان وحماية لوحة المدير والإعدادات
  adminPin?: string;
  enableAdminProtection?: boolean;
  // كلمة سر منفصلة ومخصصة لنظام ترخيص وصلاحية البرنامج
  licenseAdminPin?: string;
  // نظام ترخيص وصلاحية البرنامج والتحكم في المدة (60 يوماً وتجديدها)
  licenseStartDate?: string;
  licenseDurationDays?: number;
  licenseExpiryDate?: string;
  licenseKey?: string;
  masterDeveloperKey?: string;
  isLicenseActive?: boolean;
  isLifetimeLicense?: boolean;
  lastValidatedTimestamp?: number;
}

export interface LicenseStatus {
  isExpired: boolean;
  isLifetime: boolean;
  daysRemaining: number;
  hoursRemaining: number;
  totalDurationDays: number;
  startDate: string;
  expiryDate: string;
  percentageUsed: number;
  statusLabel: 'active' | 'warning' | 'expired';
}

export type StoreTab = 'pos' | 'inventory' | 'orders' | 'sales' | 'customers' | 'reports' | 'settings';
export type AppViewMode = 'admin' | 'storefront';
