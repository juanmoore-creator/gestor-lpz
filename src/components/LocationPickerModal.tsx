import React, { useState, useCallback, useRef } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';

interface LocationPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (address: string, location: { lat: number; lng: number }) => void;
    initialLocation?: { lat: number; lng: number };
}

const containerStyle = {
    width: '100%',
    height: '100%'
};

const defaultCenter = {
    lat: -34.603722,
    lng: -58.381592 // Buenos Aires
};

const LocationPickerModal: React.FC<LocationPickerModalProps> = ({ isOpen, onClose, onConfirm, initialLocation }) => {
    const [selectedLocation, setSelectedLocation] = useState<google.maps.LatLngLiteral | null>(initialLocation || defaultCenter);
    const [address, setAddress] = useState<string>('');
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);

    // We intentionally don't use 'map' state if not needed, but keep ref for potential bounds usage
    const mapRef = useRef<google.maps.Map | null>(null);

    const onLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
        if (initialLocation) {
            map.panTo(initialLocation);
            // Reverse geocode initial
            reverseGeocode(initialLocation);
        }
    }, [initialLocation]);

    const onUnmount = useCallback(() => {
        mapRef.current = null;
    }, []);

    const reverseGeocode = async (loc: google.maps.LatLngLiteral) => {
        setIsLoadingAddress(true);
        try {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: loc }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                    setAddress(results[0].formatted_address);
                } else {
                    setAddress('Ubicación seleccionada');
                }
                setIsLoadingAddress(false);
            });
        } catch (error) {
            console.error("Reverse geocoding error:", error);
            setAddress('Error obteniendo dirección');
            setIsLoadingAddress(false);
        }
    };

    const handleMapClick = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const loc = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            setSelectedLocation(loc);
            reverseGeocode(loc);
        }
    };

    const handleConfirm = () => {
        if (selectedLocation) {
            onConfirm(address, selectedLocation);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <svg className="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Seleccionar Ubicación
                        </h3>
                        <p className="text-sm text-slate-500">Haz clic en el mapa para marcar la propiedad</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Map Area */}
                <div className="flex-1 relative">
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={selectedLocation || defaultCenter}
                        zoom={15}
                        onClick={handleMapClick}
                        onLoad={onLoad}
                        onUnmount={onUnmount}
                        options={{
                            clickableIcons: false,
                            streetViewControl: false,
                            mapTypeControl: false
                        }}
                    >
                        {selectedLocation && (
                            <Marker position={selectedLocation} />
                        )}
                    </GoogleMap>

                    {/* Address Overlay */}
                    <div className="absolute bottom-6 left-6 right-6 pointer-events-none flex justify-center">
                        <div className="bg-white/95 backdrop-blur shadow-lg rounded-lg p-4 border border-slate-200 pointer-events-auto max-w-lg w-full flex items-center justify-between gap-4">
                            <div className="flex-1 truncate">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Dirección Detectada</label>
                                <div className="text-slate-800 font-medium truncate">
                                    {isLoadingAddress ? 'Cargando...' : (address || 'Selecciona un punto en el mapa')}
                                </div>
                            </div>
                            <button
                                onClick={handleConfirm}
                                disabled={!selectedLocation || isLoadingAddress}
                                className="bg-brand hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-semibold shadow-sm transition-all active:scale-95 flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LocationPickerModal;
