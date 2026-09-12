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
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { registerUser } from "@/actions/register";
import {
  emailSchema,
  passwordSchema,
  registerSchema,
  zodFieldError,
} from "@/lib/zod";
import { FormDataType } from "@/types/form-data";
import {
  isAuthUnavailableCode,
  parseRateLimitedCode,
} from "@/utils/auth-messages";

type Props = {
  onClose: () => void;
};

const RegistrationForm = ({ onClose }: Props) => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormDataType>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = <K extends keyof FormDataType>(
    field: K,
    value: FormDataType[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const parsed = registerSchema.safeParse(formData);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Некорректные данные");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await registerUser(parsed.data);

      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }

      const email =
        "user" in result && result.user?.email
          ? result.user.email
          : parsed.data.email;

      const signInResult = await signIn("credentials", {
        email,
        password: parsed.data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        if (isAuthUnavailableCode(signInResult.code)) {
          setError(
            "Аккаунт создан, но вход временно недоступен. Войдите вручную чуть позже.",
          );
          return;
        }
        const limited = parseRateLimitedCode(signInResult.code);
        setError(
          limited.limited
            ? limited.retryAfterSec
              ? `Аккаунт создан, но слишком много попыток входа. Подождите ${limited.retryAfterSec} сек. и войдите вручную.`
              : "Аккаунт создан, но слишком много попыток входа. Войдите вручную чуть позже."
            : "Аккаунт создан, но войти не удалось. Попробуйте войти вручную.",
        );
        return;
      }

      router.refresh();
      onClose();
    } catch {
      setError("Ошибка при регистрации");
    } finally {
      setIsSubmitting(false);
    }
  };

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

      {error ? (
        <p className="text-sm text-[var(--kitchen-beet)]" role="alert">
          {error}
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
