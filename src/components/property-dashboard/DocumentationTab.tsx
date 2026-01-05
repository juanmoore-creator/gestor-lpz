import React, { useState } from 'react';
import { Files, Upload, Trash2, FileText, X, ExternalLink } from 'lucide-react';
import { Card } from '../ui/Card';
import { useDocuments } from '../../hooks/useDocuments';
import { formatDate } from '../../utils/format';
import { db } from '../../lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { ImageUpload } from '../ImageUpload'; // Using ImageUpload as a base for file selection

interface DocumentationTabProps {
    propertyId: string;
}

const DocumentationTab: React.FC<DocumentationTabProps> = ({ propertyId }) => {
    const { documents, loading, addDocument } = useDocuments(propertyId);
    const [showUpload, setShowUpload] = useState(false);
    const [uploadData, setUploadData] = useState({
        name: '',
        url: ''
    });

    const handleUploadComplete = async (urls: string[]) => {
        if (urls.length === 0) return;
        try {
            await addDocument({
                name: uploadData.name || 'Documento sin nombre',
                url: urls[0],
                uploadedAt: new Date()
            });
            setShowUpload(false);
            setUploadData({ name: '', url: '' });
        } catch (error) {
            console.error("Error adding document", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este documento?')) return;
        try {
            await deleteDoc(doc(db, 'documents', id));
        } catch (error) {
            console.error("Error deleting document", error);
        }
    };

    return (
        <Card className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Files className="w-6 h-6 text-brand" /> Documentación
                    </h2>
                    <p className="text-slate-500">Archivos, títulos y planos de la propiedad.</p>
                </div>
                <button
                    onClick={() => setShowUpload(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white font-bold rounded-xl hover:bg-brand-dark transition-all shadow-md active:scale-95"
                >
                    <Upload className="w-5 h-5" />
                    Subir Documento
                </button>
            </div>

            {loading ? (
                <div className="py-12 text-center text-slate-400">Cargando documentos...</div>
            ) : documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map(doc => (
                        <div key={doc.id} className="p-4 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition-all flex flex-col justify-between gap-3">
                            <div className="flex items-start justify-between">
                                <div className="p-3 bg-indigo-50 text-brand rounded-lg">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div className="flex gap-1">
                                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-brand rounded-lg transition-colors">
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                    <button onClick={() => handleDelete(doc.id)} className="p-2 text-slate-400 hover:text-rose-500 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 truncate" title={doc.name}>{doc.name}</h4>
                                <p className="text-xs text-slate-400 mt-1">{formatDate(doc.uploadedAt)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
                    <Files className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No hay documentos subidos.</p>
                </div>
            )}

            {showUpload && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Subir Documento</h3>
                            <button onClick={() => setShowUpload(false)}><X className="w-6 h-6" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Documento</label>
                                <input required type="text" value={uploadData.name} onChange={e => setUploadData({ ...uploadData, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="Ej: Escritura, Plano, DNI Propietario" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Archivo</label>
                                <ImageUpload
                                    images={[]}
                                    onImagesChange={handleUploadComplete}
                                    maxImages={1}
                                    label="Seleccionar Archivo"
                                />
                            </div>
                            <button onClick={() => setShowUpload(false)} className="w-full py-2 bg-slate-100 text-slate-600 font-bold rounded-xl mt-4">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default DocumentationTab;
