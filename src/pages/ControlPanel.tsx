import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, StickyNote, ArrowRight, Plus, Clock, FileText } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useClients } from '../context/ClientsContext';
import { useActiveValuation } from '../hooks/useActiveValuation';
import { useNotes } from '../hooks/useNotes';
import NotesModal from '../components/modals/NotesModal';

const ControlPanel = () => {
    const navigate = useNavigate();
    const { clients } = useClients();
    const { handleNewValuation } = useActiveValuation();
    const { notes } = useNotes();
    const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);

    const recentClients = clients.slice(0, 3);
    const recentNotes = notes.slice(0, 3);

    const handleCreateNewValuation = () => {
        handleNewValuation();
        navigate('/app/tasaciones/editar');
    };

    return (
        <div className="space-y-8">
            <NotesModal
                isOpen={isNotesModalOpen}
                onClose={() => setIsNotesModalOpen(false)}
            />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-slate-900">Panel de Control</h1>
                    <p className="text-slate-500 text-sm">Resumen de tu actividad inmobiliaria</p>
                </div>
            </div>

            {/* QUICK ACTIONS BAR */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <button
                    onClick={handleCreateNewValuation}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-brand text-white rounded-lg shadow-md hover:bg-brand-dark transition-colors font-semibold text-lg"
                >
                    <Plus className="w-5 h-5" /> Nueva Tasación
                </button>
                <button
                    onClick={() => navigate('/app/clients')}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-slate-700 rounded-lg shadow-md border border-slate-200 hover:bg-slate-50 transition-colors font-semibold text-lg"
                >
                    <Users className="w-5 h-5" /> Nuevo Cliente
                </button>
                <button
                    onClick={() => navigate('/app/tasaciones')}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-slate-700 rounded-lg shadow-md border border-slate-200 hover:bg-slate-50 transition-colors font-semibold text-lg"
                >
                    <FileText className="w-5 h-5" /> Ver Tasaciones
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Proximas Reuniones */}
                <Card className="bg-white border-slate-200 p-6 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="bg-indigo-50 p-2 rounded-lg">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="font-bold font-heading text-slate-800">Próximas Reuniones</h2>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 min-h-[150px] border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                        <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                            <Clock className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-slate-600 font-medium mb-1">Sin reuniones programadas</p>
                        <p className="text-xs text-slate-400 mb-4">Conecta tu Google Calendar para ver tus eventos aquí.</p>
                        <button className="text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors">
                            Sincronizar Calendario
                        </button>
                    </div>
                </Card>

                {/* Clientes */}
                <Card className="bg-white border-slate-200 p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="bg-emerald-50 p-2 rounded-lg">
                                <Users className="w-5 h-5 text-emerald-600" />
                            </div>
                            <h2 className="font-bold font-heading text-slate-800">Clientes Recientes</h2>
                        </div>
                        <button
                            onClick={() => navigate('/app/clients')}
                            className="text-xs font-medium text-slate-500 hover:text-emerald-600 flex items-center gap-1 transition-colors"
                        >
                            Ver todos <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="flex-1 space-y-3">
                        {recentClients.length > 0 ? (
                            recentClients.map(client => (
                                <div key={client.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg hover:border-emerald-200 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm">
                                            {client.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">
                                                {client.name}
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                                {client.phone || client.email || 'Sin contacto'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                <p className="text-sm text-slate-500 mb-2">No hay clientes recientes</p>
                                <button
                                    onClick={() => navigate('/app/clients')}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-md transition-colors"
                                >
                                    <Plus className="w-3 h-3" /> Agregar Cliente
                                </button>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Notas */}
                <Card className="bg-white border-slate-200 p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="bg-amber-50 p-2 rounded-lg">
                                <StickyNote className="w-5 h-5 text-amber-500" />
                            </div>
                            <h2 className="font-bold font-heading text-slate-800">Notas Rápidas</h2>
                        </div>
                        <button
                            onClick={() => setIsNotesModalOpen(true)}
                            className="text-xs font-medium text-slate-500 hover:text-amber-600 flex items-center gap-1 transition-colors"
                        >
                            Ver todas <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="flex-1 space-y-3">
                        {recentNotes.length > 0 ? (
                            recentNotes.map(note => (
                                <div
                                    key={note.id}
                                    onClick={() => setIsNotesModalOpen(true)}
                                    className="p-3 bg-amber-50/50 border border-amber-100/50 rounded-lg hover:border-amber-200 hover:bg-amber-50 cursor-pointer transition-colors group"
                                >
                                    <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed">
                                        {note.content}
                                    </p>
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="text-[10px] text-slate-400">
                                            {new Date(note.updatedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 min-h-[150px] border-2 border-dashed border-amber-100 rounded-xl bg-amber-50/20">
                                <p className="text-sm text-slate-500 mb-2">No tienes notas</p>
                                <button
                                    onClick={() => setIsNotesModalOpen(true)}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-md transition-colors"
                                >
                                    <Plus className="w-3 h-3" /> Crear Nota
                                </button>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ControlPanel;

