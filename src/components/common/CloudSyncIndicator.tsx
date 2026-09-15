import React from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';

interface CloudSyncIndicatorProps {
  isSynced: boolean;
  isSyncing?: boolean;
}

export const CloudSyncIndicator: React.FC<CloudSyncIndicatorProps> = ({ isSynced, isSyncing }) => {
  return (
    <div
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all select-none ${
        isSyncing
          ? 'bg-blue-950/80 text-blue-300 border-blue-800'
          : isSynced
          ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80'
          : 'bg-amber-950/70 text-amber-300 border-amber-800/80'
      }`}
      title={
        isSyncing
          ? 'جاري مزامنة البيانات سحابياً...'
          : isSynced
          ? 'متصل سحابياً: الطلبات والمخزون متزامنة فورياً بين الهاتف والكمبيوتر'
          : 'جاري الاتصال بالسحابة...'
      }
    >
      {isSyncing ? (
        <>
          <RefreshCw className="w-3 h-3 animate-spin text-blue-400 shrink-0" />
          <span className="hidden xl:inline">مزامنة سحابية...</span>
        </>
      ) : isSynced ? (
        <>
          <Cloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="hidden xl:inline">متصل بالسحابة</span>
        </>
      ) : (
        <>
          <CloudOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="hidden xl:inline">محلي</span>
        </>
      )}
    </div>
  );
};
