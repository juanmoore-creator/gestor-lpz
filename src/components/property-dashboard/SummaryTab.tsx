import React, { useMemo } from 'react';
import { Ruler, Bed, Bath, DollarSign, Calendar, TrendingUp, Activity, Clock, FileText } from 'lucide-react';

import { Card } from '../ui/Card';
import { useInmueble } from '../../hooks/useInmueble';
import { useVisits } from '../../hooks/useVisits';
import { useOffers } from '../../hooks/useOffers';
import { useValuations } from '../../hooks/useValuations';
import { formatCurrency, formatDate } from '../../utils/format';
import { ImageUpload } from '../ImageUpload';
import { useNavigate } from 'react-router-dom';

interface SummaryTabProps {
    propertyId: string;
}

const SummaryTab: React.FC<SummaryTabProps> = ({ propertyId }) => {
    const navigate = useNavigate();
    const { inmueble } = useInmueble(propertyId);
    const { visits } = useVisits(propertyId);
    const { offers } = useOffers(propertyId);
    const { valuations } = useValuations(propertyId);

    const stats = useMemo(() => {
        const highestOffer = offers.length > 0 ? Math.max(...offers.map(o => o.amount)) : 0;
        const latestValuation = valuations.length > 0 ? valuations[0].valuation?.market : null;
        return {
            totalVisits: visits.length,
            totalOffers: offers.length,
            highestOffer,
            latestValuation
        };
    }, [visits, offers, valuations]);

    const recentActivity = useMemo(() => {
        const all = [
            ...visits.map(v => ({ type: 'visit', date: v.date, label: `Visita de ${v.visitorName}` })),
            ...offers.map(o => ({ type: 'offer', date: o.date, label: `Oferta de ${formatCurrency(o.amount)} (${o.offererName})` })),
            ...valuations.map(v => ({ type: 'valuation', date: v.date, label: `Nueva Tasación: ${v.name || 'Sin nombre'}` }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return all.slice(0, 5);
    }, [visits, offers, valuations]);

    if (!inmueble) return null;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Data & Stats */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="p-4 bg-indigo-50 border-indigo-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg text-brand">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">Visitas</p>
                                    <p className="text-2xl font-bold text-slate-800">{stats.totalVisits}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4 bg-emerald-50 border-emerald-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg text-emerald-600">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">Oferta Máxima</p>
                                    <p className="text-2xl font-bold text-slate-800">{stats.highestOffer > 0 ? formatCurrency(stats.highestOffer) : '--'}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4 bg-amber-50 border-amber-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg text-amber-600">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">Terciles</p>
                                    <p className="text-2xl font-bold text-slate-800">{stats.latestValuation ? formatCurrency(stats.latestValuation) : '--'}</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <Card className="p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Información General</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="space-y-1">
                                <p className="text-xs text-slate-400 uppercase font-semibold">Superficie</p>
                                <div className="flex items-center gap-2 text-slate-700">
                                    <Ruler className="w-4 h-4 text-brand" />
                                    <span className="font-medium">{inmueble.caracteristicas?.metrosCuadrados || 0} m²</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-slate-400 uppercase font-semibold">Habitaciones</p>
                                <div className="flex items-center gap-2 text-slate-700">
                                    <Bed className="w-4 h-4 text-brand" />
                                    <span className="font-medium">{inmueble.caracteristicas?.habitaciones || 0}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-slate-400 uppercase font-semibold">Baños</p>
                                <div className="flex items-center gap-2 text-slate-700">
                                    <Bath className="w-4 h-4 text-brand" />
                                    <span className="font-medium">{inmueble.caracteristicas?.banos || 0}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-slate-400 uppercase font-semibold">Operación</p>
                                <div className="flex items-center gap-2 text-slate-700">
                                    <DollarSign className="w-4 h-4 text-brand" />
                                    <span className="font-medium">{inmueble.operacion}</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Galería de Imágenes</h3>
                        <ImageUpload
                            images={inmueble.fotos || []}
                            onImagesChange={() => { }}
                            maxImages={10}
                        />
                    </Card>
                </div>

                {/* Right Column: Status & Activity */}
                <div className="space-y-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Estado de Gestión</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-sm text-slate-600">Estado</span>
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                    {inmueble.status}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-sm text-slate-600">Última Actualización</span>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <Clock className="w-3.5 h-3.5" />
                                    {inmueble.fechaActualizacion ? new Date(inmueble.fechaActualizacion).toLocaleDateString() : 'N/A'}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate(`/app/inmuebles/${propertyId}/edit`)}
                            className="w-full mt-6 py-3 bg-brand text-white font-bold rounded-xl hover:bg-brand-dark transition-all shadow-sm active:scale-95"
                        >
                            Editar Propiedad
                        </button>
                    </Card>

                    <Card className="p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Actividad Reciente</h3>
                        <div className="space-y-4">
                            {recentActivity.length > 0 ? recentActivity.map((act, i) => (
                                <div key={i} className="flex gap-3 pb-3 border-b last:border-0">
                                    <div className="mt-1">
                                        {act.type === 'visit' && <Calendar className="w-4 h-4 text-indigo-500" />}
                                        {act.type === 'offer' && <DollarSign className="w-4 h-4 text-emerald-500" />}
                                        {act.type === 'valuation' && <FileText className="w-4 h-4 text-brand" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">{act.label}</p>
                                        <p className="text-xs text-slate-400">{formatDate(act.date)}</p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-slate-400 py-4 text-center">Sin actividad reciente.</p>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SummaryTab;
