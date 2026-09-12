require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const readline = require('readline');
const os = require('os');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

rl.question('Enable network access for other devices? (y/n): ', (answer) => {
  const enableNetwork = answer.toLowerCase() === 'y';
  const host = enableNetwork ? '0.0.0.0' : 'localhost';

  app.listen(PORT, host, () => {
    console.log('');
    console.log('================================');
    console.log('  GameStop Online');
    console.log('================================');
    console.log('');
    console.log('Local:    http://localhost:' + PORT);
    if (enableNetwork) {
      console.log('Network:  http://' + getLocalIP() + ':' + PORT);
      console.log('');
      console.log('Other devices can access this on your network.');
    }
    console.log('');
    console.log('Press Ctrl+C to stop.');
    console.log('');
  });

  rl.close();
});
