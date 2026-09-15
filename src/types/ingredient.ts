import { ingredientCreateSchema } from "@/lib/zod";
import type { z } from "zod";

export type IngredientInput = z.infer<typeof ingredientCreateSchema>;

export type IngredientType = {
  id: string;
  name: string;
  category: IngredientInput["category"];
  unit: IngredientInput["unit"];
  pricePerUnit: number;
  description: string | null;
};
