import { Dispatch } from "./dispatch";
import { LeafEffect, LeafEffectMapper } from "./effect";

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
export type EffectManager<AppAction = unknown, SelfAction = unknown, State = unknown, THome = unknown> = {
  readonly home: THome;
  readonly mapCmd: LeafEffectMapper;
  readonly mapSub: LeafEffectMapper;
  readonly onEffects: OnEffects<AppAction, SelfAction, State>;
  readonly onSelfAction: OnSelfAction<AppAction, SelfAction, State>;
};

/** @ignore */
export function createGetEffectManager(effectManagers: ReadonlyArray<EffectManager>): (home: string) => EffectManager {
  type ManagersByHome = {
    readonly [home: string]: EffectManager<unknown, unknown, unknown>;
  };
  function managersByHome(effectManagers: ReadonlyArray<EffectManager>): ManagersByHome {
    return Object.fromEntries(effectManagers.map((em) => [em.home, em]));
  }
  const managers = managersByHome(effectManagers);
  return function getEffectManager(home: string): EffectManager<unknown> {
    const managerModule = managers[home];
    if (!managerModule) {
      throw new Error(`Could not find effect manager '${home}'. Make sure it was passed to the runtime.`);
    }
    return managerModule;
  };
}
