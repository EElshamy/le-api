export const CREATE_CONTACT_MESSAGE = `
mutation createContactMessage ($input: CreateContactMessageInput!) {
    response: createContactMessage (input: $input) {
      code
      success
      message
      data {
        id
        name
        email
        phone
        message
        contactReason
        resolvedAt
      }
    }
  }
`;

export const RESOLVE_OR_UN_RESOLVED_CONTACT_MESSAGE_BOARD = `
mutation resolveOrUnResolveContactMessageBoard ($contactMessageId: String!) {
    response: resolveOrUnResolveContactMessageBoard (contactMessageId: $contactMessageId) {
      code
      success
      message
      data {
        id
        resolvedAt
      }
    }
  }
`;

export const CONTACT_MESSAGE_BOARD = `
query contactMessageBoard ($contactMessageId: String!) {
    response: contactMessageBoard (contactMessageId: $contactMessageId) {
      code
      success
      message
      data {
        id
        name
        email
        phone
        message
        contactReason
        resolvedAt
      }
    }
  }
`;

export const CONTACT_MESSAGES_BOARD = `
query contactMessagesBoard ($filter: ContactMessageFilter) {
    response: contactMessagesBoard (filter: $filter) {
      code
      success
      message
      data {
        items{
          id
          name
          email
          phone
          message
          contactReason
          resolvedAt
        }
      }
    }
  }
`;

export const DELETE_CONTACT_MESSAGE_BOARD = `
mutation deleteContactMessageBoard ($contactMessageId: String!) {
    response: deleteContactMessageBoard (contactMessageId: $contactMessageId) {
      code
      success
      message
      data
    }
  }
`;
