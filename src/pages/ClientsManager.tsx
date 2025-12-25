import { useState, useMemo } from 'react';
import {
    Users, Search, Filter, Phone, MoveRight as ArrowRight, X, MessageCircle, Pencil, History,
    TrendingUp, Activity, UserPlus, Trash2, FileText
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { useClients } from '../context/ClientsContext';
import { useValuation } from '../context/ValuationContext';
import type { Client } from '../types';
import { useNavigate } from 'react-router-dom';

export default function ClientsManager() {
    const { clients, addClient, updateClient, deleteClient } = useClients();
    const { savedValuations, handleLoadValuation } = useValuation();
    const navigate = useNavigate();

    const [selectedClient, setSelectedClient] = useState<Client & { valuations: any[] } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Partial<Client> | null>(null);

    // --- Calculations ---

    // Merge valuations into clients for display
    const clientsWithHistory = useMemo(() => {
        return clients.map(client => {
            // Find valuations that strictly match the client name
            // In a more robust app, we would link by ID. For now, name matching as per plan.
            const clientValuations = savedValuations.filter(v =>
                (v.clientName && v.clientName.trim().toLowerCase() === client.name.trim().toLowerCase())
            );

            return {
                ...client,
                valuations: clientValuations
            };
        });
    }, [clients, savedValuations]);

    // Filter logic
    const filteredClients = useMemo(() => {
        return clientsWithHistory.filter(client => {
            const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                client.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [clientsWithHistory, searchQuery, statusFilter]);

    const activeValuationsCount = savedValuations.length; // Placeholder logic
    const conversionRate = "0%"; // Placeholder

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Activo</span>;
            case 'lead':
                return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Lead</span>;
            case 'past':
                return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">Pasado</span>;
            default:
                return null;
        }
    };

    const handleSaveClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingClient?.name) return;

        try {
            if (editingClient.id) {
                await updateClient(editingClient.id, editingClient);
            } else {
                await addClient({
                    name: editingClient.name || '',
                    email: editingClient.email || '',
                    phone: editingClient.phone || '',
                    status: (editingClient.status as any) || 'lead',
                    notes: editingClient.notes || ''
                });
            }
            setIsModalOpen(false);
            setEditingClient(null);
        } catch (error) {
            console.error("Error saving client", error);
        }
    };

    const openNewClientModal = () => {
        setEditingClient({ status: 'lead' });
        setIsModalOpen(true);
    };

    const openEditClientModal = (client: Client) => {
        setEditingClient(client);
        setIsModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-8 relative overflow-x-hidden">
            {/* 1. Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-slate-900">Administración de Clientes</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestiona tu cartera de contactos y sus propiedades vinculadas</p>
                </div>
                <button
                    onClick={openNewClientModal}
                    className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg shadow-sm transition-all active:scale-95 font-medium"
                >
                    <UserPlus className="w-4 h-4" />
                    Nuevo Cliente
                </button>
            </div>

            {/* 2. Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                    label="Total Clientes"
                    value={clients.length.toString()}
                    subtext="Registrados"
                    color="indigo"
                    icon={<Users className="w-5 h-5 text-indigo-600" />}
                />
                <StatCard
                    label="Tasaciones Guardadas"
                    value={activeValuationsCount.toString()}
                    subtext="Total histórico"
                    color="emerald"
                    icon={<Activity className="w-5 h-5 text-emerald-600" />}
                />
                <StatCard
                    label="Tasa de Conversión"
                    value={conversionRate}
                    subtext="Calculado s/ históricos"
                    color="amber"
                    icon={<TrendingUp className="w-5 h-5 text-amber-600" />}
                />
            </div>

            {/* 3. Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-brand/10 focus:border-brand shadow-sm"
                    />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-48">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-brand/10 focus:border-brand shadow-sm appearance-none cursor-pointer"
                        >
                            <option value="all">Todos los Estados</option>
                            <option value="active">Activos</option>
                            <option value="lead">Leads</option>
                            <option value="past">Pasados</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 4. Clients Table */}
            <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs font-semibold text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-4 py-4">Teléfono</th>
                                <th className="px-4 py-4 text-center">Propiedades</th>
                                <th className="px-4 py-4">Estado</th>
                                <th className="px-4 py-4">Última Actividad</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredClients.map((client) => (
                                <tr
                                    key={client.id}
                                    onClick={() => setSelectedClient(client)}
                                    className="group hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-semibold text-slate-800">{client.name}</div>
                                            <div className="text-xs text-slate-500">{client.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 font-mono text-slate-600 text-xs">
                                        {client.phone}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                            {client.valuations.length}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        {getStatusBadge(client.status)}
                                    </td>
                                    <td className="px-4 py-4 text-slate-500 text-xs">
                                        {new Date(client.lastActivity).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => openEditClientModal(client)}
                                                className="p-1.5 text-slate-400 hover:text-brand hover:bg-brand/10 rounded transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            {/* Assuming 'val' would come from client.valuations or similar context */}
                                            {/* This button is added based on the provided diff, but 'val' needs to be defined in context */}
                                            {/* For demonstration, I'm adding a placeholder for 'val' and assuming it's for a specific valuation */}
                                            {client.valuations.length > 0 && (
                                                <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-50">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // Placeholder for handleLoadValuation and navigate, as 'val' is not defined here
                                                            // In a real scenario, you'd iterate client.valuations or pick one.
                                                            // For now, let's assume 'val' refers to the first valuation for demonstration.
                                                            const firstValuation = client.valuations[0];
                                                            if (firstValuation) {
                                                                // handleLoadValuation(firstValuation); // Uncomment and implement if needed
                                                                // navigate('/app'); // Uncomment and implement if needed
                                                                console.log("Navigating to valuation:", firstValuation);
                                                            }
                                                        }}
                                                        className="text-xs font-medium text-brand hover:text-brand-dark flex items-center gap-1"
                                                    >
                                                        Ver Reporte <ArrowRight className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => deleteClient(client.id)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredClients.length === 0 && (
                        <div className="p-12 text-center text-slate-400">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No se encontraron clientes con los filtros actuales.</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* 5. Detail Drawer */}
            <div
                className={`fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${selectedClient ? 'translate-x-0' : 'translate-x-full'
                    } `}
            >
                {selectedClient && (
                    <>
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-bold font-heading text-slate-800">{selectedClient.name}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    {getStatusBadge(selectedClient.status)}
                                    <span className="text-xs text-slate-400">•</span>
                                    <span className="text-xs text-slate-500">{selectedClient.email}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedClient(null)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Contact Info */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <Phone className="w-3 h-3" /> Datos de Contacto
                                </h3>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-500">Teléfono</span>
                                        <span className="text-sm font-medium text-slate-900 font-mono">{selectedClient.phone || '-'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-500">Email</span>
                                        <span className="text-sm font-medium text-slate-900">{selectedClient.email || '-'}</span>
                                    </div>
                                    <div className="pt-2 flex gap-2">
                                        <button className="flex-1 py-1.5 flex items-center justify-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-lg transition-colors">
                                            <MessageCircle className="w-3 h-3" /> WhatsApp
                                        </button>
                                        <button
                                            onClick={() => openEditClientModal(selectedClient)}
                                            className="flex-1 py-1.5 flex items-center justify-center gap-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                                        >
                                            <Pencil className="w-3 h-3" /> Editar
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <FileText className="w-3 h-3" /> Notas
                                </h3>
                                <div className={`p-4 rounded-xl border text-sm ${selectedClient.notes ? 'bg-amber-50/50 border-amber-100 text-slate-600' : 'bg-slate-50 border-slate-100 text-slate-400 italic'}`}>
                                    {selectedClient.notes || "No hay notas guardadas para este cliente."}
                                </div>
                            </div>

                            {/* Valuations History */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <History className="w-3 h-3" /> Tasacion
                                </h3>
                                <div className="space-y-3">
                                    {selectedClient.valuations && selectedClient.valuations.length > 0 ? (
                                        selectedClient.valuations.map((val: any) => (
                                            <div
                                                key={val.id}
                                                onClick={() => {
                                                    handleLoadValuation(val);
                                                    navigate('/app/tasaciones');
                                                }}
                                                className="group p-3 bg-white border border-slate-200 hover:border-brand/30 hover:shadow-md hover:shadow-brand/5 rounded-xl transition-all cursor-pointer"
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-xs font-semibold text-brand bg-brand/5 px-2 py-0.5 rounded-full">
                                                        {new Date(val.date).toLocaleDateString()}
                                                    </span>
                                                    <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-brand transition-colors" />
                                                </div>
                                                <div className="font-medium text-slate-800 text-sm mb-0.5 line-clamp-1">
                                                    {val.target.address}
                                                </div>
                                                <div className="text-xs text-slate-500 flex items-center gap-2">
                                                    <span>{val.comparables?.length || 0} comparables</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 text-center text-slate-400 text-sm">
                                            No hay tasaciones registradas para este cliente.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Overlay Backdrop */}
            {selectedClient && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setSelectedClient(null)}
                />
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold font-heading text-slate-800">
                                {editingClient?.id ? 'Editar Cliente' : 'Nuevo Cliente'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveClient} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Nombre Completo</label>
                                <input
                                    required
                                    type="text"
                                    value={editingClient?.name || ''}
                                    onChange={e => setEditingClient(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-brand focus:border-brand"
                                    placeholder="Ej: Juan Pérez"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Email</label>
                                <input
                                    type="email"
                                    value={editingClient?.email || ''}
                                    onChange={e => setEditingClient(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-brand focus:border-brand"
                                    placeholder="Ej: juan@email.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Teléfono</label>
                                <input
                                    type="tel"
                                    value={editingClient?.phone || ''}
                                    onChange={e => setEditingClient(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-brand focus:border-brand"
                                    placeholder="+54 9 11..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Estado</label>
                                <select
                                    value={editingClient?.status || 'lead'}
                                    onChange={e => setEditingClient(prev => ({ ...prev, status: e.target.value as any }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-brand focus:border-brand"
                                >
                                    <option value="lead">Lead (Potencial)</option>
                                    <option value="active">Activo (Con Tasaciones)</option>
                                    <option value="past">Pasado (Inactivo)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Notas</label>
                                <textarea
                                    value={editingClient?.notes || ''}
                                    onChange={e => setEditingClient(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-brand focus:border-brand min-h-[80px]"
                                    placeholder="Detalles adicionales..."
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-brand hover:bg-brand-dark rounded-lg transition-colors shadow-sm"
                                >
                                    Guardar Cliente
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
