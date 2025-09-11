import React, { useState, useEffect, SyntheticEvent, useRef } from 'react';
import { useNotifications, NotificationRecord, Notification } from '.';
import { SnackbarCloseReason, Snackbar } from '@mui/material';
import { Slide, SlideProps } from '@mui/material';
import { Icon } from '@tapis/tapisui-common';
import styles from './NotificationToast.module.scss';

const NotificationToast = () => {
  type TransitionType =
    | React.ComponentType<
        SlideProps & {
          children?: React.ReactElement<any, any> | undefined;
        }
      >
    | undefined;
  const { notifications, markread } = useNotifications();
  const [open, setOpen] = useState(false);
  const [notificationRecord, setNotificationRecord] =
    useState<NotificationRecord | null>(null);
  const [transition, setTransition] = React.useState<TransitionType>(undefined);

  // Track the last processed notification to prevent loops
  const lastProcessedId = useRef<string | null>(null);

  useEffect(() => {
    // Get the first unread notification
    const firstUnread = notifications.find((n) => !n.read);

    if (firstUnread && firstUnread.id !== lastProcessedId.current) {
      if (!notificationRecord) {
        // Set a new toast when we don't have an active one
        setNotificationRecord({ ...firstUnread });
        setTransition(() => (props: SlideProps) => (
          <Slide {...props} direction="right" />
        ));
        setOpen(true);
        lastProcessedId.current = firstUnread.id;
      } else if (open) {
        // Close current toast to show new one
        setOpen(false);
        // The new notification will be processed after this one closes
      }
    }
  }, [notifications, notificationRecord, open]);

  const handleExited = () => {
    // Mark the current notification as read
    if (notificationRecord) {
      markread(notificationRecord.id);
    }

    // Clear current notification
    setNotificationRecord(null);

    // Reset the last processed ID so new notifications can be shown
    lastProcessedId.current = null;
  };

  const handleClose = (
    _event: Event | SyntheticEvent<any, Event>,
    reason: SnackbarCloseReason
  ) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  return notificationRecord && !notificationRecord.read ? (
    <Snackbar
      key={notificationRecord ? notificationRecord.id : undefined}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      TransitionComponent={transition}
      open={open}
      autoHideDuration={3500}
      onClose={handleClose}
      TransitionProps={{
        onExited: handleExited,
      }}
      message={<ToastMessage notification={notificationRecord!.notification} />}
    />
  ) : null;
};

export const ToastMessage: React.FC<{ notification: Notification }> = ({
  notification,
}) => {
  return (
    <>
      <div className={styles['notification-toast-icon-wrapper']}>
        {notification.icon && (
          <Icon
            name={notification.icon}
            className={
              notification.status === 'ERROR' ? styles['toast-is-error'] : ''
            }
          />
        )}
      </div>
      <div className={styles['notification-toast-content']}>
        <span>{notification.message}</span>
      </div>
    </>
  );
};

export default NotificationToast;
