"use client";

import {
  Button,
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
  signInPasswordSchema,
  signInSchema,
  zodFieldError,
} from "@/lib/zod";
import { useAuthStore } from "@/store/auth.store";

type Props = {
  onClose: () => void;
};

type LoginFields = {
  email: string;
  password: string;
};

const LoginForm = ({ onClose }: Props) => {
  const login = useAuthStore((s) => s.login);
  const error = useAuthStore((s) => s.error);
  const op = useAuthStore((s) => s.op);
  const clearError = useAuthStore((s) => s.clearError);
  const isSubmitting = op === "login";

  const [formData, setFormData] = useState<LoginFields>({
    email: "",
    password: "",
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const updateField = <K extends keyof LoginFields>(
    field: K,
    value: LoginFields[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    const parsed = signInSchema.safeParse(formData);
    if (!parsed.success) {
      setLocalError(parsed.error.issues[0]?.message ?? "Некорректные данные");
      return;
    }

    await login(parsed.data);
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
        name="password"
        type="password"
        value={formData.password}
        onChange={(value) => updateField("password", value)}
        validate={(value) =>
          zodFieldError(signInPasswordSchema.safeParse(value))
        }
        className="auth-form__field"
      >
        <Label>Пароль</Label>
        <Input placeholder="Ваш пароль" />
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
          {isSubmitting ? "Вход…" : "Войти"}
        </Button>
      </div>
    </Form>
  );
};

export default LoginForm;
