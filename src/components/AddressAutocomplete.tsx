
import React, { useState, useEffect, useRef } from 'react';
import LocationPickerModal from './LocationPickerModal';

interface AddressAutocompleteProps {
    value: string;
    onChange: (value: string, location?: { lat: number; lng: number }) => void;
    placeholder?: string;
    className?: string;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({ value, onChange, placeholder, className }) => {
    const [inputValue, setInputValue] = useState(value);
    const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);

    // Service references
    const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
    const placesService = useRef<google.maps.places.PlacesService | null>(null);
    const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    // Dedicated div for Google Maps attributions to avoid overwriting main UI
    const attributionsRef = useRef<HTMLDivElement>(null);

    // Sync external value changes
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    // Initialize Services
    useEffect(() => {
        try {
            if (!window.google || !window.google.maps || !window.google.maps.places) {
                console.warn("Google Maps Places library not loaded yet.");
                return;
            }

            if (!autocompleteService.current) {
                autocompleteService.current = new google.maps.places.AutocompleteService();
            }

            // Use attributionsRef instead of wrapperRef to prevent DOM overwrites
            if (!placesService.current && attributionsRef.current) {
                placesService.current = new google.maps.places.PlacesService(attributionsRef.current);
            }

            if (!sessionToken.current) {
                sessionToken.current = new google.maps.places.AutocompleteSessionToken();
            }
        } catch (err) {
            console.error("Error initializing Google Maps services:", err);
        }
    }, []); // Removed specific refs from deps as they are stable

    // Fetch predictions
    useEffect(() => {
        if (!inputValue || inputValue.length < 3) {
            setPredictions([]);
            return;
        }

        if (!showSuggestions) return;

        if (autocompleteService.current) {
            try {
                if (!sessionToken.current) {
                    sessionToken.current = new google.maps.places.AutocompleteSessionToken();
                }

                const request: google.maps.places.AutocompletionRequest = {
                    input: inputValue,
                    componentRestrictions: { country: 'ar' },
                    sessionToken: sessionToken.current
                };

                autocompleteService.current.getPlacePredictions(request, (results, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                        setPredictions(results);
                    } else {
                        setPredictions([]);
                    }
                });
            } catch (err) {
                console.error("Error fetching predictions:", err);
            }
        }
    }, [inputValue, showSuggestions]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);
        // On manual type, we clear location. 
        onChange(val, undefined);
        setShowSuggestions(true);
    };

    const handleSelectPrediction = (prediction: google.maps.places.AutocompletePrediction) => {
        const address = prediction.description;
        setInputValue(address);
        setShowSuggestions(false);
        setPredictions([]);

        // Fetch Details for Geometry using the SAME session token
        if (placesService.current && sessionToken.current) {
            try {
                const request: google.maps.places.PlaceDetailsRequest = {
                    placeId: prediction.place_id,
                    fields: ['geometry', 'formatted_address'],
                    sessionToken: sessionToken.current
                };

                placesService.current.getDetails(request, (place, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry && place.geometry.location) {
                        const loc = {
                            lat: place.geometry.location.lat(),
                            lng: place.geometry.location.lng()
                        };
                        onChange(address, loc);
                    } else {
                        onChange(address, undefined);
                    }

                    // Generate NEW session token for next session
                    sessionToken.current = new google.maps.places.AutocompleteSessionToken();
                });
            } catch (err) {
                console.error("Error fetching place details:", err);
                onChange(address, undefined);
            }
        } else {
            onChange(address, undefined);
        }
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMapConfirm = (address: string, location: { lat: number; lng: number }) => {
        setInputValue(address);
        onChange(address, location);
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div className="relative">
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => setShowSuggestions(true)}
                    className={`${className} pr-10`} // Add padding for icon
                    placeholder={placeholder}
                />
                <button
                    type="button"
                    onClick={() => setIsMapModalOpen(true)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand transition-colors p-1"
                    title="Seleccionar en mapa"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            </div>

            {showSuggestions && predictions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-auto">
                    {predictions.map((prediction) => (
                        <li
                            key={prediction.place_id}
                            onClick={() => handleSelectPrediction(prediction)}
                            className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 flex items-start gap-2 border-b border-slate-50 last:border-0"
                        >
                            <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{prediction.description}</span>
                        </li>
                    ))}
                </ul>
            )}

            <LocationPickerModal
                isOpen={isMapModalOpen}
                onClose={() => setIsMapModalOpen(false)}
                onConfirm={handleMapConfirm}
            />

            {/* Dedicated hidden container for Google Maps attributions */}
            <div ref={attributionsRef} className="hidden"></div>
        </div>
    );
};

export default AddressAutocomplete;
