/* eslint-disable import/first, import/newline-after-import, import/order */

// Program
import * as ProgramNs from "./program";
export const Program = ProgramNs;
export type Program<S, A, V> = ProgramNs.Program<S, A, V>;

// Dispatch
import * as DispatchNs from "./dispatch";
export const Dispatch = DispatchNs;
export type Dispatch<A> = DispatchNs.Dispatch<A>;

// Effect manager
export * from "./effect-manager";

// Cmd
import * as CmdNs from "./cmd";
export const Cmd = CmdNs;
export type Cmd<A> = CmdNs.Cmd<A>;

// Sub
import * as SubNs from "./sub";
export const Sub = SubNs;
export type Sub<A> = SubNs.Sub<A>;

// Result
import * as ResultNs from "./result";
export const Result = ResultNs;
export type Result<TError, TValue> = ResultNs.Result<TError, TValue>;
