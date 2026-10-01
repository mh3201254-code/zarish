export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  cover_image: string | null;
  sort_order: number;
  published: boolean;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  sale_price: number | null;
  category_id: string | null;
  category_slug: string;
  category_name: string;
  metal: string;
  stone: string;
  weight_grams: number | null;
  sizes: string[];
  stock: number;
  featured: boolean;
  published: boolean;
  sort_order: number;
  images: string[];
};

export type OrderStatus = "new" | "confirmed" | "shipped" | "delivered" | "cancelled";

export type OrderItem = {
  id: string;
  name: string;
  slug: string;
  unit_price: number;
  qty: number;
  size?: string;
};

export type Order = {
  id: string;
  ref: string | null;
  customer_name: string;
  phone: string;
  address: string;
  city: string;
  notes: string;
  payment_method: string;
  items: OrderItem[];
  subtotal: number;
  delivery_charge: number;
  total: number;
  status: OrderStatus;
  admin_notes: string;
  created_at: string;
};

export type Message = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export type Settings = Record<string, string>;
