const express = require('express');
const path = require('path');

const payHandler = require('./api/pay');
const statusHandler = require('./api/status');
const webhookHandler = require('./api/webhook');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.post('/api/pay', payHandler);
app.get('/api/status', statusHandler);
app.post('/api/webhook', webhookHandler);

// Static files with index.html support for directories and .html extension resolution
app.use(express.static(__dirname, {
  extensions: ['html'],
  index: 'index.html',
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 KTS Website is live at http://localhost:${PORT}\n`);
});
