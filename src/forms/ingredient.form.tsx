"use client";

import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  ListBox,
  Select,
  Spinner,
  TextArea,
  TextField,
  cn,
} from "@heroui/react";
import { useEffect, useState, type FormEvent, type Key } from "react";

import { CATEGORY_OPTIONS, UNIT_OPTIONS } from "@/constants/select-options";
import {
  ingredientCategorySchema,
  ingredientDescriptionSchema,
  ingredientNameSchema,
  ingredientPriceSchema,
  ingredientSchema,
  ingredientUnitSchema,
  zodFieldError,
} from "@/lib/zod";
import { useIngredientStore } from "@/store/ingredient.store";

type IngredientFormValues = {
  name: string;
  category: string;
  unit: string;
  pricePerUnit: string;
  description: string;
};

const emptyForm = (): IngredientFormValues => ({
  name: "",
  category: "",
  unit: "",
  pricePerUnit: "",
  description: "",
});

const IngredientForm = () => {
  const addIngredient = useIngredientStore((s) => s.addIngredient);
  const isSubmitting = useIngredientStore((s) => s.isSubmitting);
  const [formData, setFormData] = useState<IngredientFormValues>(emptyForm);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!localError && !successMessage) return;

    const timer = window.setTimeout(() => {
      setLocalError(null);
      setSuccessMessage(null);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [localError, successMessage]);

  const updateField = <K extends keyof IngredientFormValues>(
    field: K,
    value: IngredientFormValues[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onSelectChange = (field: "category" | "unit") => (key: Key | null) => {
    updateField(field, key == null ? "" : String(key));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setLocalError(null);
    setSuccessMessage(null);

    const parsed = ingredientSchema.safeParse(formData);
    if (!parsed.success) {
      setLocalError(parsed.error.issues[0]?.message ?? "Некорректные данные");
      return;
    }

    try {
      const result = await addIngredient(parsed.data);
      if (!result.ok) {
        setLocalError(result.error);
        return;
      }

      setFormData(emptyForm());
      setSuccessMessage("Ингредиент добавлен");
    } catch {
      setLocalError("Не удалось добавить ингредиент");
    }
  };

  return (
    <Form className="kitchen-form ingredient-form" onSubmit={handleSubmit}>
      <TextField
        isRequired
        fullWidth
        name="name"
        type="text"
        value={formData.name}
        isDisabled={isSubmitting}
        onChange={(value) => updateField("name", value)}
        validate={(value) =>
          zodFieldError(ingredientNameSchema.safeParse(value))
        }
        className="kitchen-form__field"
      >
        <Label>Название</Label>
        <Input placeholder="Например, морковь" />
        <FieldError />
      </TextField>

      <div className="ingredient-form__row">
        <Select
          isRequired
          fullWidth
          name="category"
          placeholder="Выберите"
          value={formData.category || null}
          isDisabled={isSubmitting}
          onChange={onSelectChange("category")}
          validate={(value) =>
            zodFieldError(ingredientCategorySchema.safeParse(value ?? ""))
          }
          className="kitchen-form__field"
        >
          <Label>Категория</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {CATEGORY_OPTIONS.map((option) => (
                <ListBox.Item
                  key={option.value}
                  id={option.value}
                  textValue={option.label}
                >
                  {option.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
          <FieldError />
        </Select>

        <Select
          isRequired
          fullWidth
          name="unit"
          placeholder="Выберите"
          value={formData.unit || null}
          isDisabled={isSubmitting}
          onChange={onSelectChange("unit")}
          validate={(value) =>
            zodFieldError(ingredientUnitSchema.safeParse(value ?? ""))
          }
          className="kitchen-form__field"
        >
          <Label>Ед. изм.</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {UNIT_OPTIONS.map((option) => (
                <ListBox.Item
                  key={option.value}
                  id={option.value}
                  textValue={option.label}
                >
                  {option.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
          <FieldError />
        </Select>

        <TextField
          isRequired
          fullWidth
          name="pricePerUnit"
          type="number"
          value={formData.pricePerUnit}
          isDisabled={isSubmitting}
          onChange={(value) => updateField("pricePerUnit", value)}
          validate={(value) =>
            zodFieldError(ingredientPriceSchema.safeParse(value))
          }
          className="kitchen-form__field"
        >
          <Label>Цена за ед.</Label>
          <Input placeholder="0" min={0} step="0.01" />
          <FieldError />
        </TextField>
      </div>

      <TextField
        fullWidth
        name="description"
        value={formData.description}
        isDisabled={isSubmitting}
        onChange={(value) => updateField("description", value)}
        validate={(value) =>
          zodFieldError(ingredientDescriptionSchema.safeParse(value))
        }
        className="kitchen-form__field"
      >
        <Label>Описание</Label>
        <TextArea placeholder="Необязательно — заметки о продукте" rows={3} />
        <FieldError />
      </TextField>

      {localError || successMessage ? (
        <div
          className={cn(
            "ingredient-form__toast",
            localError
              ? "ingredient-form__toast--error"
              : "ingredient-form__toast--success",
          )}
          role={localError ? "alert" : "status"}
        >
          <span className="ingredient-form__toast-label">
            {localError ? "Ошибка" : "Готово"}
          </span>
          <p className="ingredient-form__toast-text">
            {localError ?? successMessage}
          </p>
        </div>
      ) : null}

      <div className="kitchen-form__actions">
        <Button
          type="submit"
          className={cn("kitchen-form__submit", "site-header__cta")}
          isPending={isSubmitting}
        >
          {({ isPending }) => (
            <>
              {isPending ? <Spinner color="current" size="sm" /> : null}
              {isPending ? "Добавление…" : "Добавить ингредиент"}
            </>
          )}
        </Button>
      </div>
    </Form>
  );
};

export default IngredientForm;
