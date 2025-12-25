import CoverPage from './report/CoverPage';
import MapPage from './report/MapPage';
import AgentManagerSidebar from './report/AgentManagerSidebar';


import SummaryPage from './report/SummaryPage';
import PropertyDetailPage from './report/PropertyDetailPage';
import PriceSuggestionPage from './report/PriceSuggestionPage';
import AveragesPage from './report/AveragesPage';
import ContactPage from './report/ContactPage';

interface AnnotatedPageProps {
    children: React.ReactNode;
    visible?: boolean;
    inputs?: {
        label: string;
        value: any;
        onChange: (val: any) => void;
        type?: 'text' | 'number';
    }[];
    customSidebar?: React.ReactNode;
}

const AnnotatedPage = ({ children, inputs, visible, customSidebar }: AnnotatedPageProps) => {
    if (!visible) return <>{children}</>;
    return (
        <div className="flex gap-8 mb-12 justify-center items-start">
            <div className="relative shadow-xl">
                {children}
            </div>
            {/* Annotation Side Panel */}
            {customSidebar ? customSidebar : (
                <div className="w-72 pt-8 sticky top-8">
                    <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-indigo-200 shadow-lg">
                        <h4 className="font-bold text-indigo-900 mb-4 uppercase text-xs tracking-wider flex items-center gap-2 border-b border-indigo-100 pb-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            Editar Datos del Reporte
                        </h4>
                        <div className="space-y-4">
                            {inputs?.map((input, i) => (
                                <div key={i} className="flex flex-col gap-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider ml-1">{input.label}</label>
                                    {input.type === 'number' ? (
                                        <input
                                            type="number"
                                            value={input.value}
                                            onChange={(e) => input.onChange(parseFloat(e.target.value) || 0)}
                                            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-medium"
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            value={input.value || ''}
                                            onChange={(e) => input.onChange(e.target.value)}
                                            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-medium"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        {!inputs?.length && (
                            <p className="text-xs text-slate-400 italic text-center py-2">
                                Sin campos editables en esta página
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

interface ReportViewProps {
    data: any;
    properties: any[];
    valuation: any;
    stats: any;
    theme?: { primary: string, secondary: string };
    showAnnotations?: boolean;
    onUpdateData?: (path: string, value: any) => void;
    onUpdateComparable?: (id: string, path: string, value: any) => void;
}

const ReportView = ({ data, properties, valuation, stats, theme, showAnnotations = false, onUpdateData, onUpdateComparable }: ReportViewProps) => {
    // Helper to safely call update
    const update = (path: string, val: any) => {
        if (onUpdateData) onUpdateData(path, val);
    };

    const updateComp = (id: string, path: string, val: any) => {
        if (onUpdateComparable) onUpdateComparable(id, path, val);
    };

    return (
        <div id="report-view" className={showAnnotations ? "flex flex-col items-center bg-slate-200/50 py-12 min-h-screen" : ""}>
            <AnnotatedPage visible={showAnnotations} inputs={[
                { label: "Dirección", value: data.target?.address, onChange: (v) => update('target.address', v) },
                // Client, Broker, Matricula handled by customSidebar
            ]} customSidebar={
                <AgentManagerSidebar data={data} onUpdate={update} />
            }>
                <CoverPage data={data} theme={theme} />
            </AnnotatedPage>

            <AnnotatedPage visible={showAnnotations} inputs={[
                // Map page usually doesn't need text edit, maybe address refernece?
                { label: "Dirección Referencia", value: data.target?.address, onChange: (v) => update('target.address', v) }
            ]}>
                <MapPage properties={properties} target={data?.target} theme={theme} mapImage={data?.target?.mapImage} />
            </AnnotatedPage>

            <AnnotatedPage visible={showAnnotations}>
                <SummaryPage properties={properties} theme={theme} />
            </AnnotatedPage>

            {properties.map((prop, index) => (
                <AnnotatedPage key={prop.id || index} visible={showAnnotations} inputs={[
                    { label: "Dirección", value: prop.address, onChange: (v) => updateComp(prop.id, 'address', v) },
                    { label: "Precio (USD)", value: prop.price, type: 'number', onChange: (v) => updateComp(prop.id, 'price', v) },
                    { label: "Días en Mercado", value: prop.daysOnMarket, type: 'number', onChange: (v) => updateComp(prop.id, 'daysOnMarket', v) },
                    { label: "Sup. Cubierta (m²)", value: prop.coveredSurface, type: 'number', onChange: (v) => updateComp(prop.id, 'coveredSurface', v) },
                    { label: "Sup. Descubierta (m²)", value: prop.uncoveredSurface, type: 'number', onChange: (v) => updateComp(prop.id, 'uncoveredSurface', v) },
                ]}>
                    <PropertyDetailPage property={prop} index={index} theme={theme} />
                </AnnotatedPage>
            ))}

            <AnnotatedPage visible={showAnnotations} inputs={[
                { label: "Valor Mercado (USD)", value: valuation.market, type: 'number', onChange: (v) => update('market', v) },
                { label: "Valor Rápido (USD)", value: valuation.low, type: 'number', onChange: (v) => update('low', v) },
                { label: "Valor Alto (USD)", value: valuation.high, type: 'number', onChange: (v) => update('high', v) },
            ]}>
                <PriceSuggestionPage data={valuation} stats={stats} theme={theme} properties={properties} />
            </AnnotatedPage>

            <AnnotatedPage visible={showAnnotations}>
                <AveragesPage properties={properties} theme={theme} />
            </AnnotatedPage>

            <AnnotatedPage visible={showAnnotations} customSidebar={
                <AgentManagerSidebar data={data} onUpdate={update} />
            }>
                <ContactPage data={data} theme={theme} />
            </AnnotatedPage>
        </div>
    );
};

export default ReportView;
