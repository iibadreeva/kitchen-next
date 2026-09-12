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
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import {
  emailSchema,
  signInPasswordSchema,
  signInSchema,
  zodFieldError,
} from "@/lib/zod";
import {
  authUnavailableMessage,
  isAuthUnavailableCode,
  parseRateLimitedCode,
  rateLimitedMessage,
} from "@/utils/auth-messages";

type Props = {
  onClose: () => void;
};

type LoginFields = {
  email: string;
  password: string;
};

const LoginForm = ({ onClose }: Props) => {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFields>({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = <K extends keyof LoginFields>(
    field: K,
    value: LoginFields[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const parsed = signInSchema.safeParse(formData);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Некорректные данные");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      });

      if (result?.error) {
        if (isAuthUnavailableCode(result.code)) {
          setError(authUnavailableMessage());
          return;
        }
        const limited = parseRateLimitedCode(result.code);
        setError(
          limited.limited
            ? rateLimitedMessage(limited.retryAfterSec)
            : "Неверный email или пароль",
        );
        return;
      }

      router.refresh();
      onClose();
    } catch {
      setError("Не удалось войти");
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
          {isSubmitting ? "Вход…" : "Войти"}
        </Button>
      </div>
    </Form>
  );
};

export default LoginForm;
