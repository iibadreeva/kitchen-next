import { auth } from "@/auth/auth";
import IngredientForm from "@/forms/ingredient.form";

export default async function Ingredients() {
  const session = await auth();
  const isAuthed = Boolean(session?.user?.id);

  return (
    <section className="ingredient-page" aria-labelledby="ingredient-form-title">
      <div className="ingredient-page__intro">
        <h2 id="ingredient-form-title" className="ingredient-page__title">
          Новый ингредиент
        </h2>
        <p className="ingredient-page__lede">
          {isAuthed
            ? "Добавьте продукт на кухню: название, категорию, единицу и цену. Описание — по желанию."
            : "Чтобы добавлять ингредиенты, войдите в аккаунт через меню в шапке."}
        </p>
      </div>
      {isAuthed ? (
        <IngredientForm />
      ) : (
        <p className="ingredient-page__guest" role="status">
          Требуется вход в аккаунт.
        </p>
      )}
    </section>
  );
}
