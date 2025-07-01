"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface NotificationPreferences {
    isEnabled: boolean;
    emailEnabled: boolean;
    pushEnabled: boolean;
    whatsappEnabled: boolean;
    whatsappNumber?: string;
    startHour: number;
    endHour: number;
    allowedDays: number[];
    notificationTypes: string[];
    morningReminder: boolean;
    taskReminder: boolean;
    habitReminder: boolean;
    motivation: boolean;
    dailySummary: boolean;
    morningTime: string;
    noonTime: string;
    afternoonTime: string;
    eveningTime: string;
    nightTime: string;
}

const defaultPreferences: NotificationPreferences = {
    isEnabled: true,
    emailEnabled: true,
    pushEnabled: true,
    whatsappEnabled: false,
    whatsappNumber: '',
    startHour: 9,
    endHour: 18,
    allowedDays: [1, 2, 3, 4, 5],
    notificationTypes: ['TASK_DUE', 'HABIT_REMINDER', 'DAILY_SUMMARY'],
    morningReminder: true,
    taskReminder: true,
    habitReminder: true,
    motivation: true,
    dailySummary: true,
    morningTime: '08:00',
    noonTime: '12:00',
    afternoonTime: '14:00',
    eveningTime: '18:00',
    nightTime: '22:00'
};

interface NotificationSettingsProps {
    userId: string;
    preferences?: NotificationPreferences;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ userId, preferences: initialPreferences }) => {
    const router = useRouter();
    const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
        const mergedPreferences = {
            ...defaultPreferences,  // D'abord les valeurs par défaut
            ...(initialPreferences || {}),  // Ensuite les préférences initiales pour écraser les valeurs par défaut
        };
        
        // S'assurer que les tableaux sont correctement initialisés
        return {
            ...mergedPreferences,
            allowedDays: Array.isArray(initialPreferences?.allowedDays) 
                ? initialPreferences.allowedDays 
                : defaultPreferences.allowedDays,
            notificationTypes: Array.isArray(initialPreferences?.notificationTypes)
                ? initialPreferences.notificationTypes
                : defaultPreferences.notificationTypes
        };
    });
    const [loading, setLoading] = useState(!initialPreferences);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (initialPreferences) {
            setPreferences({
                ...defaultPreferences,  // D'abord les valeurs par défaut
                ...(initialPreferences || {}),  // Ensuite les préférences initiales pour écraser les valeurs par défaut
                allowedDays: Array.isArray(initialPreferences.allowedDays)
                    ? initialPreferences.allowedDays
                    : defaultPreferences.allowedDays,
                notificationTypes: Array.isArray(initialPreferences.notificationTypes)
                    ? initialPreferences.notificationTypes
                    : defaultPreferences.notificationTypes
            });
        } else {
            loadPreferences();
        }
    }, [userId, initialPreferences]);

    const loadPreferences = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/notifications/preferences?userId=${userId}`, {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Erreur lors du chargement des préférences');
            }

            const data = await response.json();
            if (data && Object.keys(data).length > 0) {
                setPreferences({
                    ...defaultPreferences,  // D'abord les valeurs par défaut
                    ...data,  // Ensuite les données de la base pour écraser les valeurs par défaut
                    allowedDays: Array.isArray(data.allowedDays)
                        ? data.allowedDays
                        : defaultPreferences.allowedDays,
                    notificationTypes: Array.isArray(data.notificationTypes)
                        ? data.notificationTypes
                        : defaultPreferences.notificationTypes
                });
            }
        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Erreur lors du chargement des préférences');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (name === 'allowedDays') {
            const checked = (e.target as HTMLInputElement).checked;
            const day = parseInt(value);
            setPreferences(prev => ({
                ...prev,
                allowedDays: checked
                    ? [...(prev.allowedDays || []), day].sort((a, b) => a - b)
                    : (prev.allowedDays || []).filter(d => d !== day)
            }));
        } else if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setPreferences(prev => ({
                ...prev,
                [name]: checked
            }));
        } else if (name === 'notificationTypes') {
            setPreferences(prev => {
                const currentTypes = Array.isArray(prev.notificationTypes) ? prev.notificationTypes : [];
                return {
                    ...prev,
                    notificationTypes: currentTypes.includes(value)
                        ? currentTypes.filter(t => t !== value)
                        : [...currentTypes, value]
                };
            });
        } else if (name === 'startHour' || name === 'endHour') {
            setPreferences(prev => ({
                ...prev,
                [name]: parseInt(value)
            }));
        } else if (name.endsWith('Time')) {
            // Gérer spécifiquement les champs d'heure (morningTime, noonTime, etc.)
            setPreferences(prev => ({
                ...prev,
                [name]: value
            }));
        } else {
            setPreferences(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Vérifier que les tableaux sont bien initialisés avant l'envoi
            const dataToSend = {
                ...preferences,
                allowedDays: Array.isArray(preferences.allowedDays)
                    ? preferences.allowedDays
                    : defaultPreferences.allowedDays,
                notificationTypes: Array.isArray(preferences.notificationTypes)
                    ? preferences.notificationTypes
                    : defaultPreferences.notificationTypes
            };

            // Sauvegarder dans PostgreSQL
            const response = await fetch('/api/notifications/preferences', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    userId,
                    ...dataToSend
                }),
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la sauvegarde');
            }

            toast.success('Préférences enregistrées !');
            router.refresh();
        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        try {
            const response = await fetch('/api/notifications/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ userId }),
            });

            if (!response.ok) {
                throw new Error('Erreur lors de l\'envoi du test');
            }

            toast.success('Notification de test envoyée !');
        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Erreur lors de l\'envoi du test');
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>;
    }

    const daysOfWeek = [
        { value: 1, label: 'Lundi' },
        { value: 2, label: 'Mardi' },
        { value: 3, label: 'Mercredi' },
        { value: 4, label: 'Jeudi' },
        { value: 5, label: 'Vendredi' },
        { value: 6, label: 'Samedi' },
        { value: 7, label: 'Dimanche' }
    ];

    const notificationTypeLabels: Record<string, string> = {
        'TASK_DUE': 'Tâches à échéance',
        'HABIT_REMINDER': 'Rappel des habitudes',
        'DAILY_SUMMARY': 'Résumé quotidien'
    };

    // S'assurer que les tableaux sont bien initialisés avant le rendu
    const allowedDays = Array.isArray(preferences.allowedDays) 
        ? preferences.allowedDays 
        : defaultPreferences.allowedDays;
    
    const notificationTypes = Array.isArray(preferences.notificationTypes)
        ? preferences.notificationTypes
        : defaultPreferences.notificationTypes;

    return (
        <div className="max-w-2xl mx-auto p-4">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Activation générale */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Activation des notifications</h3>
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            name="isEnabled"
                            checked={preferences.isEnabled}
                            onChange={handleChange}
                            className="form-checkbox h-5 w-5 text-blue-600"
                        />
                        <span>Activer les notifications</span>
                    </label>
                </div>

                {/* Configuration WhatsApp */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">WhatsApp</h3>
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            name="whatsappEnabled"
                            checked={preferences.whatsappEnabled}
                            onChange={handleChange}
                            className="form-checkbox h-5 w-5 text-blue-600"
                        />
                        <span>Activer les notifications WhatsApp</span>
                    </label>
                    
                    {preferences.whatsappEnabled && (
                        <div className="ml-8">
                            <label className="block text-sm font-medium text-gray-700">
                                Numéro WhatsApp
                                <input
                                    type="tel"
                                    name="whatsappNumber"
                                    value={preferences.whatsappNumber || ''}
                                    onChange={handleChange}
                                    placeholder="+33612345678"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </label>
                        </div>
                    )}
                </div>

                {/* Plage horaire */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Plage horaire</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Heure de début
                                <select
                                    name="startHour"
                                    value={preferences.startHour}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <option key={i} value={i}>{i}:00</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Heure de fin
                                <select
                                    name="endHour"
                                    value={preferences.endHour}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <option key={i} value={i}>{i}:00</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Jours de la semaine */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Jours de notification</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {daysOfWeek.map(day => (
                            <label key={day.value} className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    name="allowedDays"
                                    value={day.value}
                                    checked={allowedDays.includes(day.value)}
                                    onChange={handleChange}
                                    className="form-checkbox h-5 w-5 text-blue-600"
                                />
                                <span>{day.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Types de notifications */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Types de notifications</h3>
                    <div className="space-y-2">
                        {Object.entries(notificationTypeLabels).map(([type, label]) => (
                            <label key={type} className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    name="notificationTypes"
                                    value={type}
                                    checked={notificationTypes.includes(type)}
                                    onChange={handleChange}
                                    className="form-checkbox h-5 w-5 text-blue-600"
                                />
                                <span>{label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Canaux de notification */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Canaux de notification</h3>
                    <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                name="emailEnabled"
                                checked={preferences.emailEnabled}
                                onChange={handleChange}
                                className="form-checkbox h-5 w-5 text-blue-600"
                            />
                            <span>Email</span>
                        </label>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                name="pushEnabled"
                                checked={preferences.pushEnabled}
                                onChange={handleChange}
                                className="form-checkbox h-5 w-5 text-blue-600"
                            />
                            <span>Notifications push</span>
                        </label>
                    </div>
                </div>

                {/* Types de rappels */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Types de rappels</h3>
                    <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                name="morningReminder"
                                checked={preferences.morningReminder}
                                onChange={handleChange}
                                className="form-checkbox h-5 w-5 text-blue-600"
                            />
                            <span>Rappel matinal</span>
                        </label>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                name="taskReminder"
                                checked={preferences.taskReminder}
                                onChange={handleChange}
                                className="form-checkbox h-5 w-5 text-blue-600"
                            />
                            <span>Rappel des tâches</span>
                        </label>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                name="habitReminder"
                                checked={preferences.habitReminder}
                                onChange={handleChange}
                                className="form-checkbox h-5 w-5 text-blue-600"
                            />
                            <span>Rappel des habitudes</span>
                        </label>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                name="motivation"
                                checked={preferences.motivation}
                                onChange={handleChange}
                                className="form-checkbox h-5 w-5 text-blue-600"
                            />
                            <span>Messages de motivation</span>
                        </label>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                name="dailySummary"
                                checked={preferences.dailySummary}
                                onChange={handleChange}
                                className="form-checkbox h-5 w-5 text-blue-600"
                            />
                            <span>Résumé quotidien</span>
                        </label>
                    </div>
                </div>

                {/* Horaires des notifications */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Horaires des notifications</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Rappel matinal
                            </label>
                            <input
                                type="time"
                                name="morningTime"
                                value={preferences.morningTime}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Vérification de midi
                            </label>
                            <input
                                type="time"
                                name="noonTime"
                                value={preferences.noonTime}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Rappel de l'après-midi
                            </label>
                            <input
                                type="time"
                                name="afternoonTime"
                                value={preferences.afternoonTime}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Planification du soir
                            </label>
                            <input
                                type="time"
                                name="eveningTime"
                                value={preferences.eveningTime}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Vérification de nuit
                            </label>
                            <input
                                type="time"
                                name="nightTime"
                                value={preferences.nightTime}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex space-x-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                    <button
                        type="button"
                        onClick={handleTest}
                        className="flex-1 bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                        Tester les notifications
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NotificationSettings; 