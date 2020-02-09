import { exhaustiveCheck } from "ts-exhaustive-check";
import { Dispatch, ActionMapper } from "./dispatch";
import {
  LeafEffect,
  LeafEffectMapper,
  InternalHome,
  Effect,
  BatchedEffect,
  MappedEffect
} from "./effect";

/**
 * A function that will be called by the runtime with the effects (commands and subscriptions)
 * that was gathered for the effect manager.
 */
export type OnEffects<AppAction, SelfAction, State> = (
  dispatchApp: Dispatch<AppAction>,
  dispatchSelf: Dispatch<SelfAction>,
  cmds: ReadonlyArray<LeafEffect<AppAction>>,
  subs: ReadonlyArray<LeafEffect<AppAction>>,
  state: State
) => State;

/**
 * A function that will be called by the runtime with the actions that an effect manager
 * dispatches to itself.
 */
export type OnSelfAction<AppAction, SelfAction, State> = (
  dispatchApp: Dispatch<AppAction>,
  dispatchSelf: Dispatch<SelfAction>,
  action: SelfAction,
  state: State
) => State;

/**
 * A type that describes an effect manager that can be used by the runtime.
 */
export type EffectManager<
  AppAction = unknown,
  SelfAction = unknown,
  State = unknown,
  THome = unknown
> = {
  readonly home: THome;
  readonly mapCmd: LeafEffectMapper;
  readonly mapSub: LeafEffectMapper;
  readonly onEffects: OnEffects<AppAction, SelfAction, State>;
  readonly onSelfAction: OnSelfAction<AppAction, SelfAction, State>;
};

/** @ignore */
export type ManagersByHome = {
  readonly [home: string]: EffectManager<unknown, unknown, unknown>;
};

/** @ignore */
export function managersByHome(
  effectManagers: ReadonlyArray<EffectManager<unknown, unknown, unknown>>
): ManagersByHome {
  return Object.fromEntries(effectManagers.map(em => [em.home, em]));
}

/** @ignore */
export function getEffectManager(
  home: string,
  managers: ManagersByHome
): EffectManager<unknown> {
  const managerModule = managers[home];
  if (!managerModule) {
    throw new Error(
      `Could not find effect manager '${home}'. Make sure it was passed to the runtime.`
    );
  }
  return managerModule;
}

/** @ignore */
export type GatheredEffects<A> = {
  // This type is mutable for efficency
  // eslint-disable-next-line functional/prefer-readonly-type
  [home: string]: {
    // eslint-disable-next-line functional/prefer-readonly-type
    readonly cmds: Array<LeafEffect<A>>;
    // eslint-disable-next-line functional/prefer-readonly-type
    readonly subs: Array<LeafEffect<A>>;
  };
};

/** @ignore */
export function gatherEffects<A>(
  managers: ManagersByHome,
  gatheredEffects: GatheredEffects<A>,
  isCmd: boolean,
  effect: Effect<unknown>,
  actionMapper: ActionMapper<unknown, unknown> | undefined = undefined
): void {
  if (effect.home === InternalHome) {
    const internalEffect = effect as
      | BatchedEffect<unknown>
      | MappedEffect<unknown, unknown>;
    switch (internalEffect.type) {
      case "Batched": {
        internalEffect.list.flatMap(c =>
          gatherEffects(managers, gatheredEffects, isCmd, c, actionMapper)
        );
        return;
      }
      case "Mapped":
        gatherEffects(
          managers,
          gatheredEffects,
          isCmd,
          internalEffect.original,
          actionMapper
            ? a => actionMapper(internalEffect.actionMapper(a))
            : internalEffect.actionMapper
        );
        return;
      default:
        exhaustiveCheck(internalEffect, true);
    }
  } else {
    const manager = getEffectManager(effect.home, managers);
    if (!gatheredEffects[effect.home]) {
      gatheredEffects[effect.home] = { cmds: [], subs: [] };
    }
    const list = isCmd
      ? gatheredEffects[effect.home].cmds
      : gatheredEffects[effect.home].subs;
    const mapper = isCmd ? manager.mapCmd : manager.mapSub;
    list.push(actionMapper ? mapper(actionMapper, effect) : effect);
  }
}
