import Database from "better-sqlite3";
import bcrypt from "bcrypt";
import path from "path";

const dbPath = path.join(import.meta.dirname, "waler.db");
const db = new Database(dbPath);

const SALT_ROUNDS = 12;

async function createProUser() {
  // Renseignez ces valeurs via l'environnement (ne jamais committer un vrai mot de passe).
  const username = process.env.PRO_USER_USERNAME || "demo_user";
  const email = process.env.PRO_USER_EMAIL || "demo@example.com";
  const password = process.env.PRO_USER_PASSWORD;
  const platform = "instagram";

  if (!password) {
    console.error("❌ Définissez PRO_USER_PASSWORD (et PRO_USER_EMAIL/PRO_USER_USERNAME) dans l'environnement.");
    process.exit(1);
  }
  
  // Hash password with bcrypt
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  
  // Check if user exists
  const existingUser = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email);
  
  if (existingUser) {
    // Update existing user
    db.prepare(`
      UPDATE users 
      SET password_hash = ?,
          subscription_tier = 'pro',
          subscription_status = 'active'
      WHERE email = ?
    `).run(passwordHash, email);
    
    console.log(`\n✅ User updated successfully!`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👤 Username: ${username}`);
    console.log(`🎯 Tier: PRO`);
    console.log(`\n🚀 You can now login at: http://localhost:5000`);
  } else {
    // Insert new user with Pro subscription
    const result = db.prepare(`
      INSERT INTO users (
        username, 
        email, 
        password_hash, 
        platform, 
        subscription_tier,
        subscription_status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      username,
      email,
      passwordHash,
      platform,
      'pro',
      'active'
    );
    
    console.log(`\n✅ Pro user created successfully!`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👤 Username: ${username}`);
    console.log(`🎯 Tier: PRO`);
    console.log(`📱 Platform: ${platform}`);
    console.log(`\n🚀 You can now access the dashboard at: http://localhost:5000/dashboard/${result.lastInsertRowid}`);
  }
  
  db.close();
}

createProUser().catch(console.error);
