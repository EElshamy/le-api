export const REGISTER = `
mutation register ($input: RegisterInput!) {
    response: registerAsUser (input: $input) {
      code
      success
      message
      data {
        id
        role
        email
        code
        unverifiedEmail
      }
    }
  }
`;

export const VERIFY_USER_BY_EMAIL = `
  mutation verifyUserVerificationCodeByEmail ($input: VerifyUserByEmailInput!) {
    response: verifyUserVerificationCodeByEmail (input: $input) {
      code
      success
      message
      data{
        id
        email
        code
        unverifiedEmail
        token
      }
    }
  }
`;

export const EMAIL_AND_PASSWORD_LOGIN = `
  mutation emailAndPasswordLogin ($input: EmailAndPasswordLoginInput!) {
    response: emailAndPasswordLogin (input: $input) {
      code
      success
      message
      data{
        id
        email
        unverifiedEmail
        token
      }
    }
  }
`;

export const RESET_PASSWORD_BY_EMAIL = `
  mutation resetPasswordByEmail ($input: ResetPasswordByEmailInput!) {
    response: resetPasswordByEmail (input: $input) {
      code
      success
      message
      data
    }
  }
`;

export const ME = `
  query me {
    response: me {
      code
      success
      message
      data {
        id
        email
        isBlocked
        role
      }
    }
  }
`;
export const LOGOUT = `
  mutation logout {
    response: logout {
      code
      success
      message
      data
    }
  }
`;

export const SEND_EMAIL_VERIFICATION_CODE = `
  mutation sendEmailVerificationCode ($input: SendEmailVerificationCodeInput!) {
    response: sendEmailVerificationCode (input: $input) {
      code
      success
      message
      data
    }
  }
`;

export const CHANGE_EMAIL = `
  mutation changeEmail($input :UpdateEmailInput! ) {
   response: changeEmail(input:$input) {
      message
      code
      data {
        unverifiedEmail
        email
        code
      }
    }
  }
`;

export const LOGOUT_OTHER_SESSIONS = `
  mutation logoutOfOtherSessions {
    response: logoutOfOtherSessions {
      message
      code
      data
    }
  }
`;

export const REGISTER_AS_LECTURER = `
  mutation registerAsLecturer($input: RegisterAsLecturerInput!) {
    response: registerAsLecturer(input: $input) {
      message
      code
      data {
        id
        arFullName
        enFullName
        code
        email
        unverifiedEmail
        token
        hasPassword
        lecturer {
          id
          status
          hasCompletedProfile
          jobTitle {
            id
          }
          fieldOfTrainings {
            id
          }
        }
      }
    }
}
`;



