
const MapPage = ({ properties, target, theme, mapImage }: { properties: any[], target?: any, theme?: { primary: string, secondary: string }, mapImage?: string }) => {
    const primaryColor = theme?.primary || '#1e293b';
    const secondaryColor = theme?.secondary || '#4f46e5';

    return (
        <div className="print-page h-[1123px] w-[794px] bg-white p-12 flex flex-col">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b pb-2" style={{ borderColor: primaryColor }}>Ubicación de Comparables</h2>
            <div className="flex-1 border border-slate-200 rounded-lg flex items-center justify-center bg-slate-50 mb-8 overflow-hidden">
                {mapImage ? (
                    <img
                        src={mapImage}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                        alt="Mapa de Comparables"
                    />
                ) : (
                    <div className="flex flex-col items-center text-slate-400 p-8 text-center">
                        <span className="text-4xl mb-4">🗺️</span>
                        <p>Mapa no disponible.</p>
                        <p className="text-sm mt-2">Asegúrate de haber ingresado direcciones válidas y guardado la tasación para generar el mapa.</p>
                    </div>
                )}
            </div>
            <div>
                <h3 className="font-semibold text-lg mb-4 text-slate-700">Referencias</h3>
                <ul className="space-y-3">
                    {/* Target Property Reference */}
                    {target && (
                        <li className="text-md text-slate-700 flex items-start">
                            <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3 flex-shrink-0 bg-red-600"
                            >
                                T
                            </div>
                            <span className="font-semibold">{target.address} (Propiedad Objetivo)</span>
                        </li>
                    )}

                    {/* Comparables References */}
                    {properties.map((p, i) => (
                        <li key={p.id || i} className="text-md text-slate-700 flex items-start">
                            <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3 flex-shrink-0"
                                style={{ backgroundColor: secondaryColor }}
                            >
                                {i + 1}
                            </div>
                            <span>{p.address}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="mt-auto pt-6 border-t border-slate-200 flex justify-between text-xs text-slate-400">
                <span>Reporte generado el {new Date().toLocaleDateString()}</span>
                <span>Página 2</span>
            </div>
        </div>
    );
};

export default MapPage;
