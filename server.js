const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from 'public', but DO NOT automatically
// serve index.html for a '/' request.
app.use(express.static('public', { index: false }));
const htmlPath = path.join(__dirname, 'public', 'index.html');

app.get('/', (req, res) => {
    fs.readFile(htmlPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading index.html:', err);
            return res.status(500).send('Error loading application.');
        }

        const user = process.env.LASTFM_USER || '%%LASTFM_USER%%';
        const apiKey = process.env.LASTFM_API_KEY || '%%LASTFM_API_KEY%%';

        if (!apiKey || apiKey.startsWith('%%')) {
            console.error("Configuration Error: LASTFM_API_KEY environment variable is not set.");
            return res.status(500).send('Configuration Error: API Key not set on server.');
        }
        if (!user || user.startsWith('%%')) {
            console.error("Configuration Error: LASTFM_USER environment variable is not set.");
            return res.status(500).send('Configuration Error: User not set on server.');
        }

        // Replace placeholders in the HTML
        let html = data.replace(/%%LASTFM_USER%%/g, user);
        html = html.replace(/%%LASTFM_API_KEY%%/g, apiKey);

        // Send the modified HTML
        res.send(html);
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Last.fm app listening on http://localhost:${port}`);
    console.log(`Serving data for user: ${process.env.LASTFM_USER || '(default)'}`);
});