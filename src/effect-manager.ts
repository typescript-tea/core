import { Dispatch } from "./dispatch";
import { Cmd } from "./cmd";
import { Sub } from "./sub";

/**
 * A type that describes an effect manager that can be used by the {@link "program".run} function.
 *
 * @category Effect Manager
 */
export type EffectManager<
  Home = string,
  ProgramAction = unknown,
  SelfAction = unknown,
  SelfState = unknown,
  MyCmd extends Cmd<ProgramAction, Home> = Cmd<ProgramAction, Home>,
  MySub extends Sub<ProgramAction, Home> = Sub<ProgramAction, Home>
> = {
  /**
   * All effect managers must have a unique `Home` string that is used to identify effects that should
   * be routed to each effect manager. This is simply a string with the only constraint that is must
   * be unique among all other effect managers that are used.
   */
  readonly home: Home;
  /**
   * This function is used when calling {@link "cmd".map}.
   */
  readonly mapCmd: <A1, A2>(actionMapper: (a1: A1) => A2, cmd: Cmd<A1>) => Cmd<A2>;
  /**
   * This function is used when calling {@link "sub".map}.
   */
  readonly mapSub: <A1, A2>(actionMapper: (a1: A1) => A2, sub: Sub<A1>) => Sub<A2>;
  /**
   * This function will be called when initializing the effect manager.
   */
  readonly setup: (dispatchProgram: Dispatch<ProgramAction>, dispatchSelf: Dispatch<SelfAction>) => () => void;
  /**
   * This function will be called with effects emitted from the Program matching this manager's home.
   */
  readonly onEffects: (
    dispatchProgram: Dispatch<ProgramAction>,
    dispatchSelf: Dispatch<SelfAction>,
    cmds: ReadonlyArray<MyCmd>,
    subs: ReadonlyArray<MySub>,
    state: SelfState
  ) => SelfState;
  /**
   * This function will be called when the manager issues an action to itself.
   */
  readonly onSelfAction: (
    dispatchProgram: Dispatch<ProgramAction>,
    dispatchSelf: Dispatch<SelfAction>,
    action: SelfAction,
    state: SelfState
  ) => SelfState;
};

/** @ignore */
export function createGetEffectManager(effectManagers: ReadonlyArray<EffectManager>): (home: string) => EffectManager {
  type ManagersByHome = {
    readonly [home: string]: EffectManager;
  };
  function managersByHome(effectManagers: ReadonlyArray<EffectManager>): ManagersByHome {
    return Object.fromEntries(effectManagers.map((em) => [em.home, em]));
  }
  const managers = managersByHome(effectManagers);
  return function getEffectManager(home: string): EffectManager {
    const managerModule = managers[home];
    if (!managerModule) {
      throw new Error(`Could not find effect manager '${home}'. Make sure it was passed to the runtime.`);
    }
    return managerModule;
  };
}
