import React from 'react';
import {
    MapPin, Building2, Calendar, Layout, Home,
    Maximize2, Box, Bath, Car, ArrowDownRight, User, Check, Clock
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../utils/format';

interface PropertyDetailProps {
    property: any;
    index: number;
    theme?: {
        primary: string;
        secondary: string;
    };
}

const PropertyDetailPage = ({ property, index, theme }: PropertyDetailProps) => {

    // Calculate difference percentage if both prices exist
    const diffPercentage = property.publicationPrice && property.closingPrice
        ? ((property.closingPrice - property.publicationPrice) / property.publicationPrice) * 100
        : 0;

    const propertyAttributes = [
        { label: 'Precio m² (total)', value: property.coveredSurface ? formatCurrency((property.closingPrice || property.price) / property.coveredSurface) : '-', icon: ArrowDownRight },
        { label: 'Superficie total', value: `${formatNumber(property.coveredSurface + property.uncoveredSurface)} m²`, icon: Maximize2 },
        { label: 'Cochera', value: property.garage ? 'Sí' : 'No', icon: Car },
        { label: 'Superficie cubierta', value: `${formatNumber(property.coveredSurface)} m²`, icon: Layout },
        { label: 'Antigüedad', value: `${property.age} años`, icon: Calendar },
        { label: 'Superficie descubierta', value: `${formatNumber(property.uncoveredSurface || 0)} m²`, icon: Home },
        { label: 'Pisos', value: property.floorType || '-', icon: Building2 }, // Using floorType for Pisos
        { label: 'Deptos. en el edificio', value: property.apartmentsInBuilding || '-', icon: Building2 },
        { label: 'Ambientes', value: property.rooms || '-', icon: Layout },
        { label: 'Apto crédito', value: property.isCreditEligible ? 'Sí' : 'No', icon: Check },
        { label: 'Baños', value: property.bathrooms || property.baths || '-', icon: Bath },
        { label: 'Ofrece financiamiento', value: property.hasFinancing ? 'Sí' : 'No', icon: ArrowDownRight },
        { label: 'Toilettes', value: property.toilettes || '-', icon: Bath },
        { label: 'Apto profesional', value: property.isProfessional ? 'Sí' : 'No', icon: User },
        { label: 'Dormitorios', value: property.bedrooms || '-', icon: Box },
        { label: 'Días en el mercado', value: property.daysOnMarket || '-', icon: Clock }
    ];

    const images = property.images && property.images.length > 0
        ? property.images
        : (property.coverImage ? [property.coverImage] : ['/placeholder-house.jpg']);

    return (
        <div className="bg-white p-8 w-[794px] h-[1123px] mx-auto text-slate-800 relative print-page page-break-after-always flex flex-col">

            {/* Header / Title */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Comparable #{index + 1}</span>
                    <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-5 h-5 text-slate-800" />
                        <h2 className="text-lg font-bold text-slate-800">{property.address}</h2>
                    </div>
                </div>
            </div>

            {/* Image Grid */}
            <div className="grid grid-cols-2 gap-1 h-[340px] mb-6 overflow-hidden rounded-xl flex-shrink-0">
                <div className="h-full relative bg-slate-100">
                    <img
                        src={images[0]}
                        className="w-full h-full object-cover"
                        alt="Main"
                        crossOrigin="anonymous"
                    />
                </div>
                <div className="grid grid-rows-2 gap-1 h-full">
                    <div className="relative bg-slate-100 h-full">
                        <img
                            src={images[1] || images[0]}
                            className="w-full h-full object-cover"
                            alt="Secondary"
                            crossOrigin="anonymous"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-1 h-full">
                        <div className="relative bg-slate-100 h-full">
                            <img
                                src={images[2] || images[0]}
                                className="w-full h-full object-cover"
                                alt="Tertiary 1"
                                crossOrigin="anonymous"
                            />
                        </div>
                        <div className="relative bg-slate-100 h-full">
                            <img
                                src={images[3] || images[0]}
                                className="w-full h-full object-cover"
                                alt="Tertiary 2"
                                crossOrigin="anonymous"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tags Header */}
            <div className="flex items-center gap-3 mb-6">
                <span className="px-3 py-1 border rounded-lg text-xs font-medium text-slate-600">Venta</span>
                {/* <span className="px-3 py-1 border rounded-lg text-xs font-medium text-slate-600">Departamento</span> */}
                <span className={`flex items-center gap-2 px-3 py-1 border rounded-lg text-xs font-medium ${property.status === 'Cerrada' || property.status === 'Vendido' ? 'text-green-600 bg-green-50 border-green-100' :
                    property.status === 'Reservado' ? 'text-amber-600 bg-amber-50 border-amber-100' :
                        'text-blue-600 bg-blue-50 border-blue-100'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${property.status === 'Cerrada' || property.status === 'Vendido' ? 'bg-green-600' :
                        property.status === 'Reservado' ? 'bg-amber-600' : 'bg-blue-600'
                        }`}></span> {property.status || 'Disponible'}
                </span>
                {property.closingDate && (
                    <span className="px-3 py-1 border rounded-lg text-xs font-medium text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Cierre: {property.closingDate}
                    </span>
                )}
            </div>

            {/* Price Section */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg">
                        <Layout className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium mb-0.5">Precio de publicación</p>
                        <p className="text-xl font-bold text-slate-800">{formatCurrency(property.publicationPrice || property.price || 0)}</p>
                    </div>
                </div>
                {property.closingPrice && (
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-slate-50 rounded-lg">
                            <Check className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium mb-0.5">Precio de venta</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-xl font-bold text-slate-800">{formatCurrency(property.closingPrice)}</p>
                                {diffPercentage !== 0 && (
                                    <span className={`text-xs font-bold ${diffPercentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {diffPercentage.toFixed(1)}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {!property.closingPrice && (
                    <div className="flex items-start gap-3 opacity-50">
                        <div className="p-2 bg-slate-50 rounded-lg">
                            <Check className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium mb-0.5">Precio de venta</p>
                            <p className="text-xl font-bold text-slate-800">-</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Attributes Grid */}
            <div className="grid grid-cols-2 gap-y-5 gap-x-12 mb-8">
                {propertyAttributes.map((attr, index) => (
                    <div key={index} className="flex items-center gap-3">
                        <div className="w-5 flex justify-center"><attr.icon className="w-4 h-4 text-slate-400 stroke-2" /></div>
                        <div className="flex items-baseline gap-1 text-sm">
                            <span className="text-slate-500">{attr.label}:</span>
                            <span className="font-bold text-slate-800 truncate">{attr.value}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Amenities Section */}
            {property.amenities && property.amenities.length > 0 && (
                <div className="mt-auto bg-slate-50 p-4 rounded-xl border border-slate-100 relative">
                    <p className="text-xs text-slate-400 font-bold uppercase mb-2">Amenities & Detalles</p>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                        {Array.isArray(property.amenities) ? property.amenities.join(', ') : property.amenities}
                    </p>
                </div>
            )}

            {/* Footer Page Number */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between text-[10px] text-slate-400 uppercase tracking-widest">
                <span>Ficha de Comparable</span>
                <span>Página {4 + index}</span>
            </div>
        </div>
    );
};

export default PropertyDetailPage;
