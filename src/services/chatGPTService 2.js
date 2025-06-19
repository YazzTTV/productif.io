const OpenAI = require('openai');

class ChatGPTService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    async generateResponse(message, context = []) {
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
            console.error('Error generating ChatGPT response:', error.message);
            throw error;
        }
    }

    async analyzeMessage(message) {
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

module.exports = new ChatGPTService(); 