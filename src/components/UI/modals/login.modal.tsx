"use client";

import CustomModal from "@/components/common/modal";
import LoginForm from "@/forms/login.form";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const LoginModal = ({ onClose, isOpen }: Props) => {
  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Войти"
      size="md"
      eyebrow="С возвращением"
      description="Войдите, чтобы сохранять избранные рецепты и возвращаться к ним с любой кухни."
    >
      <LoginForm onClose={onClose} />
    </CustomModal>
  );
};

export default LoginModal;
