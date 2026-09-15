// Map utilities for customer geolocation, distances, and navigation links

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // 1 decimal place
}

export function getGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function getGoogleMapsDirectionsUrl(
  destLat: number,
  destLng: number,
  originLat?: number,
  originLng?: number
): string {
  if (originLat !== undefined && originLng !== undefined) {
    return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
}

export function getWhatsAppLocationMessage(
  customerName: string,
  customerPhone: string,
  orderNumber: string,
  total: number,
  currency: string,
  lat: number,
  lng: number,
  address?: string,
  decimals: number = 2
): string {
  const gmapsUrl = getGoogleMapsUrl(lat, lng);
  const directionsUrl = getGoogleMapsDirectionsUrl(lat, lng);
  const formattedTotal = Number(total || 0).toFixed(decimals);

  const text = `📍 *موقع توصيل طلب الزبون*
👤 *الزبون:* ${customerName}
📞 *الهاتف:* ${customerPhone}
📦 *رقم الطلب:* ${orderNumber}
💰 *المجموع:* ${formattedTotal} ${currency}
🏠 *العنوان:* ${address || 'محدد على الخريطة'}

🗺️ *رابط الموقع في خرائط Google:*
${gmapsUrl}

🚗 *بدء الملاحة المباشرة للعنوان:*
${directionsUrl}`;

  return encodeURIComponent(text);
}

// Quick City Presets for fast map navigation
export const CITY_PRESETS = [
  { name: 'الجزائر العاصمة', lat: 36.7538, lng: 3.0588 },
  { name: 'وهران', lat: 35.6987, lng: -0.6349 },
  { name: 'قسنطينة', lat: 36.365, lng: 6.6147 },
  { name: 'عنابة', lat: 36.9, lng: 7.7667 },
  { name: 'البليدة', lat: 36.4702, lng: 2.8277 },
  { name: 'سطيف', lat: 36.1911, lng: 5.4137 },
  { name: 'تلمسان', lat: 34.8783, lng: -1.315 },
  { name: 'باتنة', lat: 35.5559, lng: 6.1743 },
  { name: 'الرياض', lat: 24.7136, lng: 46.6753 },
  { name: 'جدة', lat: 21.5433, lng: 39.1728 },
  { name: 'القاهرة', lat: 30.0444, lng: 31.2357 },
  { name: 'الدار البيضاء', lat: 33.5731, lng: -7.5898 },
  { name: 'تونس', lat: 36.8065, lng: 10.1815 },
];

// Simple reverse geocoding via OpenStreetMap Nominatim with fallback
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=ar,en`,
      {
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        // Build concise Arabic address
        const addr = data.address || {};
        const parts = [
          addr.road || addr.suburb || addr.neighbourhood,
          addr.city || addr.town || addr.county || addr.state,
        ].filter(Boolean);

        return parts.length > 0 ? parts.join('، ') : data.display_name.split(',').slice(0, 3).join('، ');
      }
    }
  } catch {
    // Network or timeout failure, return formatted coordinates
  }

  return `الموقع: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}
