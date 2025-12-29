export interface Note {
    id: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

import { useState, useEffect } from 'react';

export const useNotes = () => {
    const [notes, setNotes] = useState<Note[]>(() => {
        const stored = localStorage.getItem('app_notes');
        if (stored) {
            return JSON.parse(stored);
        }

        // Migration from old format
        const oldNote = localStorage.getItem('dashboard_notes');
        if (oldNote && oldNote.trim()) {
            const migratedNote: Note = {
                id: crypto.randomUUID(),
                content: oldNote,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            return [migratedNote];
        }

        return [];
    });

    useEffect(() => {
        localStorage.setItem('app_notes', JSON.stringify(notes));
    }, [notes]);

    const addNote = (content: string) => {
        const newNote: Note = {
            id: crypto.randomUUID(),
            content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        setNotes(prev => [newNote, ...prev]);
    };

    const updateNote = (id: string, content: string) => {
        setNotes(prev => prev.map(note =>
            note.id === id
                ? { ...note, content, updatedAt: new Date().toISOString() }
                : note
        ));
    };

    const deleteNote = (id: string) => {
        setNotes(prev => prev.filter(note => note.id !== id));
    };

    return {
        notes,
        addNote,
        updateNote,
        deleteNote
    };
};
