import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  X,
  MapPin,
  Store,
  Navigation,
  Phone,
  Filter,
  CheckCircle,
  Clock,
  ExternalLink,
  Share2,
} from 'lucide-react';
import { OnlineOrder, StoreSettings } from '../../types/store';
import {
  calculateDistanceKm,
  getGoogleMapsUrl,
  getGoogleMapsDirectionsUrl,
  getWhatsAppLocationMessage,
} from '../../utils/mapUtils';
import { formatMoney } from '../../utils/formatUtils';

interface AllDeliveryOrdersMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: OnlineOrder[];
  settings: StoreSettings;
  onSelectOrder?: (order: OnlineOrder) => void;
}

export const AllDeliveryOrdersMapModal: React.FC<AllDeliveryOrdersMapModalProps> = ({
  isOpen,
  onClose,
  orders,
  settings,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'preparing' | 'completed'>('all');
  const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null);

  // Orders with customer GPS location
  const deliveryOrdersWithLocation = orders.filter(
    (o) => o.deliveryType === 'delivery' && o.customerLocation && o.customerLocation.lat && o.customerLocation.lng
  );

  const filteredOrders = deliveryOrdersWithLocation.filter((o) => {
    if (statusFilter === 'all') return true;
    return o.status === statusFilter;
  });

  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Determine initial center
    let initialCenter: [number, number] = [36.7538, 3.0588];
    if (settings.storeLocation) {
      initialCenter = [settings.storeLocation.lat, settings.storeLocation.lng];
    } else if (filteredOrders.length > 0 && filteredOrders[0].customerLocation) {
      initialCenter = [
        filteredOrders[0].customerLocation.lat,
        filteredOrders[0].customerLocation.lng,
      ];
    }

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 13,
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add Store Pin if available
    if (settings.storeLocation) {
      const storeIcon = L.divIcon({
        className: 'all-map-store-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: #1e1b4b; border: 3px solid #6366f1; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(99,102,241,0.5);">
              <svg style="width: 20px; height: 20px; fill: #a5b4fc;" viewBox="0 0 24 24">
                <path d="M4 4h16v2H4zm2 4h12v2H6zm-2 4h16v8H4z"/>
              </svg>
            </div>
            <div style="background: #1e1b4b; color: #e0e7ff; font-size: 11px; padding: 2px 8px; border-radius: 6px; font-weight: bold; margin-top: 2px; border: 1px solid #4f46e5; white-space: nowrap;">${settings.storeName}</div>
          </div>
        `,
        iconSize: [40, 52],
        iconAnchor: [20, 48],
      });

      L.marker([settings.storeLocation.lat, settings.storeLocation.lng], { icon: storeIcon })
        .addTo(map)
        .bindPopup(`<b>${settings.storeName}</b><br>المقر الرئيسي`);
    }

    // Add Markers for each order
    const markers: L.Marker[] = [];
    const allLatLngs: [number, number][] = [];

    if (settings.storeLocation) {
      allLatLngs.push([settings.storeLocation.lat, settings.storeLocation.lng]);
    }

    filteredOrders.forEach((order) => {
      if (!order.customerLocation) return;
      const { lat, lng } = order.customerLocation;
      allLatLngs.push([lat, lng]);

      // Pin color based on status
      const colorBg =
        order.status === 'pending'
          ? '#f59e0b'
          : order.status === 'preparing'
          ? '#3b82f6'
          : '#10b981';

      const statusText =
        order.status === 'pending'
          ? 'جديد'
          : order.status === 'preparing'
          ? 'قيد التجهيز'
          : 'مكتمل';

      const pinIcon = L.divIcon({
        className: 'all-orders-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: ${colorBg}; border: 3px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.4);">
              <span style="color: white; font-weight: bold; font-size: 10px; font-family: monospace;">${order.orderNumber.replace('ORD-', '')}</span>
            </div>
            <div style="background: rgba(15,23,42,0.9); color: white; font-size: 10px; padding: 2px 6px; border-radius: 4px; margin-top: 2px; font-weight: 600; white-space: nowrap; border: 1px solid rgba(255,255,255,0.2);">
              ${order.customerName.split(' ')[0]} (${statusText})
            </div>
          </div>
        `,
        iconSize: [36, 48],
        iconAnchor: [18, 44],
      });

      const marker = L.marker([lat, lng], { icon: pinIcon }).addTo(map);

      marker.on('click', () => {
        setSelectedOrder(order);
      });

      markers.push(marker);
    });

    // Fit bounds
    if (allLatLngs.length > 1) {
      map.fitBounds(L.latLngBounds(allLatLngs), { padding: [50, 50] });
    } else if (allLatLngs.length === 1) {
      map.setView(allLatLngs[0], 14);
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, statusFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <span>خريطة التوصيل ومواقع الزبائن</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {deliveryOrdersWithLocation.length} طلبات توصيل محددة
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تتبّع وتوجيه سيارات التوصيل ومواقع الزبائن عبر الخريطة التفاعلية
              </p>
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

        {/* Filter Bar */}
        <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar text-xs">
          <div className="flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium">حالة الطلبات:</span>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              الكل ({deliveryOrdersWithLocation.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-amber-400 hover:text-amber-200'
              }`}
            >
              جديد ({deliveryOrdersWithLocation.filter((o) => o.status === 'pending').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('preparing')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                statusFilter === 'preparing'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-blue-400 hover:text-blue-200'
              }`}
            >
              قيد التجهيز ({deliveryOrdersWithLocation.filter((o) => o.status === 'preparing').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-emerald-400 hover:text-emerald-200'
              }`}
            >
              مكتمل ({deliveryOrdersWithLocation.filter((o) => o.status === 'completed').length})
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              طلب جديد
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              قيد التجهيز
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              مكتمل
            </span>
          </div>
        </div>

        {/* Map View & Floating Card */}
        <div className="relative w-full h-[60vh] bg-slate-950">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* If an order is selected, show floating card */}
          {selectedOrder && selectedOrder.customerLocation && (
            <div className="absolute top-4 right-4 left-4 sm:left-auto sm:w-96 z-[400] bg-slate-900/95 backdrop-blur-md border border-slate-700/90 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-top-2 duration-200 text-xs">
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5 mb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-sm">{selectedOrder.customerName}</span>
                    <span className="font-mono text-blue-400 font-bold">{selectedOrder.orderNumber}</span>
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">📞 {selectedOrder.customerPhone}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 mb-3">
                <div className="text-slate-300">
                  <span className="text-slate-400">العنوان: </span>
                  <span>{selectedOrder.deliveryAddress || selectedOrder.customerLocation.address}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>المبلغ الإجمالي:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {formatMoney(selectedOrder.total, settings)}
                  </span>
                </div>
                {settings.storeLocation && (
                  <div className="text-slate-400 text-[11px]">
                    المسافة من المحل:{' '}
                    <span className="text-blue-300 font-bold font-mono">
                      {calculateDistanceKm(
                        settings.storeLocation.lat,
                        settings.storeLocation.lng,
                        selectedOrder.customerLocation.lat,
                        selectedOrder.customerLocation.lng
                      )}{' '}
                      كم
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <a
                  href={getGoogleMapsDirectionsUrl(
                    selectedOrder.customerLocation.lat,
                    selectedOrder.customerLocation.lng,
                    settings.storeLocation?.lat,
                    settings.storeLocation?.lng
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition text-[11px] cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>ملاحة GPS</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    const encoded = getWhatsAppLocationMessage(
                      selectedOrder.customerName,
                      selectedOrder.customerPhone,
                      selectedOrder.orderNumber,
                      selectedOrder.total,
                      settings.currency,
                      selectedOrder.customerLocation!.lat,
                      selectedOrder.customerLocation!.lng,
                      selectedOrder.deliveryAddress
                    );
                    window.open(`https://wa.me/?text=${encoded}`, '_blank');
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition text-[11px] cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>إرسال للسائق</span>
                </button>

                <a
                  href={`tel:${selectedOrder.customerPhone}`}
                  className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition text-[11px] border border-slate-700 cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>اتصال</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
