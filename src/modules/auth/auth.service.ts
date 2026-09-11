import { redis } from "../../config/redis";
import { Role } from "../../models/Role";
import { User } from "../../models/User";
import logger from "../../config/logger";

/** Returns true only if the Redis connection is in a usable state. */
function isRedisReady(): boolean {
  return redis.status === "ready";
}

export async function getCachedPermissionsForRoles(roleSlugs: string[]) {
  if (!roleSlugs.length) return [];

  const cacheKeys = roleSlugs.map(slug => `permissions:role:${slug}`);
  const permissions: { module: string; action: string }[] = [];
  const missingSlugs: string[] = [...roleSlugs]; // default: all are misses

  // 1. Try Redis multi-get — skip entirely if Redis is down
  if (isRedisReady()) {
    try {
      const cachedResults = await redis.mget(...cacheKeys);
      missingSlugs.length = 0; // reset — repopulate below

      for (let i = 0; i < roleSlugs.length; i++) {
        const slug = roleSlugs[i];
        const cached = cachedResults[i];
        if (cached) {
          try {
            permissions.push(...JSON.parse(cached));
          } catch {
            missingSlugs.push(slug);
          }
        } else {
          missingSlugs.push(slug);
        }
      }
    } catch (err) {
      logger.warn("Redis mget failed — falling back to DB:", (err as Error).message);
      // missingSlugs already has all slugs; fall through to DB
    }
  }

  // 2. Fetch cache misses (or all, when Redis is down) from DB
  if (missingSlugs.length > 0) {
    const roles = await Role.find({ slug: { $in: missingSlugs } });
    for (const role of roles) {
      if (role.permissions) {
        const rolePerms = role.permissions.map((p: { module: string; action: string }) => ({
          module: p.module,
          action: p.action,
        }));
        permissions.push(...rolePerms);

        // Write-through cache only when Redis is up
        if (isRedisReady()) {
          try {
            await redis.set(`permissions:role:${role.slug}`, JSON.stringify(rolePerms), "EX", 86400);
          } catch (err) {
            logger.warn("Redis set failed (non-fatal):", (err as Error).message);
          }
        }
      }
    }
  }

  // 3. Deduplicate
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

  // Try Redis only when available
  if (isRedisReady()) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        try { return JSON.parse(cached); } catch { /* corrupt — fall through */ }
      }
    } catch (err) {
      logger.warn("Redis get failed — falling back to DB:", (err as Error).message);
    }
  }

  // DB fallback
  const user = await User.findById(userId).select("-password -refreshToken").lean();
  if (user && isRedisReady()) {
    try {
      await redis.set(cacheKey, JSON.stringify(user), "EX", 900);
    } catch (err) {
      logger.warn("Redis set failed (non-fatal):", (err as Error).message);
    }
  }
  return user;
}
