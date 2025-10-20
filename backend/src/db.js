const mongoose = require('mongoose');

async function connectDB(uri) {
  mongoose.set('strictQuery', true); // quieter queries

  mongoose.connection.on('connected', () => console.log('🟢 MongoDB connected'));
  mongoose.connection.on('error', err => console.error('🔴 MongoDB error:', err));
  mongoose.connection.on('disconnected', () => console.log('🟡 MongoDB disconnected'));

  await mongoose.connect(uri, {
    autoIndex: true,          // turn off in prod if needed
    maxPoolSize: 10,          // tune if high throughput
    serverSelectionTimeoutMS: 10000,
  });
}

async function disconnectDB() {
  await mongoose.connection.close();
}

module.exports = { connectDB, disconnectDB };
