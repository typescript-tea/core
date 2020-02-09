import { ActionMapper } from "./dispatch";

/**
 * Commands and Subscriptions are both effects and they can both be batched and mapped.
 * This module handles the batching and mapping of both commands and subscriptions
 * in a generic way.
 * Each effect specifies a "home" that it belongs to. The effects can then be
 * gathered by "home" and passed to the Effect Manager for that "home".
 * This is an internal module which is not intended for outside usage.
 * Please use only the Cmd and Sub modules externally.
 */
export type Effect<A> =
  | BatchedEffect<A>
  | MappedEffect<A, unknown>
  | LeafEffect<A>;

export const InternalHome = "__internal";
export type InternalHome = typeof InternalHome;

export type LeafEffect<_A> = {
  readonly home: string;
  readonly type: string;
};

export type BatchedEffect<A> = {
  readonly home: InternalHome;
  readonly type: "Batched";
  readonly list: ReadonlyArray<Effect<A>>;
};

export type MappedEffect<A1, A2> = {
  readonly home: InternalHome;
  readonly type: "Mapped";
  readonly actionMapper: ActionMapper<A1, A2>;
  readonly original: BatchedEffect<A1> | MappedEffect<A1, A2> | LeafEffect<A1>;
};

export function batchEffects<A>(
  effects: ReadonlyArray<Effect<A> | undefined>
): BatchedEffect<A> {
  return {
    home: InternalHome,
    type: "Batched",
    list: effects.filter(c => c !== undefined) as ReadonlyArray<Effect<A>>
  };
}

export function mapEffect<A1, A2>(
  mapper: ActionMapper<A1, A2>,
  c: BatchedEffect<A1> | MappedEffect<A1, A2> | LeafEffect<A1> | undefined
): MappedEffect<A1, A2> | undefined {
  return c === undefined
    ? undefined
    : { home: InternalHome, type: "Mapped", actionMapper: mapper, original: c };
}

export type LeafEffectMapper<A1 = unknown, A2 = unknown> = (
  actionMapper: ActionMapper<A1, A2>,
  effect: Effect<A1>
) => LeafEffect<A2>;
