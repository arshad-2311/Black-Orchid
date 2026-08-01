# Database Seed — `prisma/seed.ts`

This document describes exactly what the `prisma/seed.ts` script writes into the
Black Orchid SQLite database (`db/custom.db`) and how to re-run it.

The script imports:

```ts
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";
import { IMAGES } from "../src/lib/images";
```

It is idempotent — running it twice will not duplicate rows (see
[Re-seeding](#re-seeding) below).

---

## 1. Admin User

A single administrator is created (or, if one already exists with the same
email, the password is reset to `admin123`).

| Field    | Value                                       |
| -------- | ------------------------------------------- |
| email    | `admin@blackorchid.com`                     |
| name     | `Restaurant Administrator`                  |
| password | `admin123` (hashed with **bcrypt, 12 rounds**) |
| role     | `ADMIN`                                     |

Login URL: navigate to `/#admin` (or `/admin`).

> The hash stored in the DB always starts with `$2b$12$`. See
> [`src/lib/auth.ts`](../src/lib/auth.ts) — `BCRYPT_ROUNDS = 12`.

---

## 2. Site Settings (singleton)

Upserted against `id = "singleton"`. Only the `create` branch sets values; on
re-seed the existing settings are preserved (the `update: {}` is intentional —
we don't want to clobber edits the admin made in the dashboard).

| Field            | Value (abbreviated)                                                            |
| ---------------- | ------------------------------------------------------------------------------ |
| restaurantName   | `Black Orchid`                                                                 |
| tagline          | `Fine Dining & Banquet`                                                        |
| heroTitle        | `An Exquisite Symphony of Flavour`                                             |
| heroSubtitle     | `Where culinary artistry meets timeless elegance — an evening destined to…`    |
| aboutTitle       | `A Legacy of Culinary Excellence`                                              |
| aboutBody        | `Born from a passion for the extraordinary, Black Orchid has redefined…`       |
| phone            | `+1 (555) 010-2024`                                                            |
| email            | `reservations@blackorchid.com`                                                 |
| address          | `128 Velvet Lane, Downtown District, Metropolis`                               |
| hoursWeekday     | `11:00 AM – 11:00 PM`                                                          |
| hoursWeekend     | `10:00 AM – 12:30 AM`                                                          |
| instagram        | `https://instagram.com`                                                        |
| facebook         | `https://facebook.com`                                                         |
| twitter          | `https://twitter.com`                                                          |
| whatsapp         | `+15550102024`                                                                 |
| banquetCapacity  | `Up to 300 guests`                                                             |
| banquetDesc      | `Our grand banquet hall is a canvas for your most cherished occasions…`        |
| metaTitle        | `Black Orchid — Fine Dining & Banquet`                                         |
| metaDesc         | `A premier luxury restaurant & banquet facility offering exquisite cuisine…`   |

---

## 3. Menu Categories (6)

Upserted by `slug`. The `order` field controls display order in the public menu
and admin panel.

| Order | Name         | Slug           |
| ----- | ------------ | -------------- |
| 0     | Starters     | `starters`     |
| 1     | Main Course  | `main-course`  |
| 2     | Chinese      | `chinese`      |
| 3     | Indian       | `indian`       |
| 4     | Desserts     | `desserts`     |
| 5     | Cocktails    | `cocktails`    |

---

## 4. Menu Items (24)

Existing items are **deleted** (`db.menuItem.deleteMany({})`) and recreated on
every seed run, so the list is always exactly the 24 below.

Each item has these fields (mapped from the seed object):

| Seed field | DB field          | Notes                                                |
| ---------- | ----------------- | ---------------------------------------------------- |
| `name`     | `name`            | String                                               |
| `tagline`  | `tagline`         | Short poetic tagline shown on cards                  |
| `desc`     | `description`     | Full description for the dish showcase               |
| `shortDesc`| `shortDescription`| One-liner for cards                                  |
| `price`    | `price`           | Float (USD)                                          |
| `image`    | `image`           | Primary image URL                                    |
| `images`   | `images`          | **JSON-encoded array** of 1–3 URLs (gallery)         |
| `cat`      | `categoryId`      | Resolved from `catMap[slug]`                         |
| `veg`      | `veg`             | Boolean                                              |
| `spice`    | `spice`           | 0–3                                                  |
| `featured` | `featured`        | Boolean (shown in "Signature Dishes")                |
| `chef`     | `chefRecommended` | Boolean (gold "Chef Recommended" badge)              |
| `ingredients` | `ingredients`  | **JSON-encoded array** of strings                    |
| `allergens`   | `allergens`    | **JSON-encoded array** of strings                    |
| `serving`  | `servingSize`     | e.g. `"4 pieces"`, `"200g"`, `"120ml coupe"`         |

`order` is the index in the array. `available` is always `true`.

### Representative examples

**Truffle Arancini** (Starters)
- tagline: "A golden, truffle-laced beginning"
- price: `$18`, veg, spice 0, featured + chef-recommended
- ingredients: Carnaroli risotto rice, Saffron, Black truffle, Parmesan, Panko breadcrumbs, Truffle aioli
- allergens: Gluten, Dairy, Egg
- serving: "4 pieces"
- images: 3 (`IMAGES.food[0]`, `[4]`, `[6]`)

**A5 Wagyu Tenderloin** (Main Course)
- tagline: "The crown jewel of the menu"
- price: `$89`, non-veg, spice 0, featured + chef-recommended
- ingredients: A5 Japanese wagyu, Bone marrow, Butter, Shallot, Red wine jus, Flake salt
- allergens: Dairy
- serving: "200g"

**Black Orchid Martini** (Cocktails)
- tagline: "The house signature"
- price: `$18`, veg, spice 0, featured + chef-recommended
- ingredients: London Dry gin, Blackberry, Elderflower, Lime, Edible gold
- allergens: *(none)*
- serving: "120ml coupe"

### Full list (24)

| # | Name                          | Category    | Price | Veg | Chef |
| - | ----------------------------- | ----------- | ----- | --- | ---- |
| 1 | Truffle Arancini              | Starters    | 18    | ✓   | ✓    |
| 2 | Seared Diver Scallops         | Starters    | 26    |     |      |
| 3 | Yellowfin Tuna Tartare        | Starters    | 24    |     |      |
| 4 | Burrata & Heirloom            | Starters    | 20    | ✓   |      |
| 5 | A5 Wagyu Tenderloin           | Main Course | 89    |     | ✓    |
| 6 | Butter-Poached Lobster        | Main Course | 62    |     |      |
| 7 | Herb Crusted Rack of Lamb     | Main Course | 48    |     |      |
| 8 | Miso Black Cod                | Main Course | 54    |     | ✓    |
| 9 | Imperial Peking Duck          | Chinese     | 42    |     | ✓    |
| 10| Dim Sum Platter               | Chinese     | 28    |     |      |
| 11| Szechuan Mapo Tofu            | Chinese     | 22    | ✓   |      |
| 12| Crispy Chilli Beef            | Chinese     | 30    |     |      |
| 13| Royal Dum Biryani             | Indian      | 34    |     | ✓    |
| 14| Butter Chicken                | Indian      | 29    |     |      |
| 15| Paneer Tikka Masala           | Indian      | 24    | ✓   |      |
| 16| Dal Makhani                   | Indian      | 19    | ✓   |      |
| 17| Dark Chocolate Sphere         | Desserts    | 16    | ✓   | ✓    |
| 18| Tahitian Crème Brûlée         | Desserts    | 14    | ✓   |      |
| 19| Deconstructed Tiramisu        | Desserts    | 15    | ✓   |      |
| 20| Pistachio Soufflé             | Desserts    | 17    | ✓   |      |
| 21| Black Orchid Martini          | Cocktails   | 18    | ✓   | ✓    |
| 22| Smoked Old Fashioned          | Cocktails   | 19    | ✓   |      |
| 23| Golden Elixir                 | Cocktails   | 22    | ✓   |      |
| 24| Garden Negroni                | Cocktails   | 17    | ✓   |      |

---

## 5. Gallery Images (16)

Existing gallery rows are deleted and recreated. Each has `title`, `url`
(local `/img/*.webp`), `caption`, `category`, and `order` (= index).

Categories in use: `Food`, `Drinks`, `Interior`, `Events`, `Banquet`.

| Title                  | Category | Caption (abbreviated)                                   |
| ---------------------- | -------- | ------------------------------------------------------- |
| Velvet Lounge          | Interior | Our signature velvet lounge bathed in golden light      |
| Chef's Tasting         | Food     | A composed tasting course by Chef Aurelio               |
| Midnight Negroni       | Drinks   | Crafted cocktails at the marble bar                     |
| Grand Hall             | Banquet  | The grand banquet hall set for an evening…              |
| Wagyu Course           | Food     | A5 Wagyu, the crown jewel of the menu                   |
| Chandelier Atrium      | Interior | Crystal chandeliers in the main atrium                  |
| Smoked Old Fashioned   | Drinks   | Theatre of smoke at the bar                             |
| Wedding Gala           | Events   | An opulent wedding celebration                          |
| Chocolate Sphere       | Food     | Dessert, revealed tableside                             |
| Private Dining         | Interior | The intimate private dining room                        |
| Peking Duck            | Food     | Imperial Peking Duck, carved tableside                  |
| Reception Glow         | Events   | A gala reception under warm lights                      |
| Cocktail Bar           | Drinks   | The marble cocktail bar                                 |
| Golden Booth           | Interior | A golden booth for intimate evenings                    |
| Corporate Gala         | Events   | A corporate gala dinner                                 |
| Pistachio Soufflé      | Food     | Pistachio soufflé, risen to perfection                  |

---

## 6. Testimonials (6)

Existing testimonials are deleted and recreated.

| Name               | Role                          | Rating | Featured |
| ------------------ | ----------------------------- | ------ | -------- |
| Eleanor Whitmore   | Food Critic, The Gazette      | 5      | ✓        |
| Marcus Delacroix   | Regular Patron                | 5      | ✓        |
| Priya Nair         | Wedding Client                | 5      | ✓        |
| James Holloway     | Business Executive            | 4      |          |
| Sofia Marchetti    | Lifestyle Blogger             | 5      | ✓        |
| Daniel Cho         | Anniversary Guest             | 5      |          |

Each testimonial stores: `name`, `role`, `photo` (local WebP avatar),
`rating` (4–5), `message`, `featured` (boolean), `order` (index).

---

## 7. Events (4)

Existing events are deleted and recreated. `published` is set to `true` for all.

| Title                          | Date       | Image source        |
| ------------------------------ | ---------- | ------------------- |
| Truffle & Wine Gala            | 2025-03-22 | `IMAGES.food[1]`    |
| Valentine's Tasting Menu       | 2025-02-14 | `IMAGES.ambiance[0]`|
| Mixology Masterclass           | 2025-04-05 | `IMAGES.drinks[1]`  |
| Diwali Grand Celebration       | 2025-10-21 | `IMAGES.banquet[0]` |

---

## 8. Catering Packages (3)

Existing packages are deleted and recreated.

| Package          | Price /guest | Guests range    | Order | Notes                |
| ---------------- | ------------ | --------------- | ----- | -------------------- |
| Silver Soirée    | $65          | 20–50 guests    | 0     | Entry tier           |
| Golden Gala      | $120         | 100–250 guests  | 1     | **Most Popular**     |
| Platinum Royal   | $220         | 250–500 guests  | 2     | Bespoke top tier     |

The `features` field is a pipe-separated string (e.g.
`"5-course plated menu|Premium beverage station|Dedicated service staff|Linens & tableware|2-hour service window"`).

---

## Re-seeding

The script is idempotent. Safe operations:

- **Admin user** — `findUnique` → create if missing, otherwise reset password.
- **Site settings** — `upsert` with empty `update` (preserves admin edits).
- **Menu categories** — `upsert` by slug.
- **Menu items, gallery, testimonials, events, catering packages** —
  `deleteMany({})` then `create` (always reflects the seed file).

To re-seed:

```bash
# 1. (Optional) wipe the DB and re-apply the schema
bun run db:push

# 2. Run the seed script directly with bun
bun prisma/seed.ts

# 3. Restart the dev server so the Prisma client picks up fresh data
#    (Ctrl-C the running `bun run dev`, then `bun run dev` again)
```

Expected output:

```
🌱 Seeding Black Orchid database...
  ✓ Admin user created (admin@blackorchid.com / admin123)
  ✓ Site settings seeded
  ✓ Menu categories seeded
  ✓ 24 menu items seeded
  ✓ 16 gallery images seeded
  ✓ 6 testimonials seeded
  ✓ 4 events seeded
  ✓ 3 catering packages seeded

✅ Seeding complete!
   Admin login: admin@blackorchid.com / admin123
```

> If the admin already exists, the first line becomes
> `  ✓ Admin password reset to admin123` — this is expected, not an error.

---

## Related

- [DATABASE.md](./DATABASE.md) — full schema reference.
- [ADMIN_CMS.md](./ADMIN_CMS.md) — how the admin UI edits these records.
- [AUTHENTICATION.md](./AUTHENTICATION.md) — bcrypt + JWT details.
