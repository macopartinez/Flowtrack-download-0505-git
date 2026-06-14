import { db } from '../server/db';
import { Client, FollowerList, UnfollowList, Snapshot } from '../server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

async function checkFollowerStats() {
  try {
    console.log('🔍 Vérification des stats de followers...\n');

    // Récupérer tous les clients
    const clients = await db.select({
      id: Client.id,
      instagramUsername: Client.instagramUsername,
    }).from(Client);

    console.log(`📊 ${clients.length} client(s) trouvé(s)\n`);

    for (const client of clients) {
      console.log(`\n👤 Client: @${client.instagramUsername} (ID: ${client.id})`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Compter les followers
      const followersResult = await db.select({ count: sql<number>`count(*)` })
        .from(FollowerList)
        .where(eq(FollowerList.clientId, client.id));
      const followersCount = Number(followersResult[0]?.count || 0);

      // Compter les unfollowers
      const unfollowersResult = await db.select({ count: sql<number>`count(*)` })
        .from(UnfollowList)
        .where(eq(UnfollowList.clientId, client.id));
      const unfollowersCount = Number(unfollowersResult[0]?.count || 0);

      // Compter les snapshots
      const snapshotsResult = await db.select({ count: sql<number>`count(*)` })
        .from(Snapshot)
        .where(eq(Snapshot.clientId, client.id));
      const snapshotsCount = Number(snapshotsResult[0]?.count || 0);

      console.log(`✅ Followers: ${followersCount}`);
      console.log(`❌ Unfollowers: ${unfollowersCount}`);
      console.log(`📸 Snapshots: ${snapshotsCount}`);

      // Derniers followers ajoutés
      const recentFollowers = await db.select({
        followerUsername: FollowerList.followerUsername,
        detectedAt: FollowerList.detectedAt,
      })
        .from(FollowerList)
        .where(eq(FollowerList.clientId, client.id))
        .orderBy(desc(FollowerList.detectedAt))
        .limit(5);

      if (recentFollowers.length > 0) {
        console.log('\n🆕 Derniers followers:');
        recentFollowers.forEach((f, i) => {
          console.log(`  ${i + 1}. @${f.followerUsername} - ${new Date(f.detectedAt).toLocaleString()}`);
        });
      }

      // Derniers snapshots
      const recentSnapshots = await db.select({
        followersCount: Snapshot.followersCount,
        createdAt: Snapshot.createdAt,
      })
        .from(Snapshot)
        .where(eq(Snapshot.clientId, client.id))
        .orderBy(desc(Snapshot.createdAt))
        .limit(5);

      if (recentSnapshots.length > 0) {
        console.log('\n📸 Derniers snapshots:');
        recentSnapshots.forEach((s, i) => {
          console.log(`  ${i + 1}. ${s.followersCount} followers - ${new Date(s.createdAt).toLocaleString()}`);
        });
      }
    }

    console.log('\n✅ Vérification terminée');
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

checkFollowerStats();
