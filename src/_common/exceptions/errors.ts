import { i18Errors } from './i18-errors';

export class MessageSource {
  getMessage(errorKey: string, lang?: string, params?) {
    if (!lang) lang = 'en';
    let localizedMessage: string = i18Errors[lang.toLowerCase()][errorKey];
    for (const key in params) {
      console.log(localizedMessage);
      localizedMessage = localizedMessage.replace(`{${key}}`, params[key]);
      console.log(localizedMessage);
    }
    return localizedMessage;
  }
}
