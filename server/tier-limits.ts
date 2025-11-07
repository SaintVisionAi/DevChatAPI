// Production-ready tier enforcement system
import { db } from "@db";
import { users } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

// Subscription tiers with limits
export const TIER_LIMITS = {
  free: {
    name: 'Free',
    messageLimit: 100,
    price: 0,
    features: ['Basic chat', 'Limited AI models'],
  },
  starter: {
    name: 'Starter',
    messageLimit: 1000,
    price: 27,
    features: ['All AI modes', 'Web search', 'Voice', '1000 messages/month'],
  },
  pro: {
    name: 'Pro',
    messageLimit: 10000,
    price: 97,
    features: ['Priority support', 'Advanced features', 'Image generation', '10,000 messages/month'],
  },
  enterprise: {
    name: 'Enterprise',
    messageLimit: -1, // Unlimited
    price: 297,
    features: ['Unlimited messages', 'Custom integrations', 'Dedicated support', 'White-label'],
  },
} as const;

export type TierName = keyof typeof TIER_LIMITS;

// Check if user has reached their message limit
export async function checkMessageLimit(userId: string): Promise<{ allowed: boolean; remaining: number; tier: string; limit: number }> {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  if (!user || user.length === 0) {
    throw new Error('User not found');
  }

  const userData = user[0];
  const tier = (userData.subscriptionTier || 'free') as TierName;
  const tierLimit = TIER_LIMITS[tier].messageLimit;
  const currentCount = userData.messageCount || 0;

  // Check if monthly reset is needed (30 days)
  const lastReset = userData.lastResetAt || new Date();
  const daysSinceReset = Math.floor((Date.now() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceReset >= 30) {
    // Reset the message count
    await db.update(users)
      .set({ 
        messageCount: 0, 
        lastResetAt: new Date() 
      })
      .where(eq(users.id, userId));
    
    return {
      allowed: true,
      remaining: tierLimit === -1 ? -1 : tierLimit,
      tier,
      limit: tierLimit,
    };
  }

  // Enterprise has unlimited messages
  if (tierLimit === -1) {
    return {
      allowed: true,
      remaining: -1,
      tier,
      limit: -1,
    };
  }

  // Check if limit reached
  const allowed = currentCount < tierLimit;
  const remaining = Math.max(0, tierLimit - currentCount);

  return {
    allowed,
    remaining,
    tier,
    limit: tierLimit,
  };
}

// Increment message count
export async function incrementMessageCount(userId: string): Promise<void> {
  await db.update(users)
    .set({ 
      messageCount: sql`${users.messageCount} + 1` 
    })
    .where(eq(users.id, userId));
}

// Update user tier based on Stripe subscription
export async function updateUserTier(userId: string, tier: TierName): Promise<void> {
  const tierLimit = TIER_LIMITS[tier].messageLimit;
  
  await db.update(users)
    .set({ 
      subscriptionTier: tier,
      messageLimit: tierLimit,
      messageCount: 0, // Reset on tier change
      lastResetAt: new Date(),
    })
    .where(eq(users.id, userId));
}

// Get user's current usage stats
export async function getUserUsageStats(userId: string) {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  if (!user || user.length === 0) {
    throw new Error('User not found');
  }

  const userData = user[0];
  const tier = (userData.subscriptionTier || 'free') as TierName;
  const tierData = TIER_LIMITS[tier];
  
  return {
    tier,
    tierName: tierData.name,
    messageCount: userData.messageCount || 0,
    messageLimit: userData.messageLimit || 100,
    remaining: tierData.messageLimit === -1 ? -1 : Math.max(0, (userData.messageLimit || 100) - (userData.messageCount || 0)),
    percentUsed: tierData.messageLimit === -1 ? 0 : Math.min(100, Math.round(((userData.messageCount || 0) / (userData.messageLimit || 100)) * 100)),
    lastResetAt: userData.lastResetAt,
    features: tierData.features,
  };
}
