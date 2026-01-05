import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Trash2, ExternalLink } from 'lucide-react';
import { Card } from '../ui/Card';
import { useValuations } from '../../hooks/useValuations';
import { useInmueble } from '../../hooks/useInmueble';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { formatCurrency, formatDate, toDate } from '../../utils/format';
import PDFGenerator from '../PDFGenerator';

interface ValuationsTabProps {
    propertyId: string;
}

const ValuationsTab: React.FC<ValuationsTabProps> = ({ propertyId }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { inmueble } = useInmueble(propertyId);
    const { valuations, loading } = useValuations(propertyId);

    const handleDeleteValuation = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('¿Estás seguro de eliminar esta tasación?')) return;
        try {
            await deleteDoc(doc(db, `users/${user!.uid}/saved_valuations`, id));
        } catch (error) {
            console.error("Error deleting valuation", error);
        }
    };

    return (
        <Card className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-brand" /> Tasaciones del Inmueble
                    </h2>
                    <p className="text-slate-500">Historial de valoraciones realizadas para esta propiedad.</p>
                </div>
                <button
                    onClick={() => navigate('/app/inmuebles/editar', { state: { propertyData: inmueble } })}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white font-bold rounded-xl hover:bg-brand-dark transition-all shadow-md active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Tasación
                </button>
            </div>

            {loading ? (
                <div className="py-12 text-center text-slate-400">Cargando historial...</div>
            ) : valuations.length > 0 ? (
                <div className="space-y-4">
                    {valuations.map(val => (
                        <div
                            key={val.id}
                            className="group p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row justify-between items-center gap-4"
                            onClick={() => navigate('/app/inmuebles/editar', { state: { propertyData: inmueble, valuationData: val } })}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-50 text-brand rounded-full flex items-center justify-center font-bold text-lg">
                                    {toDate(val.date).getDate()}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">{val.name || 'Tasación sin nombre'}</h4>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <span>{formatDate(val.date)}</span>
                                        <span>•</span>
                                        <span className="font-medium text-slate-700">{val.clientName || 'Cliente General'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                                <div className="text-right">
                                    <p className="text-xs text-slate-400 uppercase font-semibold">Valor de Mercado</p>
                                    <p className="font-bold text-lg text-slate-800">{formatCurrency(val.valuation?.market || 0)}</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <PDFGenerator
                                        tipo="tasacion"
                                        data={val}
                                        displayMode="icon"
                                        className="p-2 text-slate-400 hover:text-brand hover:bg-indigo-50 rounded-lg transition-colors"
                                    />
                                    <button
                                        onClick={(e) => handleDeleteValuation(val.id, e)}
                                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-brand transition-colors" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No hay tasaciones registradas para este inmueble.</p>
                    <p className="text-sm text-slate-400">Crea la primera para comenzar el historial.</p>
                </div>
            )}
        </Card>
    );
};

export default ValuationsTab;
