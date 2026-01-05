import React, { useState } from 'react';
import { Calendar, Plus, Trash2, Clock, User, Phone, FileText, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { useVisits } from '../../hooks/useVisits';
import { formatDate } from '../../utils/format';
import { db } from '../../lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

interface VisitsTabProps {
    propertyId: string;
}

const VisitsTab: React.FC<VisitsTabProps> = ({ propertyId }) => {
    const { visits, loading, addVisit } = useVisits(propertyId);
    const [showModal, setShowModal] = useState(false);
    const [newVisit, setNewVisit] = useState({
        visitorName: '',
        visitorContact: '',
        date: '',
        notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addVisit({
                ...newVisit,
                date: new Date(newVisit.date)
            });
            setShowModal(false);
            setNewVisit({ visitorName: '', visitorContact: '', date: '', notes: '' });
        } catch (error) {
            console.error("Error adding visit", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar esta visita?')) return;
        try {
            await deleteDoc(doc(db, 'visits', id));
        } catch (error) {
            console.error("Error deleting visit", error);
        }
    };

    return (
        <Card className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-brand" /> Visitas
                    </h2>
                    <p className="text-slate-500">Seguimiento de visitas y prospectos.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white font-bold rounded-xl hover:bg-brand-dark transition-all shadow-md active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Agendar Visita
                </button>
            </div>

            {loading ? (
                <div className="py-12 text-center text-slate-400">Cargando visitas...</div>
            ) : visits.length > 0 ? (
                <div className="space-y-4">
                    {visits.map(visit => (
                        <div key={visit.id} className="p-4 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-brand" />
                                    <span className="font-bold text-slate-800">{visit.visitorName}</span>
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        {formatDate(visit.date)}
                                    </div>
                                    {visit.visitorContact && (
                                        <div className="flex items-center gap-1.5">
                                            <Phone className="w-3.5 h-3.5" />
                                            {visit.visitorContact}
                                        </div>
                                    )}
                                </div>
                                {visit.notes && (
                                    <div className="flex items-start gap-1.5 text-sm text-slate-500 italic">
                                        <FileText className="w-3.5 h-3.5 mt-0.5" />
                                        {visit.notes}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => handleDelete(visit.id)}
                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No hay visitas registradas.</p>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Agendar Visita</h3>
                            <button onClick={() => setShowModal(false)}><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Visitante</label>
                                <input required type="text" value={newVisit.visitorName} onChange={e => setNewVisit({ ...newVisit, visitorName: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="Nombre completo" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Contacto</label>
                                <input type="text" value={newVisit.visitorContact} onChange={e => setNewVisit({ ...newVisit, visitorContact: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="WhatsApp o Email" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha y Hora</label>
                                <input required type="datetime-local" value={newVisit.date} onChange={e => setNewVisit({ ...newVisit, date: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
                                <textarea value={newVisit.notes} onChange={e => setNewVisit({ ...newVisit, notes: e.target.value })} className="w-full px-4 py-2 border rounded-lg" rows={3} placeholder="Intereses, comentarios..." />
                            </div>
                            <button type="submit" className="w-full py-3 bg-brand text-white font-bold rounded-xl hover:bg-brand-dark transition-all">Guardar Visita</button>
                        </form>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default VisitsTab;
