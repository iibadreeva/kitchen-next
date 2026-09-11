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
import { FormDataType } from "@/types/form-data";
import { registerUser } from "@/actions/register";

type Props = {
  onClose: () => void;
};

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

function isValidEmail(email: string) {
  return EMAIL_REGEX.test(email);
}

const RegistrationForm = ({ onClose }: Props) => {
  const [formData, setFormData] = useState<FormDataType>({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const updateField = <K extends keyof FormDataType>(
    field: K,
    value: FormDataType[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("submited", formData);

    const result = await registerUser(formData);
    console.log("result", result);

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
          if (!isValidEmail(value)) return "Некорректный email";
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
        minLength={8}
        name="password"
        type="password"
        value={formData.password}
        onChange={(value) => updateField("password", value)}
        validate={(value) => {
          if (value.length < 8) {
            return "Пароль должен содержать не менее 8 символов.";
          }
          if (!/[A-Z]/.test(value)) {
            return "Пароль должен содержать как минимум одну заглавную букву.";
          }
          if (!/[0-9]/.test(value)) {
            return "Пароль должен содержать как минимум одну цифру.";
          }
          return null;
        }}
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
          if (!value) {
            return "Пароль для подтверждения обязателен";
          }
          if (value !== formData.password) {
            return "Пароли не совпадают";
          }
          return null;
        }}
        className="auth-form__field"
      >
        <Label>Подтвердите пароль</Label>
        <Input placeholder="Повторите пароль" />
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
          Зарегистрироваться
        </Button>
      </div>
    </Form>
  );
};

export default RegistrationForm;
