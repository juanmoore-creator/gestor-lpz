import React from 'react';
import { Home, MapPin, ArrowRight, DollarSign, ShieldCheck, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Inmueble, Client } from '../../types';

interface PropertyClientCardProps {
    property?: Inmueble;
    client?: Client & { properties?: Inmueble[] };
}

export const PropertyClientCard: React.FC<PropertyClientCardProps> = ({ property, client }) => {
    const navigate = useNavigate();

    const getStatusBadge = (status: string) => {
        const normalizedStatus = status.toLowerCase();
        const statuses: Record<string, React.ReactNode> = {
            'disponible': <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">Disponible</span>,
            'reservado': <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">Reservado</span>,
            'vendido': <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200">Vendido</span>,
            'alquilado': <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-200">Alquilado</span>,
            'nuevo': <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200">Nuevo</span>,
            'en seguimiento': <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">Seguimiento</span>,
            'cerrado': <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">Cerrado</span>,
        };
        return statuses[normalizedStatus] || <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    };

    if (client) {
        const clientType = client.type || (client.roles && client.roles[0]) || 'Comprador';

        const renderClientInfo = () => {
            if (clientType === 'Comprador') {
                return (
                    <div className="grid grid-cols-3 gap-2 w-full">
                        <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                            <DollarSign className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-500" />
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Presp. Máx</p>
                            <p className="text-xs font-bold text-slate-700 truncate">{client.budget || '-'}</p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                            <MapPin className="w-3.5 h-3.5 mx-auto mb-1 text-brand/70" />
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Zonas</p>
                            <p className="text-xs font-bold text-slate-700 truncate">{client.interestZone || '-'}</p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                            <Home className="w-3.5 h-3.5 mx-auto mb-1 text-slate-400" />
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Tipología</p>
                            <p className="text-xs font-bold text-slate-700 truncate">{client.propertyType || '-'}</p>
                        </div>
                    </div>
                );
            }
            if (clientType === 'Inquilino') {
                return (
                    <div className="grid grid-cols-3 gap-2 w-full">
                        <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                            <DollarSign className="w-3.5 h-3.5 mx-auto mb-1 text-blue-500" />
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Presp. Alq</p>
                            <p className="text-xs font-bold text-slate-700 truncate">{client.budget || '-'}</p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                            <MapPin className="w-3.5 h-3.5 mx-auto mb-1 text-brand/70" />
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Zonas</p>
                            <p className="text-xs font-bold text-slate-700 truncate">{client.interestZone || '-'}</p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                            <ShieldCheck className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-500" />
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Garantía</p>
                            <p className="text-xs font-bold text-slate-700 truncate">Ver notas</p>
                        </div>
                    </div>
                );
            }
            if (clientType === 'Propietario') {
                const mainProp = client.properties && client.properties.length > 0 ? client.properties[0] : null;
                return (
                    <div className="grid grid-cols-3 gap-2 w-full">
                        <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                            <MapPin className="w-3.5 h-3.5 mx-auto mb-1 text-brand/70" />
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Dirección</p>
                            <p className="text-xs font-bold text-slate-700 truncate" title={mainProp?.direccion}>{mainProp?.direccion || '-'}</p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                            <DollarSign className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-500" />
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Valor</p>
                            <p className="text-xs font-bold text-slate-700 truncate">
                                {mainProp?.precio ? `${mainProp.precio.moneda} ${mainProp.precio.valor.toLocaleString()}` : '-'}
                            </p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100 flex flex-col items-center justify-center">
                            <Tag className="w-3.5 h-3.5 mx-auto mb-1 text-slate-400" />
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Estado</p>
                            {mainProp ? getStatusBadge(mainProp.status) : <span className="text-xs font-bold text-slate-700">-</span>}
                        </div>
                    </div>
                );
            }
            return null;
        };

        return renderClientInfo();
    }

    if (!property) return null;

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
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate">{property.direccion}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-3">
                        {property.precio && (
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Precio</span>
                                <span className="text-xs font-bold text-slate-700">
                                    {property.precio.moneda} {property.precio.valor.toLocaleString()}
                                </span>
                            </div>
                        )}
                        {!property.precio && (
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Superficie</span>
                                <span className="text-xs font-bold text-slate-700">{property.caracteristicas?.metrosCuadrados || 0} m²</span>
                            </div>
                        )}
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
