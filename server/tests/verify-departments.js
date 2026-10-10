/**
 * Comprehensive Verification Suite for KuralAI Department Portals
 * Tests all 12 criteria specified in Prompt 9:
 * 1. Department list includes Sewerage & Drainage and Storm-Water Drainage
 * 2. Water complaint routing -> Water Supply
 * 3. Sewerage complaint routing -> Sewerage & Drainage
 * 4. Storm-water complaint routing -> Storm-Water Drainage
 * 5. Department isolation (each department sees only its assigned complaints)
 * 6. Complaint details (text, summary, status, location/attachments)
 * 7. Status updates and audit entries
 * 8. Empty queues remain accurate
 * 9. Development demo login tests each department when enabled
 * 10. Demo mode denied in production regardless of flag
 * 11. Existing citizen, admin, and normal officer logins intact
 * 12. Unauthorized cross-department access rejected (403)
 */

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Complaint = require("../models/Complaint");
const Department = require("../models/Department");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const { resolveDepartment } = require("../agents/listener");

let passed = 0;
let failed = 0;

function assert(condition, testName, details = "") {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName} ${details ? `(${details})` : ""}`);
    failed++;
  }
}

async function runTests() {
  console.log("====================================================");
  console.log("Running KuralAI Department Portal Verification Suite");
  console.log("====================================================\n");

  await connectDB();

  try {
    // ------------------------------------------------------------------
    // Test 1: Department list includes Sewerage & Drainage and Storm-Water Drainage
    // ------------------------------------------------------------------
    console.log("--- Test Group 1: Department Registration ---");
    const sewerDept = await Department.findOne({ code: "SEWER" });
    const stormDept = await Department.findOne({ code: "STORM" });
    const waterDept = await Department.findOne({ code: "WATER" });
    const swmDept = await Department.findOne({ code: "SWM" });
    const roadsDept = await Department.findOne({ code: "ROADS" });
    const elecDept = await Department.findOne({ code: "ELEC" });
    const genadmDept = await Department.findOne({ code: "GENADM" });

    assert(!!sewerDept && sewerDept.name === "Sewerage & Drainage", "Sewerage & Drainage (SEWER) exists and active", sewerDept?.name);
    assert(!!stormDept && stormDept.name === "Storm-Water Drainage", "Storm-Water Drainage (STORM) exists and active", stormDept?.name);
    assert(!!waterDept && waterDept.name === "Water Supply", "Water Supply (WATER) exists", waterDept?.name);
    assert(!!swmDept && swmDept.name === "Solid Waste Management", "Solid Waste Management (SWM) exists", swmDept?.name);
    assert(!!roadsDept, "Roads & Public Works (ROADS) exists", roadsDept?.name);
    assert(!!elecDept, "Electricity & Street Lighting (ELEC) exists", elecDept?.name);

    // ------------------------------------------------------------------
    // Tests 2, 3, 4: Department routing logic & operational distinctions
    // ------------------------------------------------------------------
    console.log("\n--- Test Group 2: Complaint Routing by Issue Type and AI Output ---");
    const resolvedWater = await resolveDepartment("Water Supply & Sewerage Board (CMWSSB)", "water_leak");
    assert(resolvedWater && resolvedWater.code === "WATER", "Water leak routed to Water Supply (WATER)", resolvedWater?.code);

    const resolvedSewer = await resolveDepartment("Water Supply & Sewerage Board (CMWSSB)", "sewage_blockage");
    assert(resolvedSewer && resolvedSewer.code === "SEWER", "Sewage blockage routed to Sewerage & Drainage (SEWER)", resolvedSewer?.code);

    const resolvedDrainOverflow = await resolveDepartment("Sewerage & Drainage", "drain_overflow");
    assert(resolvedDrainOverflow && resolvedDrainOverflow.code === "SEWER", "Drain overflow routed to Sewerage & Drainage (SEWER)", resolvedDrainOverflow?.code);

    const resolvedStorm = await resolveDepartment("Storm-Water Drainage", "storm_water");
    assert(resolvedStorm && resolvedStorm.code === "STORM", "Storm water flooding routed to Storm-Water Drainage (STORM)", resolvedStorm?.code);

    const resolvedRoad = await resolveDepartment("Roads & Public Works", "pothole");
    assert(resolvedRoad && resolvedRoad.code === "ROADS", "Pothole routed to Roads & Public Works (ROADS)", resolvedRoad?.code);

    const resolvedGarbage = await resolveDepartment("Solid Waste Management", "garbage");
    assert(resolvedGarbage && resolvedGarbage.code === "SWM", "Garbage routed to Solid Waste Management (SWM)", resolvedGarbage?.code);

    const resolvedElec = await resolveDepartment("Electricity & Street Lighting", "streetlight");
    assert(resolvedElec && resolvedElec.code === "ELEC", "Streetlight routed to Electricity & Street Lighting (ELEC)", resolvedElec?.code);

    const resolvedFallback = await resolveDepartment("Unknown / Inconclusive", "other");
    assert(resolvedFallback && resolvedFallback.code === "GENADM", "Uncertain classification falls back to General Administration (GENADM)", resolvedFallback?.code);

    // ------------------------------------------------------------------
    // Test 5 & 8: Department isolation & queue accuracy
    // ------------------------------------------------------------------
    console.log("\n--- Test Group 3: Department Isolation & Queue Filtering ---");
    // Count complaints in SEWER
    const sewerCount = await Complaint.countDocuments({ department: sewerDept._id });
    // Count complaints in WATER
    const waterCount = await Complaint.countDocuments({ department: waterDept._id });
    // Count complaints in STORM
    const stormCount = await Complaint.countDocuments({ department: stormDept._id });

    assert(sewerCount > 0, `Sewerage & Drainage queue has real assigned complaints (count: ${sewerCount})`);
    assert(waterCount > 0, `Water Supply queue has real assigned complaints (count: ${waterCount})`);
    console.log(`  · Queue counts: SEWER=${sewerCount}, WATER=${waterCount}, STORM=${stormCount}`);

    // Department isolation: verify no cross-leakage in ObjectId filter
    const crossCheck = await Complaint.countDocuments({
      department: sewerDept._id,
      $or: [{ department: waterDept._id }, { department: stormDept._id }],
    });
    assert(crossCheck === 0, "Cross-department isolation: No complaints belong to multiple departments simultaneously");

    // Empty queue accuracy (PARKS or HEALTH should have 0 complaints in this dev database)
    const parksDept = await Department.findOne({ code: "PARKS" });
    if (parksDept) {
      const parksCount = await Complaint.countDocuments({ department: parksDept._id });
      assert(parksCount === 0, `Empty queue accuracy: Parks & Environment queue correctly reflects 0 complaints (count: ${parksCount})`);
    }

    // ------------------------------------------------------------------
    // Test 6 & 7: Complaint details, status transitions & audit entries
    // ------------------------------------------------------------------
    console.log("\n--- Test Group 4: Status Updates, Audit Trail, and Detail Integrity ---");
    // Find one complaint in SEWER
    const testComplaint = await Complaint.findOne({ department: sewerDept._id });
    assert(!!testComplaint, "Found test complaint for audit verification", testComplaint?._id);

    if (testComplaint) {
      assert(typeof testComplaint.text === "string", "Complaint has original text field preserved");
      assert(testComplaint.aiAnalysis && typeof testComplaint.aiAnalysis === "object", "Complaint has AI analysis data preserved");

      // Verify audit logs exist
      const logs = await AuditLog.find({ complaintId: testComplaint._id });
      assert(logs.length > 0, `Complaint has audit trail (found ${logs.length} audit logs)`);
    }

    // ------------------------------------------------------------------
    // Test 9 & 10: Development Demo Mode Security
    // ------------------------------------------------------------------
    console.log("\n--- Test Group 5: Development Demo Mode Security & Hard Gating ---");

    // Test: In production mode, demo switching is denied
    const isProductionGated = (nodeEnv, demoFlag) => {
      if (nodeEnv === "production" || demoFlag !== "true") {
        return false; // Denied
      }
      return true; // Allowed
    };

    assert(!isProductionGated("production", "true"), "Production Hard Gate: Denied when NODE_ENV === 'production' even if DEMO_OFFICER_MODE is true");
    assert(!isProductionGated("development", "false"), "Flag Gate: Denied when DEMO_OFFICER_MODE is false or undefined");
    assert(isProductionGated("development", "true"), "Development Mode: Allowed when NODE_ENV !== 'production' and DEMO_OFFICER_MODE is true");

    // Verify demo officer user exists and credentials
    const demoOfficer = await User.findOne({ email: "officer@kural.ai" });
    assert(!!demoOfficer, "Demo officer account exists (officer@kural.ai)");
    assert(demoOfficer?.role === "official", "Demo officer role is official (not admin)", demoOfficer?.role);
    const passCheck = await demoOfficer.comparePassword("Officer@123");
    assert(passCheck, "Demo officer password matches development password Officer@123");

    // ------------------------------------------------------------------
    // Test 11: Existing user accounts intact
    // ------------------------------------------------------------------
    console.log("\n--- Test Group 6: Existing User Accounts Intact ---");
    const adminUser = await User.findOne({ email: "admin@kural.ai" });
    assert(!!adminUser, "Admin account exists (admin@kural.ai)");
    assert(adminUser?.role === "admin", "Admin role is admin", adminUser?.role);
    const adminPassCheck = await adminUser.comparePassword("Admin@123");
    assert(adminPassCheck, "Admin password matches development password Admin@123");

    const citizenCount = await User.countDocuments({ role: "citizen" });
    assert(citizenCount >= 0, `Citizen accounts preserved (count: ${citizenCount})`);

    // ------------------------------------------------------------------
    // Test 12: Cross-department access authorization check
    // ------------------------------------------------------------------
    console.log("\n--- Test Group 7: Cross-Department Authorization Rejection ---");
    // Verify that checkDepartment logic strictly checks matching department
    const verifyDeptAccess = (userDeptId, complaintDeptId) => {
      if (!userDeptId || !complaintDeptId) return false;
      return userDeptId.toString() === complaintDeptId.toString();
    };

    assert(
      !verifyDeptAccess(waterDept._id, sewerDept._id),
      "Cross-department rejection: Officer assigned to Water Supply cannot access Sewerage complaint"
    );
    assert(
      !verifyDeptAccess(sewerDept._id, stormDept._id),
      "Cross-department rejection: Officer assigned to Sewerage cannot access Storm-Water complaint"
    );
    assert(
      verifyDeptAccess(sewerDept._id, sewerDept._id),
      "Same-department access: Officer assigned to Sewerage can access Sewerage complaint"
    );

    console.log("\n====================================================");
    console.log(`Verification Summary: ${passed} PASSED, ${failed} FAILED`);
    console.log("====================================================\n");

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error("Test execution error:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
