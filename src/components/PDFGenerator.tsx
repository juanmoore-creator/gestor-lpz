import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ReportView from './ReportView';
import { Download } from 'lucide-react';

interface PDFGeneratorProps {
    target: any;
    comparables: any[];
    valuation: any;
    stats: any;
    brokerName?: string;
    matricula?: string;
    clientName?: string;
    theme?: {
        primary: string;
        secondary: string;
    };
    displayMode?: 'text' | 'icon';
    className?: string;
}

const PDFGenerator = ({ target, comparables, valuation, stats, brokerName, matricula, clientName, theme, displayMode = 'text', className }: PDFGeneratorProps) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

    // State for overrides
    const [editableReportData, setEditableReportData] = useState<any>(null);
    const [editableComparables, setEditableComparables] = useState<any[]>([]);

    useEffect(() => {
        setMountNode(document.body);
    }, []);

    useEffect(() => {
        if (showPreview) {
            setEditableReportData({
                target: JSON.parse(JSON.stringify(target)),
                brokerName: brokerName || '',
                matricula: matricula || '',
                clientName: clientName || 'Cliente Final',
                ...JSON.parse(JSON.stringify(valuation))
            });
            setEditableComparables(JSON.parse(JSON.stringify(comparables)));
        } else {
            setEditableReportData(null);
            setEditableComparables([]);
        }
    }, [showPreview, target, comparables, valuation, brokerName, matricula, clientName]);

    const handleUpdateData = (path: string, value: any) => {
        setEditableReportData((prev: any) => {
            const newData = { ...prev };
            if (path.includes('.')) {
                const parts = path.split('.');
                let current = newData;
                for (let i = 0; i < parts.length - 1; i++) {
                    if (!current[parts[i]]) current[parts[i]] = {};
                    current = current[parts[i]];
                }
                current[parts[parts.length - 1]] = value;
            } else {
                newData[path] = value;
            }
            return newData;
        });
    };

    const handleUpdateComparable = (id: string, path: string, value: any) => {
        setEditableComparables((prev: any[]) => prev.map(comp => {
            if (comp.id === id) {
                return { ...comp, [path]: value };
            }
            return comp;
        }));
    };

    const handleGeneratePDF = async () => {
        setIsGenerating(true);

        try {
            // Lazy load libraries only when needed
            const [html2canvas, jsPDF] = await Promise.all([
                import('html2canvas').then(m => m.default),
                import('jspdf').then(m => m.default)
            ]);

            // Wait a tick for React to render the portal content if it wasn't there
            await new Promise(resolve => setTimeout(resolve, 100));

            const container = document.getElementById('pdf-render-target');
            if (!container) throw new Error("Container not found");

            const pages = container.querySelectorAll('.print-page');
            if (pages.length === 0) throw new Error("No pages found");

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = 210;
            const pdfHeight = 297;

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i] as HTMLElement;
                const canvas = await html2canvas(page, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    width: 794,
                    windowWidth: 794,
                    height: 1123,
                    windowHeight: 1123,
                    onclone: (clonedDoc) => {
                        const clonedPage = clonedDoc.getElementById('pdf-render-target');
                        if (clonedPage) {
                            clonedPage.style.display = 'block';
                        }
                    }
                });

                const imgData = canvas.toDataURL('image/jpeg', 0.8);

                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            }

            pdf.save(`tasacion-${target.address || 'propiedad'}.pdf`);
        } catch (err) {
            console.error("Error generating PDF", err);
            alert("Hubo un error al generar el PDF.");
        } finally {
            setIsGenerating(false);
        }
    };

    // Use editable data if available (preview mode), otherwise use props
    const activeReportData = editableReportData || {
        target: target,
        brokerName: brokerName || '',
        matricula: matricula || '',
        clientName: clientName || 'Cliente Final',
        ...valuation
    };

    const activeComparables = editableComparables.length > 0 ? editableComparables : comparables;

    return (
        <>
            <button
                onClick={() => setShowPreview(true)}
                className={className || `flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-200 hover:shadow-md rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:shadow-none active:scale-95`}
                disabled={isGenerating || comparables.length === 0}
                title="Generar PDF"
            >
                {isGenerating ? (
                    displayMode === 'icon' ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : 'Generando...'
                ) : (
                    <>
                        <Download className="w-4 h-4" />
                        {displayMode === 'text' && <span className="hidden sm:inline">PDF</span>}
                    </>
                )}
            </button>

            {/* Preview Modal */}
            {showPreview && createPortal(
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex flex-col animate-in fade-in duration-200">
                    <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">Vista Previa del Reporte</h3>
                            <p className="text-sm text-slate-500">Revisa los datos antes de exportar</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowPreview(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleGeneratePDF}
                                disabled={isGenerating}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                            >
                                {isGenerating ? 'Generando...' : <><Download className="w-4 h-4" /> Descargar PDF</>}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-slate-100 p-8">
                        <div className="max-w-6xl mx-auto">
                            <ReportView
                                data={activeReportData}
                                properties={activeComparables}
                                valuation={activeReportData}
                                stats={stats}
                                theme={theme}
                                showAnnotations={true}
                                onUpdateData={handleUpdateData}
                                onUpdateComparable={handleUpdateComparable}
                            />
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Hidden Render Target for PDF Generation (Clean version without annotations) */}
            {mountNode && createPortal(
                <div id="pdf-render-target" style={{
                    position: 'fixed',
                    left: '-10000px',
                    top: 0,
                    width: '794px',
                    zIndex: -9999,
                    visibility: 'hidden',
                    pointerEvents: 'none'
                }}>
                    <div style={{ visibility: 'visible' }}>
                        <ReportView
                            data={activeReportData}
                            properties={activeComparables}
                            valuation={activeReportData}
                            stats={stats}
                            theme={theme}
                            showAnnotations={false}
                        />
                    </div>
                </div>,
                mountNode
            )}
        </>
    );
};

export default PDFGenerator;
