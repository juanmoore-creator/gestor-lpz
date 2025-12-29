import { useState, useMemo } from 'react';
import {
    Users, Search, Filter, Phone, MoveRight as ArrowRight, X, MessageCircle, Pencil, History,
    TrendingUp, Activity, UserPlus, Trash2, FileText
} from 'lucide-react';
import { ClientActivityTimeline } from '../components/ClientActivityTimeline';
import { NotesModal } from '../components/NotesModal';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { useClients } from '../context/ClientsContext';
import { useSavedValuations } from '../hooks/useSavedValuations';
import { useActiveValuation } from '../hooks/useActiveValuation';
import type { Client, SavedValuation } from '../types';
import { useNavigate } from 'react-router-dom';

export default function ClientsManager() {
    const { clients, addClient, updateClient, deleteClient } = useClients();
    const { savedValuations, handleLoadValuation } = useSavedValuations();
    const { loadActiveValuation, isDirty } = useActiveValuation();
    const navigate = useNavigate();

    const [selectedClient, setSelectedClient] = useState<Client & { valuations: any[] } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Partial<Client> | null>(null);

    // Notes Modal State
    const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
    const [notesClient, setNotesClient] = useState<Client | null>(null);

    // --- Calculations ---
    const clientsWithHistory = useMemo(() => {
        return clients.map(client => ({
            ...client,
            valuations: savedValuations.filter(v => v.clientName && v.clientName.trim().toLowerCase() === client.name.trim().toLowerCase())
        }));
    }, [clients, savedValuations]);

    const filteredClients = useMemo(() => {
        return clientsWithHistory.filter(client => {
            const lowerQuery = searchQuery.toLowerCase();
            const matchesSearch = client.name.toLowerCase().includes(lowerQuery) || (client.email && client.email.toLowerCase().includes(lowerQuery));
            const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [clientsWithHistory, searchQuery, statusFilter]);

    const handleLoad = (val: SavedValuation) => {
        const payload = { valuation: val, isDirty };
        handleLoadValuation(payload, (loadedValuation) => {
            loadActiveValuation(loadedValuation);
            navigate('/app/tasaciones/editar');
        });
    };

    const getStatusBadge = (status: string) => {
        const statuses: Record<string, React.ReactNode> = {
            active: <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Activo</span>,
            lead: <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Lead</span>,
            past: <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">Pasado</span>,
        };
        return statuses[status] || null;
    };

    const handleSaveClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingClient?.name) return;
        try {
            if (editingClient.id) {
                await updateClient(editingClient.id, editingClient);
            } else {
                await addClient({
                    name: editingClient.name || '', email: editingClient.email || '', phone: editingClient.phone || '',
                    status: (editingClient.status as any) || 'lead', notes: editingClient.notes || ''
                });
            }
            setIsModalOpen(false); setEditingClient(null);
        } catch (error) { console.error("Error saving client", error); }
    };

    const openNewClientModal = () => { setEditingClient({ status: 'lead' }); setIsModalOpen(true); };
    const openEditClientModal = (client: Client) => { setEditingClient(client); setIsModalOpen(true); };

    return (
        <div className="min-h-screen bg-slate-50 pb-8 relative overflow-x-hidden">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-slate-900">Administración de Clientes</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestiona tu cartera de contactos y sus propiedades.</p>
                </div>
                <button onClick={openNewClientModal} className="flex items-center justify-center gap-2 px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg shadow-sm font-medium">
                    <UserPlus className="w-4 h-4" /> Nuevo Cliente
                </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard label="Total Clientes" value={clients.length.toString()} color="indigo" icon={<Users />} />
                <StatCard label="Tasaciones Guardadas" value={savedValuations.length.toString()} color="emerald" icon={<Activity />} />
                <StatCard label="Tasa de Conversión" value="0%" subtext="Próximamente" color="amber" icon={<TrendingUp />} />
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Buscar por nombre o email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm" />
                </div>
                <div className="relative w-full sm:w-48">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm appearance-none cursor-pointer">
                        <option value="all">Todos los Estados</option>
                        <option value="active">Activos</option>
                        <option value="lead">Leads</option>
                        <option value="past">Pasados</option>
                    </select>
                </div>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                {filteredClients.map(client => (
                    <Card key={client.id} className="p-4" onClick={() => setSelectedClient(client)}>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-slate-800">{client.name}</p>
                                <p className="text-xs text-slate-500">{client.email || client.phone}</p>
                            </div>
                            {getStatusBadge(client.status)}
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                            <div className="text-sm text-slate-500">
                                <span className="font-medium text-slate-700">{client.valuations.length}</span> tasaciones
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={(e) => { e.stopPropagation(); openEditClientModal(client); }} className="p-2 text-slate-500 hover:bg-slate-100 rounded-md"><Pencil className="w-4 h-4" /></button>
                                <button onClick={(e) => { e.stopPropagation(); deleteClient(client.id); }} className="p-2 text-slate-500 hover:bg-rose-100 hover:text-rose-600 rounded-md"><Trash2 className="w-4 h-4" /></button>
                                <button onClick={() => setSelectedClient(client)} className="px-3 py-1.5 text-xs font-medium text-brand bg-brand/10 rounded-md">Detalles</button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block">
                <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs font-semibold text-slate-500 uppercase bg-slate-50 border-b">
                                <tr>
                                    <th className="px-6 py-4">Cliente</th>
                                    <th className="px-4 py-4">Contacto</th>
                                    <th className="px-4 py-4 text-center">Tasaciones</th>
                                    <th className="px-4 py-4">Estado</th>
                                    <th className="px-4 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredClients.map((client) => (
                                    <tr key={client.id} onClick={() => setSelectedClient(client)} className="group hover:bg-slate-50 cursor-pointer">
                                        <td className="px-6 py-4 font-semibold text-slate-800">{client.name}</td>
                                        <td className="px-4 py-4 text-slate-600">{client.email || client.phone}</td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100">{client.valuations.length}</span>
                                        </td>
                                        <td className="px-4 py-4">{getStatusBadge(client.status)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                                                <button onClick={() => openEditClientModal(client)} className="p-1.5 text-slate-400 hover:text-brand rounded"><Pencil className="w-4 h-4" /></button>
                                                <button onClick={() => deleteClient(client.id)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {filteredClients.length === 0 && (
                <div className="p-12 text-center text-slate-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No se encontraron clientes.</p>
                </div>
            )}

            {/* Detail Drawer */}
            <div className={`fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl transform transition-transform z-50 ${selectedClient ? 'translate-x-0' : 'translate-x-full'}`}>
                {selectedClient && (
                    <div className="flex flex-col h-full">
                        <div className="p-6 border-b flex items-center justify-between bg-slate-50">
                            <div>
                                <h2 className="text-xl font-bold font-heading">{selectedClient.name}</h2>
                                <div className="flex items-center gap-2 mt-1">{getStatusBadge(selectedClient.status)}</div>
                            </div>
                            <button onClick={() => setSelectedClient(null)} className="p-2 rounded-full hover:bg-slate-100"><X /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Contact Info */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase">Datos de Contacto</h3>
                                <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <Phone className="w-3.5 h-3.5" /> Teléfono
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium font-mono">{selectedClient.phone || '-'}</span>
                                            {selectedClient.phone && (
                                                <a
                                                    href={`https://wa.me/${selectedClient.phone.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1 text-emerald-500 hover:bg-emerald-50 rounded"
                                                    title="Enviar WhatsApp"
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-500">Email</span>
                                        <span className="text-sm font-medium">{selectedClient.email || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Valuations */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
                                        <History className="w-3.5 h-3.5" /> Tasaciones Guardadas
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setNotesClient(selectedClient);
                                            setIsNotesModalOpen(true);
                                        }}
                                        className="text-xs font-semibold text-brand hover:text-brand-dark flex items-center gap-1 bg-brand/5 px-2 py-1 rounded"
                                    >
                                        <FileText className="w-3 h-3" /> Notas
                                    </button>
                                </div>
                                {selectedClient.valuations.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedClient.valuations.map((val: any) => (
                                            <div key={val.id} onClick={() => handleLoad(val)} className="group p-3 bg-white border rounded-xl cursor-pointer hover:border-brand/30 transition-colors shadow-sm">
                                                <div className="flex justify-between items-start">
                                                    <span className="text-xs font-semibold text-brand bg-brand/5 px-2 py-0.5 rounded-full">
                                                        {new Date(val.date).toLocaleDateString()}
                                                    </span>
                                                    <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-brand transition-colors" />
                                                </div>
                                                <div className="font-medium text-sm mt-1">{val.target.address}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                                        No hay tasaciones registradas.
                                    </div>
                                )}
                            </div>

                            {/* Activity Timeline */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
                                    <Activity className="w-3.5 h-3.5" /> Actividad Reciente
                                </h3>
                                <ClientActivityTimeline clientId={selectedClient.id} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {selectedClient && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
                    onClick={() => setSelectedClient(null)}
                />
            )}

            {/* Edit/New Client Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold mb-4">{editingClient?.id ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
                        <form onSubmit={handleSaveClient} className="space-y-4">
                            <input
                                required
                                type="text"
                                value={editingClient?.name || ''}
                                onChange={e => setEditingClient(p => ({ ...p, name: e.target.value }))}
                                className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-brand/10 focus:border-brand rounded-lg p-2.5 text-sm"
                                placeholder="Nombre Completo"
                            />
                            <input
                                type="email"
                                value={editingClient?.email || ''}
                                onChange={e => setEditingClient(p => ({ ...p, email: e.target.value }))}
                                className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-brand/10 focus:border-brand rounded-lg p-2.5 text-sm"
                                placeholder="Email"
                            />
                            <input
                                type="tel"
                                value={editingClient?.phone || ''}
                                onChange={e => setEditingClient(p => ({ ...p, phone: e.target.value }))}
                                className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-brand/10 focus:border-brand rounded-lg p-2.5 text-sm"
                                placeholder="Teléfono"
                            />
                            <select
                                value={editingClient?.status || 'lead'}
                                onChange={e => setEditingClient(p => ({ ...p, status: e.target.value as any }))}
                                className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-brand/10 focus:border-brand rounded-lg p-2.5 text-sm appearance-none"
                            >
                                <option value="lead">Lead</option>
                                <option value="active">Activo</option>
                                <option value="past">Pasado</option>
                            </select>
                            <textarea
                                value={editingClient?.notes || ''}
                                onChange={e => setEditingClient(p => ({ ...p, notes: e.target.value }))}
                                className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-brand/10 focus:border-brand rounded-lg p-2.5 text-sm min-h-[100px]"
                                placeholder="Notas internas..."
                            />
                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-brand hover:bg-brand-dark rounded-lg shadow-sm transition-colors"
                                >
                                    Guardar Cliente
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <NotesModal
                isOpen={isNotesModalOpen}
                onClose={() => {
                    setIsNotesModalOpen(false);
                    setNotesClient(null);
                }}
                client={notesClient}
            />
        </div>
    );
}
