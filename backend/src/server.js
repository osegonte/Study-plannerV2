const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001; // Changed from 5000 to 3001

// Middleware
app.use(cors());
app.use(express.json());

// Basic route
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'PDF Study Planner API is running', 
    stage: 'Stage 1',
    port: PORT
  });
});

// Routes will be added in future stages
// app.use('/api/pdfs', require('./routes/pdfRoutes'));
// app.use('/api/time-tracking', require('./routes/timeRoutes'));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 PDF Study Planner - Stage 1`);
  console.log(`🌐 API Health Check: http://localhost:${PORT}/api/health`);
});
