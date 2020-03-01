import { Dispatch } from "./dispatch";
import { LeafEffect, LeafEffectMapper } from "./effect";

/**
 * A type that describes an effect manager that can be used by the runtime.
 */
export type EffectManager<ProgramAction = unknown, SelfAction = unknown, State = unknown, Home = unknown> = {
  readonly home: Home;
  readonly mapCmd: LeafEffectMapper;
  readonly mapSub: LeafEffectMapper;
  readonly onEffects: (
    dispatchProgram: Dispatch<ProgramAction>,
    dispatchSelf: Dispatch<SelfAction>,
    cmds: ReadonlyArray<LeafEffect<ProgramAction>>,
    subs: ReadonlyArray<LeafEffect<ProgramAction>>,
    state: State
  ) => State;
  readonly onSelfAction: (
    dispatchProgram: Dispatch<ProgramAction>,
    dispatchSelf: Dispatch<SelfAction>,
    action: SelfAction,
    state: State
  ) => State;
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
