import mongoose from 'mongoose';
import { connectDatabase } from '../../config/database';
import { faker } from '@faker-js/faker';

// Default Tenant ID we will use for seeding everything
export const DEMO_TENANT_ID = 'demo';

/**
 * Initialize database connection and optionally clear collections
 */
export async function initSeeder(clearDB = false) {
  await connectDatabase();
  console.log('🌱 Connected to Database for seeding.');

  if (clearDB) {
    console.log('🧹 Clearing existing collections...');
    const collections = await mongoose.connection.db?.collections();
    if (collections) {
      for (let collection of collections) {
        await collection.deleteMany({});
      }
    }
    console.log('✅ Database cleared.');
  }
}

/**
 * Close database connection
 */
export async function closeSeeder() {
  await mongoose.disconnect();
  console.log('👋 Database connection closed.');
}

/**
 * Generate a random Nepali phone number
 */
export function generateNepaliPhone() {
  return `98${faker.string.numeric(8)}`;
}

/**
 * Pick a random item from an array
 */
export function randomArrayItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
