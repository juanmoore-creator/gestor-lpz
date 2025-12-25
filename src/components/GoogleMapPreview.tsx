import React, { useEffect, useState, useCallback, useRef } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import type { TargetProperty, Comparable } from '../types';

const containerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '0.5rem'
};

const defaultCenter = {
    lat: -34.603722,
    lng: -58.381592 // Buenos Aires
};

interface GoogleMapPreviewProps {
    target: TargetProperty;
    comparables: Comparable[];
    onMapImageUpdate: (url: string) => void;
    isLoaded: boolean;
}

const GoogleMapPreview: React.FC<GoogleMapPreviewProps> = ({ target, comparables, onMapImageUpdate, isLoaded }) => {
    // Loader moved to parent


    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [targetLocation, setTargetLocation] = useState<google.maps.LatLngLiteral | null>(null);
    const [compLocations, setCompLocations] = useState<{ id: string, loc: google.maps.LatLngLiteral, index: number }[]>([]);

    const geocoder = useRef<google.maps.Geocoder | null>(null);

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback() {
        setMap(null);
    }, []);

    // Geocoding Effect
    useEffect(() => {
        if (!isLoaded) return;
        if (!geocoder.current) {
            geocoder.current = new google.maps.Geocoder();
        }

        const geocodeAddress = async (address: string): Promise<google.maps.LatLngLiteral | null> => {
            if (!address) return null;
            return new Promise((resolve) => {
                geocoder.current!.geocode({
                    address: address,
                    componentRestrictions: { country: 'AR' }
                }, (results, status) => {
                    if (status === 'OK' && results && results[0]) {
                        const loc = results[0].geometry.location;
                        resolve({ lat: loc.lat(), lng: loc.lng() });
                    } else {
                        console.warn(`Geocoding failed for ${address}: ${status}`);
                        resolve(null);
                    }
                });
            });
        };

        const updateLocations = async () => {
            // Geocode Target
            if (target.location) {
                setTargetLocation(target.location);
                if (map) map.panTo(target.location);
            } else if (target.address) {
                const loc = await geocodeAddress(target.address);
                if (loc) {
                    setTargetLocation(loc);
                    if (map) map.panTo(loc);
                }
            }

            // Geocode Comparables
            // Run in parallel for speed, but keep index
            const promises = comparables.map(async (comp, index) => {
                let loc: google.maps.LatLngLiteral | null = null;
                if (comp.location) {
                    loc = comp.location;
                } else if (comp.address) {
                    loc = await geocodeAddress(comp.address);
                }

                if (loc) {
                    return { id: comp.id, loc, index };
                }
                return null;
            });

            const results = await Promise.all(promises);
            const validResults = results.filter((r): r is { id: string, loc: google.maps.LatLngLiteral, index: number } => r !== null);
            setCompLocations(validResults);
        };

        const timeoutId = setTimeout(() => {
            updateLocations();
        }, 500); // Debounce geocoding

        return () => clearTimeout(timeoutId);
    }, [isLoaded, target, comparables, map]); // Added target to dependencies


    // Fit Bounds Effect
    useEffect(() => {
        if (map && targetLocation) {
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(targetLocation);
            compLocations.forEach(c => bounds.extend(c.loc));
            map.fitBounds(bounds);

            // Adjust zoom if only one point or too zoomed in
            const listener = google.maps.event.addListenerOnce(map, "idle", () => {
                if (map.getZoom()! > 16) map.setZoom(16);
            });
            return () => google.maps.event.removeListener(listener);
        }
    }, [map, targetLocation, compLocations]);


    // Generate Static Map URL
    useEffect(() => {
        if (!targetLocation) return;

        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        const baseUrl = "https://maps.googleapis.com/maps/api/staticmap";
        const size = "640x640"; // Higher res (max free is 640x640 usually)
        const maptype = "roadmap";
        // Styles to match the clean look if desired, or standard

        let markers = `&markers=color:red|label:T|${targetLocation.lat},${targetLocation.lng}`;

        compLocations.forEach((c) => {
            // Use c.index + 1 for the label to match references
            markers += `&markers=color:blue|label:${c.index + 1}|${c.loc.lat},${c.loc.lng}`;
        });

        // Add scale=2 for retina/high quality print
        const url = `${baseUrl}?size=${size}&scale=2&maptype=${maptype}${markers}&key=${apiKey}`;

        // Only update if different to avoid infinite loops
        if (target.mapImage !== url) {
            onMapImageUpdate(url);
        }

    }, [targetLocation, compLocations]);


    if (!isLoaded) return <div className="h-[400px] w-full bg-slate-100 animate-pulse rounded-lg">Loading Maps...</div>;

    return (
        <div className="w-full">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={targetLocation || defaultCenter}
                zoom={14}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: false,
                }}
            >
                {/* Target Marker */}
                {targetLocation && (
                    <Marker
                        position={targetLocation}
                        label={{ text: "T", color: "white" }}
                    />
                )}

                {/* Comparable Markers */}
                {compLocations.map((c) => (
                    <Marker
                        key={c.id}
                        position={c.loc}
                        label={{ text: (c.index + 1).toString(), color: "white" }}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            fillColor: "blue",
                            fillOpacity: 1,
                            strokeColor: "white",
                            strokeWeight: 2,
                            scale: 10,
                            labelOrigin: new google.maps.Point(0, 0)
                        }}
                    />
                ))}
            </GoogleMap>
            <p className="text-xs text-slate-500 mt-2 text-center">
                * El mapa se actualiza automáticamente con las direcciones ingresadas.
            </p>
        </div>
    );
};

export default React.memo(GoogleMapPreview);
