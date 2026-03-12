import { ErrorCodeEnum } from '../exceptions/error-code.enum';

export const THROTTLE_ERROR_MAP: Record<number, ErrorCodeEnum> = {
  10: ErrorCodeEnum.TOO_MANY_REQUESTS_AND_BLOCKED_ONE_HOUR
};
