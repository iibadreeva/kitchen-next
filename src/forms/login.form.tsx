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

type Props = {
  onClose: () => void;
};

type LoginFields = {
  email: string;
  password: string;
};

const LoginForm = ({ onClose }: Props) => {
  const [formData, setFormData] = useState<LoginFields>({
    email: "",
    password: "",
  });

  const updateField = <K extends keyof LoginFields>(
    field: K,
    value: LoginFields[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onClose();
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
        validate={(value) => {
          if (!value) return "Почта обязательна";
          return null;
        }}
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
        validate={(value) => {
          if (!value) return "Пароль обязателен";
          return null;
        }}
        className="auth-form__field"
      >
        <Label>Пароль</Label>
        <Input placeholder="Ваш пароль" />
        <FieldError />
      </TextField>

      <div className="auth-form__actions">
        <Button
          type="button"
          variant="secondary"
          className="auth-form__cancel"
          onPress={onClose}
        >
          Отмена
        </Button>
        <Button
          type="submit"
          className={cn("auth-form__submit", "site-header__cta")}
        >
          Войти
        </Button>
      </div>
    </Form>
  );
};

export default LoginForm;
