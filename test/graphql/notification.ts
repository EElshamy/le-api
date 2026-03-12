export const MANAGE_PATIENT_NOTIFICATIONS = `
  mutation managePatientNotifications ($input: ManagePatientNotificationsInput!) {
    response: managePatientNotifications (input: $input) {
      code
      success
      message
      data {
        id
        firstName
        email
        verifiedPhone
        isBlocked
        notificationManager{
          WHEN_APPOINTMENT_PRESCRIPTIONS_ADDED
          WHEN_APPOINTMENT_SICK_LEAVE_ADDED
          WHEN_APPOINTMENT_VISIT_SUMMARY_ADDED
          WHEN_SCHEDULED_APPOINTMENT_ALARM
        }
      }
    }
  }
`;

export const MANAGE_DOCTOR_NOTIFICATIONS = `
  mutation manageDoctorNotifications ($input: ManageDoctorNotificationsInput!) {
    response: manageDoctorNotifications (input: $input) {
      code
      success
      message
      data {
        id
        firstName
        email
        verifiedPhone
        isBlocked
        notificationManager{
          VIA_PUSH
          WHEN_SCHEDULED_APPOINTMENT_ALARM
          WHEN_APPOINTMENT_CANCELED
          WHEN_APPOINTMENT_NEED_SUMMARY
          WHEN_NEW_APPOINTMENT
        }
      }
    }
  }
`;

export const NOTIFICATIONS = `
  query notifications ($filter: FilterNotificationsInput) {
    response: notifications (filter: $filter) {
      data{
        items{
          id
          type
          parent{
            ...on Appointment{
              id
            }
            ...on Transaction{
              id
            }
            ...on DoctorRequest{
              id
            }
            ...on NotExistRecord{
              notExistRecord
            }
          }
          localeTitle
          localeBody
        }
      }
      code
      success
      message
    }
  }
`;

export const DELETE_NOTIFICATION = `
  mutation deleteNotification ($notificationId: String!) {
    response: deleteNotification (notificationId: $notificationId) {
      code
      success
      message
      data
    }
  }
`;

export const SEND_NOTIFICATION_BOARD = `
  mutation sendNotificationBoard ($input: SendNotificationBoardInput!) {
    response: sendNotificationBoard (input: $input) {
      code
      success
      message
      data
    }
  }
`;
