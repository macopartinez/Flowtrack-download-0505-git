import { db } from "../server/db";
import { users } from "../server/db/schema";
import { eq } from "drizzle-orm";

async function setUserPro(email: string) {
  try {
    console.log(`🔍 Looking for user: ${email}`);
    
    const user = await db.query.users.findFirst({
      where: eq(users.email, email)
    });
    
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }
    
    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);
    console.log(`📊 Current tier: ${user.subscriptionTier}`);
    
    // Update to Pro plan
    await db.update(users)
      .set({
        subscriptionTier: 'pro',
        subscriptionStatus: 'active',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days trial
      })
      .where(eq(users.id, user.id));
    
    console.log(`✅ User upgraded to Pro plan with 14-day trial!`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🎯 Tier: pro`);
    console.log(`⏰ Trial ends: ${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: tsx scripts/set-user-pro.ts user@example.com');
  process.exit(1);
}

setUserPro(email);
