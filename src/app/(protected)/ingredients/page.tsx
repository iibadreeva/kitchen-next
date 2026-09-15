import { redirect } from "next/navigation";

import { auth } from "@/auth/auth";
import IngredientsList from "@/components/UI/ingredients/ingredients-list";
import IngredientForm from "@/forms/ingredient.form";
import { ROUTE_ERROR_UNAUTHORIZED } from "@/utils/route-error";

export default async function Ingredients() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/error?code=${ROUTE_ERROR_UNAUTHORIZED}`);
  }

  return (
    <section className="ingredient-page" aria-labelledby="ingredient-form-title">
      <div className="ingredient-page__intro">
        <h2 id="ingredient-form-title" className="ingredient-page__title">
          Новый ингредиент
        </h2>
        <p className="ingredient-page__lede">
          Добавьте продукт на кухню: название, категорию, единицу и цену.
          Описание — по желанию.
        </p>
      </div>
      <IngredientForm />
      <div
        className="ingredient-page__list"
        aria-labelledby="ingredient-list-title"
      >
        <h2 id="ingredient-list-title" className="ingredient-page__title">
          Ваши ингредиенты
        </h2>
        <IngredientsList />
      </div>
    </section>
  );
}
