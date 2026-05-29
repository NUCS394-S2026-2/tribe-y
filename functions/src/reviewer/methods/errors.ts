/**
 * Thrown by method handlers when their params don't validate. The RPC
 * dispatcher catches `name === 'InvalidParamsError'` and converts it to a
 * JSON-RPC `-32602` envelope.
 */
export class InvalidParamsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidParamsError';
  }
}
