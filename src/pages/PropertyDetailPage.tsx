import { useParams, useNavigate } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import {
    Home, FileText, Calendar, DollarSign, Files,
    ArrowLeft, MapPin
} from 'lucide-react';
import { useInmueble } from '../hooks/useInmueble';
import SummaryTab from '../components/property-dashboard/SummaryTab';
import ValuationsTab from '../components/property-dashboard/ValuationsTab';
import VisitsTab from '../components/property-dashboard/VisitsTab';
import OffersTab from '../components/property-dashboard/OffersTab';
import DocumentationTab from '../components/property-dashboard/DocumentationTab';

const PropertyDetailPage = () => {
    const { inmuebleId } = useParams<{ inmuebleId: string }>();
    const navigate = useNavigate();
    const { inmueble, isLoading, error } = useInmueble(inmuebleId);

    if (isLoading) {

        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
            </div>
        );
    }

    if (error || !inmueble) {
        return (
            <div className="p-8 text-center text-slate-500">
                <h2 className="text-xl font-bold mb-2">Error</h2>
                <p>{error || 'Inmueble no encontrado'}</p>
                <button
                    onClick={() => navigate('/app/inmuebles')}
                    className="mt-4 px-4 py-2 bg-brand text-white rounded-lg"
                >
                    Volver a la lista
                </button>
            </div>
        );
    }

    const tabsItems = [
        { id: 'resumen', label: 'Resumen', icon: Home },
        { id: 'tasaciones', label: 'Tasaciones', icon: FileText },
        { id: 'visitas', label: 'Visitas', icon: Calendar },
        { id: 'ofertas', label: 'Ofertas', icon: DollarSign },
        { id: 'documentacion', label: 'Documentación', icon: Files },
    ];

    return (
        <div className="container mx-auto pb-12">
            {/* Header / Breadcrumbs */}
            <div className="mb-6 flex items-center gap-4">
                <button
                    onClick={() => navigate('/app/inmuebles')}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{inmueble.direccion}</h1>
                    <p className="text-slate-500 text-sm flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {inmueble.direccion}
                    </p>
                </div>
            </div>

            <Tabs.Root defaultValue="resumen" className="flex flex-col">
                <Tabs.List className="flex border-b border-slate-200 mb-6 overflow-x-auto no-scrollbar">
                    {tabsItems.map((tab) => (
                        <Tabs.Trigger
                            key={tab.id}
                            value={tab.id}
                            className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-slate-500 hover:text-slate-700 border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:text-brand transition-all whitespace-nowrap"
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </Tabs.Trigger>
                    ))}
                </Tabs.List>

                {/* Resumen Content */}
                <Tabs.Content value="resumen" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <SummaryTab propertyId={inmuebleId!} />
                </Tabs.Content>

                {/* Tasaciones Content */}
                <Tabs.Content value="tasaciones" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <ValuationsTab propertyId={inmuebleId!} />
                </Tabs.Content>

                {/* Visits Content */}
                <Tabs.Content value="visitas" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <VisitsTab propertyId={inmuebleId!} />
                </Tabs.Content>

                {/* Offers Content */}
                <Tabs.Content value="ofertas" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <OffersTab propertyId={inmuebleId!} />
                </Tabs.Content>

                {/* Documentation Content */}
                <Tabs.Content value="documentacion" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <DocumentationTab propertyId={inmuebleId!} />
                </Tabs.Content>
            </Tabs.Root>

        </div>
    );
};

export default PropertyDetailPage;
