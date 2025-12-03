import React from 'react';
import { X, MapPin } from 'lucide-react';

interface MapViewProps {
  address: string;
  onClose: () => void;
}

export const MapView: React.FC<MapViewProps> = ({ address, onClose }) => {
  if (!address) return null;

  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden border border-gray-200" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                <MapPin size={20} />
             </div>
             <div>
                <h2 className="text-lg font-bold text-gray-900">Localização no Mapa</h2>
                <p className="text-xs text-gray-500 truncate">{address}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
             <X size={24} />
          </button>
        </div>
        <div className="aspect-video w-full bg-gray-200">
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            src={mapSrc}
            title="Google Map"
            loading="lazy"
          ></iframe>
        </div>
      </div>
    </div>
  );
};