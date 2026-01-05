export type GiftDTO = {
  id: string;
  title: string;
  url: string | null;
  description: string | null;
  price: number | null;
  currency: string | null;
  images: string[];
  mainImage: string | null;
  createdAt: string;
  updatedAt: string;
};
