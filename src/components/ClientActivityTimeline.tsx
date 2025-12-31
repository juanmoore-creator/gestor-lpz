import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Calendar, FileText, Phone,
    CheckCircle, AlertCircle, Clock
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

interface Log {
    id: string;
    title: string;
    description?: string;
    date: number; // Timestamp
    type: 'info' | 'success' | 'warning' | 'error' | 'call' | 'meeting' | 'note';
}

interface ClientActivityTimelineProps {
    clientId: string;
}

export function ClientActivityTimeline({ clientId }: ClientActivityTimelineProps) {
    const { user } = useAuth();
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid || !clientId) return;

        const logsRef = collection(db, `users/${user.uid}/clients/${clientId}/logs`);
        const q = query(logsRef, orderBy('date', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newLogs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Log[];

            setLogs(newLogs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching client logs:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, clientId]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'call': return <Phone className="w-4 h-4" />;
            case 'meeting': return <Calendar className="w-4 h-4" />;
            case 'note': return <FileText className="w-4 h-4" />;
            case 'success': return <CheckCircle className="w-4 h-4" />;
            case 'warning': return <AlertCircle className="w-4 h-4" />;
            case 'error': return <AlertCircle className="w-4 h-4" />;
            default: return <Activity className="w-4 h-4" />;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'call': return 'bg-blue-100 text-blue-600 border-blue-200';
            case 'meeting': return 'bg-purple-100 text-purple-600 border-purple-200';
            case 'note': return 'bg-amber-100 text-amber-600 border-amber-200';
            case 'success': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
            case 'warning': return 'bg-orange-100 text-orange-600 border-orange-200';
            case 'error': return 'bg-red-100 text-red-600 border-red-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    if (loading) {
        return (
            <div className="py-8 flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand"></div>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="py-8 text-center text-slate-400 text-sm italic border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p>No hay actividad reciente registrada.</p>
            </div>
        );
    }

    return (
        <div className="relative pl-4 border-l border-slate-200 space-y-6">
            <AnimatePresence>
                {logs.map((log, index) => (
                    <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="relative group"
                    >
                        {/* Dot on timeline */}
                        <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ring-1 ring-slate-200 ${index === 0 ? 'bg-brand ring-brand/30' : 'bg-slate-300'
                            }`} />

                        <div className="bg-white rounded-lg border border-slate-100 p-3 shadow-sm hover:shadow-md transition-shadow group-hover:border-slate-200">
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg border ${getColor(log.type)}`}>
                                    {getIcon(log.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm font-medium text-slate-800 line-clamp-1">{log.title}</p>
                                        <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                                            {new Date(log.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {log.description && (
                                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{log.description}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
