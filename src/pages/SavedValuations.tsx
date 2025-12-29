import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSavedValuations } from '../hooks/useSavedValuations';
import { useActiveValuation } from '../hooks/useActiveValuation';
import type { SavedValuation } from '../types';
import {
    Search, Filter, Plus, ArrowUpDown, Trash2, ArrowRight, MapPin,
    Calendar, User, FileText, AlertCircle, TrendingUp
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';

const SavedValuations = () => {
    const navigate = useNavigate();

    const {
        handleNewValuation,
        loadActiveValuation,
        isDirty,
        currentValuationId,
        setCurrentValuationId
    } = useActiveValuation();

    const {
        savedValuations,
        handleLoadValuation,
        handleDeleteValuation,
    } = useSavedValuations();

    // Local State for Interactivity
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: 'date' | 'comparables' | 'clientName'; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
    const [filterClient, setFilterClient] = useState<'all' | 'with_client' | 'no_client'>('all');

    // Load active valuation logic
    const handleLoad = (val: SavedValuation) => {
        const payload = { valuation: val, isDirty };
        handleLoadValuation(payload, (loadedValuation) => {
            loadActiveValuation(loadedValuation);
            navigate('/app/tasaciones/editar');
        });
    };

    // Delete logic with confirmation
    const handleDelete = (id: string) => {
        if (window.confirm('¿Estás seguro de querer eliminar esta tasación? Esta acción no se puede deshacer.')) {
            handleDeleteValuation(id, (deletedId) => {
                if (deletedId === currentValuationId) {
                    setCurrentValuationId(null);
                }
            });
        }
    }

    const handleCreateNew = () => {
        handleNewValuation();
        navigate('/app/tasaciones/editar');
    };

    // Sorting Helper
    const requestSort = (key: 'date' | 'comparables' | 'clientName') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Filtering and Sorting Data
    const processedValuations = useMemo(() => {
        let filtered = [...savedValuations];

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(val =>
                (val.name && val.name.toLowerCase().includes(lowerQuery)) ||
                (val.clientName && val.clientName.toLowerCase().includes(lowerQuery)) ||
                (val.target?.address && val.target.address.toLowerCase().includes(lowerQuery))
            );
        }

        if (filterClient === 'with_client') {
            filtered = filtered.filter(val => val.clientName && val.clientName.trim() !== '');
        } else if (filterClient === 'no_client') {
            filtered = filtered.filter(val => !val.clientName || val.clientName.trim() === '');
        }

        filtered.sort((a, b) => {
            let aValue: any = a[sortConfig.key] ?? 0;
            let bValue: any = b[sortConfig.key] ?? 0;
            if (sortConfig.key === 'comparables') {
                aValue = a.comparables?.length || 0;
                bValue = b.comparables?.length || 0;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [savedValuations, searchQuery, filterClient, sortConfig]);

    const getSortIcon = (key: string) => {
        if (sortConfig.key === key) {
            return <ArrowUpDown className={`w-3 h-3 ml-1 ${sortConfig.direction === 'asc' ? 'rotate-180' : ''} transition-transform`} />
        }
        return <ArrowUpDown className="w-3 h-3 ml-1 opacity-20" />;
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-slate-900">Mis Tasaciones</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestiona y accede a tu historial de tasaciones</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg shadow-sm transition-all active:scale-95 font-medium w-full md:w-auto justify-center"
                >
                    <Plus className="w-4 h-4" />
                    Nueva Tasación
                </button>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por dirección o cliente..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                    />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-48">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            value={filterClient}
                            onChange={(e) => setFilterClient(e.target.value as any)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm appearance-none cursor-pointer"
                        >
                            <option value="all">Todas</option>
                            <option value="with_client">Con cliente</option>
                            <option value="no_client">Sin cliente</option>
                        </select>
                    </div>
                </div>
            </div>
            
            {/* Mobile View: Cards */}
            <div className="md:hidden space-y-4">
                {processedValuations.map(val => (
                    <Card key={val.id} className="p-4">
                        <div className="flex justify-between items-start">
                            <p className="font-bold text-slate-800 line-clamp-2 pr-2">{val.target?.address || val.name || 'Sin dirección'}</p>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(val.id); }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 mb-3 flex items-center gap-2">
                             <Calendar className="w-3.5 h-3.5" />
                             {new Date(val.date).toLocaleDateString()}
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                             <div className="bg-slate-50 p-2 rounded-lg">
                                <p className="text-xs text-slate-400">Cliente</p>
                                <p className="font-medium text-slate-700">{val.clientName || 'N/A'}</p>
                             </div>
                             <div className="bg-slate-50 p-2 rounded-lg">
                                <p className="text-xs text-slate-400">Comparables</p>
                                <p className="font-medium text-slate-700">{val.comparables?.length || 0}</p>
                             </div>
                        </div>
                        <button
                            onClick={() => handleLoad(val)}
                            className="w-full flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-brand bg-brand/10 hover:bg-brand/20 rounded-lg"
                        >
                            Abrir <ArrowRight className="w-3 h-3" />
                        </button>
                    </Card>
                ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block">
                <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-sm text-left">
                            {/* Table Header */}
                             <thead className="text-xs font-semibold text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-slate-100" onClick={() => requestSort('date')}>
                                        <div className="flex items-center gap-1">Fecha {getSortIcon('date')}</div>
                                    </th>
                                    <th className="px-6 py-4">Dirección / Nombre</th>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-slate-100" onClick={() => requestSort('clientName')}>
                                        <div className="flex items-center gap-1">Cliente {getSortIcon('clientName')}</div>
                                    </th>
                                    <th className="px-6 py-4 text-center cursor-pointer hover:bg-slate-100" onClick={() => requestSort('comparables')}>
                                        <div className="flex items-center justify-center gap-1">Comparables {getSortIcon('comparables')}</div>
                                    </th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            {/* Table Body */}
                            <tbody className="divide-y divide-slate-100">
                                <AnimatePresence mode='popLayout'>
                                    {processedValuations.length > 0 && processedValuations.map((val) => (
                                        <motion.tr layout key={val.id} className="group hover:bg-slate-50">
                                           {/* Table Row Content */}
                                           <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-slate-500 gap-2">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(val.date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900 group-hover:text-brand line-clamp-1">
                                                    {val.target?.address || val.name || 'Sin dirección'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {val.clientName || <span className="text-xs text-slate-400 italic">Sin asignar</span>}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                                                    {val.comparables?.length || 0}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100">
                                                    <button onClick={() => handleLoad(val)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand bg-brand/5 hover:bg-brand/10 rounded-lg">
                                                        Abrir <ArrowRight className="w-3 h-3" />
                                                    </button>
                                                    <button onClick={() => handleDelete(val.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                     <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 text-xs text-slate-500 flex justify-between items-center">
                        <span>Mostrando {processedValuations.length} de {savedValuations.length} tasaciones</span>
                    </div>
                </Card>
            </div>
             {processedValuations.length === 0 && (
                <div className="text-center py-16 text-slate-500">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <h3 className="text-lg font-semibold text-slate-700">No se encontraron tasaciones</h3>
                    <p>Prueba ajustando los filtros o creando una nueva tasación.</p>
                </div>
            )}
        </div>
    );
};

export default SavedValuations;

