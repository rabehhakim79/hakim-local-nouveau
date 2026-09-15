import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  X,
  MapPin,
  ExternalLink,
  Navigation,
  Share2,
  Copy,
  Check,
  Phone,
  Store,
  Layers,
} from 'lucide-react';
import { GeoLocation, StoreSettings } from '../../types/store';
import {
  calculateDistanceKm,
  getGoogleMapsUrl,
  getGoogleMapsDirectionsUrl,
  getWhatsAppLocationMessage,
} from '../../utils/mapUtils';

interface CustomerLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  customerPhone: string;
  orderNumber?: string;
  orderTotal?: number;
  deliveryAddress?: string;
  location: GeoLocation;
  settings: StoreSettings;
}

export const CustomerLocationModal: React.FC<CustomerLocationModalProps> = ({
  isOpen,
  onClose,
  customerName,
  customerPhone,
  orderNumber = '',
  orderTotal = 0,
  deliveryAddress,
  location,
  settings,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [copied, setCopied] = useState(false);
  const [mapType, setMapType] = useState<'osm' | 'satellite'>('osm');

  // Calculate distance if store location exists
  const distanceKm = settings.storeLocation
    ? calculateDistanceKm(
        settings.storeLocation.lat,
        settings.storeLocation.lng,
        location.lat,
        location.lng
      )
    : null;

  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    // Cleanup previous map if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [location.lat, location.lng],
      zoom: 16,
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    // Tile layer
    const tileUrl =
      mapType === 'osm'
        ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    const attribution =
      mapType === 'osm'
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        : '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS';

    L.tileLayer(tileUrl, {
      attribution,
      maxZoom: 19,
    }).addTo(map);

    // Custom pulse customer pin icon
    const customerIcon = L.divIcon({
      className: 'custom-customer-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
          <div style="width: 38px; height: 38px; border-radius: 50%; background: #ef4444; border: 3px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.4); animation: pulse 2s infinite;">
            <svg style="width: 20px; height: 20px; fill: white;" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/>
            </svg>
          </div>
          <div style="width: 12px; height: 4px; border-radius: 50%; background: rgba(0,0,0,0.3); margin-top: 2px;"></div>
        </div>
      `,
      iconSize: [40, 44],
      iconAnchor: [20, 42],
      popupAnchor: [0, -42],
    });

    const marker = L.marker([location.lat, location.lng], { icon: customerIcon }).addTo(map);

    // Popup content
    const popupContent = `
      <div style="direction: rtl; text-align: right; font-family: sans-serif; min-width: 180px; padding: 4px;">
        <div style="font-weight: bold; color: #0f172a; font-size: 14px; margin-bottom: 4px;">${customerName}</div>
        <div style="color: #475569; font-size: 12px; margin-bottom: 2px;">📞 ${customerPhone}</div>
        ${orderNumber ? `<div style="color: #2563eb; font-weight: bold; font-size: 12px; margin-bottom: 2px;">📦 طلب: ${orderNumber}</div>` : ''}
        ${deliveryAddress ? `<div style="color: #334155; font-size: 11px; margin-top: 4px; border-top: 1px solid #e2e8f0; padding-top: 4px;">📍 ${deliveryAddress}</div>` : ''}
      </div>
    `;
    marker.bindPopup(popupContent).openPopup();

    // If store location exists, add store marker and polyline
    if (settings.storeLocation) {
      const storeIcon = L.divIcon({
        className: 'custom-store-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: #2563eb; border: 3px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.35);">
              <svg style="width: 18px; height: 18px; fill: white;" viewBox="0 0 24 24">
                <path d="M4 4h16v2H4zm2 4h12v2H6zm-2 4h16v8H4z"/>
              </svg>
            </div>
            <div style="font-size: 10px; background: #1e293b; color: white; padding: 2px 6px; border-radius: 4px; margin-top: 2px; font-weight: bold; white-space: nowrap;">المحل</div>
          </div>
        `,
        iconSize: [36, 48],
        iconAnchor: [18, 44],
      });

      L.marker([settings.storeLocation.lat, settings.storeLocation.lng], { icon: storeIcon })
        .addTo(map)
        .bindPopup(`<b>${settings.storeName || 'المحل'}</b><br>${settings.address || ''}`);

      // Draw dashed route line between store and customer
      const latlngs: [number, number][] = [
        [settings.storeLocation.lat, settings.storeLocation.lng],
        [location.lat, location.lng],
      ];
      L.polyline(latlngs, {
        color: '#2563eb',
        weight: 3,
        dashArray: '6, 8',
        opacity: 0.8,
      }).addTo(map);

      // Fit bounds to show both
      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    // Leaflet container sizing fix
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, location.lat, location.lng, mapType, settings.storeLocation]);

  if (!isOpen) return null;

  const gmapsUrl = getGoogleMapsUrl(location.lat, location.lng);
  const directionsUrl = getGoogleMapsDirectionsUrl(
    location.lat,
    location.lng,
    settings.storeLocation?.lat,
    settings.storeLocation?.lng
  );

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(gmapsUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSendToDriver = () => {
    const encoded = getWhatsAppLocationMessage(
      customerName,
      customerPhone,
      orderNumber,
      orderTotal,
      settings.currency,
      location.lat,
      location.lng,
      deliveryAddress || location.address
    );
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <span>موقع الزبون: {customerName}</span>
                {orderNumber && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 font-mono">
                    {orderNumber}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {deliveryAddress || location.address || `الإحداثيات: ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Map layer toggle */}
            <button
              type="button"
              onClick={() => setMapType(mapType === 'osm' ? 'satellite' : 'osm')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
              title="تغيير نمط الخريطة"
            >
              <Layers className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">{mapType === 'osm' ? 'قمر صناعي' : 'خريطة شوارع'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Map Viewport */}
        <div className="relative w-full h-[50vh] sm:h-[55vh] bg-slate-950">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Quick distance overlay badge */}
          {distanceKm !== null && (
            <div className="absolute top-3 right-3 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-700 px-3 py-1.5 rounded-xl text-xs text-slate-200 shadow-lg flex items-center gap-2">
              <Store className="w-4 h-4 text-blue-400" />
              <span>المسافة التقريبية من المحل:</span>
              <span className="font-bold text-emerald-400 font-mono">{distanceKm} كم</span>
            </div>
          )}

          {/* Coordinates indicator */}
          <div className="absolute bottom-3 left-3 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-mono text-slate-400 shadow-md">
            {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
          </div>
        </div>

        {/* Action Controls & Navigation Footer */}
        <div className="p-4 bg-slate-850 border-t border-slate-800 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {/* 1. Open Google Maps Directions */}
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-sm cursor-pointer text-center"
            >
              <Navigation className="w-4 h-4 shrink-0" />
              <span>بدء الملاحة (GPS)</span>
            </a>

            {/* 2. Open in Google Maps */}
            <a
              href={gmapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition border border-slate-700 cursor-pointer text-center"
            >
              <ExternalLink className="w-4 h-4 shrink-0 text-amber-400" />
              <span>فتح في Google Maps</span>
            </a>

            {/* 3. Send Location to Delivery Driver via WhatsApp */}
            <button
              type="button"
              onClick={handleSendToDriver}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-sm cursor-pointer text-center"
            >
              <Share2 className="w-4 h-4 shrink-0" />
              <span>إرسال للسائق (واتساب)</span>
            </button>

            {/* 4. Call Customer */}
            <a
              href={`tel:${customerPhone}`}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition border border-slate-700 cursor-pointer text-center"
            >
              <Phone className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>اتصال بالزبون</span>
            </a>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
            <div className="truncate min-w-0 pr-2">
              <span className="font-semibold text-slate-300">العنوان: </span>
              <span>{deliveryAddress || location.address || 'محدد على الخريطة'}</span>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition shrink-0 cursor-pointer font-medium"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">تم نسخ الرابط!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ رابط الخريطة</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
