import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  X,
  MapPin,
  Crosshair,
  Search,
  Check,
  Loader2,
  AlertCircle,
  Navigation,
} from 'lucide-react';
import { GeoLocation } from '../../types/store';
import { CITY_PRESETS, reverseGeocode } from '../../utils/mapUtils';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLocation?: GeoLocation;
  title?: string;
  subtitle?: string;
  onConfirm: (location: GeoLocation) => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  initialLocation,
  title = 'تحديد موقع التوصيل على الخريطة',
  subtitle = 'انقر على الخريطة أو اسحب العلامة لتحديد موقعك بدقة متناهية',
  onConfirm,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Default to initialLocation, or default center (36.7538, 3.0588)
  const [selectedLat, setSelectedLat] = useState<number>(
    initialLocation?.lat || 36.7538
  );
  const [selectedLng, setSelectedLng] = useState<number>(
    initialLocation?.lng || 3.0588
  );
  const [addressText, setAddressText] = useState<string>(
    initialLocation?.address || ''
  );
  const [additionalNotes, setAdditionalNotes] = useState<string>('');

  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Update position and reverse geocode
  const updatePosition = async (lat: number, lng: number, shouldGeocode = true) => {
    setSelectedLat(lat);
    setSelectedLng(lng);

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }

    if (shouldGeocode) {
      setIsGeocoding(true);
      try {
        const readable = await reverseGeocode(lat, lng);
        setAddressText(readable);
      } catch {
        // Ignore
      } finally {
        setIsGeocoding(false);
      }
    }
  };

  // GPS Geolocation Handler
  const handleGetGPSLocation = () => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('خاصية تحديد الموقع الجغرافي GPS غير مدعومة في هذا المتصفح');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        updatePosition(latitude, longitude, true);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 17, { duration: 1.2 });
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('يرجى السماح بصلاحية الموقع في المتصفح لتحديد موقعك تلقائياً');
        } else {
          setGpsError('تعذر تحديد موقع GPS الحالي. يرجى النقر يدوياً على الخريطة');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Map Initialization
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const startLat = initialLocation?.lat || 36.7538;
    const startLng = initialLocation?.lng || 3.0588;

    const map = L.map(mapContainerRef.current, {
      center: [startLat, startLng],
      zoom: initialLocation ? 16 : 13,
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    // Standard high-speed OSM tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Draggable Pin Icon
    const pinIcon = L.divIcon({
      className: 'custom-picker-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: grab;">
          <div style="width: 42px; height: 42px; border-radius: 50%; background: #2563eb; border: 3px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(37,99,235,0.6); animation: bounce 1.2s infinite alternate;">
            <svg style="width: 24px; height: 24px; fill: white;" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/>
            </svg>
          </div>
          <div style="width: 14px; height: 5px; border-radius: 50%; background: rgba(0,0,0,0.3); margin-top: 3px;"></div>
        </div>
      `,
      iconSize: [42, 48],
      iconAnchor: [21, 46],
    });

    const marker = L.marker([startLat, startLng], {
      icon: pinIcon,
      draggable: true,
    }).addTo(map);
    markerRef.current = marker;

    // Handle marker drag
    marker.on('dragend', () => {
      const latlng = marker.getLatLng();
      updatePosition(latlng.lat, latlng.lng, true);
    });

    // Handle click on map to reposition pin
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      updatePosition(e.latlng.lat, e.latlng.lng, true);
    });

    // Resize recalculation
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    // If no initial location passed, attempt automatic GPS prompt
    if (!initialLocation && navigator.geolocation) {
      handleGetGPSLocation();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirmLocation = () => {
    const fullAddress = additionalNotes
      ? `${addressText ? addressText + ' - ' : ''}${additionalNotes}`
      : addressText || `الموقع الجغرافي: ${selectedLat.toFixed(5)}, ${selectedLng.toFixed(5)}`;

    onConfirm({
      lat: selectedLat,
      lng: selectedLng,
      address: fullAddress,
    });
    onClose();
  };

  const handleJumpCity = (lat: number, lng: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 14);
      updatePosition(lat, lng, true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">{title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick city jump tags */}
        <div className="px-4 py-2 bg-slate-900/95 border-b border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[11px] text-slate-400 shrink-0 font-medium">المدن السريعة:</span>
          {CITY_PRESETS.map((city) => (
            <button
              key={city.name}
              type="button"
              onClick={() => handleJumpCity(city.lat, city.lng)}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 transition cursor-pointer border border-slate-700/50"
            >
              {city.name}
            </button>
          ))}
        </div>

        {/* Map Container */}
        <div className="relative w-full h-[45vh] sm:h-[48vh] bg-slate-950">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Floating GPS Button */}
          <button
            type="button"
            onClick={handleGetGPSLocation}
            disabled={isLocating}
            className="absolute top-3 right-3 z-[400] bg-blue-600 hover:bg-blue-500 active:scale-95 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            title="تحديد موقعي الحالي بدقة"
          >
            {isLocating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري تحديد موقعك...</span>
              </>
            ) : (
              <>
                <Crosshair className="w-4 h-4" />
                <span>موقعي الحالي (GPS)</span>
              </>
            )}
          </button>

          {/* GPS Error Alert */}
          {gpsError && (
            <div className="absolute top-14 right-3 left-3 z-[400] bg-rose-950/95 border border-rose-700 text-rose-200 px-3 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{gpsError}</span>
            </div>
          )}

          {/* Pin Instruction Badge */}
          <div className="absolute bottom-3 right-3 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-700 px-3 py-1.5 rounded-xl text-[11px] text-slate-300 shadow-lg flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>اسحب العلامة الزرقاء أو انقر لتحديد مكانك</span>
          </div>
        </div>

        {/* Location Details & Confirmation Form */}
        <div className="p-4 bg-slate-850 border-t border-slate-800 space-y-3">
          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">
                  العنوان المكتشف / اسم الحي:
                </label>
                {isGeocoding && (
                  <span className="text-[10px] text-blue-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    جاري التعرف على العنوان...
                  </span>
                )}
              </div>
              <input
                type="text"
                value={addressText}
                onChange={(e) => setAddressText(e.target.value)}
                placeholder="حي، شارع، منطقة..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                ملاحظات إضافية للتوصيل (رقم العمارة، الطابق، الباب، علامة مميزة):
              </label>
              <input
                type="text"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="مثال: عمارة رقم 4، الطابق 2، بجانب صيدلية الأمل"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <div className="text-[11px] font-mono text-slate-400">
              {selectedLat.toFixed(5)}, {selectedLng.toFixed(5)}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleConfirmLocation}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>تأكيد الموقع المختار</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
