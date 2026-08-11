import fs from "fs";
import path from "path";

type Variant = {
  name: string;
  price: number;
  dietaryType?: string;
};

type MenuItem = {
  id: string;
  name: string;
  tagline: string | null;
  description: string;
  shortDescription: string | null;
  price: number | null;
  variants: Variant[];
  image: string;
  images: string[];
  categoryId: string;
  available: boolean;
  veg: boolean;
  dietaryType: string;
  spice: number;
  featured: boolean;
  chefRecommended: boolean;
  ingredients: string[];
  allergens: string[];
  servingSize: string | null;
  winePairing?: string | null;
  tastingNotes?: string | null;
  pairingPrice?: number | null;
  order: number;
  pdfPage: number;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  order: number;
};

type Manifest = {
  metadata: {
    source: string;
    pages: string;
    totalCategories: number;
    totalItems: number;
    totalVariants: number;
  };
  categories: Category[];
  items: MenuItem[];
};

export function validateManifest(): { success: boolean; errors: string[]; report: any } {
  const errors: string[] = [];
  const manifestPath = path.join(process.cwd(), "data", "black-orchid-menu.json");

  if (!fs.existsSync(manifestPath)) {
    return { success: false, errors: [`Manifest file missing at ${manifestPath}`], report: null };
  }

  const manifestRaw = fs.readFileSync(manifestPath, "utf-8");
  let manifest: Manifest;
  try {
    manifest = JSON.parse(manifestRaw);
  } catch (e) {
    return { success: false, errors: [`Manifest JSON parse error: ${(e as Error).message}`], report: null };
  }

  const { categories, items } = manifest;

  if (!Array.isArray(categories) || categories.length === 0) {
    errors.push("No categories found in manifest.");
  }

  if (!Array.isArray(items) || items.length === 0) {
    errors.push("No items found in manifest.");
  }

  const categoryIds = new Set(categories.map((c) => c.id));
  const imageToItemMap = new Map<string, string>();
  const itemIds = new Set<string>();

  items.forEach((item, index) => {
    // Check ID uniqueness
    if (itemIds.has(item.id)) {
      errors.push(`Duplicate item ID found: ${item.id}`);
    }
    itemIds.add(item.id);

    // Category association check
    if (!categoryIds.has(item.categoryId)) {
      errors.push(`Item "${item.name}" (Page ${item.pdfPage}) references invalid categoryId: ${item.categoryId}`);
    }

    // Pricing & Variant checks
    if (item.price === null || item.price === undefined) {
      if (!Array.isArray(item.variants) || item.variants.length === 0) {
        errors.push(`Item "${item.name}" (Page ${item.pdfPage}) has null price but no variants defined.`);
      }
    } else if (typeof item.price === "number") {
      if (item.price <= 0) {
        errors.push(`Item "${item.name}" (Page ${item.pdfPage}) has invalid non-positive price: ${item.price}`);
      }
    } else {
      errors.push(`Item "${item.name}" (Page ${item.pdfPage}) has invalid price type: ${typeof item.price}`);
    }

    if (Array.isArray(item.variants) && item.variants.length > 0) {
      item.variants.forEach((v, vi) => {
        if (!v.name || typeof v.price !== "number" || v.price <= 0) {
          errors.push(`Item "${item.name}" variant #${vi + 1} is invalid: ${JSON.stringify(v)}`);
        }
      });
    }

    // Dietary classification check
    if (!["vegetarian", "non_vegetarian", "not_specified"].includes(item.dietaryType)) {
      errors.push(`Item "${item.name}" has invalid dietaryType: ${item.dietaryType}`);
    }

    // Image Asset Checks
    if (!item.image) {
      errors.push(`Item "${item.name}" is missing image path.`);
    } else {
      const relPath = item.image.replace(/^\//, "");
      const fullImgPath = path.join(process.cwd(), "public", relPath);

      if (!fs.existsSync(fullImgPath)) {
        errors.push(`Item "${item.name}" image file missing on disk: ${fullImgPath}`);
      } else {
        const ext = path.extname(fullImgPath).toLowerCase();
        if (ext !== ".webp" && ext !== ".avif") {
          errors.push(`Item "${item.name}" image format is not WebP/AVIF: ${ext}`);
        }
      }

      // Check 1:1 image mapping (no shared images between unrelated items)
      if (imageToItemMap.has(item.image)) {
        errors.push(`Image shared by multiple items: "${item.image}" (Item: ${item.name} and ${imageToItemMap.get(item.image)})`);
      } else {
        imageToItemMap.set(item.image, item.name);
      }
    }
  });

  // Check for orphan images in public/images/menu/
  const menuImgDir = path.join(process.cwd(), "public", "images", "menu");
  if (fs.existsSync(menuImgDir)) {
    const files = fs.readdirSync(menuImgDir);
    files.forEach((file) => {
      const webPath = `/images/menu/${file}`;
      if (!imageToItemMap.has(webPath)) {
        errors.push(`Orphan image asset found in public/images/menu: ${file}`);
      }
    });
  }

  const success = errors.length === 0;

  const report = {
    timestamp: new Date().toISOString(),
    success,
    totalCategories: categories.length,
    totalItems: items.length,
    variantItemsCount: items.filter((i) => i.variants && i.variants.length > 0).length,
    singlePriceItemsCount: items.filter((i) => typeof i.price === "number").length,
    totalImagesVerified: imageToItemMap.size,
    errorsCount: errors.length,
    errors,
  };

  fs.mkdirSync(path.join(process.cwd(), "scratch"), { recursive: true });
  fs.writeFileSync(path.join(process.cwd(), "scratch", "menu_validation_report.json"), JSON.stringify(report, null, 2));

  return { success, errors, report };
}

export function runValidationCLI() {
  console.log("Running manifest & image asset validation...");
  const res = validateManifest();
  if (res.success) {
    console.log(`✅ Validation Passed! ${res.report.totalCategories} categories, ${res.report.totalItems} items (${res.report.variantItemsCount} variant-priced), ${res.report.totalImagesVerified} images verified.`);
  } else {
    console.error("❌ Validation Failed with errors:");
    res.errors.forEach((err) => console.error(`  - ${err}`));
  }
  return res;
}

if (process.argv[1] && process.argv[1].includes("validate-pdf-menu")) {
  const res = runValidationCLI();
  if (!res.success) process.exit(1);
}
