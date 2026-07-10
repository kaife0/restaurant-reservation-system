require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Table = require('./models/Table');
const User = require('./models/User');

const TABLES = [
  { number: 1, capacity: 2 },
  { number: 2, capacity: 2 },
  { number: 3, capacity: 4 },
  { number: 4, capacity: 4 },
  { number: 5, capacity: 6 },
  { number: 6, capacity: 8 },
];

const run = async () => {
  await connectDB();

  await Table.deleteMany({});
  await Table.insertMany(TABLES);
  console.log(`Seeded ${TABLES.length} tables`);

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@restaurant.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await User.create({
      name: 'Restaurant Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    });
    console.log(`Seeded admin user -> email: ${adminEmail} / password: ${adminPassword}`);
  } else {
    console.log('Admin user already exists, skipping');
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
