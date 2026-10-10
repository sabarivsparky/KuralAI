/**
 * Database seed script for KuralAI.
 * Creates default departments and an admin user.
 *
 * Usage: node data/seed.js
 *
 * This script is idempotent — it won't create duplicates.
 */
const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Department = require("../models/Department");
const User = require("../models/User");

const DEFAULT_DEPARTMENTS = [
  {
    name: "Water Supply",
    code: "WATER",
    description: "Water supply, pipeline issues, contamination, and water shortage complaints.",
  },
  {
    name: "Sewerage & Drainage",
    code: "SEWER",
    description: "Sewage drain blockages, overflow, underground drainage failures, and wastewater issues.",
  },
  {
    name: "Solid Waste Management",
    code: "SWM",
    description: "Garbage collection, waste disposal, recycling, and cleanliness issues.",
  },
  {
    name: "Roads & Public Works",
    code: "ROADS",
    description: "Road damage, potholes, construction issues, footpath repairs, and infrastructure maintenance.",
  },
  {
    name: "Electricity & Street Lighting",
    code: "ELEC",
    description: "Power outages, electrical hazards, streetlight issues, and meter complaints.",
  },
  {
    name: "Storm-Water Drainage",
    code: "STORM",
    description: "Storm-water drain blockages, rainwater flooding, waterlogging, and monsoon drainage issues.",
  },
  {
    name: "Public Health",
    code: "HEALTH",
    description: "Public health hazards, mosquito breeding, food safety, and hospital complaints.",
  },
  {
    name: "Public Safety",
    code: "SAFETY",
    description: "Safety hazards, illegal activities, traffic issues, and emergency concerns.",
  },
  {
    name: "Parks & Environment",
    code: "PARKS",
    description: "Park maintenance, tree hazards, pollution, and environmental issues.",
  },
  {
    name: "Sanitation & Waste",
    code: "SANIT",
    description: "Public sanitation, street sweeping, and hygiene management.",
  },
  {
    name: "General Administration",
    code: "GENADM",
    description: "General civic complaints that do not fall under a specific department.",
  },
];

async function seed() {
  try {
    await connectDB();
    console.log("Connected to database.\n");

    // --- Seed departments (create new or update name/description for existing codes) ---
    let createdCount = 0;
    let updatedCount = 0;
    for (const dept of DEFAULT_DEPARTMENTS) {
      const exists = await Department.findOne({ code: dept.code });
      if (!exists) {
        await Department.create(dept);
        console.log(`  ✓ Created department: ${dept.name} (${dept.code})`);
        createdCount++;
      } else if (exists.name !== dept.name || exists.description !== dept.description) {
        exists.name = dept.name;
        exists.description = dept.description;
        await exists.save();
        console.log(`  ↻ Updated department: ${dept.name} (${dept.code})`);
        updatedCount++;
      } else {
        console.log(`  · Skipped (exists): ${dept.name} (${dept.code})`);
      }
    }
    console.log(`\nDepartments: ${createdCount} created, ${updatedCount} updated, ${DEFAULT_DEPARTMENTS.length - createdCount - updatedCount} unchanged.\n`);

    // --- Seed admin user ---
    const adminEmail = "admin@kural.ai";
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await User.create({
        displayName: "KuralAI Admin",
        email: adminEmail,
        passwordHash: "Admin@123", // Will be hashed by pre-save hook
        role: "admin",
        isActive: true,
      });
      console.log(`  ✓ Created admin user: ${adminEmail} (password: Admin@123)`);
    } else {
      console.log(`  · Admin user already exists: ${adminEmail}`);
    }

    // --- Seed sample officer user ---
    const officerEmail = "officer@kural.ai";
    const existingOfficer = await User.findOne({ email: officerEmail });
    if (!existingOfficer) {
      const genAdmDept = await Department.findOne({ code: "GENADM" });
      await User.create({
        displayName: "Sample Officer",
        email: officerEmail,
        passwordHash: "Officer@123", // Will be hashed by pre-save hook
        role: "official",
        department: genAdmDept ? genAdmDept._id : null,
        isActive: true,
      });
      console.log(`  ✓ Created officer user: ${officerEmail} (password: Officer@123, dept: General Administration)`);
    } else {
      console.log(`  · Officer user already exists: ${officerEmail}`);
    }

    console.log("\n✅ Seed complete.\n");
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

seed();
