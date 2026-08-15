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
        password: await hashPassword("admin123"),
        role: "ADMIN",
      },
    });
    console.log("  ✓ Admin user created (admin@blackorchid.com / admin123)");
  } else {
    await db.adminUser.update({
      where: { email: adminEmail },
      data: { password: await hashPassword("admin123") },
    });
    console.log("  ✓ Admin password reset to admin123");
  }

  // 2. Site settings
  await db.siteSettings.upsert({
    where: { id: "singleton" },
    update: {
      phone: "+91 95850 18502",
      phoneSecondary: null,
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
      phoneSecondary: null,
      email: "boan.reservations@gmail.com",
      address: "G Block, L33, 1st Avenue, R.V. Nagar, Brindhavan Colony, VOC Nagar, Anna Nagar East, Chennai, Tamil Nadu – 600102",
      mapEmbed: "https://maps.google.com/?q=Black+Orchid+Anna+Nagar+East+Chennai",
      hoursWeekday: "11:00 AM – 11:00 PM",
      hoursWeekend: "11:00 AM – 11:00 PM",
      instagram: "",
      facebook: "https://www.facebook.com/blackorchidchennai/",
      twitter: "",
      whatsapp: "+919585018502",
      banquetCapacity: "Up to 300 guests",
      banquetDesc:
        "Our grand banquet facility is a canvas for your most cherished occasions — from corporate gatherings to special celebrations.",
      metaTitle: "Black Orchid — Restobar & Fine Dining | Anna Nagar East, Chennai",
      metaDesc:
        "A stylish restobar in Anna Nagar East, Chennai, combining exquisite food, crafted cocktails, vibrant music, and elevated dining experiences.",
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

  // 4. Menu items — rich data for premium dish showcase
  const items = [
    // Starters
    { name: "Truffle Arancini", tagline: "A golden, truffle-laced beginning", desc: "Creamy saffron risotto spheres rolled in a crisp panko-parmesan crumb, finished with generous shavings of black truffle and a delicate truffle aioli. Served on a warm slate with micro herbs.", shortDesc: "Crispy saffron risotto, black truffle, parmesan", price: 18, image: IMAGES.food[0], images: [IMAGES.food[0], IMAGES.food[4], IMAGES.food[6]], cat: "starters", veg: true, spice: 0, featured: true, chef: true, ingredients: ["Carnaroli risotto rice", "Saffron", "Black truffle", "Parmesan", "Panko breadcrumbs", "Truffle aioli"], allergens: ["Gluten", "Dairy", "Egg"], serving: "4 pieces" },
    { name: "Seared Diver Scallops", tagline: "From the cold depths, plated like jewels", desc: "Hand-dived scallops seared to a golden crust, resting on a silky cauliflower purée, finished with a caviar beurre blanc and a scatter of micro herbs. A study in restraint and luxury.", shortDesc: "Pan-seared scallops, cauliflower purée, caviar", price: 26, image: IMAGES.food[4], images: [IMAGES.food[4], IMAGES.food[5], IMAGES.food[7]], cat: "starters", veg: false, spice: 0, featured: true, chef: false, ingredients: ["Diver scallops", "Cauliflower", "Caviar", "Butter", "Lemon", "Micro herbs"], allergens: ["Shellfish", "Dairy", "Fish"], serving: "3 scallops" },
    { name: "Yellowfin Tuna Tartare", tagline: "Raw, pristine, citrus-bright", desc: "Hand-cut yellowfin tuna tossed in citrus ponzu, layered with avocado, and crowned with a crisp wonton shard and toasted sesame. Bright, clean, and impossibly fresh.", shortDesc: "Yellowfin, avocado, ponzu, crisp wonton", price: 24, image: IMAGES.food[5], images: [IMAGES.food[5], IMAGES.food[0]], cat: "starters", veg: false, spice: 1, featured: false, chef: false, ingredients: ["Yellowfin tuna", "Avocado", "Ponzu", "Wonton", "Sesame", "Scallion"], allergens: ["Fish", "Gluten", "Sesame"], serving: "180g" },
    { name: "Burrata & Heirloom", tagline: "Summer, captured on a plate", desc: "A whole burrata oozing over ripe heirloom tomatoes, drizzled with basil oil and aged balsamic, served with a crisp sourdough shard. Simple, seasonal, sublime.", shortDesc: "Burrata, heirloom tomatoes, basil oil, balsamic", price: 20, image: IMAGES.food[6], images: [IMAGES.food[6], IMAGES.food[0]], cat: "starters", veg: true, spice: 0, featured: false, chef: false, ingredients: ["Burrata", "Heirloom tomatoes", "Basil oil", "Aged balsamic", "Sourdough"], allergens: ["Dairy", "Gluten"], serving: "Single portion" },
    // Main Course
    { name: "A5 Wagyu Tenderloin", tagline: "The crown jewel of the menu", desc: "Japanese A5 wagyu tenderloin, seared on cast iron and basted in bone-marrow butter, served with a charred shallot and a deep red wine jus. Marbled, melting, unforgettable.", shortDesc: "A5 wagyu, bone-marrow butter, red wine jus", price: 89, image: IMAGES.food[1], images: [IMAGES.food[1], IMAGES.food[4], IMAGES.food[7]], cat: "main-course", veg: false, spice: 0, featured: true, chef: true, ingredients: ["A5 Japanese wagyu", "Bone marrow", "Butter", "Shallot", "Red wine jus", "Flake salt"], allergens: ["Dairy"], serving: "200g" },
    { name: "Butter-Poached Lobster", tagline: "Theatre in a bowl", desc: "Maine lobster poached in clarified butter, set on herb fettuccine beneath a bisque foam, with charred cherry tomatoes and fresh tarragon. Decadent from the first twirl.", shortDesc: "Maine lobster, herb fettuccine, bisque foam", price: 62, image: IMAGES.food[6], images: [IMAGES.food[6], IMAGES.food[2]], cat: "main-course", veg: false, spice: 0, featured: true, chef: false, ingredients: ["Maine lobster", "Fettuccine", "Lobster bisque", "Cherry tomato", "Tarragon", "Butter"], allergens: ["Shellfish", "Gluten", "Dairy"], serving: "Half lobster" },
    { name: "Herb Crusted Rack of Lamb", tagline: "Rosemary, smoke, mint", desc: "A Frenched rack of lamb crusted with rosemary and mustard, roasted pink and rested, served over smoked aubergine with a mint oil and a glossy garlic jus.", shortDesc: "Rosemary lamb, smoked aubergine, mint oil", price: 48, image: IMAGES.food[7], images: [IMAGES.food[7], IMAGES.food[1]], cat: "main-course", veg: false, spice: 0, featured: false, chef: false, ingredients: ["Rack of lamb", "Rosemary", "Dijon mustard", "Aubergine", "Mint", "Garlic jus"], allergens: ["Mustard"], serving: "4 chops" },
    { name: "Miso Black Cod", tagline: "Three days of patience", desc: "Black cod marinated in Saikyo miso for three days, then glazed to a deep amber lacquer. Served in a dashi broth with bok choy and pickled ginger. Buttery, sweet, iconic.", shortDesc: "Miso-glazed cod, dashi, bok choy", price: 54, image: IMAGES.food[2], images: [IMAGES.food[2], IMAGES.food[5]], cat: "main-course", veg: false, spice: 1, featured: true, chef: true, ingredients: ["Black cod", "Saikyo miso", "Sake", "Mirin", "Dashi", "Bok choy", "Pickled ginger"], allergens: ["Fish", "Soy"], serving: "180g fillet" },
    // Chinese
    { name: "Imperial Peking Duck", tagline: "Carved tableside, by tradition", desc: "A whole duck roasted over fruitwood until the skin shatters like glass, carved tableside and served with hand-folded steamed pancakes, hoisin, cucumber, and scallion. A ceremony in itself.", shortDesc: "Crispy duck, pancakes, hoisin, scallion", price: 42, image: IMAGES.food[2], images: [IMAGES.food[2], IMAGES.food[3]], cat: "chinese", veg: false, spice: 0, featured: true, chef: true, ingredients: ["Whole duck", "Hoisin sauce", "Cucumber", "Scallion", "Steamed pancakes"], allergens: ["Gluten", "Soy"], serving: "Whole duck, 2 courses" },
    { name: "Dim Sum Platter", tagline: "Hand-folded, steamed to order", desc: "A selection of hand-folded prawn and pork dumplings, steamed in bamboo baskets, with a chilli oil and black vinegar dip. Delicate parcels of the kitchen's craft.", shortDesc: "Prawn & pork dumplings, chilli oil, vinegar", price: 28, image: IMAGES.food[3], images: [IMAGES.food[3], IMAGES.food[2]], cat: "chinese", veg: false, spice: 1, featured: false, chef: false, ingredients: ["Prawns", "Pork", "Wonton wrappers", "Chilli oil", "Black vinegar", "Ginger"], allergens: ["Shellfish", "Gluten", "Soy"], serving: "6 pieces" },
    { name: "Szechuan Mapo Tofu", tagline: "Numbing, fiery, addictive", desc: "Silken tofu in a glossy sauce of szechuan peppercorn, chilli bean paste, and ground pork, finished with a curl of spring onion. The kind of heat that calls you back.", shortDesc: "Silken tofu, szechuan pepper, chilli bean", price: 22, image: IMAGES.food[3], images: [IMAGES.food[3]], cat: "chinese", veg: true, spice: 3, featured: false, chef: false, ingredients: ["Silken tofu", "Szechuan peppercorn", "Chilli bean paste", "Spring onion"], allergens: ["Soy"], serving: "Single bowl" },
    { name: "Crispy Chilli Beef", tagline: "Wok-charred, glassy, sweet-hot", desc: "Strips of beef wok-tossed until crisp and glassy in a sweet chilli glaze with garlic and spring onion. The texture is the theatre here — shatter then melt.", shortDesc: "Crispy beef, chilli, garlic, spring onion", price: 30, image: IMAGES.food[7], images: [IMAGES.food[7], IMAGES.food[1]], cat: "chinese", veg: false, spice: 2, featured: false, chef: false, ingredients: ["Beef sirloin", "Chilli", "Garlic", "Spring onion", "Soy"], allergens: ["Soy", "Gluten"], serving: "220g" },
    // Indian
    { name: "Royal Dum Biryani", tagline: "Sealed, slow-steamed, regal", desc: "Aged basmati layered with slow-cooked lamb, fried onions, saffron, and whole spices, sealed and dum-cooked until each grain is separate and fragrant. Served with raita and mirchi salan.", shortDesc: "Basmati, lamb, saffron, sealed & slow-cooked", price: 34, image: IMAGES.food[1], images: [IMAGES.food[1], IMAGES.food[5]], cat: "indian", veg: false, spice: 2, featured: true, chef: true, ingredients: ["Aged basmati", "Lamb", "Saffron", "Fried onion", "Whole spices", "Yoghurt"], allergens: ["Dairy"], serving: "Large bowl" },
    { name: "Butter Chicken", tagline: "The beloved classic, elevated", desc: "Tandoor-roasted chicken in a silky tomato cream gravy finished with fenugreek and a swirl of cream, served with fresh naan from the tandoor. Comfort, refined.", shortDesc: "Tandoor chicken, tomato cream, fenugreek, naan", price: 29, image: IMAGES.food[5], images: [IMAGES.food[5], IMAGES.food[0]], cat: "indian", veg: false, spice: 1, featured: true, chef: false, ingredients: ["Chicken", "Tomato", "Cream", "Fenugreek", "Ginger-garlic", "Naan"], allergens: ["Dairy", "Gluten"], serving: "Single portion" },
    { name: "Paneer Tikka Masala", tagline: "Char-grilled, cashew-silk", desc: "Cubes of cottage cheese marinated and char-grilled, folded into a cashew-tomato gravy with a finish of cilantro. The vegetarian centrepiece that surprises even carnivores.", shortDesc: "Grilled paneer, cashew tomato gravy, cilantro", price: 24, image: IMAGES.food[0], images: [IMAGES.food[0], IMAGES.food[4]], cat: "indian", veg: true, spice: 2, featured: false, chef: false, ingredients: ["Paneer", "Cashew", "Tomato", "Cilantro", "Spices"], allergens: ["Dairy", "Nuts"], serving: "Single portion" },
    { name: "Dal Makhani", tagline: "Overnight, smoked, soulful", desc: "Black lentils slow-cooked overnight with butter and cream, finished with a charcoal smoke under a sealed lid. Deep, dark, and unctuous — the soul of the Indian kitchen.", shortDesc: "Black lentils, butter, cream, smoked", price: 19, image: IMAGES.food[4], images: [IMAGES.food[4]], cat: "indian", veg: true, spice: 1, featured: false, chef: false, ingredients: ["Black urad lentils", "Butter", "Cream", "Tomato", "Charcoal smoke"], allergens: ["Dairy"], serving: "Single bowl" },
    // Desserts
    { name: "Dark Chocolate Sphere", tagline: "Revealed at the table", desc: "A dark chocolate sphere melted tableside with warm raspberry coulis, revealing a molten centre, gold leaf, and vanilla bean ice cream. A small piece of theatre to close.", shortDesc: "Molten centre, gold leaf, raspberry, vanilla", price: 16, image: IMAGES.dessert[0], images: [IMAGES.dessert[0], IMAGES.dessert[1], IMAGES.dessert[3]], cat: "desserts", veg: true, spice: 0, featured: true, chef: true, ingredients: ["70% dark chocolate", "Raspberry", "Vanilla bean", "Gold leaf", "Cream"], allergens: ["Dairy"], serving: "Single portion" },
    { name: "Tahitian Crème Brûlée", tagline: "The crack, then the silk", desc: "Tahitian vanilla custard with a caramelised sugar crust shattered at the table, served with a shortbread biscuit. The classic, done with the rarest vanilla.", shortDesc: "Vanilla custard, caramelised crust, shortbread", price: 14, image: IMAGES.dessert[1], images: [IMAGES.dessert[1], IMAGES.dessert[2]], cat: "desserts", veg: true, spice: 0, featured: false, chef: false, ingredients: ["Tahitian vanilla", "Cream", "Egg yolk", "Sugar", "Shortbread"], allergens: ["Dairy", "Egg", "Gluten"], serving: "Single ramekin" },
    { name: "Deconstructed Tiramisu", tagline: "Espresso soil, mascarpone cloud", desc: "Mascarpone cream layered with espresso soil, cocoa, and amaretto pearls — the familiar flavours of tiramisu reimagined as a modern composition.", shortDesc: "Mascarpone, espresso soil, cocoa, amaretto", price: 15, image: IMAGES.dessert[2], images: [IMAGES.dessert[2]], cat: "desserts", veg: true, spice: 0, featured: false, chef: false, ingredients: ["Mascarpone", "Espresso", "Cocoa", "Amaretto", "Ladyfinger"], allergens: ["Dairy", "Egg", "Gluten", "Nuts"], serving: "Single glass" },
    { name: "Pistachio Soufflé", tagline: "Rises to order, falls to the spoon", desc: "A warm pistachio soufflé risen to the rim, served with rose cream, honeycomb, and a dust of pistachio. Order it early — it waits for no one.", shortDesc: "Warm soufflé, rose cream, honeycomb", price: 17, image: IMAGES.dessert[3], images: [IMAGES.dessert[3], IMAGES.dessert[0]], cat: "desserts", veg: true, spice: 0, featured: true, chef: false, ingredients: ["Pistachio", "Egg white", "Rose", "Honeycomb", "Cream"], allergens: ["Dairy", "Egg", "Nuts"], serving: "Single ramekin" },
    // Cocktails
    { name: "Black Orchid Martini", tagline: "The house signature", desc: "London Dry gin shaken with blackberry, elderflower, and lime, strained into a chilled coupe and finished with a flake of edible gold. The cocktail that named the house.", shortDesc: "Gin, blackberry, elderflower, edible gold", price: 18, image: IMAGES.drinks[0], images: [IMAGES.drinks[0], IMAGES.drinks[3]], cat: "cocktails", veg: true, spice: 0, featured: true, chef: true, ingredients: ["London Dry gin", "Blackberry", "Elderflower", "Lime", "Edible gold"], allergens: [], serving: "120ml coupe" },
    { name: "Smoked Old Fashioned", tagline: "Smoke, then pour", desc: "Bourbon stirred with demerara and orange bitters under a dome of cherrywood smoke, lifted at the table to reveal a single brandied cherry. Theatre, then warmth.", shortDesc: "Bourbon, cherrywood smoke, demerara, bitters", price: 19, image: IMAGES.drinks[1], images: [IMAGES.drinks[1], IMAGES.drinks[5]], cat: "cocktails", veg: true, spice: 0, featured: false, chef: false, ingredients: ["Bourbon", "Demerara", "Orange bitters", "Cherrywood smoke", "Brandied cherry"], allergens: [], serving: "150ml" },
    { name: "Golden Elixir", tagline: "Champagne, lifted in gold", desc: "Vintage champagne with a float of cognac, saffron, and citrus, finished with a gold flake. The toast for the occasion that demands one.", shortDesc: "Champagne, cognac, saffron, gold flake", price: 22, image: IMAGES.drinks[3], images: [IMAGES.drinks[3], IMAGES.drinks[0]], cat: "cocktails", veg: true, spice: 0, featured: true, chef: false, ingredients: ["Vintage champagne", "Cognac", "Saffron", "Citrus", "Gold flake"], allergens: [], serving: "Flute" },
    { name: "Garden Negroni", tagline: "Botanical, bitter, smoked", desc: "Gin, vermouth, and Campari over a large rock with a flame-kissed rosemary sprig and a slice of blood orange. The Negroni, given a garden's breath.", shortDesc: "Gin, vermouth, Campari, smoked rosemary", price: 17, image: IMAGES.drinks[5], images: [IMAGES.drinks[5], IMAGES.drinks[1]], cat: "cocktails", veg: true, spice: 0, featured: false, chef: false, ingredients: ["Gin", "Sweet vermouth", "Campari", "Rosemary", "Blood orange"], allergens: [], serving: "150ml" },
  ];

  // Clear existing items then recreate for idempotency
  await db.menuItem.deleteMany({});
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
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
