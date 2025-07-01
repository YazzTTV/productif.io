"use client"

import React, { useEffect, useState } from 'react';
import NotificationSettings from '../components/NotificationSettings';

const SettingsPage = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Récupérer l'utilisateur depuis votre API
        const fetchUser = async () => {
            try {
                const response = await fetch('/api/auth/me');
                const data = await response.json();
                setUser(data);
            } catch (error) {
                console.error('Erreur lors de la récupération de l\'utilisateur:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    if (loading) {
        return <div>Chargement...</div>;
    }

    if (!user) {
        return <div>Veuillez vous connecter pour accéder aux paramètres.</div>;
    }

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Paramètres</h1>
            
            <div className="space-y-8">
                {/* Section Notifications */}
                <section>
                    <NotificationSettings userId={user.id} />
                </section>

                {/* Autres sections de paramètres ici */}
            </div>
        </div>
    );
};

export default SettingsPage; 