const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running' });
});

// OpenAI API proxy endpoint
app.post('/api/openai', async (req, res) => {
    try {
        const { messages, useVision, temperature, maxTokens } = req.body;

        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({ 
                error: 'OpenAI API key not configured on server' 
            });
        }

        const requestBody = {
            model: "gpt-4o",
            messages: messages,
            max_tokens: maxTokens || (useVision ? 300 : 150),
            temperature: temperature || 1.2
        };

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('OpenAI API Error:', error);
            return res.status(response.status).json({ 
                error: 'OpenAI API request failed',
                details: error 
            });
        }

        const data = await response.json();
        res.json({ 
            content: data.choices[0].message.content.trim() 
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
    console.log(`OpenAI API Key configured: ${process.env.OPENAI_API_KEY ? 'Yes' : 'No'}`);
});
