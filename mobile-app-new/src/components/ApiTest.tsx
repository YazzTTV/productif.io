import React, { useState } from 'react';
import { CapacitorHttp } from '@capacitor/core';

export const ApiTest: React.FC = () => {
  const [status, setStatus] = useState<string>('En attente du test...');
  const [error, setError] = useState<string | null>(null);

  const testApi = async () => {
    setStatus('Test en cours...');
    setError(null);

    try {
      // Test avec Capacitor HTTP
      const response = await CapacitorHttp.get({
        url: 'https://www.productif.io/api/test-users',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200) {
        setStatus(`API accessible ! Réponse : ${JSON.stringify(response.data)}`);
      } else {
        setStatus(`Erreur ${response.status}`);
        setError(response.data?.message || 'Erreur inconnue');
      }
    } catch (err) {
      setStatus('Erreur de connexion');
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      console.error('Détails de l\'erreur:', err);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Test de l'API Productif.io</h2>
      
      <button 
        onClick={testApi}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007AFF',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          marginBottom: '20px'
        }}
      >
        Tester la connexion API
      </button>

      <div style={{ marginBottom: '10px' }}>
        <strong>Statut:</strong> {status}
      </div>

      {error && (
        <div style={{ color: 'red' }}>
          <strong>Erreur:</strong> {error}
        </div>
      )}
    </div>
  );
}; 