import { useState } from 'react';
import { useNotes, type Note } from '../../hooks/useNotes';
import { Plus, Trash2, X, Check, Search, Paperclip, Calendar as CalendarIcon } from 'lucide-react';


interface NotesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const NotesModal = ({ isOpen, onClose }: NotesModalProps) => {
    const { notes, addNote, updateNote, deleteNote } = useNotes();
    const [isAdding, setIsAdding] = useState(false);
    const [newNoteContent, setNewNoteContent] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    if (!isOpen) return null;

    const handleAddNote = () => {
        if (newNoteContent.trim()) {
            addNote(newNoteContent);
            setNewNoteContent('');
            setIsAdding(false);
        }
    };

    const startEditing = (note: Note) => {
        setEditingId(note.id);
        setEditContent(note.content);
    };

    const saveEdit = (id: string) => {
        if (editContent.trim()) {
            updateNote(id, editContent);
            setEditingId(null);
        }
    };

    const filteredNotes = notes.filter(note =>
        note.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold font-heading text-slate-900">Mis Notas</h2>
                        <p className="text-sm text-slate-500">Gestiona tus apuntes rápidos</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                        <Search className="w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar en tus notas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 placeholder:text-slate-400 text-sm"
                        />
                    </div>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors font-medium text-sm shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Nueva Nota
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-0 bg-white">
                    {isAdding && (
                        <div className="bg-amber-50 p-6 border-b border-amber-200 animate-in fade-in slide-in-from-top-2">
                            <textarea
                                value={newNoteContent}
                                onChange={(e) => setNewNoteContent(e.target.value)}
                                placeholder="Escribe tu nueva nota aquí..."
                                className="w-full min-h-[100px] bg-white border border-amber-200 rounded-lg p-3 text-slate-700 focus:ring-2 focus:ring-amber-200 focus:border-amber-300 resize-none mb-3"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setIsAdding(false)}
                                    className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddNote}
                                    className="px-3 py-1.5 text-sm font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow-sm"
                                >
                                    Guardar Nota
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="min-w-full inline-block align-middle">
                        <div className="border-hidden rounded-lg">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50 sticky top-0 z-10">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-[55%]">
                                            Nota
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-[15%]">
                                            Vinculaciones
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-[15%]">
                                            Fecha
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-[15%]">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {filteredNotes.length > 0 ? (
                                        filteredNotes.map(note => (
                                            <tr
                                                key={note.id}
                                                className="hover:bg-slate-50 transition-colors group cursor-pointer"
                                                onClick={() => !editingId && startEditing(note)}
                                            >
                                                {editingId === note.id ? (
                                                    <td colSpan={4} className="px-6 py-4">
                                                        <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                                                            <textarea
                                                                value={editContent}
                                                                onChange={(e) => setEditContent(e.target.value)}
                                                                className="w-full min-h-[100px] bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-700 focus:ring-2 focus:ring-brand-light focus:border-brand resize-none"
                                                                autoFocus
                                                            />
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditingId(null);
                                                                    }}
                                                                    className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 rounded-md"
                                                                >
                                                                    Cancelar
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        saveEdit(note.id);
                                                                    }}
                                                                    className="px-3 py-1.5 text-sm font-medium bg-brand text-white rounded-md hover:bg-brand-dark transition-colors flex items-center gap-2"
                                                                >
                                                                    <Check className="w-4 h-4" /> Guardar
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                ) : (
                                                    <>
                                                        <td className="px-6 py-4">
                                                            <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                                                {note.content.length > 25
                                                                    ? note.content.substring(0, 25) + '...'
                                                                    : note.content}
                                                            </p>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <div className="p-1.5 rounded-md text-slate-300 bg-slate-50 group-hover:text-slate-400 group-hover:bg-white border border-transparent group-hover:border-slate-100 transition-all pointer-events-none" title="Sin archivos adjuntos">
                                                                    <Paperclip className="w-4 h-4" />
                                                                </div>
                                                                <div className="p-1.5 rounded-md text-slate-300 bg-slate-50 group-hover:text-slate-400 group-hover:bg-white border border-transparent group-hover:border-slate-100 transition-all pointer-events-none" title="Sin reuniones vinculadas">
                                                                    <CalendarIcon className="w-4 h-4" />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="text-xs text-slate-500">
                                                                {new Date(note.updatedAt).toLocaleDateString()}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteNote(note.id);
                                                                }}
                                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                                title="Eliminar"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400 border-dashed">
                                                <p>No se encontraron notas</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotesModal;
