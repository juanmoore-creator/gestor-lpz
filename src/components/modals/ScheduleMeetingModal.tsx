import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react'; // Removing explicit import of motion/AnimatePresence to keep it simple or use if available. Assuming framer-motion is available based on previous files.
import { motion, AnimatePresence } from 'framer-motion';

interface ScheduleMeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    initialNotes?: string;
}

export default function ScheduleMeetingModal({ isOpen, onClose, onSuccess, initialNotes = '' }: ScheduleMeetingModalProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial state for new event
    const [newEvent, setNewEvent] = useState({
        summary: '',
        description: '',
        location: '',
        startDateTime: '',
        endDateTime: ''
    });

    // Reset form when opening
    useEffect(() => {
        if (isOpen) {
            const startDate = new Date();
            // Round up to next hour for better UX? Or just current time.
            startDate.setMinutes(startDate.getMinutes() + 10); // A bit in the future
            startDate.setSeconds(0);

            const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour later

            const toLocalISO = (d: Date) => {
                const pad = (n: number) => n < 10 ? '0' + n : n;
                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            };

            setNewEvent({
                summary: '',
                description: initialNotes || '',
                location: '',
                startDateTime: toLocalISO(startDate),
                endDateTime: toLocalISO(endDate)
            });
            setError(null);
        }
    }, [isOpen, initialNotes]);

    const handleSaveEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        try {
            // Check if gapi is initialized
            if (!window.gapi || !window.gapi.client || !window.gapi.client.calendar) {
                throw new Error("Services de Google no inicializados. Intenta recargar la página.");
            }

            // 1. Format to local ISO without offset for the API
            const formatToLocalISO = (dateString: string) => {
                if (!dateString) return '';
                const hasSeconds = dateString.split(':').length === 3;
                let baseTime = hasSeconds ? dateString : `${dateString}:00`;
                return baseTime.substring(0, 19);
            };

            // 2. Prepare event object
            const event = {
                'summary': newEvent.summary,
                'location': newEvent.location,
                'description': newEvent.description,
                'start': {
                    'dateTime': formatToLocalISO(newEvent.startDateTime),
                    'timeZone': 'America/Argentina/Buenos_Aires'
                },
                'end': {
                    'dateTime': formatToLocalISO(newEvent.endDateTime),
                    'timeZone': 'America/Argentina/Buenos_Aires'
                }
            };

            // 3. Insert event
            await window.gapi.client.calendar.events.insert({
                'calendarId': 'primary',
                'resource': event
            });

            // 4. Success handling
            if (onSuccess) onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Error creating event:", err);
            setError("Error al guardar: " + (err.result?.error?.message || err.message || "Error desconocido"));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 ring-1 ring-white/20 max-h-[90vh] overflow-y-auto custom-scrollbar"
                    >
                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                            <h3 className="text-2xl font-bold text-gray-900 font-heading">
                                Nueva Reunión
                            </h3>
                            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSaveEvent} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-bold text-slate-700">Título</label>
                                <input
                                    type="text"
                                    required
                                    value={newEvent.summary}
                                    onChange={e => setNewEvent({ ...newEvent, summary: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand transition-all outline-none font-medium"
                                    placeholder="Ej: Tasación - Calle 48"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-slate-700">Inicio</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={newEvent.startDateTime}
                                        onChange={e => setNewEvent({ ...newEvent, startDateTime: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand transition-all outline-none text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-slate-700">Fin</label>
                                    <input
                                        type="datetime-local"
                                        value={newEvent.endDateTime}
                                        onChange={e => setNewEvent({ ...newEvent, endDateTime: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand transition-all outline-none text-sm"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-sm font-bold text-slate-700">Ubicación</label>
                                <input
                                    type="text"
                                    value={newEvent.location}
                                    onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand transition-all outline-none font-medium"
                                    placeholder="Dirección o lugar"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-sm font-bold text-slate-700">Nota / Descripción</label>
                                <textarea
                                    value={newEvent.description}
                                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand transition-all outline-none h-24 resize-none font-medium text-slate-600"
                                    placeholder="Detalles importantes..."
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex items-center gap-2 bg-gradient-to-r from-brand to-indigo-600 text-white px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-brand/25 transition-all font-bold disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
