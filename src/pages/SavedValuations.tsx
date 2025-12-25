import { useNavigate } from 'react-router-dom';
import { useValuation } from '../context/ValuationContext';
import { FolderOpen, Trash2, Calendar, FileText, ArrowRight, Plus } from 'lucide-react';
import { Card } from '../components/ui/Card';

const SavedValuations = () => {
    const navigate = useNavigate();
    const {
        savedValuations,
        handleLoadValuation,
        handleDeleteValuation,
        handleNewValuation
    } = useValuation();

    const handleLoad = (val: any) => {
        handleLoadValuation(val);
        navigate('/app/tasaciones/editar');
    };

    const handleCreateNew = () => {
        handleNewValuation();
        navigate('/app/tasaciones/editar');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-slate-900">Mis Tasaciones</h1>
                    <p className="text-slate-500 text-sm">Gestiona y accede a tu historial de tasaciones</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors shadow-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Nueva Tasación
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedValuations.length === 0 ? (
                    <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <div className="bg-slate-50 p-4 rounded-full inline-flex mb-4">
                            <FolderOpen className="w-8 h-8 opacity-40 text-slate-500" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 mb-2">No hay tasaciones guardadas</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mb-6">Empezá una nueva tasación para guardar tu progreso y consultarlo después.</p>
                        <button
                            onClick={handleCreateNew}
                            className="text-brand font-medium hover:underline text-sm"
                        >
                            Crear mi primera tasación
                        </button>
                    </div>
                ) : (
                    savedValuations.map((val) => (
                        <Card key={val.id} className="bg-white hover:shadow-md transition-shadow duration-200 group relative border-slate-200">
                            <div className="p-5 flex flex-col h-full">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="bg-indigo-50 p-2 rounded-lg text-brand">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('¿Estás seguro de que deseas eliminar esta tasación?')) {
                                                handleDeleteValuation(val.id);
                                            }
                                        }}
                                        className="text-slate-300 hover:text-rose-500 p-1.5 rounded-md hover:bg-rose-50 transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-800 text-lg mb-1 line-clamp-1" title={val.name}>
                                        {val.name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(val.date).toLocaleDateString()}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 mb-4">
                                        <div className="bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                            <span className="block text-[10px] uppercase text-slate-400 font-bold">Cliente</span>
                                            <span className="font-medium truncate block">{val.clientName || '-'}</span>
                                        </div>
                                        <div className="bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                            <span className="block text-[10px] uppercase text-slate-400 font-bold">Comparables</span>
                                            <span className="font-medium">{val.comparables?.length || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 mt-auto">
                                    <button
                                        onClick={() => handleLoad(val)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 hover:bg-brand hover:text-white text-slate-700 font-medium rounded-lg transition-all text-sm group-hover:border-transparent border border-slate-200"
                                    >
                                        Abrir Tasación
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default SavedValuations;
