import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import styles from './GenericModal.module.scss';

export type GenericModalProps = {
  toggle: () => void;
  title: string;
  body: React.ReactNode;
  footer?: React.ReactNode;
  [key: string]: any;
};

const GenericModal: React.FC<GenericModalProps> = ({
  toggle,
  title,
  body,
  footer,
  ...props
}) => {
  return (
    <Modal
      backdrop={true} // Set to "static" to prevent closing on click outside
      keyboard={true}
      isOpen={true}
      toggle={toggle}
      className={styles.modal}
      {...props}
    >
      <ModalHeader toggle={toggle} charCode="&#x2715;">
        <span>{title}</span>
      </ModalHeader>
      <ModalBody>{body}</ModalBody>
      {footer && <ModalFooter>{footer}</ModalFooter>}
    </Modal>
  );
};

export default GenericModal;
