import { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import Papa from 'papaparse';
import type { Comparable, SurfaceType } from '../types/index';
import { DEFAULT_FACTORS, SURFACE_TYPES } from '../constants';

const getSheetCsvUrl = (url: string) => {
    try {
        const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match && match[1]) {
            return `https://docs.google.com/spreadsheets/d/${match[1]}/gviz/tq?tqx=out:csv`;
        }
        return null;
    } catch (e) {
        return null;
    }
};


export function useGoogleSheetImport() {
    const { user } = useAuth();
    const [sheetUrl, setSheetUrl] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleImportFromSheet = async () => {
        if (!sheetUrl) return alert("Por favor ingresa el link de tu Google Sheet (debe ser público).");
        if (!user?.uid) return alert("Debes estar conectado para importar.");

        const csvUrl = getSheetCsvUrl(sheetUrl);
        if (!csvUrl) return alert("Link inválido. Asegúrate de copiar el link completo de tu Google Sheet.");

        setIsImporting(true);
        setError(null);

        const comparablesPath = `users/${user.uid}/comparables`;

        try {
            const urlWithCacheBuster = `${csvUrl}&t=${Date.now()}`;
            const response = await fetch(urlWithCacheBuster);
            if (!response.ok) throw new Error("No se pudo obtener la información de la hoja de cálculo.");
            const text = await response.text();

            Papa.parse(text, {
                header: true,
                skipEmptyLines: true,
                transformHeader: (h: string) => h.trim(),
                complete: async (results: any) => {
                    try {
                        const rows = results.data as any[];
                        const newComps: Omit<Comparable, 'id'>[] = [];

                        const cleanNumber = (val: any): number => {
                            if (!val) return 0;
                            let str = val.toString();
                            str = str.replace(/[Uu$sSDdm²\s]/g, '');
                            str = str.replace(/\./g, '').replace(',', '.');
                            return parseFloat(str) || 0;
                        };

                        for (const row of rows) {
                            const address = row['Dirección'] || row['Address'] || 'Sin dirección';
                            if ((!address || address === 'Sin dirección') && !row['Precio']) continue;

                            newComps.push({
                                address: address,
                                price: cleanNumber(row['Precio'] || row['Price']),
                                coveredSurface: cleanNumber(row['Sup. Cubierta'] || row['Covered Surface']),
                                uncoveredSurface: cleanNumber(row['Sup. Descubierta'] || row['Uncovered Surface']),
                                surfaceType: (SURFACE_TYPES.includes((row['Tipo Sup'] || row['Surface Type'] || '').trim() as any) ? (row['Tipo Sup'] || row['Surface Type'] || '').trim() : 'Ninguno') as SurfaceType,
                                homogenizationFactor: row['Factor'] ? cleanNumber(row['Factor']) : DEFAULT_FACTORS[(row['Tipo Sup'] || row['Surface Type'] || 'Ninguno') as SurfaceType] || 1,
                                daysOnMarket: cleanNumber(row['Días'] || row['Days']),
                                // Add other fields with defaults if they exist in your sheet
                                rooms: 0,
                                bedrooms: 0,
                                bathrooms: 0,
                                age: 0,
                                garage: false,
                                semiCoveredSurface: 0,
                                toilettes: 0,
                                floorType: '',
                                apartmentsInBuilding: 0,
                                isCreditEligible: false,
                                isProfessional: false,
                                hasFinancing: false,
                                images: [],
                            });
                        }

                        const batch = writeBatch(db);
                        newComps.forEach(c => {
                            const newRef = doc(collection(db, comparablesPath));
                            batch.set(newRef, c);
                        });
                        await batch.commit();
                        
                        alert(`Se importaron ${newComps.length} propiedades exitosamente.`);
                        setIsImporting(false);

                    } catch (err: any) {
                        console.error("Parse Logic Error:", err);
                        setError(`Error procesando los datos: ${err.message}`);
                        setIsImporting(false);
                    }
                },
                error: (err: any) => {
                    console.error("CSV Parse Error:", err);
                    setError("Error al leer los datos de la hoja de cálculo.");
                    setIsImporting(false);
                }
            });
        } catch (error: any) {
            console.error("Sheet Import Error:", error);
            setError("Error importando desde Sheet. Asegúrate que esté configurada como 'Cualquiera con el enlace puede ver'.");
            setIsImporting(false);
        }
    };

    return {
        sheetUrl,
        setSheetUrl,
        handleImportFromSheet,
        isImporting,
        error,
    };
}
