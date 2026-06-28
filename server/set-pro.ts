import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(import.meta.dirname, "waler.db");
const db = new Database(dbPath);

// Get all users
console.log("\n📋 Current users:");
const users = db.prepare("SELECT id, username, email FROM users").all();
console.table(users);

if (users.length === 0) {
  console.log("❌ No users found. Please register first.");
  process.exit(1);
}

// Get the first user (or you can specify by email)
const user = users[0] as any;

// Add subscription_tier and subscription_status columns if they don't exist
try {
  db.prepare("ALTER TABLE users ADD COLUMN subscription_tier TEXT").run();
  console.log("✅ Added subscription_tier column");
} catch (e) {
  // Column already exists
}

try {
  db.prepare("ALTER TABLE users ADD COLUMN subscription_status TEXT").run();
  console.log("✅ Added subscription_status column");
} catch (e) {
  // Column already exists
}

// Update user to Pro
db.prepare(`
  UPDATE users 
  SET subscription_tier = 'pro', 
      subscription_status = 'active'
  WHERE id = ?
`).run(user.id);

console.log(`\n🎉 User ${user.username} (${user.email}) is now PRO!`);
console.log("\n✅ Refresh your dashboard to see Pro features!");

db.close();
