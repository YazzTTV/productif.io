const express = require('express');
const next = require('next');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: path.join(__dirname, '..') });
const handle = app.getRequestHandler();

// URL du serveur principal de développement
const API_URL = process.env.API_URL || 'http://localhost:3001';

app.prepare().then(() => {
    const server = express();
    
    // Autoriser CORS pour les requêtes de l'app mobile
    server.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }
        next();
    });

    // Proxy pour toutes les routes API vers le serveur principal
    server.use('/api', createProxyMiddleware({
        target: API_URL,
        changeOrigin: true,
        pathRewrite: {
            '^/api': '/api', // garde le préfixe /api
        },
        onError: (err, req, res) => {
            console.error('Proxy Error:', err);
            res.status(500).json({
                error: 'Erreur de connexion au serveur principal',
                details: err.message
            });
        }
    }));
    
    // Servir les fichiers statiques
    server.use(express.static(path.join(__dirname, '..', 'public')));
    
    // Toutes les autres routes -> app
    server.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
    });
    
    const port = process.env.PORT || 3000;
    server.listen(port, '0.0.0.0', () => {
        console.log(`> Ready on http://localhost:${port}`);
        console.log(`> Proxying API requests to ${API_URL}`);
    });
}); 