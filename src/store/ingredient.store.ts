"use client";

import { create } from "zustand";

import {
  createIngredient,
  getIngredients,
  removeIngredient as removeIngredientAction,
} from "@/actions/ingredient";
import type { IngredientInput, IngredientType } from "@/types/ingredient";

export type AddIngredientResult =
  | { ok: true }
  | { ok: false; error: string };

type IngredientStateType = {
  ingredients: IngredientType[];
  isLoadingList: boolean;
  isSubmitting: boolean;
  deletingId: string | null;
  listError: string | null;
  /** Инвалидирует in-flight loadIngredients после локальных мутаций. */
  loadSeq: number;
  loadIngredients: () => Promise<void>;
  addIngredient: (data: IngredientInput) => Promise<AddIngredientResult>;
  removeIngredient: (id: string) => Promise<boolean>;
  clearListError: () => void;
};

export const useIngredientStore = create<IngredientStateType>((set, get) => ({
  ingredients: [],
  isLoadingList: false,
  isSubmitting: false,
  deletingId: null,
  listError: null,
  loadSeq: 0,

  clearListError: () => set({ listError: null }),

  loadIngredients: async () => {
    const seq = get().loadSeq + 1;
    set({ isLoadingList: true, listError: null, loadSeq: seq });

    try {
      const result = await getIngredients();
      if (get().loadSeq !== seq) return;

      if (result.success) {
        set({ ingredients: result.ingredients, isLoadingList: false });
      } else {
        set({ listError: result.error, isLoadingList: false });
      }
    } catch (error) {
      console.error("Failed to load ingredients:", error);
      if (get().loadSeq !== seq) return;
      set({
        listError: "Ошибка при загрузке ингредиентов",
        isLoadingList: false,
      });
    }
  },

  addIngredient: async (data) => {
    if (get().isSubmitting) {
      return { ok: false, error: "Добавление уже выполняется" };
    }

    set({ isSubmitting: true, listError: null });

    try {
      const result = await createIngredient(data);
      if (result.success) {
        const created: IngredientType = {
          id: result.ingredient.id,
          name: result.ingredient.name,
          category: result.ingredient.category,
          unit: result.ingredient.unit,
          pricePerUnit: result.ingredient.pricePerUnit,
          description: result.ingredient.description,
        };
        set((state) => ({
          ingredients: [...state.ingredients, created].sort((a, b) =>
            a.name.localeCompare(b.name, "ru"),
          ),
          isSubmitting: false,
          listError: null,
          // Сбрасываем in-flight load, чтобы не затереть локальный список.
          loadSeq: state.loadSeq + 1,
          isLoadingList: false,
        }));
        return { ok: true };
      }

      set({ isSubmitting: false });
      return { ok: false, error: result.error };
    } catch (error) {
      console.error("Failed to add ingredient:", error);
      set({ isSubmitting: false });
      return { ok: false, error: "Ошибка при добавлении ингредиента" };
    }
  },

  removeIngredient: async (id) => {
    set({ deletingId: id, listError: null });

    try {
      const result = await removeIngredientAction(id);
      if (result.success) {
        set((state) => ({
          ingredients: state.ingredients.filter(
            (ingredient) => ingredient.id !== id,
          ),
          deletingId: null,
          loadSeq: state.loadSeq + 1,
          isLoadingList: false,
        }));
        return true;
      }

      set({ listError: result.error, deletingId: null });
      return false;
    } catch (error) {
      console.error("Failed to remove ingredient:", error);
      set({
        listError: "Ошибка при удалении ингредиента",
        deletingId: null,
      });
      return false;
    }
  },
}));
