import { db } from "./db";
import { hashPassword } from "./auth";
import { IMAGES } from "./images";

let isSeeding = false;

/**
 * Ensures database tables contain default seed data.
 * Safe to call concurrently on Vercel / serverless environments.
 */
export async function ensureSeeded() {
  if (isSeeding) return;
  try {
    const adminCount = await db.adminUser.count().catch(() => 0);
    const menuCount = await db.menuItem.count().catch(() => 0);

    if (adminCount > 0 && menuCount > 0) {
      return; // Already populated
    }

    isSeeding = true;
    console.log("🌱 Auto-seeding database for Vercel/Production instance...");

    // 1. Admin user
    const adminEmail = "admin@blackorchid.com";
    const existing = await db.adminUser.findUnique({ where: { email: adminEmail } });
    if (!existing) {
      await db.adminUser.create({
        data: {
          email: adminEmail,
          name: "Restaurant Administrator",
          password: await hashPassword("admin123"),
          role: "ADMIN",
        },
      });
    } else {
      await db.adminUser.update({
        where: { email: adminEmail },
        data: { password: await hashPassword("admin123") },
      });
    }

    // 2. Site settings
    await db.siteSettings.upsert({
      where: { id: "singleton" },
      update: {
        phone: "+91 95850 18502",
        phoneSecondary: "+91 91764 77647",
        email: "boan.reservations@gmail.com",
        address: "G Block, L33, 1st Avenue, R.V. Nagar, Brindhavan Colony, VOC Nagar, Anna Nagar East, Chennai, Tamil Nadu – 600102",
        mapEmbed: "https://maps.google.com/?q=Black+Orchid+Anna+Nagar+East+Chennai",
        hoursWeekday: "11:00 AM – 11:00 PM",
        hoursWeekend: "11:00 AM – 11:00 PM",
        facebook: "https://www.facebook.com/blackorchidchennai/",
        whatsapp: "+919585018502",
        metaTitle: "Black Orchid — Restobar & Fine Dining | Anna Nagar East, Chennai",
        metaDesc: "A stylish restobar in Anna Nagar East, Chennai, combining exquisite food, crafted cocktails, vibrant music, and elevated dining experiences.",
      },
      create: {
        id: "singleton",
        restaurantName: "Black Orchid",
        tagline: "Restobar & Fine Dining",
        heroTitle: "An Exquisite Symphony of Flavour",
        heroSubtitle: "Where culinary artistry meets vibrant nightlife — an evening destined to linger in memory.",
        aboutTitle: "The Black Orchid Story",
        aboutBody:
          "Black Orchid is a stylish restobar located in Anna Nagar East, Chennai, created for those who appreciate great food, crafted cocktails, music, and vibrant celebrations. From relaxing evenings with friends to grand events, every detail is designed for an unforgettable dining experience.",
        phone: "+91 95850 18502",
        phoneSecondary: "+91 91764 77647",
        email: "boan.reservations@gmail.com",
        address: "G Block, L33, 1st Avenue, R.V. Nagar, Brindhavan Colony, VOC Nagar, Anna Nagar East, Chennai, Tamil Nadu – 600102",
        mapEmbed: "https://maps.google.com/?q=Black+Orchid+Anna+Nagar+East+Chennai",
        hoursWeekday: "11:00 AM – 11:00 PM",
        hoursWeekend: "11:00 AM – 11:00 PM",
        facebook: "https://www.facebook.com/blackorchidchennai/",
        whatsapp: "+919585018502",
        banquetCapacity: "Up to 300 guests",
        banquetDesc: "Our grand banquet facility is a canvas for your most cherished occasions — from corporate gatherings to special celebrations.",
        metaTitle: "Black Orchid — Restobar & Fine Dining | Anna Nagar East, Chennai",
        metaDesc: "A stylish restobar in Anna Nagar East, Chennai, combining exquisite food, crafted cocktails, vibrant music, and elevated dining experiences.",
      },
    });

    // 3. Categories
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

    // 4. Menu Items
    const items = [
      { name: "Truffle Arancini", tagline: "A golden, truffle-laced beginning", desc: "Creamy saffron risotto spheres rolled in a crisp panko-parmesan crumb, finished with generous shavings of black truffle and a delicate truffle aioli.", shortDesc: "Crispy saffron risotto, black truffle, parmesan", price: 18, image: IMAGES.food[0], images: [IMAGES.food[0], IMAGES.food[4], IMAGES.food[6]], cat: "starters", veg: true, spice: 0, featured: true, chef: true, ingredients: ["Carnaroli risotto rice", "Saffron", "Black truffle", "Parmesan", "Panko breadcrumbs", "Truffle aioli"], allergens: ["Gluten", "Dairy", "Egg"], serving: "4 pieces" },
      { name: "Seared Diver Scallops", tagline: "From the cold depths, plated like jewels", desc: "Hand-dived scallops seared to a golden crust, resting on a silky cauliflower purée, finished with a caviar beurre blanc and a scatter of micro herbs.", shortDesc: "Pan-seared scallops, cauliflower purée, caviar", price: 26, image: IMAGES.food[4], images: [IMAGES.food[4], IMAGES.food[5], IMAGES.food[7]], cat: "starters", veg: false, spice: 0, featured: true, chef: false, ingredients: ["Diver scallops", "Cauliflower", "Caviar", "Butter", "Lemon", "Micro herbs"], allergens: ["Shellfish", "Dairy", "Fish"], serving: "3 scallops" },
      { name: "Yellowfin Tuna Tartare", tagline: "Raw, pristine, citrus-bright", desc: "Hand-cut yellowfin tuna tossed in citrus ponzu, layered with avocado, and crowned with a crisp wonton shard and toasted sesame.", shortDesc: "Yellowfin, avocado, ponzu, crisp wonton", price: 24, image: IMAGES.food[5], images: [IMAGES.food[5], IMAGES.food[0]], cat: "starters", veg: false, spice: 1, featured: false, chef: false, ingredients: ["Yellowfin tuna", "Avocado", "Ponzu", "Wonton", "Sesame", "Scallion"], allergens: ["Fish", "Gluten", "Sesame"], serving: "180g" },
      { name: "Burrata & Heirloom", tagline: "Summer, captured on a plate", desc: "A whole burrata oozing over ripe heirloom tomatoes, drizzled with basil oil and aged balsamic, served with a crisp sourdough shard.", shortDesc: "Burrata, heirloom tomatoes, basil oil, balsamic", price: 20, image: IMAGES.food[6], images: [IMAGES.food[6], IMAGES.food[0]], cat: "starters", veg: true, spice: 0, featured: false, chef: false, ingredients: ["Burrata", "Heirloom tomatoes", "Basil oil", "Aged balsamic", "Sourdough"], allergens: ["Dairy", "Gluten"], serving: "Single portion" },
      { name: "A5 Wagyu Tenderloin", tagline: "The crown jewel of the menu", desc: "Japanese A5 wagyu tenderloin, seared on cast iron and basted in bone-marrow butter, served with a charred shallot and a deep red wine jus.", shortDesc: "A5 wagyu, bone-marrow butter, red wine jus", price: 89, image: IMAGES.food[1], images: [IMAGES.food[1], IMAGES.food[4], IMAGES.food[7]], cat: "main-course", veg: false, spice: 0, featured: true, chef: true, ingredients: ["A5 Japanese wagyu", "Bone marrow", "Butter", "Shallot", "Red wine jus", "Flake salt"], allergens: ["Dairy"], serving: "200g" },
      { name: "Butter-Poached Lobster", tagline: "Theatre in a bowl", desc: "Maine lobster poached in clarified butter, set on herb fettuccine beneath a bisque foam, with charred cherry tomatoes and fresh tarragon.", shortDesc: "Maine lobster, herb fettuccine, bisque foam", price: 62, image: IMAGES.food[6], images: [IMAGES.food[6], IMAGES.food[2]], cat: "main-course", veg: false, spice: 0, featured: true, chef: false, ingredients: ["Maine lobster", "Fettuccine", "Lobster bisque", "Cherry tomato", "Tarragon", "Butter"], allergens: ["Shellfish", "Gluten", "Dairy"], serving: "Half lobster" },
      { name: "Herb Crusted Rack of Lamb", tagline: "Rosemary, smoke, mint", desc: "A Frenched rack of lamb crusted with rosemary and mustard, roasted pink and rested, served over smoked aubergine with a mint oil and a glossy garlic jus.", shortDesc: "Rosemary lamb, smoked aubergine, mint oil", price: 48, image: IMAGES.food[7], images: [IMAGES.food[7], IMAGES.food[1]], cat: "main-course", veg: false, spice: 0, featured: false, chef: false, ingredients: ["Rack of lamb", "Rosemary", "Dijon mustard", "Aubergine", "Mint", "Garlic jus"], allergens: ["Mustard"], serving: "4 chops" },
      { name: "Miso Black Cod", tagline: "Three days of patience", desc: "Black cod marinated in Saikyo miso for three days, then glazed to a deep amber lacquer. Served in a dashi broth with bok choy and pickled ginger.", shortDesc: "Miso-glazed cod, dashi, bok choy", price: 54, image: IMAGES.food[2], images: [IMAGES.food[2], IMAGES.food[5]], cat: "main-course", veg: false, spice: 1, featured: true, chef: true, ingredients: ["Black cod", "Saikyo miso", "Sake", "Mirin", "Dashi", "Bok choy", "Pickled ginger"], allergens: ["Fish", "Soy"], serving: "180g fillet" },
      { name: "Imperial Peking Duck", tagline: "Carved tableside, by tradition", desc: "A whole duck roasted over fruitwood until the skin shatters like glass, carved tableside and served with hand-folded steamed pancakes, hoisin, cucumber, and scallion.", shortDesc: "Crispy duck, pancakes, hoisin, scallion", price: 42, image: IMAGES.food[2], images: [IMAGES.food[2], IMAGES.food[3]], cat: "chinese", veg: false, spice: 0, featured: true, chef: true, ingredients: ["Whole duck", "Hoisin sauce", "Cucumber", "Scallion", "Steamed pancakes"], allergens: ["Gluten", "Soy"], serving: "Whole duck, 2 courses" },
      { name: "Dim Sum Platter", tagline: "Hand-folded, steamed to order", desc: "A selection of hand-folded prawn and pork dumplings, steamed in bamboo baskets, with a chilli oil and black vinegar dip.", shortDesc: "Prawn & pork dumplings, chilli oil, vinegar", price: 28, image: IMAGES.food[3], images: [IMAGES.food[3], IMAGES.food[2]], cat: "chinese", veg: false, spice: 1, featured: false, chef: false, ingredients: ["Prawns", "Pork", "Wonton wrappers", "Chilli oil", "Black vinegar", "Ginger"], allergens: ["Shellfish", "Gluten", "Soy"], serving: "6 pieces" },
      { name: "Royal Dum Biryani", tagline: "Sealed, slow-steamed, regal", desc: "Aged basmati layered with slow-cooked lamb, fried onions, saffron, and whole spices, sealed and dum-cooked until each grain is separate and fragrant.", shortDesc: "Basmati, lamb, saffron, sealed & slow-cooked", price: 34, image: IMAGES.food[1], images: [IMAGES.food[1], IMAGES.food[5]], cat: "indian", veg: false, spice: 2, featured: true, chef: true, ingredients: ["Aged basmati", "Lamb", "Saffron", "Fried onion", "Whole spices", "Yoghurt"], allergens: ["Dairy"], serving: "Large bowl" },
      { name: "Butter Chicken", tagline: "The beloved classic, elevated", desc: "Tandoor-roasted chicken in a silky tomato cream gravy finished with fenugreek and a swirl of cream, served with fresh naan from the tandoor.", shortDesc: "Tandoor chicken, tomato cream, fenugreek, naan", price: 29, image: IMAGES.food[5], images: [IMAGES.food[5], IMAGES.food[0]], cat: "indian", veg: false, spice: 1, featured: true, chef: false, ingredients: ["Chicken", "Tomato", "Cream", "Fenugreek", "Ginger-garlic", "Naan"], allergens: ["Dairy", "Gluten"], serving: "Single portion" },
      { name: "Dark Chocolate Sphere", tagline: "Revealed at the table", desc: "A dark chocolate sphere melted tableside with warm raspberry coulis, revealing a molten centre, gold leaf, and vanilla bean ice cream.", shortDesc: "Molten centre, gold leaf, raspberry, vanilla", price: 16, image: IMAGES.dessert[0], images: [IMAGES.dessert[0], IMAGES.dessert[1], IMAGES.dessert[3]], cat: "desserts", veg: true, spice: 0, featured: true, chef: true, ingredients: ["70% dark chocolate", "Raspberry", "Vanilla bean", "Gold leaf", "Cream"], allergens: ["Dairy"], serving: "Single portion" },
      { name: "Black Orchid Martini", tagline: "The house signature", desc: "London Dry gin shaken with blackberry, elderflower, and lime, strained into a chilled coupe and finished with a flake of edible gold.", shortDesc: "Gin, blackberry, elderflower, edible gold", price: 18, image: IMAGES.drinks[0], images: [IMAGES.drinks[0], IMAGES.drinks[3]], cat: "cocktails", veg: true, spice: 0, featured: true, chef: true, ingredients: ["London Dry gin", "Blackberry", "Elderflower", "Lime", "Edible gold"], allergens: [], serving: "120ml coupe" },
    ];

    if (menuCount === 0) {
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (catMap[it.cat]) {
          await db.menuItem.create({
            data: {
              name: it.name,
              tagline: it.tagline,
              description: it.desc,
              shortDescription: it.shortDesc,
              price: it.price,
              image: it.image,
              images: JSON.stringify(it.images),
              categoryId: catMap[it.cat],
              veg: it.veg,
              spice: it.spice,
              featured: it.featured,
              chefRecommended: it.chef,
              ingredients: JSON.stringify(it.ingredients),
              allergens: JSON.stringify(it.allergens),
              servingSize: it.serving,
              available: true,
              order: i,
            },
          });
        }
      }
    }

    // 5. Gallery
    const galleryCount = await db.galleryImage.count().catch(() => 0);
    if (galleryCount === 0) {
      const gallery = [
        { title: "Velvet Lounge", url: IMAGES.interior[0], category: "Interior", caption: "Our signature velvet lounge bathed in golden light" },
        { title: "Chef's Tasting", url: IMAGES.food[0], category: "Food", caption: "A composed tasting course by Chef Aurelio" },
        { title: "Midnight Negroni", url: IMAGES.drinks[0], category: "Drinks", caption: "Crafted cocktails at the marble bar" },
        { title: "Grand Hall", url: IMAGES.banquet[1], category: "Banquet", caption: "The grand banquet hall set for an evening of celebration" },
        { title: "Wagyu Course", url: IMAGES.food[1], category: "Food", caption: "A5 Wagyu, the crown jewel of the menu" },
        { title: "Chandelier Atrium", url: IMAGES.interior[1], category: "Interior", caption: "Crystal chandeliers in the main atrium" },
        { title: "Smoked Old Fashioned", url: IMAGES.drinks[1], category: "Drinks", caption: "Theatre of smoke at the bar" },
        { title: "Wedding Gala", url: IMAGES.banquet[2], category: "Events", caption: "An opulent wedding celebration" },
      ];
      for (let i = 0; i < gallery.length; i++) {
        await db.galleryImage.create({ data: { ...gallery[i], order: i } });
      }
    }

    // 6. Testimonials
    const testCount = await db.testimonial.count().catch(() => 0);
    if (testCount === 0) {
      const testimonials = [
        { name: "Eleanor Whitmore", role: "Food Critic, The Gazette", rating: 5, message: "An evening at Black Orchid is nothing short of theatrical. Every plate arrives as a work of art, every flavour a revelation.", photo: IMAGES.avatar[0], featured: true },
        { name: "Marcus Delacroix", role: "Regular Patron", rating: 5, message: "We've celebrated every milestone here for five years. The service anticipates your needs before you do. Simply the finest dining in the city.", photo: IMAGES.avatar[1], featured: true },
        { name: "Priya Nair", role: "Wedding Client", rating: 5, message: "Our wedding banquet was flawless. The team transformed the hall into a dream and the catering left our guests speechless.", photo: IMAGES.avatar[2], featured: true },
      ];
      for (let i = 0; i < testimonials.length; i++) {
        await db.testimonial.create({ data: { ...testimonials[i], order: i } });
      }
    }

    // 7. Events
    const eventCount = await db.eventItem.count().catch(() => 0);
    if (eventCount === 0) {
      const events = [
        { title: "Truffle & Wine Gala", description: "An exclusive evening pairing rare truffles with vintage wines, curated by our sommelier and executive chef.", date: "2025-03-22", image: IMAGES.food[1], published: true },
        { title: "Valentine's Tasting Menu", description: "A seven-course tasting menu designed for two, with live jazz and a complimentary champagne toast.", date: "2025-02-14", image: IMAGES.ambiance[0], published: true },
      ];
      for (const e of events) {
        await db.eventItem.create({ data: e });
      }
    }

    // 8. Catering Packages
    const pkgCount = await db.cateringPackage.count().catch(() => 0);
    if (pkgCount === 0) {
      const pkgs = [
        {
          name: "Cocktail Reception",
          guests: "25 – 100 Guests",
          description: "An elegant evening of passed hors d'oeuvres, signature cocktails, and live station theatre.",
          price: 65,
          image: IMAGES.drinks[0],
          features: "8 Passed Canapés | 2 Signature Cocktails | Dedicated Mixologist | Full Service Staff | Glassware & Decor Setup",
          order: 0,
        },
        {
          name: "Grand Banquet Buffet",
          guests: "50 – 250 Guests",
          description: "Our signature multi-course buffet featuring Indian, Pan-Asian, and Continental specialities.",
          price: 95,
          image: IMAGES.food[4],
          features: "6 Starters & 8 Main Courses | Live Grilling Station | Full Dessert Symphony | Executive Chef Supervision | Complete Linen & Tableware",
          order: 1,
        },
        {
          name: "Royal Plated Gala",
          guests: "30 – 150 Guests",
          description: "An opulent 5-course sit-down dinner with wine pairings and white-glove butler service.",
          price: 140,
          image: IMAGES.banquet[2],
          features: "5-Course Gourmet Plated Dinner | Sommelier Wine Pairings | White-Glove Butler Service | Custom Printed Menus & Place Cards | Pre-Event Tasting for 4",
          order: 2,
        },
      ];
      for (const p of pkgs) {
        await db.cateringPackage.create({ data: p });
      }
    }

    console.log("✅ Auto-seed completed successfully!");
  } catch (e) {
    console.error("Auto-seed error:", e);
  } finally {
    isSeeding = false;
  }
}
