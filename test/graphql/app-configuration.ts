export const CREATE_APP_CONFIGURATION = `
mutation createAppConfigurationBoard ($input: CreateAppConfigurationInput!) {
    response: createAppConfigurationBoard (input: $input) {
      code
      success
      message
      data {
        id
        key
        value
        displayAs
      }
    }
  }
`;

export const UPDATE_APP_CONFIGURATION = `
mutation updateAppConfigurationBoard ($input: UpdateAppConfigurationInput!) {
    response: updateAppConfigurationBoard (input: $input) {
      code
      success
      message
      data {
        id
        key
        value
        displayAs
      }
    }
  }
`;

export const TERMS_AND_CONDITIONS = `
query termsAndConditions {
    response: termsAndConditions {
      code
      success
      message
      data
    }
  }
`;

export const TREATMENT_CONSENT = `
query treatmentConsent {
    response: treatmentConsent {
      code
      success
      message
      data
    }
  }
`;

export const APP_CONFIGURATION_BOARD = `
query appConfigurationBoard ($input: AppConfigurationInput!){
    response: appConfigurationBoard(input: $input) {
      code
      success
      message
      data{
        id
        key
        value
        displayAs
      }
    }
  }
`;
export const APP_CONFIGURATIONS_BOARD = `
query appConfigurationsBoard{
    response: appConfigurationsBoard{
      code
      success
      message
      data{
        id
        key
        value
        displayAs
      }
    }
  }
`;
