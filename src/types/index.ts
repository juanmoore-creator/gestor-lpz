export type SurfaceType = 'Jardín' | 'Patio' | 'Terraza' | 'Balcón' | 'Ninguno';

export interface Location {
    lat: number;
    lng: number;
}

export type InmuebleStatus = 'Disponible' | 'Reservado' | 'Vendido' | 'Alquilado' | 'No Disponible';
export type InmuebleOperacion = 'Venta' | 'Alquiler' | 'Alquiler Temporario';

export interface Inmueble {
    id: string; // ID del documento de Firestore
    direccion: string; // Dirección completa y formateada
    tipo?: string;
    descripcion?: string;
    location: Location; // Coordenadas para Google Maps

    // Características principales
    caracteristicas: {
        metrosCuadrados: number;
        habitaciones: number;
        banos: number;
        cocheras?: number;
        // Puedes añadir más campos como 'planta', 'ascensor', etc.
    };

    precio?: {
        valor: number;
        moneda: 'USD' | 'ARS';
    };

    propietarioId: string; // ID del cliente que es el propietario
    agenteId: string; // ID del agente asignado

    // Galería de medios
    fotos: string[]; // Array de URLs de las imágenes

    // Estado y tipo de gestión
    status: InmuebleStatus;
    operacion: InmuebleOperacion;

    // Metadatos
    fechaCreacion: Date;
    fechaActualizacion: Date;
}

export interface PropertyCharacteristics {
    // Indispensable
    rooms?: number;           // Ambientes
    bedrooms?: number;        // Dormitorios
    bathrooms?: number;       // Baños
    age?: number;             // Antigüedad (years)
    garage?: boolean;         // Cochera

    // Optional
    semiCoveredSurface?: number; // Superficie semicubierta
    toilettes?: number;
    floorType?: string;       // Pisos de la propiedad
    apartmentsInBuilding?: number; // Deptos. en el edificio
    isCreditEligible?: boolean;    // Apto crédito
    isProfessional?: boolean;      // Apto profesional
    hasFinancing?: boolean;        // Ofrece financiamiento
    images?: string[];             // URLs de imagenes
    mapImage?: string;             // URL de imagen del mapa estático (Google Maps)
    lotDimensions?: string;        // Medidas del lote
    orientation?: string;          // Orientación
    utilities?: string;            // Servicios
    condition?: string;            // Estado (Excelente, Muy bueno, etc.)
}

export interface TargetProperty extends PropertyCharacteristics {
    address: string;
    location?: { lat: number; lng: number }; // Added location
    coveredSurface: number;
    uncoveredSurface: number;
    surfaceType: SurfaceType;
    homogenizationFactor: number;
}

export interface Comparable extends PropertyCharacteristics {
    id: string;
    address: string;
    location?: { lat: number; lng: number }; // Added location
    price: number;
    coveredSurface: number;
    uncoveredSurface: number;
    surfaceType: SurfaceType;
    homogenizationFactor: number;
    daysOnMarket: number;
    hSurface?: number;
    hPrice?: number;
    // New fields for PDF Grid Layout
    publicationPrice?: number;
    closingPrice?: number;
    closingDate?: string;
    status?: 'Disponible' | 'Reservado' | 'Vendido' | 'Alquilado' | 'Cerrada'; // 'Cerrada' to match user term
    amenities?: string[];
}

export interface SavedValuation {
    id: string;
    inmuebleId: string; // ID del Inmueble al que pertenece esta tasación
    name: string;
    date: number;
    target: TargetProperty;
    comparables: Comparable[];
    clientName?: string;
    valuation?: {
        low: number;
        market: number;
        high: number;
    };
    // New fields for PDF generation
    publicationPrice?: number;
    closingPrice?: number;
    closingDate?: string;
    valuationStatus?: 'Abierta' | 'Cerrada';
    amenities?: string[];
}

export interface Client {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: 'Nuevo' | 'En Seguimiento' | 'Cerrado';
    type: 'Comprador' | 'Propietario' | 'Inquilino';
    roles?: ('Comprador' | 'Propietario' | 'Inquilino')[];
    budget?: string;
    interestZone?: string;
    propertyType?: string;
    createdAt: number;
    lastActivity: number;
    notes?: string;
}

// Interfaz para la sección de Tasaciones
export interface Valuation {
    id: string;
    propertyId: string;
    date: any; // Using any for Timestamp compatibility or number as in SavedValuation
    amount: number;
    currency: 'USD' | 'ARS';
    notes?: string;
}

// Interfaz para la sección de Visitas
export interface Visit {
    id: string;
    propertyId: string;
    date: any;
    visitorName: string;
    visitorContact?: string;
    notes?: string;
}

// Interfaz para la sección de Ofertas
export interface Offer {
    id: string;
    propertyId: string;
    date: any;
    amount: number;
    currency: 'USD' | 'ARS';
    offererName: string;
    offererContact?: string;
    status: 'pending' | 'accepted' | 'rejected';
}

// Interfaz para la sección de Documentación
export interface PropertyDocument {
    id: string;
    propertyId: string;
    name: string;
    url: string;
    uploadedAt: any;
}

