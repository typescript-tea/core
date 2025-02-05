import { BatchedEffect, Effect, LeafEffect, mapEffect, MappedEffect } from "../effect";

// Prevent eslint@typescript-eslint/no-unused-expressions
function use(..._args: ReadonlyArray<unknown>): void {
  //
}

type MappedAction<Action> = { readonly mapped: Action };
function mapAction<Action>(mapped: Action): MappedAction<Action> {
  return { mapped };
}

// Mapping an effect should return a mapped effect.
{
  type Action = "action";

  const effect: LeafEffect<Action> = undefined!;
  const mappedEffect: MappedEffect<Action, MappedAction<Action>> = mapEffect(mapAction, effect)!;

  use(mappedEffect);
}

// Mapping a mapped effect should return a doubly mapped effect.
{
  type Action = "action";

  const mappedEffect: MappedEffect<Action, MappedAction<Action>> = undefined!;
  const doublyMappedEffect: MappedEffect<MappedAction<Action>, MappedAction<MappedAction<Action>>> = mapEffect(
    mapAction,
    mappedEffect
  )!;

  use(doublyMappedEffect);
}

// A Effect<Action> could be
// * A batched effect where the action type is Action
// * A mapped effect where the *outer* action type is Action
{
  type Action = "action";

  const mappedEffect: MappedEffect<unknown, Action> = undefined!;
  const batchedEffect: BatchedEffect<Action> = undefined!;
  const effects: ReadonlyArray<Effect<Action>> = [mappedEffect, batchedEffect];

  // // Only works if LeafEffect has a `__$$dummy_tag: A` property.
  // const mappedEffectN: MappedEffect<Action, unknown> = undefined!;
  // const batchedEffectN: BatchedEffect<Action> = undefined!;
  // // @ts-expect-error: mappedEffect has the *inner* action typed. It should be the outer.
  // const effectsN: ReadonlyArray<Effect<Action>> = [mappedEffectN, batchedEffectN];

  use(effects);
}
