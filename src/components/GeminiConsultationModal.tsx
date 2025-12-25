import { useState } from 'react';
import { X, Bot, Sparkles, CheckSquare, Square, Loader2, Copy, Check } from 'lucide-react';
import type { TargetProperty, Comparable } from '../types';

interface GeminiConsultationModalProps {
    isOpen: boolean;
    onClose: () => void;
    target: TargetProperty;
    comparables: Comparable[];
    onAddComparable: (data: Partial<Comparable>) => void;
}

interface FoundComparable {
    address: string;
    price: number;
    coveredSurface: number;
    uncoveredSurface: number;
    daysOnMarket: number;
    rooms?: number;
    bedrooms?: number;
    bathrooms?: number;
    age?: number;
    garage?: boolean;
    source?: string;
    url?: string;
    agency?: string; // Nuevo campo para mayor precisión
}

interface GeminiResponse {
    report: string;
    foundComparables: FoundComparable[];
}

export function GeminiConsultationModal({ isOpen, onClose, target, comparables, onAddComparable }: GeminiConsultationModalProps) {
    const [selectedComparables, setSelectedComparables] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<string | null>(null);
    const [parsedData, setParsedData] = useState<GeminiResponse | null>(null);
    const [copied, setCopied] = useState(false);
    const [addedIndices, setAddedIndices] = useState<number[]>([]);

    // Form data state
    const [condition, setCondition] = useState(target.condition || 'Muy bueno');
    const [lotDimensions, setLotDimensions] = useState(target.lotDimensions || '');
    const [utilities, setUtilities] = useState<string[]>(target.utilities ? target.utilities.split(',').map(u => u.trim()) : []);

    if (!isOpen) return null;

    const toggleComparable = (id: string) => {
        setSelectedComparables(prev =>
            prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
        );
    };

    const handleUtilityChange = (utility: string) => {
        setUtilities(prev =>
            prev.includes(utility)
                ? prev.filter(u => u !== utility)
                : [...prev, utility]
        );
    };

    const generatePrompt = () => {
        const selectedComps = comparables.filter(c => selectedComparables.includes(c.id));

        // Use manually selected comparables if available, otherwise rely on Google Search as per prompt instructions
        // The user prompt specifically says "ESTRICTAMENTE UTILIZA GOOGLE SEARCH", but we should still provide context if manual comps are selected.
        // However, the requested prompt format doesn't explicitly ask for manual comps list, but we can append it as context context or keep it separate.
        // Given the strict instruction "2. Comparables: ESTRICTAMENTE UTILIZA GOOGLE SEARCH...", I will focus on the Target Property data mostly, 
        // but keep the manual comps context at the end if useful, or omit if it conflicts with the "strictly google search" instruction.
        // I will keep the manual comps context as "Referencia" but prioritize the requested structure.

        const compsText = selectedComps.length > 0
            ? selectedComps.map(c =>
                `- Dirección: ${c.address}\n  Precio: USD ${c.price}\n  Sup. Cubierta: ${c.coveredSurface}m²\n  Sup. Descubierta: ${c.uncoveredSurface}m²\n  Días en mercado: ${c.daysOnMarket}`
            ).join('\n\n')
            : "No se seleccionaron comparables manuales.";

        const utilitiesStr = utilities.join(', ');

        return `REALIZAR TASACIÓN PARA LA SIGUIENTE PROPIEDAD:
            - Dirección: ${target.address}
            - Lote: ${lotDimensions || 'No especificado'}
            - Superficies: Cub ${target.coveredSurface || 0}m2, Semicub ${target.semiCoveredSurface || 0}m2, Desc ${target.uncoveredSurface || 0}m2.
            - Estado: ${condition} | Servicios: ${utilitiesStr || 'No especificados'}
            - Antigüedad: ${target.age || 0} años.

            COMPARABLES MANUALES DE REFERENCIA (SI FUERON SELECCIONADOS):
            ${compsText}

            INSTRUCCIÓN FINAL:
            Genera el JSON de tasación basado en el System Instruction provisto. Utiliza Google Search para los comparables de mercado.`;
    };

    const handleConsult = async () => {
        setLoading(true);
        setResponse(null);
        setParsedData(null);
        setAddedIndices([]);

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY; // La clave se proporciona en el entorno
            if (!apiKey) {
                // Para pruebas locales sin la clave de entorno inyectada
                throw new Error("API Key no disponible.");
            }

            const systemInstruction = `ACTÚA COMO UN SENIOR REAL ESTATE APPRAISER (La Plata/Zona Norte). Tu misión es realizar una tasación técnica de alta precisión.

PROTOCOLO TÉCNICO OBLIGATORIO:
1. BÚSQUEDA WEB Y VERIFICACIÓN (CRÍTICO):
   * Utiliza Google Search para localizar exactamente 5 comparables reales y VIGENTES en un radio < 800m.
   * VALIDACIÓN DE FUENTE: Debes indicar obligatoriamente el portal de origen y el nombre de la inmobiliaria.
   * PREVENCIÓN DE ALUCINACIONES: No generes links inventados.

2. MICRO-ENTORNO Y NORMATIVA:
   * Evalúa cercanía a Plazas y nodos de actividad.
   * Considera normativa COUT (FOS/FOT).
   * Servicios: Penaliza si falta gas natural.

IMPORTANTE: FORMATO DE SALIDA JSON
Tu respuesta DEBE ser SOLAMENTE un objeto JSON válido con la siguiente estructura. NO incluyas markdown (nada de \`\`\`json).

{
  "report": "Informe técnico completo en Markdown...",
  "foundComparables": [
     {
       "address": "Dirección",
       "price": 0,
       "coveredSurface": 0,
       "uncoveredSurface": 0,
       "daysOnMarket": 0,
       "rooms": 0,
       "bedrooms": 0,
       "bathrooms": 0,
       "age": 0,
       "garage": false,
       "source": "Portal",
       "agency": "Inmobiliaria",
       "url": "URL verificada"
     }
  ]
}`;

            const userPrompt = generatePrompt();

            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [{ text: systemInstruction }]
                    },
                    contents: [{
                        parts: [{ text: userPrompt }]
                    }],
                    tools: [{ "google_search": {} }]
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error?.message || 'Error al consultar Gemini');
            }

            const data = await res.json();
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!textResponse) throw new Error("No se recibió respuesta.");

            try {
                // Limpiar caracteres de markdown (```json ... ```) si existen
                const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(cleanJson) as GeminiResponse;
                setParsedData(parsed);
                setResponse(parsed.report);
            } catch (e) {
                console.error("JSON Parse Error", e);
                setResponse(textResponse);
            }

        } catch (error: any) {
            setResponse(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComparable = (comp: FoundComparable, index: number) => {
        onAddComparable({
            address: comp.address,
            price: comp.price,
            coveredSurface: comp.coveredSurface,
            uncoveredSurface: comp.uncoveredSurface,
            daysOnMarket: comp.daysOnMarket || 0,
            rooms: comp.rooms || 0,
            bedrooms: comp.bedrooms || 0,
            bathrooms: comp.bathrooms || 0,
            age: comp.age || 0,
            garage: comp.garage || false,
            surfaceType: 'Ninguno',
            homogenizationFactor: 1,
        });
        setAddedIndices(prev => [...prev, index]);
    };

    const copyToClipboard = () => {
        if (response) {
            const textArea = document.createElement("textarea");
            textArea.value = response;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-5xl w-full p-6 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-blue-600">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Consultar a Gemini AI</h3>
                            <p className="text-xs text-slate-500">Tasación técnica asistida por IA</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left: Controls */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* New Fields Section */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Estado de conservación</label>
                                <select
                                    value={condition}
                                    onChange={(e) => setCondition(e.target.value)}
                                    className="w-full text-sm p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                >
                                    <option value="Excelente">Excelente</option>
                                    <option value="Muy bueno">Muy bueno</option>
                                    <option value="Bueno">Bueno</option>
                                    <option value="A refaccionar">A refaccionar</option>
                                    <option value="Demolición">Demolición</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Tamaño del Lote</label>
                                <input
                                    type="text"
                                    value={lotDimensions}
                                    onChange={(e) => setLotDimensions(e.target.value)}
                                    placeholder="Ej: 10x30"
                                    className="w-full text-sm p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-2">Servicios</label>
                                <div className="space-y-2">
                                    {['Gas natural', 'Cloacas', 'Agua corriente'].map((svc) => (
                                        <label key={svc} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={utilities.includes(svc)}
                                                onChange={() => handleUtilityChange(svc)}
                                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-slate-600">{svc}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                                <CheckSquare className="w-4 h-4 text-slate-400" />
                                Contexto: Comparables
                            </h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 text-xs">
                                {comparables.map(comp => (
                                    <div
                                        key={comp.id}
                                        onClick={() => toggleComparable(comp.id)}
                                        className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all ${selectedComparables.includes(comp.id) ? 'bg-white border-blue-500 shadow-sm' : 'bg-slate-100/50 border-transparent hover:bg-slate-100'}`}
                                    >
                                        <div className={`text-blue-600 ${selectedComparables.includes(comp.id) ? 'opacity-100' : 'opacity-30'}`}>
                                            {selectedComparables.includes(comp.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-slate-700 truncate">{comp.address}</div>
                                            <div className="text-[10px] text-slate-500">USD {comp.price}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleConsult}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-sm rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-indigo-500/20 disabled:opacity-70"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Analizando mercado...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Generar Tasación IA
                                </>
                            )}
                        </button>
                    </div>

                    {/* Right: Response */}
                    <div className="lg:col-span-2 flex flex-col h-full min-h-[400px]">
                        {!parsedData && !response && !loading && (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                <Bot className="w-12 h-12 mb-3 opacity-20" />
                                <p className="text-sm">Envía los datos para que la IA realice la investigación</p>
                            </div>
                        )}

                        {loading && (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl">
                                <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-600" />
                                <p className="text-sm animate-pulse">Buscando comparables reales en portales...</p>
                            </div>
                        )}

                        {(parsedData || response) && !loading && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-slate-700 flex items-center gap-2 text-sm">
                                            <Bot className="w-4 h-4 text-blue-600" />
                                            Informe de Tasación Técnica
                                        </h4>
                                        <button onClick={copyToClipboard} className="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1">
                                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                            {copied ? 'Copiado' : 'Copiar Informe'}
                                        </button>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-sm text-slate-700 leading-relaxed overflow-y-auto max-h-[400px]">
                                        <div className="whitespace-pre-wrap">
                                            {parsedData ? parsedData.report : response}
                                        </div>
                                    </div>
                                </div>

                                {parsedData?.foundComparables && parsedData.foundComparables.length > 0 && (
                                    <div className="space-y-3 pt-4 border-t border-slate-100">
                                        <h4 className="font-semibold text-slate-700 flex items-center gap-2 text-sm">
                                            <Sparkles className="w-4 h-4 text-amber-500" />
                                            Fuentes de Mercado Detectadas
                                        </h4>
                                        <div className="grid grid-cols-1 gap-3">
                                            {parsedData.foundComparables.map((comp, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="font-medium text-slate-800 text-sm">{comp.address}</div>
                                                            {comp.url && (
                                                                <a
                                                                    href={comp.url.startsWith('http') ? comp.url : `https://${comp.url}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-500 hover:underline text-[10px]"
                                                                >
                                                                    Ver Aviso ↗
                                                                </a>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 flex flex-wrap gap-2 mt-1">
                                                            <span className="font-bold text-slate-700">USD {comp.price.toLocaleString()}</span>
                                                            <span>•</span>
                                                            <span>{comp.coveredSurface}m² cub</span>
                                                            {comp.agency && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="text-blue-600 font-medium">{comp.agency}</span>
                                                                </>
                                                            )}
                                                            {comp.source && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="italic">{comp.source}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleAddComparable(comp, idx)}
                                                        disabled={addedIndices.includes(idx)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${addedIndices.includes(idx)
                                                            ? 'bg-emerald-50 text-emerald-600'
                                                            : 'bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white'
                                                            }`}
                                                    >
                                                        {addedIndices.includes(idx) ? 'Agregado' : '+ Agregar'}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}