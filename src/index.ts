import * as ResultNs from "./result";

// Run-time
export * from "./program";
export * from "./runtime";
export * from "./dispatch";
// Effect manager
export * from "./effect-manager";

export const Result = ResultNs;
export type Result<TError, TValue> = ResultNs.Result<TError, TValue>;
