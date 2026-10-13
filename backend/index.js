const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
const dotenv = require('dotenv');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');

const Hospital = require('./models/Hospital');
const Referral = require('./models/Referral');
const User = require('./models/User');
const Patient = require('./models/Patient');

// Load .env from backend/ or root directory
dotenv.config({ path: path.resolve(__dirname, '.env') });
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

const app = express();
const PORT = process.env.PORT || 5000;

// High performance middleware
app.use(compression());
app.use(cors());
app.use(express.json());

// Health check routes
app.get('/', (req, res) => {
  res.json({ status: 'healthy', message: 'Hospital Network API is running' });
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/hospitals', require('./routes/hospitals'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/users', require('./routes/users'));
app.use('/api/patients', require('./routes/patients'));

// Initialize MongoDB connection and seed data
const startServer = async () => {
  try {
    let uri = process.env.MONGODB_URI;
    
    if (!uri) {
      console.log('No MONGODB_URI found. Initializing Memory Server...');
      const mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
    }
    
    await mongoose.connect(uri, {
      maxPoolSize: 20,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('Connected to MongoDB Successfully');
    
    // Fast check for Super Admin using exists instead of full count
    const adminExists = await User.exists({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        name: 'GovHealth Super Admin',
        email: 'admin@gov.in',
        password: 'admin',
        role: 'admin',
        department: 'Administration',
        notifications: { inApp: true, sms: false, email: true }
      });
      console.log('Super Admin seeded successfully');
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
  }
};

startServer();
