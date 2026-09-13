"use client";

import {
  Button,
  Description,
  FieldError,
  Form,
  Input,
  Label,
  TextField,
  cn,
} from "@heroui/react";
import { useState, type FormEvent } from "react";

import {
  emailSchema,
  passwordSchema,
  registerSchema,
  zodFieldError,
} from "@/lib/zod";
import { useAuthStore } from "@/store/auth.store";
import { FormDataType } from "@/types/form-data";

type Props = {
  onClose: () => void;
};

const RegistrationForm = ({ onClose }: Props) => {
  const register = useAuthStore((s) => s.register);
  const error = useAuthStore((s) => s.error);
  const op = useAuthStore((s) => s.op);
  const clearError = useAuthStore((s) => s.clearError);
  const isSubmitting = op === "register";

  const [formData, setFormData] = useState<FormDataType>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const updateField = <K extends keyof FormDataType>(
    field: K,
    value: FormDataType[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    const parsed = registerSchema.safeParse(formData);
    if (!parsed.success) {
      setLocalError(parsed.error.issues[0]?.message ?? "Некорректные данные");
      return;
    }

    await register(parsed.data);
  };

  const displayError = localError ?? error;

  return (
    <Form className="auth-form" onSubmit={onSubmit}>
      <TextField
        isRequired
        fullWidth
        name="email"
        type="email"
        value={formData.email}
        onChange={(value) => updateField("email", value)}
        validate={(value) => zodFieldError(emailSchema.safeParse(value))}
        className="auth-form__field"
      >
        <Label>Email</Label>
        <Input placeholder="anna@kitchen.ru" />
        <FieldError />
      </TextField>

      <TextField
        isRequired
        fullWidth
        minLength={8}
        name="password"
        type="password"
        value={formData.password}
        onChange={(value) => updateField("password", value)}
        validate={(value) => zodFieldError(passwordSchema.safeParse(value))}
        className="auth-form__field"
      >
        <Label>Пароль</Label>
        <Input placeholder="Придумайте пароль" />
        <Description>
          Не меньше 8 символов, одна заглавная буква и одна цифра.
        </Description>
        <FieldError />
      </TextField>

      <TextField
        isRequired
        fullWidth
        minLength={8}
        name="confirmPassword"
        type="password"
        value={formData.confirmPassword}
        onChange={(value) => updateField("confirmPassword", value)}
        validate={(value) => {
          if (!value) return "Пароль для подтверждения обязателен";
          if (value !== formData.password) return "Пароли не совпадают";
          return null;
        }}
        className="auth-form__field"
      >
        <Label>Подтвердите пароль</Label>
        <Input placeholder="Повторите пароль" />
        <FieldError />
      </TextField>

      {displayError ? (
        <p className="text-sm text-[var(--kitchen-beet)]" role="alert">
          {displayError}
        </p>
      ) : null}

      <div className="auth-form__actions">
        <Button
          type="button"
          variant="secondary"
          className="auth-form__cancel"
          onPress={onClose}
          isDisabled={isSubmitting}
        >
          Отмена
        </Button>
        <Button
          type="submit"
          className={cn("auth-form__submit", "site-header__cta")}
          isDisabled={isSubmitting}
        >
          {isSubmitting ? "Регистрация…" : "Зарегистрироваться"}
        </Button>
      </div>
    </Form>
  );
};

export default RegistrationForm;
