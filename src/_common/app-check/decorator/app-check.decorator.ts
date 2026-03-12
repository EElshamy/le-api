import { applyDecorators, UseGuards } from '@nestjs/common';
import { AppCheckGuard } from '../guards/app-check.guard';

export function RequireAppCheck() {
  return applyDecorators(UseGuards(AppCheckGuard));
}
