import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Default theme settings
const defaultTheme = {
    primary: '#4f46e5', // indigo-600
    secondary: '#cbd5e1' // slate-300
};

export function useUserProfile() {
    const { user } = useAuth();
    
    const [brokerName, setBrokerName] = useState('');
    const [matricula, setMatricula] = useState('');
    const [pdfTheme, setPdfTheme] = useState(defaultTheme);
    const [isLoading, setIsLoading] = useState(true);

    // Effect to load and save user profile data
    useEffect(() => {
        if (!user?.uid) {
            setIsLoading(false);
            return;
        }

        const profileRef = doc(db, `users/${user.uid}/data/profile`);

        const loadProfile = async () => {
            try {
                const docSnap = await getDoc(profileRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setBrokerName(data.brokerName || '');
                    setMatricula(data.matricula || '');
                    setPdfTheme(data.pdfTheme || defaultTheme);
                }
            } catch (error) {
                console.error("Error loading user profile:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadProfile();

    }, [user]);

    const saveProfile = async (profileData: { brokerName?: string, matricula?: string, pdfTheme?: { primary: string, secondary: string }}) => {
        if (!user?.uid) return;
        const profileRef = doc(db, `users/${user.uid}/data/profile`);
        try {
            await setDoc(profileRef, profileData, { merge: true });
        } catch (error) {
            console.error("Error saving user profile:", error);
        }
    };


    // We can create specific setters that also save to the DB
    const handleSetBrokerName = (name: string) => {
        setBrokerName(name);
        saveProfile({ brokerName: name });
    }

    const handleSetMatricula = (mat: string) => {
        setMatricula(mat);
        saveProfile({ matricula: mat });
    }

    const handleSetPdfTheme = (theme: { primary: string, secondary: string }) => {
        setPdfTheme(theme);
        saveProfile({ pdfTheme: theme });
    }


    return {
        brokerName,
        matricula,
        pdfTheme,
        setBrokerName: handleSetBrokerName,
        setMatricula: handleSetMatricula,
        setPdfTheme: handleSetPdfTheme,
        isLoading,
    };
}
