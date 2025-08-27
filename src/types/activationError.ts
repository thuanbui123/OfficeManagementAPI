export type ActivationErrorCode =
  | "TOKEN_INVALID"
  | "TOKEN_NOT_FOUND"
  | "TOKEN_USED"
  | "TOKEN_EXPIRED";

const STATUS_BY_CODE: Record<ActivationErrorCode, number> = {
  TOKEN_INVALID: 400,
  TOKEN_NOT_FOUND: 400, // hoặc 404 tuỳ bạn
  TOKEN_USED: 409,
  TOKEN_EXPIRED: 410,
};

export class ActivationError extends Error {
  code: ActivationErrorCode;
  status: number;

  constructor(code: ActivationErrorCode, message?: string) {
    super(message || code);
    this.code = code;
    this.status = STATUS_BY_CODE[code] ?? 400;
  }
}