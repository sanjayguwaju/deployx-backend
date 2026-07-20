import { redis } from "../../config/redis";
import { Role } from "../../models/Role";
import { User } from "../../models/User";

export async function getCachedPermissionsForRoles(roleSlugs: string[]) {
  if (!roleSlugs.length) return [];

  const cacheKeys = roleSlugs.map(slug => `permissions:role:${slug}`);
  // 1. Redis Multi-Get (mget) optimization
  const cachedResults = await redis.mget(...cacheKeys);

  const permissions: { module: string; action: string }[] = [];
  const missingSlugs: string[] = [];

  for (let i = 0; i < roleSlugs.length; i++) {
    const slug = roleSlugs[i];
    const cached = cachedResults[i];

    if (cached) {
      try {
        permissions.push(...JSON.parse(cached));
      } catch (err) {
        missingSlugs.push(slug);
      }
    } else {
      missingSlugs.push(slug);
    }
  }

  // Fetch cache misses from DB
  if (missingSlugs.length > 0) {
    const roles = await Role.find({ slug: { $in: missingSlugs } });
    for (const role of roles) {
      if (role.permissions) {
        const rolePerms = role.permissions.map((p: any) => ({
          module: p.module,
          action: p.action
        }));
        
        permissions.push(...rolePerms);
        
        // Store in Redis with 24 hour TTL (86400 seconds)
        await redis.set(`permissions:role:${role.slug}`, JSON.stringify(rolePerms), 'EX', 86400);
      }
    }
  }

  // 2. Payload Deduplication
  const uniquePermissions = Array.from(
    new Set(permissions.map(p => `${p.module}:${p.action}`))
  ).map(str => {
    const [module, action] = str.split(":");
    return { module, action };
  });

  return uniquePermissions;
}

export async function getCachedUserSession(userId: string) {
  const cacheKey = `session:user:${userId}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (err) {
      // fallback to DB on parse error
    }
  }

  // 3. User Caching for 0-DB Middleware
  const user = await User.findById(userId).select("-password -refreshToken").lean();
  if (user) {
    // Cache for 15 minutes to match JWT standard expiry, reducing DB load
    await redis.set(cacheKey, JSON.stringify(user), 'EX', 900);
  }
  return user;
}
