import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";
import { IMAGES } from "../src/lib/images";

async function main() {
  console.log("🌱 Seeding Black Orchid database...");

  // 1. Admin user
  const adminEmail = "admin@blackorchid.com";
  const existing = await db.adminUser.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    await db.adminUser.create({
      data: {
        email: adminEmail,
        name: "Restaurant Administrator",
        password: hashPassword("admin123"),
        role: "ADMIN",
      },
    });
    console.log("  ✓ Admin user created (admin@blackorchid.com / admin123)");
  } else {
    await db.adminUser.update({
      where: { email: adminEmail },
      data: { password: hashPassword("admin123") },
    });
    console.log("  ✓ Admin password reset to admin123");
  }

  // 2. Site settings
  await db.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      restaurantName: "Black Orchid",
      tagline: "Fine Dining & Banquet",
      heroTitle: "An Exquisite Symphony of Flavour",
      heroSubtitle: "Where culinary artistry meets timeless elegance — an evening destined to linger in memory.",
      aboutTitle: "A Legacy of Culinary Excellence",
      aboutBody:
        "Born from a passion for the extraordinary, Black Orchid has redefined the art of dining for over two decades. Our master chefs source the rarest ingredients from across the globe, weaving them into compositions that delight the senses and stir the soul. From intimate dinners to grand celebrations, every moment is crafted with meticulous attention to detail, enveloped in an ambience of understated luxury.",
      phone: "+1 (555) 010-2024",
      email: "reservations@blackorchid.com",
      address: "128 Velvet Lane, Downtown District, Metropolis",
      hoursWeekday: "11:00 AM – 11:00 PM",
      hoursWeekend: "10:00 AM – 12:30 AM",
      instagram: "https://instagram.com",
      facebook: "https://facebook.com",
      twitter: "https://twitter.com",
      whatsapp: "+15550102024",
      banquetCapacity: "Up to 300 guests",
      banquetDesc:
        "Our grand banquet hall is a canvas for your most cherished occasions. With soaring ceilings, crystal chandeliers, and a dedicated events team, we transform celebrations into legends — from opulent weddings to corporate galas.",
      metaTitle: "Black Orchid — Fine Dining & Banquet",
      metaDesc:
        "A premier luxury restaurant & banquet facility offering exquisite cuisine, opulent ambience, and unforgettable experiences. Reserve your table today.",
    },
  });
  console.log("  ✓ Site settings seeded");

  // 3. Menu categories
  const cats = [
    { name: "Starters", slug: "starters", order: 0 },
    { name: "Main Course", slug: "main-course", order: 1 },
    { name: "Chinese", slug: "chinese", order: 2 },
    { name: "Indian", slug: "indian", order: 3 },
    { name: "Desserts", slug: "desserts", order: 4 },
    { name: "Cocktails", slug: "cocktails", order: 5 },
  ];
  const catMap: Record<string, string> = {};
  for (const c of cats) {
    const rec = await db.menuCategory.upsert({
      where: { slug: c.slug },
      update: { order: c.order },
      create: c,
    });
    catMap[c.slug] = rec.id;
  }
  console.log("  ✓ Menu categories seeded");

  // 4. Menu items
  const items = [
    // Starters
    { name: "Truffle Arancini", desc: "Creamy saffron risotto spheres, shaved black truffle, parmesan crumb, truffle aioli", price: 18, image: IMAGES.food[0], cat: "starters", veg: true, spice: 0, featured: true },
    { name: "Seared Diver Scallops", desc: "Pan-seared scallops, silky cauliflower purée, caviar beurre blanc, micro herbs", price: 26, image: IMAGES.food[4], cat: "starters", veg: false, spice: 0, featured: true },
    { name: "Yellowfin Tuna Tartare", desc: "Hand-cut yellowfin, avocado, citrus ponzu, crisp wonton, sesame", price: 24, image: IMAGES.food[5], cat: "starters", veg: false, spice: 1, featured: false },
    { name: "Burrata & Heirloom", desc: "Creamy burrata, heirloom tomatoes, basil oil, aged balsamic, sourdough crisp", price: 20, image: IMAGES.food[6], cat: "starters", veg: true, spice: 0, featured: false },
    // Main Course
    { name: "A5 Wagyu Tenderloin", desc: "Japanese A5 wagyu, bone-marrow butter, charred shallot, red wine jus", price: 89, image: IMAGES.food[1], cat: "main-course", veg: false, spice: 0, featured: true },
    { name: "Butter-Poached Lobster", desc: "Maine lobster, herb fettuccine, bisque foam, cherry tomato, tarragon", price: 62, image: IMAGES.food[6], cat: "main-course", veg: false, spice: 0, featured: true },
    { name: "Herb Crusted Rack of Lamb", desc: "Rosemary-crusted lamb, smoked aubergine, mint oil, garlic jus", price: 48, image: IMAGES.food[7], cat: "main-course", veg: false, spice: 0, featured: false },
    { name: "Miso Black Cod", desc: "Saikyo miso marinated black cod, dashi broth, bok choy, pickled ginger", price: 54, image: IMAGES.food[2], cat: "main-course", veg: false, spice: 1, featured: true },
    // Chinese
    { name: "Imperial Peking Duck", desc: "Crispy duck, hoisin, cucumber, scallion, hand-folded steamed pancakes", price: 42, image: IMAGES.food[2], cat: "chinese", veg: false, spice: 0, featured: true },
    { name: "Dim Sum Platter", desc: "Hand-folded prawn & pork dumplings, chilli oil, black vinegar dip", price: 28, image: IMAGES.food[3], cat: "chinese", veg: false, spice: 1, featured: false },
    { name: "Szechuan Mapo Tofu", desc: "Silken tofu, szechuan peppercorn, chilli bean, spring onion", price: 22, image: IMAGES.food[3], cat: "chinese", veg: true, spice: 3, featured: false },
    { name: "Crispy Chilli Beef", desc: "Wok-tossed beef, chilli, garlic, crispy strands, spring onion", price: 30, image: IMAGES.food[7], cat: "chinese", veg: false, spice: 2, featured: false },
    // Indian
    { name: "Royal Dum Biryani", desc: "Aged basmati, saffron, slow-cooked lamb, fried onion, raita, mirchi salan", price: 34, image: IMAGES.food[1], cat: "indian", veg: false, spice: 2, featured: true },
    { name: "Butter Chicken", desc: "Tandoor chicken, tomato cream, fenugreek, fresh naan", price: 29, image: IMAGES.food[5], cat: "indian", veg: false, spice: 1, featured: true },
    { name: "Paneer Tikka Masala", desc: "Char-grilled cottage cheese, cashew tomato gravy, cilantro", price: 24, image: IMAGES.food[0], cat: "indian", veg: true, spice: 2, featured: false },
    { name: "Dal Makhani", desc: "Black lentils, butter, cream, slow-cooked overnight, smoked", price: 19, image: IMAGES.food[4], cat: "indian", veg: true, spice: 1, featured: false },
    // Desserts
    { name: "Dark Chocolate Sphere", desc: "Molten centre, gold leaf, raspberry coulis, vanilla bean ice cream", price: 16, image: IMAGES.dessert[0], cat: "desserts", veg: true, spice: 0, featured: true },
    { name: "Tahitian Crème Brûlée", desc: "Tahitian vanilla custard, caramelised sugar crust, shortbread", price: 14, image: IMAGES.dessert[1], cat: "desserts", veg: true, spice: 0, featured: false },
    { name: "Deconstructed Tiramisu", desc: "Mascarpone cream, espresso soil, cocoa, amaretto pearls", price: 15, image: IMAGES.dessert[2], cat: "desserts", veg: true, spice: 0, featured: false },
    { name: "Pistachio Soufflé", desc: "Warm pistachio soufflé, rose cream, honeycomb, pistachio dust", price: 17, image: IMAGES.dessert[3], cat: "desserts", veg: true, spice: 0, featured: true },
    // Cocktails
    { name: "Black Orchid Martini", desc: "London Dry gin, blackberry, elderflower, lime, edible gold", price: 18, image: IMAGES.drinks[0], cat: "cocktails", veg: true, spice: 0, featured: true },
    { name: "Smoked Old Fashioned", desc: "Bourbon, cherrywood smoke, demerara, orange bitters, brandied cherry", price: 19, image: IMAGES.drinks[1], cat: "cocktails", veg: true, spice: 0, featured: false },
    { name: "Golden Elixir", desc: "Vintage champagne, cognac, saffron, citrus, gold flake", price: 22, image: IMAGES.drinks[3], cat: "cocktails", veg: true, spice: 0, featured: true },
    { name: "Garden Negroni", desc: "Gin, vermouth, Campari, rosemary, blood orange, smoked rosemary", price: 17, image: IMAGES.drinks[5], cat: "cocktails", veg: true, spice: 0, featured: false },
  ];

  // Clear existing items then recreate for idempotency
  await db.menuItem.deleteMany({});
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    await db.menuItem.create({
      data: {
        name: it.name,
        description: it.desc,
        price: it.price,
        image: it.image,
        categoryId: catMap[it.cat],
        veg: it.veg,
        spice: it.spice,
        featured: it.featured,
        available: true,
        order: i,
      },
    });
  }
  console.log(`  ✓ ${items.length} menu items seeded`);

  // 5. Gallery
  await db.galleryImage.deleteMany({});
  const gallery: Array<{ title: string; url: string; category: string; caption: string }> = [
    { title: "Velvet Lounge", url: IMAGES.interior[0], category: "Interior", caption: "Our signature velvet lounge bathed in golden light" },
    { title: "Chef's Tasting", url: IMAGES.food[0], category: "Food", caption: "A composed tasting course by Chef Aurelio" },
    { title: "Midnight Negroni", url: IMAGES.drinks[0], category: "Drinks", caption: "Crafted cocktails at the marble bar" },
    { title: "Grand Hall", url: IMAGES.banquet[1], category: "Banquet", caption: "The grand banquet hall set for an evening of celebration" },
    { title: "Wagyu Course", url: IMAGES.food[1], category: "Food", caption: "A5 Wagyu, the crown jewel of the menu" },
    { title: "Chandelier Atrium", url: IMAGES.interior[1], category: "Interior", caption: "Crystal chandeliers in the main atrium" },
    { title: "Smoked Old Fashioned", url: IMAGES.drinks[1], category: "Drinks", caption: "Theatre of smoke at the bar" },
    { title: "Wedding Gala", url: IMAGES.banquet[2], category: "Events", caption: "An opulent wedding celebration" },
    { title: "Chocolate Sphere", url: IMAGES.dessert[0], category: "Food", caption: "Dessert, revealed tableside" },
    { title: "Private Dining", url: IMAGES.interior[3], category: "Interior", caption: "The intimate private dining room" },
    { title: "Peking Duck", url: IMAGES.food[2], category: "Food", caption: "Imperial Peking Duck, carved tableside" },
    { title: "Reception Glow", url: IMAGES.banquet[3], category: "Events", caption: "A gala reception under warm lights" },
    { title: "Cocktail Bar", url: IMAGES.drinks[2], category: "Drinks", caption: "The marble cocktail bar" },
    { title: "Golden Booth", url: IMAGES.interior[4], category: "Interior", caption: "A golden booth for intimate evenings" },
    { title: "Corporate Gala", url: IMAGES.banquet[5], category: "Events", caption: "A corporate gala dinner" },
    { title: "Pistachio Soufflé", url: IMAGES.dessert[3], category: "Food", caption: "Pistachio soufflé, risen to perfection" },
  ];
  for (let i = 0; i < gallery.length; i++) {
    await db.galleryImage.create({
      data: { ...gallery[i], order: i },
    });
  }
  console.log(`  ✓ ${gallery.length} gallery images seeded`);

  // 6. Testimonials
  await db.testimonial.deleteMany({});
  const testimonials = [
    { name: "Eleanor Whitmore", role: "Food Critic, The Gazette", rating: 5, message: "An evening at Black Orchid is nothing short of theatrical. Every plate arrives as a work of art, every flavour a revelation. The wagyu alone is worth the journey.", photo: IMAGES.avatar[0], featured: true },
    { name: "Marcus Delacroix", role: "Regular Patron", rating: 5, message: "We've celebrated every milestone here for five years. The service anticipates your needs before you do. Simply the finest dining in the city.", photo: IMAGES.avatar[1], featured: true },
    { name: "Priya Nair", role: "Wedding Client", rating: 5, message: "Our wedding banquet was flawless. The team transformed the hall into a dream and the catering left our guests speechless. Forever grateful.", photo: IMAGES.avatar[2], featured: true },
    { name: "James Holloway", role: "Business Executive", rating: 4, message: "Hosted a corporate dinner for forty. Impeccable coordination, exquisite menu, and an ambience that impressed even our most discerning clients.", photo: IMAGES.avatar[3], featured: false },
    { name: "Sofia Marchetti", role: "Lifestyle Blogger", rating: 5, message: "The Black Orchid Martini with edible gold is iconic. The interior is a love letter to old-world glamour. A must-visit.", photo: IMAGES.avatar[4], featured: true },
    { name: "Daniel Cho", role: "Anniversary Guest", rating: 5, message: "Celebrated our tenth anniversary. From the candlelit booth to the dessert with a gold leaf surprise — unforgettable, every detail.", photo: IMAGES.avatar[5], featured: false },
  ];
  for (let i = 0; i < testimonials.length; i++) {
    await db.testimonial.create({ data: { ...testimonials[i], order: i } });
  }
  console.log(`  ✓ ${testimonials.length} testimonials seeded`);

  // 7. Events
  await db.eventItem.deleteMany({});
  const events = [
    { title: "Truffle & Wine Gala", description: "An exclusive evening pairing rare truffles with vintage wines, curated by our sommelier and executive chef.", date: "2025-03-22", image: IMAGES.food[1] },
    { title: "Valentine's Tasting Menu", description: "A seven-course tasting menu designed for two, with live jazz and a complimentary champagne toast.", date: "2025-02-14", image: IMAGES.ambiance[0] },
    { title: "Mixology Masterclass", description: "Learn the art of craft cocktails from our head bartender in an intimate, hands-on session.", date: "2025-04-05", image: IMAGES.drinks[1] },
    { title: "Diwali Grand Celebration", description: "A festive Indian-inspired banquet with live music, traditional décor, and a special menu by our tandoor chef.", date: "2025-10-21", image: IMAGES.banquet[0] },
  ];
  for (const e of events) {
    await db.eventItem.create({ data: { ...e, published: true } });
  }
  console.log(`  ✓ ${events.length} events seeded`);

  // 8. Catering packages
  await db.cateringPackage.deleteMany({});
  const packages = [
    { name: "Silver Soirée", description: "Elegant catering for intimate gatherings and corporate lunches.", price: 65, guests: "20–50 guests", image: IMAGES.food[6], features: "5-course plated menu|Premium beverage station|Dedicated service staff|Linens & tableware|2-hour service window", order: 0 },
    { name: "Golden Gala", description: "Our most popular package for weddings and grand celebrations.", price: 120, guests: "100–250 guests", image: IMAGES.banquet[1], features: "7-course gourmet menu|Open premium bar|Live cooking stations|Full décor coordination|Event manager on-site|4-hour service window", order: 1 },
    { name: "Platinum Royal", description: "The pinnacle of bespoke catering for the most distinguished occasions.", price: 220, guests: "250–500 guests", image: IMAGES.banquet[2], features: "Bespoke multi-course menu|Vintage champagne & sommelier|Multiple live stations|Full event production|Private chef & team|Unlimited service window|Valet & concierge", order: 2 },
  ];
  for (const p of packages) {
    await db.cateringPackage.create({ data: p });
  }
  console.log(`  ✓ ${packages.length} catering packages seeded`);

  console.log("\n✅ Seeding complete!");
  console.log("   Admin login: admin@blackorchid.com / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
