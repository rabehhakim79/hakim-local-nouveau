import { StoreSettings, LicenseStatus } from '../types/store';

// Default initial duration requested by the user: 60 days
export const DEFAULT_LICENSE_DAYS = 60;
export const DEFAULT_MASTER_KEY = 'MASTER-2026';
export const DEFAULT_LICENSE_PIN = 'DEV-2026';

/**
 * Calculates current license status, remaining days, hours, and percentage.
 */
export function getLicenseStatus(settings: StoreSettings): LicenseStatus {
  if (settings.isLifetimeLicense) {
    return {
      isExpired: false,
      isLifetime: true,
      daysRemaining: 9999,
      hoursRemaining: 9999,
      totalDurationDays: 9999,
      startDate: settings.licenseStartDate || new Date().toISOString(),
      expiryDate: 'دائم (مدى الحياة)',
      percentageUsed: 0,
      statusLabel: 'active',
    };
  }

  const now = Date.now();
  let startDate = now;
  if (settings.licenseStartDate) {
    const parsedStart = new Date(settings.licenseStartDate).getTime();
    if (!isNaN(parsedStart) && parsedStart > 0) {
      startDate = parsedStart;
    }
  }
  
  const durationDays = settings.licenseDurationDays && settings.licenseDurationDays > 0 ? settings.licenseDurationDays : DEFAULT_LICENSE_DAYS;

  // Expiry date calculation
  let expiryTime = startDate + durationDays * 24 * 60 * 60 * 1000;
  if (settings.licenseExpiryDate) {
    const parsedExpiry = new Date(settings.licenseExpiryDate).getTime();
    if (!isNaN(parsedExpiry) && parsedExpiry > 0) {
      expiryTime = parsedExpiry;
    }
  }

  const totalDurationMs = Math.max(1, expiryTime - startDate);
  const remainingMs = expiryTime - now;

  const isExpired = remainingMs <= 0;
  const daysRemaining = isExpired ? 0 : Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
  const hoursRemaining = isExpired ? 0 : Math.ceil(remainingMs / (1000 * 60 * 60));

  const elapsedMs = Math.max(0, now - startDate);
  const percentageUsed = Math.min(100, Math.max(0, Math.round((elapsedMs / totalDurationMs) * 100)));

  let statusLabel: 'active' | 'warning' | 'expired' = 'active';
  if (isExpired) {
    statusLabel = 'expired';
  } else if (daysRemaining <= 10) {
    statusLabel = 'warning';
  }

  let formattedStartDate = '';
  let formattedExpiryDate = '';
  try {
    formattedStartDate = new Date(startDate).toISOString();
  } catch {
    formattedStartDate = new Date(now).toISOString();
  }
  try {
    formattedExpiryDate = new Date(expiryTime).toISOString();
  } catch {
    formattedExpiryDate = new Date(now + durationDays * 24 * 60 * 60 * 1000).toISOString();
  }

  return {
    isExpired,
    isLifetime: false,
    daysRemaining,
    hoursRemaining,
    totalDurationDays: durationDays,
    startDate: formattedStartDate,
    expiryDate: formattedExpiryDate,
    percentageUsed,
    statusLabel,
  };
}

/**
 * Generates an authentic renewal activation code for the owner to give to the client.
 */
export function generateRenewalCode(durationDays: number | 'lifetime'): string {
  if (durationDays === 'lifetime') {
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const sum = 99;
    return `ACT-LIFE-${randomHex}-${sum}`;
  }

  const daysStr = `${durationDays}D`;
  const randomPart = Math.floor(1000 + Math.random() * 9000); // 4-digit
  // Simple checksum to ensure authenticity
  const checksum = (randomPart * 7 + durationDays) % 97;
  return `ACT-${daysStr}-${randomPart}-${checksum.toString().padStart(2, '0')}`;
}

export interface RenewalResult {
  success: boolean;
  message: string;
  extendedDays?: number;
  isLifetime?: boolean;
  newExpiryDate?: string;
}

/**
 * Validates an activation / renewal code or developer master key.
 */
export function validateAndApplyCode(
  inputCode: string,
  settings: StoreSettings
): RenewalResult {
  if (!inputCode) {
    return { success: false, message: 'يرجى إدخال كود التجديد أو رمز المطور' };
  }

  // Normalize Arabic and Eastern numerals
  const normalized = inputCode
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());

  const code = normalized.toUpperCase();

  if (!code) {
    return { success: false, message: 'يرجى إدخال كود التجديد أو رمز المطور' };
  }

  // 1. Master Developer Key & License Admin PIN check (Owner/Developer bypass)
  const masterKey = (settings.masterDeveloperKey || DEFAULT_MASTER_KEY).trim().toUpperCase();
  const licensePin = (settings.licenseAdminPin || DEFAULT_LICENSE_PIN).trim().toUpperCase();
  if (code === masterKey || code === licensePin || code === 'MASTER-2026' || code === 'DEV-60D') {
    // Grant 60 days default extension or unblock
    const now = Date.now();
    const currentExpiry = settings.licenseExpiryDate ? new Date(settings.licenseExpiryDate).getTime() : now;
    const baseTime = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(baseTime + 60 * 24 * 60 * 60 * 1000).toISOString();

    return {
      success: true,
      message: 'تم تفعيل صلاحية البرنامج بنجاح عبر الرمز الرئيسي للمطور (+60 يوماً إضافية)!',
      extendedDays: 60,
      newExpiryDate: newExpiry,
    };
  }

  // 2. Lifetime Code check
  if (code.startsWith('ACT-LIFE-')) {
    return {
      success: true,
      message: 'تم تفعيل الترخيص الدائم غير المحدود بنجاح (مدى الحياة)!',
      isLifetime: true,
      extendedDays: 9999,
    };
  }

  // 3. Duration-based activation codes
  const match = code.match(/^ACT-(\d+)D-(\d{4})-(\d{2})$/);
  if (match) {
    const durationDays = parseInt(match[1], 10);
    const randomPart = parseInt(match[2], 10);
    const checksum = parseInt(match[3], 10);

    const expectedChecksum = (randomPart * 7 + durationDays) % 97;
    if (checksum === expectedChecksum && durationDays > 0) {
      const now = Date.now();
      const currentExpiry = settings.licenseExpiryDate ? new Date(settings.licenseExpiryDate).getTime() : now;
      const baseTime = currentExpiry > now ? currentExpiry : now;
      const newExpiry = new Date(baseTime + durationDays * 24 * 60 * 60 * 1000).toISOString();

      return {
        success: true,
        message: `تم تجديد وتمديد صلاحية البرنامج بنجاح لمدة ${durationDays} يوماً إضافية!`,
        extendedDays: durationDays,
        newExpiryDate: newExpiry,
      };
    }
  }

  // 4. Also support direct numeric PIN extension codes if owner entered simple format like RENEW60 or 60DAYS
  if (code === 'RENEW30' || code === 'RENEW-30') {
    return {
      success: true,
      message: 'تم تمديد صلاحية البرنامج لمدة 30 يوماً!',
      extendedDays: 30,
      newExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }
  if (code === 'RENEW60' || code === 'RENEW-60') {
    return {
      success: true,
      message: 'تم تمديد صلاحية البرنامج لمدة 60 يوماً!',
      extendedDays: 60,
      newExpiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }
  if (code === 'RENEW365' || code === 'RENEW-365' || code === 'RENEW1YEAR') {
    return {
      success: true,
      message: 'تم تمديد صلاحية البرنامج لمدة سنة كاملة (365 يوماً)!',
      extendedDays: 365,
      newExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  return {
    success: false,
    message: 'كود التجديد غير صحيح أو غير متطابق. يرجى مراجعة مالك ومطور النظام للحصول على كود صالح.',
  };
}

/**
 * Formats a date string in Arabic readable format (e.g. 15 نوفمبر 2026).
 */
export function formatArabicDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString('ar-DZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return isoDate;
  }
}
