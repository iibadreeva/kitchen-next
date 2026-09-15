import { ingredientCreateSchema } from "@/lib/zod";
import type { z } from "zod";

export type IngredientType = {
  id: string;
  name: string;
  category: string;
  unit: string;
  pricePerUnit: number;
  description: string | null;
};

export type IngredientInput = z.infer<typeof ingredientCreateSchema>;
