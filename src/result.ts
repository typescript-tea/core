/**
 * @module Result
 */

// -- RESULT (from elm core)

/**
 * A `Result` is either `Ok` meaning the computation succeeded, or it is an
 * `Err` meaning that there was some failure.
 */
export type Result<TError, TValue> =
  | { readonly type: "Ok"; readonly value: TValue }
  | { readonly type: "Err"; readonly error: TError };
export function Ok<TValue>(value: TValue): Result<never, TValue> {
  return { type: "Ok", value };
}
export function Err<TError>(error: TError): Result<TError, never> {
  return { type: "Err", error };
}

/**
 * Transform an `Err` value. For example, say the errors we get have too much
 * information:
 *     parseInt : String -> Result ParseError Int
 *     type alias ParseError =
 *         { message : String
 *         , code : Int
 *         , position : (Int,Int)
 *         }
 *     mapError .message (parseInt "123") == Ok 123
 *     mapError .message (parseInt "abc") == Err "char 'a' is not a number"
 */
export function mapError<x, y, a>(f: (x: x) => y, result: Result<x, a>): Result<y, a> {
  switch (result.type) {
    case "Ok":
      return Ok(result.value);
    case "Err":
      return Err(f(result.error));
    default: {
      const exhaustive: never = result;
      throw new Error(`Invalid result type ${exhaustive}`);
    }
  }
}
