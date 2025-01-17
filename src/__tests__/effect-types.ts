import { LeafEffect, mapEffect, MappedEffect } from "../effect";

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
