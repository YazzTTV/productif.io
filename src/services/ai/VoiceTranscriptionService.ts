import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

export interface TranscriptionResult {
    text: string;
    success: boolean;
    error?: string;
}

export class VoiceTranscriptionService {
    private openai: OpenAI;

    constructor() {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is required for voice transcription');
        }
        
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    /**
     * Télécharge un fichier audio depuis WhatsApp
     */
    async downloadAudioFile(audioId: string, accessToken: string): Promise<string | null> {
        try {
            console.log('📥 Téléchargement du fichier audio:', audioId);

            // 1. Récupérer l'URL du fichier audio
            const mediaUrlResponse = await fetch(
                `https://graph.facebook.com/v17.0/${audioId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            if (!mediaUrlResponse.ok) {
                throw new Error(`Erreur lors de la récupération de l'URL du média: ${mediaUrlResponse.status}`);
            }

            const mediaData = await mediaUrlResponse.json();
            const audioUrl = mediaData.url;

            console.log('🔗 URL du fichier audio récupérée:', audioUrl);

            // 2. Télécharger le fichier audio
            const audioResponse = await fetch(audioUrl, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!audioResponse.ok) {
                throw new Error(`Erreur lors du téléchargement du fichier audio: ${audioResponse.status}`);
            }

            // 3. Sauvegarder le fichier temporairement
            const buffer = await audioResponse.arrayBuffer();
            const tempDir = path.join(process.cwd(), 'temp');
            
            // Créer le dossier temp s'il n'existe pas
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const tempFilePath = path.join(tempDir, `audio_${audioId}_${Date.now()}.ogg`);
            fs.writeFileSync(tempFilePath, new Uint8Array(buffer));

            console.log('💾 Fichier audio sauvegardé:', tempFilePath);
            return tempFilePath;

        } catch (error) {
            console.error('❌ Erreur lors du téléchargement du fichier audio:', error);
            return null;
        }
    }

    /**
     * Transcrit un fichier audio en texte avec OpenAI Whisper
     */
    async transcribeAudio(audioFilePath: string): Promise<TranscriptionResult> {
        try {
            console.log('🎵➡️📝 Transcription du fichier audio:', audioFilePath);

            // Vérifier que le fichier existe
            if (!fs.existsSync(audioFilePath)) {
                return {
                    text: '',
                    success: false,
                    error: 'Le fichier audio n\'existe pas'
                };
            }

            // Créer un stream du fichier
            const audioStream = fs.createReadStream(audioFilePath);

            // Transcrire avec OpenAI Whisper
            const transcription = await this.openai.audio.transcriptions.create({
                file: audioStream,
                model: 'whisper-1',
                language: 'fr', // Français par défaut
                response_format: 'text'
            });

            console.log('✅ Transcription réussie:', transcription);

            // Nettoyer le fichier temporaire
            this.cleanupTempFile(audioFilePath);

            return {
                text: transcription.toString().trim(),
                success: true
            };

        } catch (error) {
            console.error('❌ Erreur lors de la transcription:', error);
            
            // Nettoyer le fichier temporaire même en cas d'erreur
            this.cleanupTempFile(audioFilePath);

            return {
                text: '',
                success: false,
                error: error instanceof Error ? error.message : 'Erreur inconnue'
            };
        }
    }

    /**
     * Traite un message vocal complet (téléchargement + transcription)
     */
    async processVoiceMessage(audioId: string, accessToken: string): Promise<TranscriptionResult> {
        try {
            console.log('🎙️ Traitement du message vocal:', audioId);

            // 1. Télécharger le fichier audio
            const audioFilePath = await this.downloadAudioFile(audioId, accessToken);
            
            if (!audioFilePath) {
                return {
                    text: '',
                    success: false,
                    error: 'Échec du téléchargement du fichier audio'
                };
            }

            // 2. Transcrire le fichier
            const transcriptionResult = await this.transcribeAudio(audioFilePath);

            return transcriptionResult;

        } catch (error) {
            console.error('❌ Erreur lors du traitement du message vocal:', error);
            return {
                text: '',
                success: false,
                error: error instanceof Error ? error.message : 'Erreur inconnue'
            };
        }
    }

    /**
     * Nettoie un fichier temporaire
     */
    private cleanupTempFile(filePath: string): void {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log('🗑️ Fichier temporaire supprimé:', filePath);
            }
        } catch (error) {
            console.error('⚠️ Erreur lors de la suppression du fichier temporaire:', error);
        }
    }

    /**
     * Nettoie tous les fichiers temporaires anciens (plus de 1 heure)
     */
    async cleanupOldTempFiles(): Promise<void> {
        try {
            const tempDir = path.join(process.cwd(), 'temp');
            
            if (!fs.existsSync(tempDir)) {
                return;
            }

            const files = fs.readdirSync(tempDir);
            const oneHourAgo = Date.now() - (60 * 60 * 1000); // 1 heure en millisecondes

            for (const file of files) {
                const filePath = path.join(tempDir, file);
                const stats = fs.statSync(filePath);
                
                if (stats.mtime.getTime() < oneHourAgo) {
                    fs.unlinkSync(filePath);
                    console.log('🗑️ Ancien fichier temporaire supprimé:', file);
                }
            }
        } catch (error) {
            console.error('⚠️ Erreur lors du nettoyage des fichiers temporaires:', error);
        }
    }
} 