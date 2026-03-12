import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { FilesAuthService } from './files-auth.service';
import { IContextAuthServiceToken, IContextAuthService } from '../context/context-auth.interface';

@Injectable()
export class FileAuthMiddleware implements NestMiddleware {
  constructor(
    private readonly filesAuthService: FilesAuthService,
    @Inject(IContextAuthServiceToken) private readonly authService: IContextAuthService
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    if (req.url.includes('favicon.ico')) {
      res.status(404).send('File not found');
      next();
    }
    try {
      const currentUser = await this.authService.getUserFromReqHeaders(req);

      const filePath = await this.filesAuthService.getFileUrlForAuthenticatedUsers(
        decodeURI(req.url),
        currentUser?.user
      );

      res.removeHeader('Authorization');
      res.removeHeader('authorization');
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
      res.set('Access-Control-Allow-Origin', '*');
      res.redirect(filePath);
    } catch (err) {
      console.log(err);
      res.statusMessage = 'File not found';
      res.status(404).send('File not found');
    }
  }
}
