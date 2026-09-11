"use client";

import CustomModal from "@/components/common/modal";
import RegistrationForm from "@/forms/registration.form";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const RegistrationModal = ({ onClose, isOpen }: Props) => {
  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Создать аккаунт"
      size="md"
      eyebrow="Добро пожаловать"
      description="Заведите место за столом — сохраняйте рецепты и собирайте свою домашнюю книгу."
    >
      <RegistrationForm onClose={onClose} />
    </CustomModal>
  );
};

export default RegistrationModal;
