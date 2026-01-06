import React, { useState } from 'react';
import { DollarSign, Plus, Trash2, User, Clock, Check, X, AlertCircle, MessageCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { useOffers } from '../../hooks/useOffers';
import { formatCurrency, formatDate } from '../../utils/format';
import { db } from '../../lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import type { Offer } from '../../types';


import { useNavigate } from 'react-router-dom';

interface OffersTabProps {
    propertyId: string;
}

const OffersTab: React.FC<OffersTabProps> = ({ propertyId }) => {
    const navigate = useNavigate();
    const { offers, loading, addOffer } = useOffers(propertyId);
    const [showModal, setShowModal] = useState(false);
    const [newOffer, setNewOffer] = useState({
        offererName: '',
        offererContact: '',
        amount: '',
        currency: 'USD' as 'USD' | 'ARS',
        date: new Date().toISOString().split('T')[0]
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addOffer({
                ...newOffer,
                amount: parseFloat(newOffer.amount),
                date: new Date(newOffer.date),
                status: 'pending'
            });
            setShowModal(false);
            setNewOffer({ offererName: '', offererContact: '', amount: '', currency: 'USD', date: new Date().toISOString().split('T')[0] });
        } catch (error) {
            console.error("Error adding offer", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar esta oferta?')) return;
        try {
            await deleteDoc(doc(db, 'offers', id));
        } catch (error) {
            console.error("Error deleting offer", error);
        }
    };

    const getStatusBadge = (status: Offer['status']) => {
        switch (status) {
            case 'accepted': return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1"><Check className="w-3 h-3" /> Aceptada</span>;
            case 'rejected': return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 flex items-center gap-1"><X className="w-3 h-3" /> Rechazada</span>;
            case 'pending': return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 flex items-center gap-1"><Clock className="w-3 h-3" /> Pendiente</span>;
        }
    };

    return (
        <Card className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-brand" /> Ofertas Recibidas
                    </h2>
                    <p className="text-slate-500">Gestión de propuestas comerciales.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white font-bold rounded-xl hover:bg-brand-dark transition-all shadow-md active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Registrar Oferta
                </button>
            </div>

            {loading ? (
                <div className="py-12 text-center text-slate-400">Cargando ofertas...</div>
            ) : offers.length > 0 ? (
                <div className="space-y-4">
                    {offers.map(offer => (
                        <div key={offer.id} className="p-6 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                            <div className="flex items-center gap-5">
                                <div className={`p-3 rounded-full ${offer.status === 'accepted' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                                    <DollarSign className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-xl text-slate-800">{formatCurrency(offer.amount)}</span>
                                        {getStatusBadge(offer.status)}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {offer.offererName}</span>
                                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatDate(offer.date)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                {offer.offererContact && (
                                    <button
                                        onClick={() => navigate(`/app/whatsapp?phone=${(offer.offererContact || '').replace(/\D/g, '')}`)}
                                        className="flex-1 sm:flex-none px-4 py-2 bg-emerald-50 text-emerald-600 font-bold rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-2"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        Contactar
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(offer.id)}
                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
                    <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No hay ofertas registradas.</p>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Registrar Oferta</h3>
                            <button onClick={() => setShowModal(false)}><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Ofertante</label>
                                <input required type="text" value={newOffer.offererName} onChange={e => setNewOffer({ ...newOffer, offererName: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="Nombre completo" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp de Contacto</label>
                                <input type="text" value={newOffer.offererContact} onChange={e => setNewOffer({ ...newOffer, offererContact: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="Ej: +54911..." />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Monto</label>
                                    <input required type="number" value={newOffer.amount} onChange={e => setNewOffer({ ...newOffer, amount: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Moneda</label>
                                    <select value={newOffer.currency} onChange={e => setNewOffer({ ...newOffer, currency: e.target.value as 'USD' | 'ARS' })} className="w-full px-4 py-2 border rounded-lg">
                                        <option value="USD">USD</option>
                                        <option value="ARS">ARS</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                                <input required type="date" value={newOffer.date} onChange={e => setNewOffer({ ...newOffer, date: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                            </div>
                            <div className="p-3 bg-indigo-50 rounded-lg flex gap-3">
                                <AlertCircle className="w-5 h-5 text-indigo-600 mt-0.5" />
                                <p className="text-xs text-indigo-700">La oferta se registrará inicialmente como <strong>Pendiente</strong>.</p>
                            </div>
                            <button type="submit" className="w-full py-3 bg-brand text-white font-bold rounded-xl hover:bg-brand-dark transition-all">Guardar Oferta</button>
                        </form>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default OffersTab;
