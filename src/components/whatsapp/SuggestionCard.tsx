import React from 'react';
import { X, Calendar, Copy, MessageSquarePlus, Sparkles } from 'lucide-react';

interface AnalysisResult {
    analysis: string;
    suggestedReply: string;
    recommendedAction: 'SCHEDULE_MEETING' | 'CREATE_NOTE' | 'NONE';
}

interface SuggestionCardProps {
    result: AnalysisResult | null;
    onClose: () => void;
    onApplyReply: (text: string) => void;
    onExecuteAction: (action: string) => void;
    isLoading?: boolean;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
    result,
    onClose,
    onApplyReply,
    onExecuteAction,
    isLoading
}) => {
    if (isLoading) {
        return (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-xl shadow-xl border border-blue-100 p-4 animate-in slide-in-from-bottom-2 z-20">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <Sparkles className="w-5 h-5 text-blue-600 animate-spin-slow" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 text-sm">Analizando conversación...</p>
                        <p className="text-xs text-slate-500">Consultando a Gemini</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!result) return null;

    return (
        <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-xl shadow-2xl border border-blue-200 overflow-hidden animate-in slide-in-from-bottom-2 z-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-white px-4 py-2 border-b border-blue-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-blue-800 text-xs uppercase tracking-wider">Sugerencia Copiloto</span>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-blue-100/50 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                    <X size={16} />
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* Analysis */}
                <div className="text-sm text-slate-600 italic border-l-2 border-blue-300 pl-3">
                    "{result.analysis}"
                </div>

                {/* Suggested Reply */}
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Respuesta Sugerida</p>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-800 text-sm">
                        {result.suggestedReply}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onApplyReply(result.suggestedReply)}
                            className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 py-2 rounded-lg text-sm font-medium transition-all"
                        >
                            <Copy size={16} />
                            Copiar
                        </button>
                        <button
                            onClick={() => onApplyReply(result.suggestedReply)}
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-all shadow-sm"
                        >
                            <MessageSquarePlus size={16} />
                            Usar
                        </button>
                    </div>
                </div>

                {/* Action */}
                {result.recommendedAction === 'SCHEDULE_MEETING' && (
                    <div className="pt-2 border-t border-slate-100">
                        <button
                            onClick={() => onExecuteAction(result.recommendedAction)}
                            className="w-full flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 py-2.5 rounded-lg text-sm font-bold transition-all"
                        >
                            <Calendar size={18} />
                            📅 Agendar Reunión Ahora
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
