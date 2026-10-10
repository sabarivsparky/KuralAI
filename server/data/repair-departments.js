/**
 * Safe, reviewable migration script to assign Department ObjectIds
 * to historical complaints that lack a department assignment.
 *
 * Usage:
 *   node data/repair-departments.js            # Dry-run mode (reports only, no changes)
 *   node data/repair-departments.js --apply    # Applies the repairs with audit logging
 */

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Complaint = require("../models/Complaint");
const Department = require("../models/Department");
const AuditLog = require("../models/AuditLog");
const { resolveDepartment } = require("../agents/listener");

async function repair() {
  const isApply = process.argv.includes("--apply");

  console.log("====================================================");
  console.log(`KuralAI Complaint Department Repair Script`);
  console.log(`Mode: ${isApply ? "⚠️ APPLY (DATABASE WRITES)" : "🔍 DRY RUN (READ ONLY)"}`);
  console.log("====================================================\n");

  try {
    await connectDB();

    const totalComplaints = await Complaint.countDocuments();
    const withDept = await Complaint.countDocuments({ department: { $exists: true, $ne: null } });
    const withoutDept = await Complaint.countDocuments({
      $or: [{ department: null }, { department: { $exists: false } }],
    });

    console.log(`Total complaints: ${totalComplaints}`);
    console.log(`Already assigned department: ${withDept}`);
    console.log(`Missing department ObjectId: ${withoutDept}\n`);

    if (withoutDept === 0) {
      console.log("✅ All complaints already have valid department assignments. No action needed.");
      process.exit(0);
    }

    const unassigned = await Complaint.find({
      $or: [{ department: null }, { department: { $exists: false } }],
    }).lean();

    console.log(`Reviewing ${unassigned.length} unassigned complaints:\n`);

    const plannedChanges = [];
    for (const c of unassigned) {
      const targetDept = await resolveDepartment(
        c.aiAnalysis?.department,
        c.aiAnalysis?.issueType
      );

      plannedChanges.push({
        id: c._id,
        currentStatus: c.status,
        textPreview: (c.text || "").substring(0, 45),
        aiDept: c.aiAnalysis?.department || "undefined",
        issueType: c.aiAnalysis?.issueType || "undefined",
        resolvedDeptName: targetDept ? targetDept.name : "None",
        resolvedDeptCode: targetDept ? targetDept.code : "None",
        targetDeptId: targetDept ? targetDept._id : null,
      });
    }

    console.table(
      plannedChanges.map((p) => ({
        ID: String(p.id).slice(-8).toUpperCase(),
        Status: p.currentStatus,
        Text: p.textPreview,
        "AI Dept String": p.aiDept,
        "Issue Type": p.issueType,
        "Target Dept": `${p.resolvedDeptName} (${p.resolvedDeptCode})`,
      }))
    );

    if (!isApply) {
      console.log("\n[DRY RUN SUMMARY]");
      console.log(`Records that would be updated: ${plannedChanges.filter((p) => p.targetDeptId).length}`);
      console.log(`Records that would remain unassigned: ${plannedChanges.filter((p) => !p.targetDeptId).length}`);
      console.log("\nTo apply these repairs, run: node data/repair-departments.js --apply\n");
      process.exit(0);
    }

    // Apply updates
    let updatedCount = 0;
    for (const p of plannedChanges) {
      if (p.targetDeptId) {
        await Complaint.updateOne(
          { _id: p.id },
          { $set: { department: p.targetDeptId } }
        );

        await AuditLog.create({
          complaintId: p.id,
          agent: "System Migration",
          action: "Department Assigned",
          details: `Historical complaint assigned to department: ${p.resolvedDeptName} (${p.resolvedDeptCode}) based on existing classification data.`,
        });

        updatedCount++;
      }
    }

    console.log(`\n✅ Successfully repaired and audited ${updatedCount} complaints.`);
    process.exit(0);
  } catch (error) {
    console.error("Repair error:", error);
    process.exit(1);
  }
}

repair();
