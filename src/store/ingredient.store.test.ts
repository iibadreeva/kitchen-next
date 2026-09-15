import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/actions/ingredient", () => ({
  createIngredient: vi.fn(),
  getIngredients: vi.fn(),
  removeIngredient: vi.fn(),
}));

import {
  createIngredient,
  getIngredients,
  removeIngredient as removeIngredientAction,
} from "@/actions/ingredient";
import { useIngredientStore } from "@/store/ingredient.store";
import type { IngredientInput, IngredientType } from "@/types/ingredient";

const sampleInput: IngredientInput = {
  name: "Морковь",
  category: "VEGETABLES",
  unit: "KILOGRAMS",
  pricePerUnit: "89.50",
  description: "",
};

const existing: IngredientType = {
  id: "ing-old",
  name: "Картофель",
  category: "VEGETABLES",
  unit: "KILOGRAMS",
  pricePerUnit: 40,
  description: null,
};

const created: IngredientType = {
  id: "ing-new",
  name: "Морковь",
  category: "VEGETABLES",
  unit: "KILOGRAMS",
  pricePerUnit: 89.5,
  description: null,
};

describe("useIngredientStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useIngredientStore.setState({
      ingredients: [],
      isLoadingList: false,
      isSubmitting: false,
      deletingId: null,
      listError: null,
      loadSeq: 0,
    });
  });

  it("не затирает список устаревшим ответом load после успешного add", async () => {
    let resolveLoad!: (value: Awaited<ReturnType<typeof getIngredients>>) => void;
    vi.mocked(getIngredients).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLoad = resolve;
        }),
    );
    vi.mocked(createIngredient).mockResolvedValue({
      success: true,
      ingredient: created,
    });

    const loadPromise = useIngredientStore.getState().loadIngredients();

    const addResult = await useIngredientStore
      .getState()
      .addIngredient(sampleInput);
    expect(addResult).toEqual({ ok: true });
    expect(useIngredientStore.getState().ingredients.map((i) => i.id)).toEqual([
      "ing-new",
    ]);

    resolveLoad({ success: true, ingredients: [existing] });
    await loadPromise;

    expect(useIngredientStore.getState().ingredients.map((i) => i.id)).toEqual([
      "ing-new",
    ]);
    expect(useIngredientStore.getState().isLoadingList).toBe(false);
  });

  it("при ошибке add возвращает error и не пишет listError", async () => {
    vi.mocked(createIngredient).mockResolvedValue({
      error: "Ингредиент с таким названием уже есть",
    });

    const result = await useIngredientStore
      .getState()
      .addIngredient(sampleInput);

    expect(result).toEqual({
      ok: false,
      error: "Ингредиент с таким названием уже есть",
    });
    expect(useIngredientStore.getState().listError).toBeNull();
    expect(useIngredientStore.getState().isSubmitting).toBe(false);
  });

  it("успешный add сбрасывает устаревший listError после провала load", async () => {
    useIngredientStore.setState({
      listError: "Ошибка при получении ингредиентов",
    });
    vi.mocked(createIngredient).mockResolvedValue({
      success: true,
      ingredient: created,
    });

    const result = await useIngredientStore
      .getState()
      .addIngredient(sampleInput);

    expect(result).toEqual({ ok: true });
    expect(useIngredientStore.getState().listError).toBeNull();
    expect(useIngredientStore.getState().ingredients.map((i) => i.id)).toEqual([
      "ing-new",
    ]);
  });

  it("повторный add при isSubmitting не вызывает createIngredient", async () => {
    let resolveCreate!: (value: Awaited<ReturnType<typeof createIngredient>>) => void;
    vi.mocked(createIngredient).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        }),
    );

    const firstPromise = useIngredientStore
      .getState()
      .addIngredient(sampleInput);
    const secondResult = await useIngredientStore
      .getState()
      .addIngredient(sampleInput);

    expect(secondResult).toEqual({
      ok: false,
      error: "Добавление уже выполняется",
    });
    expect(createIngredient).toHaveBeenCalledTimes(1);

    resolveCreate({ success: true, ingredient: created });
    await expect(firstPromise).resolves.toEqual({ ok: true });
    expect(useIngredientStore.getState().isSubmitting).toBe(false);
  });

  it("ошибка remove пишет listError, а не затрагивает результат add", async () => {
    useIngredientStore.setState({ ingredients: [existing] });
    vi.mocked(removeIngredientAction).mockResolvedValue({
      error: "Ингредиент не найден",
    });

    const removed = await useIngredientStore
      .getState()
      .removeIngredient("ing-old");

    expect(removed).toBe(false);
    expect(useIngredientStore.getState().listError).toBe(
      "Ингредиент не найден",
    );
  });
});
