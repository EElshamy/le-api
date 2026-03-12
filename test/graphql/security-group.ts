export const CREATE_SECURITY_GROUP = `
mutation createSecurityGroup ($input: CreateSecurityGroupInput!) {
    response: createSecurityGroup (input: $input) {
      code
      success
      message
      data {
        id
        groupName
      }
    }
  }
`;

export const UPDATE_SECURITY_GROUP = `
mutation updateSecurityGroup ($input: UpdateSecurityGroupInput!) {
    response: updateSecurityGroup (input: $input) {
      code
      success
      message
      data {
        id
        groupName
      }
    }
  }
`;

export const ASSIGN_SECURITY_GROUP_TO_USERS = `
mutation assignSecurityGroupToUsers ($input: AssignSecurityGroupToUsersInput!) {
    response: assignSecurityGroupToUsers (input: $input) {
      code
      success
      message
      data {
        id
        groupName
      }
    }
  }
`;

export const SECURITY_GROUPS = `
query securityGroups {
    response: securityGroups {
      code
      success
      message
      data {
        id
        groupName
      }
    }
  }
`;

export const UN_ASSIGN_SECURITY_GROUP_TO_USERS = `
mutation unAssignSecurityGroup ($input: UnAssignSecurityGroupToUsersInput!) {
    response: unAssignSecurityGroup (input: $input) {
      code
      success
      message
      data
    }
  }
`;

export const DELETE_SECURITY_GROUP = `
mutation deleteSecurityGroup ($securityGroupId: String!) {
    response: deleteSecurityGroup (securityGroupId: $securityGroupId) {
      code
      success
      message
      data
    }
  }
`;

export const SECURITY_GROUP = `
query securityGroup ($securityGroupId: String!){
    response: securityGroup (securityGroupId: $securityGroupId) {
      code
      success
      message
      data {
        id
        groupName
      }
    }
  }
`;