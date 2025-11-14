// Seed admin user
import "dotenv/config";
import bcrypt from "bcryptjs";
import { storage } from "./storage";

async function seedAdmin() {
  console.log("Seeding admin user...");
  
  try {
    // Check if admin already exists
    const existing = await storage.getUserByEmail("ryan@cookinknowledge.com");
    
    if (existing) {
      console.log("Admin user already exists!");
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash("Ayden0428$$", 10);

    // Create admin user
    await storage.upsertUser({
      id: undefined,
      email: "ryan@cookinknowledge.com",
      passwordHash,
      firstName: "Ryan",
      lastName: "Keller",
      role: "admin",
    });

    console.log("✅ Admin user created successfully!");
    console.log("Email: ryan@cookinknowledge.com");
    console.log("Password: Ayden0428$$");
  } catch (error) {
    console.error("Failed to seed admin:", error);
  }

  process.exit(0);
}

seedAdmin();