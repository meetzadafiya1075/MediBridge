require('dotenv').config();
const mongoose = require('mongoose');
const Hospital = require('./models/Hospital');
const User = require('./models/User');

const clearDb = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB Atlas');
        await Hospital.deleteMany({});
        await User.deleteMany({ role: { $ne: 'admin' } }); // Keep super admin
        console.log('Cleared all hospitals and non-admin users');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

clearDb();
