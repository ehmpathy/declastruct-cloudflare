// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { ConstraintError } from 'helpful-errors/dist/ConstraintError';

/**
 * .what = error for intermediate stages that require human action
 * .why = distinguishes "action required" from "you made a mistake"
 *
 * semantics:
 *   - BadRequestError = caller made a mistake, fix your input
 *   - ConstraintError = constraint violation, caller must fix
 *   - UnexpectedCodePathError = internal bug, should not happen
 *   - HumanGuidanceError = intermediate stage, human action required
 *
 * extends ConstraintError for exit code 2 (caller must act)
 *
 * usage:
 *   HumanGuidanceError.throw('domain transfer required', {
 *     domain: 'example.com',
 *     registrar: 'Squarespace',
 *     steps: ['disable dnssec', 'get auth code', ...],
 *   });
 */
export class HumanGuidanceError extends ConstraintError {
  /**
   * .what = emoji for human guidance errors
   * .why = visual distinction from constraint/bad-request errors
   */
  static override emoji = '🧭';

  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, metadata);
    this.name = 'HumanGuidanceError';
  }

  static override throw(
    message: string,
    metadata?: Record<string, unknown>,
  ): never {
    throw new HumanGuidanceError(message, metadata);
  }
}
