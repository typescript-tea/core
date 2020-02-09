/* eslint-disable import/first, import/newline-after-import, import/order */

// Run-time
export * from "./program";
export * from "./runtime";
export * from "./dispatch";
// Effect manager
export * from "./effect-manager";

// Result
import * as ResultNs from "./result";
export const Result = ResultNs;
export type Result<TError, TValue> = ResultNs.Result<TError, TValue>;

// Cmd
import * as CmdNs from "./cmd";
export const Cmd = CmdNs;
export type Cmd<A> = CmdNs.Cmd<A>;

// Sub
import * as SubNs from "./sub";
export const Sub = SubNs;
export type Sub<A> = SubNs.Sub<A>;
