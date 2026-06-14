/**
 * Simple Express server for handling shared flight routing
 * This can be used to serve the app with proper routing support
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../dist')));

// Handle shared flight routes
app.get('/s/:slug', (req, res) => {
  // Serve the main index.html file for shared flight URLs
  // The React app will handle the routing client-side
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Handle all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Shared flight URLs: http://localhost:${PORT}/s/{slug}`);
});

module.exports = app;
