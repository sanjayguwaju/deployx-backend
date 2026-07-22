import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

import { redis } from './src/config/redis';

async function fix() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/palikaos");
  const db = mongoose.connection.db;
  if (!db) {
    console.error("DB connection failed");
    process.exit(1);
  }
  
  await redis.flushall();
  console.log("Redis cache cleared.");
  
  const roles = await db.collection("roles").find({}).toArray();
  for (const role of roles) {
    if (role.slug === "platform_admin" || role.slug === "agency_admin" || (role.permissions && role.permissions.some((p: any) => p.subject === "all"))) {
      const fixedPerms = [{ module: "all", action: "manage" }];
      await db.collection("roles").updateOne(
        { _id: role._id },
        { $set: { permissions: fixedPerms } }
      );
      console.log(`Fixed role ${role.slug}`);
    }
  }
  process.exit(0);
}
fix();
