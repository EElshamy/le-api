import { applyDecorators } from '@nestjs/common';
import { IsNotEmpty, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { ErrorCodeEnum } from '../../_common/exceptions/error-code.enum';
import { LangEnum } from '../../user/user.enum';
import { ARLangRegex, ENLangRegex } from '../utils/common-regex';

export function ValidateLanguage(lang: LangEnum) {
  const { regex, message } = getRegexAndErrorMessageForLangValidation(lang);
  return applyDecorators(
    Transform(val => val.value.trim()),
    IsNotEmpty(),
    Matches(regex, { message })
  );
}

function getRegexAndErrorMessageForLangValidation(lang: LangEnum) {
  if (lang === LangEnum.AR) {
    return {
      regex: ARLangRegex,
      message: ErrorCodeEnum[ErrorCodeEnum.ALLOWED_ARABIC_ONLY]
    };
  } else {
    return {
      regex: ENLangRegex,
      message: ErrorCodeEnum[ErrorCodeEnum.ALLOWED_ENGLISH_ONLY]
    };
  }
}
