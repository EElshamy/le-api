export const CREATE_FAQ_BOARD = `
mutation createFaqBoard ($input: CreateFaqInput!) {
    response: createFaqBoard (input: $input) {
      code
      success
      message
      data {
        id
        enQuestion
        arQuestion
        enAnswer
        arAnswer
        isActive
      }
    }
  }
`;

export const UPDATE_FAQ_BOARD = `
mutation updateFaqBoard ($input: UpdateFaqInput!) {
    response: updateFaqBoard (input: $input) {
      code
      success
      message
      data {
        id
        enQuestion
        arQuestion
        enAnswer
        arAnswer
        isActive
      }
    }
  }
`;

export const DELETE_FAQ_BOARD = `
mutation deleteFaqBoard ($faqId: String!) {
    response: deleteFaqBoard (faqId: $faqId) {
      code
      success
      message
      data
    }
  }
`;

export const FAQ_BOARD = `
query faqBoard ($faqId: String!) {
    response: faqBoard (faqId: $faqId) {
      code
      success
      message
      data {
        id
        enQuestion
        arQuestion
        enAnswer
        arAnswer
        isActive
      }
    }
  }
`;

export const FAQS_BOARD = `
query faqsBoard ($filter:FaqFilterBoard) {
    response: faqsBoard (filter: $filter) {
      code
      success
      message
      data {
        items{
          id
          enQuestion
          arQuestion
          enAnswer
          arAnswer
          isActive
        }
      }
    }
  }
`;

export const FAQS = `
query faqs ($filter:FaqsFilter) {
    response: faqs (filter: $filter) {
      code
      success
      message
      data {
        items{
          id
          enQuestion
          arQuestion
          enAnswer
          arAnswer
          isActive
        }
      }
    }
  }
`;
