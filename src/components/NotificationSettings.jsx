"use client"

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NotificationSettings = ({ userId }) => {
    const [preferences, setPreferences] = useState({
        isEnabled: true,
        whatsappEnabled: false,
        whatsappNumber: '',
        startHour: 9,
        endHour: 22,
        allowedDays: [1, 2, 3, 4, 5, 6, 7],
        notificationTypes: ['TASK_DUE', 'HABIT_REMINDER', 'DAILY_SUMMARY']
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Charger les préférences existantes
    useEffect(() => {
        const loadPreferences = async () => {
            try {
                const response = await axios.get(`/api/notifications/preferences?userId=${userId}`);
                if (response.data) {
                    setPreferences(response.data);
                }
            } catch (error) {
                setError('Erreur lors du chargement des préférences');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        loadPreferences();
    }, [userId]);

    // Gérer les changements de formulaire
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (type === 'checkbox') {
            setPreferences(prev => ({
                ...prev,
                [name]: checked
            }));
        } else if (name === 'allowedDays') {
            const day = parseInt(value);
            setPreferences(prev => ({
                ...prev,
                allowedDays: prev.allowedDays.includes(day)
                    ? prev.allowedDays.filter(d => d !== day)
                    : [...prev.allowedDays, day].sort()
            }));
        } else if (name === 'notificationTypes') {
            setPreferences(prev => ({
                ...prev,
                notificationTypes: prev.notificationTypes.includes(value)
                    ? prev.notificationTypes.filter(t => t !== value)
                    : [...prev.notificationTypes, value]
            }));
        } else {
            setPreferences(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Enregistrer les préférences
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        try {
            await axios.post('/api/notifications/preferences', {
                userId,
                ...preferences
            });
            setSuccess(true);
        } catch (error) {
            setError(error.response?.data?.error || 'Erreur lors de la sauvegarde');
            console.error(error);
        }
    };

    // Envoyer une notification de test
    const handleTest = async () => {
        try {
            await axios.post('/api/notifications/test', { userId });
            setSuccess('Notification de test envoyée !');
        } catch (error) {
            setError('Erreur lors de l\'envoi du test');
            console.error(error);
        }
    };

    if (loading) return <div>Chargement...</div>;

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h2 className="text-2xl font-bold mb-6">Préférences de notification</h2>
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}
            
            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {typeof success === 'string' ? success : 'Préférences enregistrées !'}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Activation générale */}
                <div>
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            name="isEnabled"
                            checked={preferences.isEnabled}
                            onChange={handleChange}
                            className="form-checkbox"
                        />
                        <span>Activer les notifications</span>
                    </label>
                </div>

                {/* Configuration WhatsApp */}
                <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            name="whatsappEnabled"
                            checked={preferences.whatsappEnabled}
                            onChange={handleChange}
                            className="form-checkbox"
                        />
                        <span>Notifications WhatsApp</span>
                    </label>
                    
                    {preferences.whatsappEnabled && (
                        <input
                            type="tel"
                            name="whatsappNumber"
                            value={preferences.whatsappNumber}
                            onChange={handleChange}
                            placeholder="+33783642205"
                            className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded"
                        />
                    )}
                </div>

                {/* Heures de notification */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Début</label>
                        <input
                            type="number"
                            name="startHour"
                            min="0"
                            max="23"
                            value={preferences.startHour}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Fin</label>
                        <input
                            type="number"
                            name="endHour"
                            min="0"
                            max="23"
                            value={preferences.endHour}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded"
                        />
                    </div>
                </div>

                {/* Jours de la semaine */}
                <div>
                    <label className="block text-sm font-medium mb-2">Jours de notification</label>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { value: 1, label: 'Lun' },
                            { value: 2, label: 'Mar' },
                            { value: 3, label: 'Mer' },
                            { value: 4, label: 'Jeu' },
                            { value: 5, label: 'Ven' },
                            { value: 6, label: 'Sam' },
                            { value: 7, label: 'Dim' }
                        ].map(day => (
                            <label key={day.value} className="inline-flex items-center">
                                <input
                                    type="checkbox"
                                    name="allowedDays"
                                    value={day.value}
                                    checked={preferences.allowedDays.includes(day.value)}
                                    onChange={handleChange}
                                    className="form-checkbox"
                                />
                                <span className="ml-2">{day.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Types de notifications */}
                <div>
                    <label className="block text-sm font-medium mb-2">Types de notifications</label>
                    <div className="space-y-2">
                        {[
                            { value: 'TASK_DUE', label: 'Échéances de tâches' },
                            { value: 'HABIT_REMINDER', label: 'Rappels d\'habitudes' },
                            { value: 'DAILY_SUMMARY', label: 'Résumé quotidien' }
                        ].map(type => (
                            <label key={type.value} className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="notificationTypes"
                                    value={type.value}
                                    checked={preferences.notificationTypes.includes(type.value)}
                                    onChange={handleChange}
                                    className="form-checkbox"
                                />
                                <span className="ml-2">{type.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Boutons */}
                <div className="flex space-x-4">
                    <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Enregistrer
                    </button>
                    <button
                        type="button"
                        onClick={handleTest}
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                        Tester les notifications
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NotificationSettings; 