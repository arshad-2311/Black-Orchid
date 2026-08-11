import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { validateManifest } from "./validate-pdf-menu";

const prisma = new PrismaClient();

async function runMigration() {
  console.log("=== STARTING BLACK ORCHID MENU MIGRATION ===");

  // Step 1 - 7: Run strict validation protocol on canonical manifest & images
  console.log("Step 1-7: Validating canonical manifest & image assets...");
  const valRes = validateManifest();

  if (!valRes.success) {
    console.error("❌ MIGRATION ABORTED: Pre-migration validation failed!");
    valRes.errors.forEach((err) => console.error(`  - ${err}`));
    process.exit(1);
  }

  const manifestPath = path.join(process.cwd(), "data", "black-orchid-menu.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  const { categories, items } = manifest;

  // Step 8: Database Backup
  console.log("Step 8: Creating database backup...");
  try {
    const backupCat = await prisma.menuCategory.findMany({ include: { items: true } });
    const backupPath = path.join(process.cwd(), "scratch", `menu_backup_${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(backupCat, null, 2));
    console.log(`Backup saved to ${backupPath}`);
  } catch (err) {
    console.error("Warning: Failed to create database backup:", err);
  }

  // Step 9: Transactional Database Migration
  console.log("Step 9: Executing transactional database migration...");

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Delete all existing menu items and categories
      await tx.menuItem.deleteMany({});
      await tx.menuCategory.deleteMany({});

      // 2. Create categories
      for (const cat of categories) {
        await tx.menuCategory.create({
          data: {
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            order: cat.order,
          },
        });
      }

      // 3. Create menu items
      for (const item of items) {
        await tx.menuItem.create({
          data: {
            id: item.id,
            name: item.name,
            tagline: item.tagline || null,
            description: item.description || "",
            shortDescription: item.shortDescription || null,
            price: item.price !== null ? item.price : 0, // Prisma SQLite float
            variants: JSON.stringify(item.variants || []),
            image: item.image,
            images: JSON.stringify(item.images || [item.image]),
            categoryId: item.categoryId,
            available: item.available ?? true,
            veg: item.veg ?? false,
            dietaryType: item.dietaryType || "not_specified",
            spice: item.spice ?? 0,
            featured: item.featured ?? false,
            chefRecommended: item.chefRecommended ?? false,
            ingredients: JSON.stringify(item.ingredients || []),
            allergens: JSON.stringify(item.allergens || []),
            servingSize: item.servingSize || null,
            winePairing: item.winePairing || null,
            tastingNotes: item.tastingNotes || null,
            pairingPrice: item.pairingPrice || null,
            order: item.order || 0,
          },
        });
      }
    });

    console.log("Transactional migration completed successfully!");
  } catch (e) {
    console.error("❌ MIGRATION FAILED inside Prisma transaction:", e);
    process.exit(1);
  }

  // Step 10: Verify migrated database against canonical manifest
  console.log("Step 10: Verifying database against canonical manifest...");
  const dbCategories = await prisma.menuCategory.findMany({ include: { items: true } });
  const totalDbItems = dbCategories.reduce((acc, c) => acc + c.items.length, 0);

  if (dbCategories.length !== categories.length) {
    console.error(`❌ Verification error: DB categories count (${dbCategories.length}) !== Manifest categories count (${categories.length})`);
    process.exit(1);
  }

  if (totalDbItems !== items.length) {
    console.error(`❌ Verification error: DB items count (${totalDbItems}) !== Manifest items count (${items.length})`);
    process.exit(1);
  }

  // Step 11: Write final validation & migration report
  console.log("Step 11: Writing final migration report...");
  const finalReport = {
    timestamp: new Date().toISOString(),
    status: "SUCCESS",
    categoriesImported: categories.length,
    totalItemsImported: totalDbItems,
    variantItemsCount: items.filter((i: any) => i.variants && i.variants.length > 0).length,
    singlePriceItemsCount: items.filter((i: any) => typeof i.price === "number").length,
    oldItemsRemoved: "ALL (100% replacement)",
    validationReport: valRes.report,
  };

  fs.writeFileSync(
    path.join(process.cwd(), "scratch", "menu_migration_summary.json"),
    JSON.stringify(finalReport, null, 2)
  );

  const markdownReport = `# Black Orchid Food Menu Migration Report

- **Status**: SUCCESS
- **Timestamp**: ${finalReport.timestamp}
- **Categories Imported**: ${finalReport.categoriesImported}
- **Total Menu Items Imported**: ${finalReport.totalItemsImported}
- **Variant-Priced Items**: ${finalReport.variantItemsCount}
- **Single-Priced Items**: ${finalReport.singlePriceItemsCount}
- **Old Menu Items Purged**: 100% (Full PDF Replacement)
- **Image Assets Verified**: ${valRes.report.totalImagesVerified} WebP images

## Categories Summary
${categories.map((c: any) => `- **${c.name}** (${items.filter((i: any) => i.categoryId === c.id).length} items)`).join("\n")}
`;

  fs.writeFileSync(path.join(process.cwd(), "scratch", "menu_validation_report.md"), markdownReport);

  console.log("🎉 MIGRATION SUCCESSFUL!");
  console.log(`Report written to scratch/menu_validation_report.md`);
  await prisma.$disconnect();
}

runMigration().catch(async (e) => {
  console.error("Fatal migration error:", e);
  await prisma.$disconnect();
  process.exit(1);
});
