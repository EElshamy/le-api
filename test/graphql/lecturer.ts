export const REPLY_LECTURER_JOIN_REQUEST = `
  mutation replyLecturerJoinRequestBoard($input: ReplyLecturerJoinRequestInput!) {
  response: replyLecturerJoinRequestBoard(input: $input) {
    message
    code
    data {
      status
      statusChangedAt
      rejectReason
      user {
        id
        hasPassword
        lecturer {
          id
          status
          commissionPercentage
          uploadedMaterialUrl
        }
      }
    }
  }
}
`;

export const RESET_LECTURER_PASSWORD = `
mutation setLecturerPassword($input:SetLecturerPasswordInput!) {
 response: setLecturerPassword(input:$input) {
    code
    message
    data
  }
}
`;

export const RESNED_LECTURER_PASSWORD_RESET = `
mutation resendLecturerPasswordGenerationEmail($userIdOfLecturer: ID!) {
 response: resendLecturerPasswordGenerationEmail(userIdOfLecturer: $userIdOfLecturer) {
    data
    code
    message
  }
}
`;

export const COMPLETE_LECTURER_PROFILE = `
mutation completeLecturerProfile($input:CompleteLecturerProfileInput!){
 response:completeLecturerProfile(input:$input){
    code
    data{
      id
      lecturer{
        hasCompletedProfile
      }
    }
  }
}`;

export const CREATE_LECTURER_BOARD = `
mutation createLecturerBoard($input: CreateLecturerBoardInput!) {
  response: createLecturerBoard(input: $input) {
    code
    message
    data {
      id
      code
      lecturer {
        status
        fieldOfTrainings {
          id
        }
        hasCompletedProfile
      }
    }
  }
}

`;
