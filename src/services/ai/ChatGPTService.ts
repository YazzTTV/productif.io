import OpenAI from 'openai';

export class ChatGPTService {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    async generateResponse(message: string, context: any[] = []) {
        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    ...context,
                    { role: "user", content: message }
                ],
                temperature: 0.7,
                max_tokens: 150
            });

            return completion.choices[0].message.content;
        } catch (error) {
            console.error('Error generating ChatGPT response:', error);
            throw error;
        }
    }

    async analyzeMessage(message: string) {
        try {
            const response = await this.generateResponse(message);
            return {
                originalMessage: message,
                analysis: response,
                timestamp: new Date()
            };
        } catch (error) {
            console.error('Error analyzing message:', error);
            throw error;
        }
    }
} 