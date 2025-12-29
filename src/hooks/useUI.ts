import { useState } from 'react';

export function useUI() {
    const [savedValuationsModalOpen, setSavedValuationsModalOpen] = useState(false);
    const [geminiModalOpen, setGeminiModalOpen] = useState(false);

    return {
        savedValuationsModalOpen,
        setSavedValuationsModalOpen,
        geminiModalOpen,
        setGeminiModalOpen,
    };
}
