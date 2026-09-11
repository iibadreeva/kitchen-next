"use client";

import { Modal } from "@heroui/react";
import { type ReactNode } from "react";

type ModalSize = "xs" | "sm" | "md" | "lg" | "cover" | "full";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: ModalSize;
  eyebrow?: string;
  description?: string;
};

const CustomModal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  eyebrow,
  description,
}: Props) => {
  return (
    <Modal.Backdrop
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      variant="blur"
      className="auth-modal__backdrop"
    >
      <Modal.Container size={size} placement="center">
        <Modal.Dialog className="auth-modal__dialog">
          <div className="auth-modal__glow" aria-hidden />
          <Modal.CloseTrigger className="auth-modal__close" />
          <Modal.Header className="auth-modal__header">
            {eyebrow ? <p className="auth-modal__eyebrow">{eyebrow}</p> : null}
            <Modal.Heading className="auth-modal__heading">
              {title}
            </Modal.Heading>
            {description ? (
              <p className="auth-modal__description">{description}</p>
            ) : null}
          </Modal.Header>
          <Modal.Body className="auth-modal__body">{children}</Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
};

export default CustomModal;
