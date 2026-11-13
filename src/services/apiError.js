import { toUserMessage } from '../utils/errorMessage';

export function toError(code) {
  const error = new Error(toUserMessage(code));
  error.code = code ?? null;
  return error;
}
