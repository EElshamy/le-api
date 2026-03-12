export const UPDATE_USER = `
  mutation updateUserProfile ($input: UpdateUserProfileInput!) {
    response: updateUserProfile (input: $input) {
      code
      success
      message
      data {
        id
        firstName
        email
        verifiedPhone

      }
    }
  }
`;

export const CHANGE_PASSWORD = `
mutation changePassword ($input: ChangePasswordInput!) {
    response: changePassword (input: $input) {
      code
      success
      message
      data {
        id
      }
    }
  }
`;

export const SET_USER_PERSONAL_INFORMATION = `
  mutation set ($input: SetPersonalInformationInput!) {
    response: setUserPersonalInformation (input: $input) {
      code
      success
      message
      data {
        id
        firstName
        lastName
        gender
        birthDate
        profilePicture
        familyMembers {
          firstName
          lastName
          relation
        }
      }
    }
  }
`;

export const USERS_BOARD = `
  query usersBoard ($filter: UsersBoardFilter) {
    response: usersBoard (filter: $filter) {
      code
      success
      message
      data {
        items{
          id
          verifiedPhone
          isBlocked
          email
          gender
        }
      }
    }
  }
`;

export const USER_BOARD = `
  query userBoard ($userId: String!) {
    response: userBoard (userId: $userId) {
      code
      success
      message
      data {
          id
          verifiedPhone
          isBlocked
          email
          gender
      }
    }
  }
`;
