export const CHECK_SOCIAL_PROVIDER_STATUS = `
query checkSocialProviderStatus($input: CheckSocialStatusInput!) {
  response: checkSocialProviderStatus(input: $input) {
    message
    code
    data {
      actionRequired
      user {
        id
        code
        token
      }
    }
  }
}
`;

export const SOCIAL_REGISTER = `
mutation socialRegister($input: SocialRegisterInput!) {
  response: socialRegister(input: $input) {
    message
    code
    data {
      id
      token
      email
      code
      unverifiedEmail
    }
  }
}
`;

export const SOCIAL_LOGIN = `
mutation socialLogin($input: SocialLoginInput!) {
  response: socialLogin(input: $input) {
    message
    code
    data {
      id
      token
    }
  }
}
`;

export const SOCIAL_MERGE = `
mutation socialMerge($input: SocialMergeInput!) {
  response: socialMerge(input: $input) {
    message
    code
    data {
      id
      token
    }
  }
}
`;

export const LINK_SOCIAL_ACCOUNT = `
mutation linkSocialAccount($input: LinkSocialAccountInput!) {
  response: linkSocialAccount(input: $input) {
    message
    code
    data
  }
}
`;

export const DISCONNECT_SOCIAL_ACCOUNT = `
mutation disconnectSocialAccount($input: DisconnectSocialAccountInput!) {
  response: disconnectSocialAccount(input: $input) {
    message
    code
    data
  }
}
`;
