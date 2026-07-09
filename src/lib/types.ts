// Shared client types matching Prisma models
export type MenuCategory = {
  id: string;
  name: string;
  slug: string;
  order: number;
  items: MenuItem[];
};

export type MenuItem = {
  id: string;
  name: string;
  tagline: string | null;
  description: string;
  shortDescription: string | null;
  price: number;
  image: string | null;
  images: string[]; // parsed from JSON
  categoryId: string;
  available: boolean;
  veg: boolean;
  spice: number;
  featured: boolean;
  chefRecommended: boolean;
  ingredients: string[]; // parsed from JSON
  allergens: string[]; // parsed from JSON
  servingSize: string | null;
  order: number;
};

export type GalleryImage = {
  id: string;
  title: string;
  url: string;
  caption: string | null;
  category: string;
  order: number;
};

export type Reservation = {
  id: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  guests: number;
  special: string | null;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  createdAt: string;
};

export type Testimonial = {
  id: string;
  name: string;
  role: string | null;
  photo: string | null;
  rating: number;
  message: string;
  featured: boolean;
  order: number;
};

export type EventItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  image: string | null;
  published: boolean;
};

export type CateringPackage = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  guests: string;
  features: string;
  order: number;
};

export type SiteSettings = {
  id: string;
  restaurantName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  aboutTitle: string;
  aboutBody: string;
  phone: string;
  email: string;
  address: string;
  mapEmbed: string | null;
  hoursWeekday: string;
  hoursWeekend: string;
  instagram: string;
  facebook: string;
  twitter: string;
  whatsapp: string;
  banquetCapacity: string;
  banquetDesc: string;
  metaTitle: string;
  metaDesc: string | null;
};

export type Stats = {
  totalReservations: number;
  todayReservations: number;
  pendingReservations: number;
  totalMenuItems: number;
  totalGallery: number;
  totalEvents: number;
  totalTestimonials: number;
  totalPackages: number;
  visitors: number;
  recentReservations: Reservation[];
  weekly: { date: string; count: number }[];
};
