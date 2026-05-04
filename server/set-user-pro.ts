import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function setUserPro() {
  try {
    // Récupérer tous les utilisateurs
    const allUsers = await db.select().from(users);
    
    console.log("\n📋 Utilisateurs actuels:");
    allUsers.forEach(user => {
      console.log(`  ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Tier: ${user.subscriptionTier || 'null'}`);
    });
    
    if (allUsers.length === 0) {
      console.log("\n❌ Aucun utilisateur trouvé");
      process.exit(0);
    }
    
    // Prendre le dernier utilisateur créé
    const lastUser = allUsers[allUsers.length - 1];
    
    console.log(`\n🔄 Mise à jour de l'utilisateur ${lastUser.username} (ID: ${lastUser.id}) vers le plan Pro...`);
    
    // Mettre à jour vers Pro
    await db
      .update(users)
      .set({ 
        subscriptionTier: 'pro',
        subscriptionStatus: 'active'
      })
      .where(eq(users.id, lastUser.id));
    
    console.log(`✅ Utilisateur ${lastUser.username} mis à jour vers le plan Pro!`);
    
    // Vérifier la mise à jour
    const updatedUser = await db
      .select()
      .from(users)
      .where(eq(users.id, lastUser.id))
      .limit(1);
    
    if (updatedUser[0]) {
      console.log(`\n✓ Vérification: Tier = ${updatedUser[0].subscriptionTier}, Status = ${updatedUser[0].subscriptionStatus}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  }
}

setUserPro();
