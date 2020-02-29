import { Dispatch } from "./dispatch";
import { LeafEffect, LeafEffectMapper } from "./effect";

/**
 * A function that will be called by the runtime with the effects (commands and subscriptions)
 * that was gathered for the effect manager.
 */
export type OnEffects<ProgramAction, SelfAction, State> = (
  dispatchProgram: Dispatch<ProgramAction>,
  dispatchSelf: Dispatch<SelfAction>,
  cmds: ReadonlyArray<LeafEffect<ProgramAction>>,
  subs: ReadonlyArray<LeafEffect<ProgramAction>>,
  state: State
) => State;

/**
 * A function that will be called by the runtime with the actions that an effect manager
 * dispatches to itself.
 */
export type OnSelfAction<ProgramAction, SelfAction, State> = (
  dispatchProgram: Dispatch<ProgramAction>,
  dispatchSelf: Dispatch<SelfAction>,
  action: SelfAction,
  state: State
) => State;

/**
 * A type that describes an effect manager that can be used by the runtime.
 */
export type EffectManager<ProgramAction = unknown, SelfAction = unknown, State = unknown, Home = unknown> = {
  readonly home: Home;
  readonly mapCmd: LeafEffectMapper;
  readonly mapSub: LeafEffectMapper;
  readonly onEffects: OnEffects<ProgramAction, SelfAction, State>;
  readonly onSelfAction: OnSelfAction<ProgramAction, SelfAction, State>;
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
