import React from 'react';
import { Home, MapPin, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Inmueble } from '../../types';

interface PropertyClientCardProps {
    property: Inmueble;
}

export const PropertyClientCard: React.FC<PropertyClientCardProps> = ({ property }) => {
    const navigate = useNavigate();

    const getStatusBadge = (status: string) => {
        const normalizedStatus = status.toLowerCase();
        const statuses: Record<string, React.ReactNode> = {
            'disponible': <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">Disponible</span>,
            'reservado': <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">Reservado</span>,
            'vendido': <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200">Vendido</span>,
            'alquilado': <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-200">Alquilado</span>,
        };
        return statuses[normalizedStatus] || <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    };

    return (
        <div
            onClick={() => navigate(`/app/inmuebles/${property.id}`)}
            className="group flex flex-col sm:flex-row bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-brand/30 hover:shadow-md transition-all duration-300 cursor-pointer"
        >
            {/* Image Section */}
            <div className="w-full sm:w-32 h-32 sm:h-auto bg-slate-100 relative overflow-hidden flex-shrink-0">
                {property.fotos && property.fotos.length > 0 ? (
                    <img
                        src={property.fotos[0]}
                        alt={property.direccion}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Home className="w-8 h-8" />
                    </div>
                )}
                <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 bg-brand/90 text-white text-[10px] font-bold rounded-lg shadow-sm backdrop-blur-sm">
                        {property.operacion}
                    </span>
                </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 p-4 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start gap-2 mb-1">
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-brand transition-colors line-clamp-1">
                            {property.direccion}
                        </h4>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand group-hover:translate-x-1 transition-all flex-shrink-0 mt-0.5" />
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 text-xs mb-3">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{property.direccion}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Superficie</span>
                            <span className="text-xs font-bold text-slate-700">{property.caracteristicas?.metrosCuadrados || 0} m²</span>
                        </div>
                        <div className="w-px h-6 bg-slate-100" />
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ambientes</span>
                            <span className="text-xs font-bold text-slate-700">{property.caracteristicas?.habitaciones || 0} Amb.</span>
                        </div>
                    </div>
                    {getStatusBadge(property.status)}
                </div>
            </div>
        </div>
    );
};
