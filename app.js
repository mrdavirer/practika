
const express = require('express');
const fs = require('fs');
const https = require('https');
const app = express();

const content = fs.readFileSync('data.json', 'utf8');
const keywordsToUrls = JSON.parse(content);

app.use(express.static('public'));

app.get('/search/:keyword', (req, res) => {
    const keyword = req.params.keyword;
    const urls = keywordsToUrls[keyword];
    if (urls) {
        res.json(urls);
    } else {
        res.status(404).send('Ключевое слово не найдено');
    }
});

app.get('/download/:url', (req, res) => {
    const url = decodeURIComponent(req.params.url);
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    https.get(url, (response) => {
        if (response.statusCode !== 200) {
            res.status(response.statusCode).send(response.statusMessage);
            return;
        }

        const contentLength = parseInt(response.headers['content-length'], 10);
        let bytesReceived = 0;
        let content = '';

        response.on('data', (chunk) => {
            bytesReceived += chunk.length;
            content += chunk.toString('utf8');
            const progress = ((bytesReceived / contentLength) * 100).toFixed(2);
            res.write(`data: ${JSON.stringify({ progress })}\n\n`);
        });

        response.on('end', () => {
            res.write(`data: ${JSON.stringify({ progress: 100, content })}\n\n`);
            res.end();
        });

        response.on('error', (error) => {
            res.status(500).send(error.message);
        });
    }).on('error', (error) => {
        res.status(500).send(error.message);
    });
});

app.listen(3000, () => {
    console.log(`Сервер запущен http://localhost:3000`);
});
