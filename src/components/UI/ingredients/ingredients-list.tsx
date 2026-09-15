"use client";

import { Button, Spinner } from "@heroui/react";
import { useEffect } from "react";

import { CATEGORY_OPTIONS, UNIT_OPTIONS } from "@/constants/select-options";
import { useIngredientStore } from "@/store/ingredient.store";

function labelFor(
  options: ReadonlyArray<{ label: string; value: string }>,
  value: string,
) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export default function IngredientsList() {
  const ingredients = useIngredientStore((s) => s.ingredients);
  const isLoadingList = useIngredientStore((s) => s.isLoadingList);
  const deletingId = useIngredientStore((s) => s.deletingId);
  const listError = useIngredientStore((s) => s.listError);
  const loadIngredients = useIngredientStore((s) => s.loadIngredients);
  const removeIngredient = useIngredientStore((s) => s.removeIngredient);
  const clearListError = useIngredientStore((s) => s.clearListError);

  useEffect(() => {
    void loadIngredients();
  }, [loadIngredients]);

  useEffect(() => {
    if (!listError || ingredients.length === 0) return;

    const timer = window.setTimeout(() => {
      clearListError();
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [listError, ingredients.length, clearListError]);

  if (isLoadingList && ingredients.length === 0) {
    return (
      <div className="ingredient-list ingredient-list--loading" role="status">
        <Spinner size="sm" />
        <span>Загрузка ингредиентов…</span>
      </div>
    );
  }

  if (listError && ingredients.length === 0) {
    return (
      <div className="ingredient-list__empty-error" role="alert">
        <p className="ingredient-list__empty">{listError}</p>
        <Button
          type="button"
          variant="ghost"
          className="ingredient-list__retry"
          onPress={() => {
            void loadIngredients();
          }}
        >
          Повторить
        </Button>
      </div>
    );
  }

  if (ingredients.length === 0) {
    return (
      <p className="ingredient-list__empty" role="status">
        Пока нет ингредиентов — добавьте первый через форму выше.
      </p>
    );
  }

  return (
    <div className="ingredient-list-wrap">
      {listError ? (
        <p className="ingredient-list__error" role="alert">
          {listError}
        </p>
      ) : null}
      <ul className="ingredient-list" aria-label="Список ингредиентов">
        {ingredients.map((ingredient) => {
          const isDeleting = deletingId === ingredient.id;
          return (
            <li key={ingredient.id} className="ingredient-list__item">
              <div className="ingredient-list__main">
                <p className="ingredient-list__name">{ingredient.name}</p>
                <p className="ingredient-list__meta">
                  {labelFor(CATEGORY_OPTIONS, ingredient.category)}
                  {" · "}
                  {labelFor(UNIT_OPTIONS, ingredient.unit)}
                  {` · ${ingredient.pricePerUnit.toLocaleString("ru-RU")} ₽`}
                </p>
                {ingredient.description ? (
                  <p className="ingredient-list__description">
                    {ingredient.description}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                className="ingredient-list__remove"
                isDisabled={deletingId != null}
                isPending={isDeleting}
                onPress={() => {
                  const confirmed = window.confirm(
                    `Удалить ингредиент «${ingredient.name}»?`,
                  );
                  if (!confirmed) return;
                  void removeIngredient(ingredient.id);
                }}
              >
                {isDeleting ? "Удаление…" : "Удалить"}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
