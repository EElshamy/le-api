import { Injectable, NestMiddleware } from '@nestjs/common';
import { asyncStorage } from 'src/_common/custom-validator/not-bank.validator';

@Injectable()
export class LanguageMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    asyncStorage.run({ lang: req.headers['lang'] || 'en' }, () => {
      next();
    });
  }
}
