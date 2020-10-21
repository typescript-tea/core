import { Cmd } from "./cmd";
import { Sub } from "./sub";
import { Dispatch } from "./dispatch";
import { EffectManager, createGetEffectManager } from "./effect-manager";
import { GatheredEffects, gatherEffects } from "./effect";

/**
 * A program represents the root of an application.
 * @category Program
 */
export type Program<Init, State, Action, View> = {
  readonly init: (init: Init) => readonly [State, Cmd<Action>?];
  readonly update: (action: Action, state: State) => readonly [State, Cmd<Action>?];
  readonly view: (props: { readonly state: State; readonly dispatch: Dispatch<Action> }) => View;
  readonly subscriptions?: (state: State) => Sub<Action> | undefined;
};

/**
 * This is the runtime that provides the main loop to run a Program.
 * Given a Program and an array of EffectManagers it will start the program
 * and progress the state each time the program calls update().
 * You can use the returned function to terminate the program.
 * @param program This is the program to run.
 * @typeParam Init This is the type of the initial value passed to the program's init function.
 * @category Program
 */
export function run<Init, State, Action, View>(
  program: Program<Init, State, Action, View>,
  init: Init,
  render: (view: View) => void,
  effectManagers: ReadonlyArray<EffectManager<string, unknown, unknown>> = []
): () => void {
  const getEffectManager = createGetEffectManager(effectManagers);
  const { update, view, subscriptions } = program;
  let state: State;
  const managerStates: { [home: string]: unknown } = {};
  const managerTeardowns: Array<() => void> = [];
  let isRunning = false;
  let isProcessing = false;
  const actionQueue: Array<{
    dispatch: Dispatch<unknown>;
    action: unknown;
  }> = [];

  function processActions(): void {
    if (!isRunning || isProcessing) {
      return;
    }
    isProcessing = true;
    while (actionQueue.length > 0) {
      const queuedAction = actionQueue.shift()!;
      queuedAction.dispatch(queuedAction.action);
    }
    isProcessing = false;
  }

  const dispatchManager = (home: string) => (action: Action): void => {
    if (isRunning) {
      const manager = getEffectManager(home);
      const enqueueSelfAction = enqueueManagerAction(home);
      managerStates[home] = manager.onSelfAction(enqueueProgramAction, enqueueSelfAction, action, managerStates[home]);
    }
  };

  function dispatchApp(action: Action): void {
    if (isRunning) {
      change(update(action, state));
    }
  }

  const enqueueManagerAction = (home: string) => (action: unknown): void => {
    enqueueRaw(dispatchManager(home), action);
  };

  const enqueueProgramAction = (action: Action): void => {
    enqueueRaw(dispatchApp, action);
  };

  function enqueueRaw(dispatch: Dispatch<Action>, action: unknown): void {
    if (isRunning) {
      actionQueue.push({ dispatch, action });
      processActions();
    }
  }

  function change(change: readonly [State, Cmd<Action>?]): void {
    state = change[0];
    const cmd = change[1];
    const sub = subscriptions && subscriptions(state);
    const gatheredEffects: GatheredEffects<Action> = {};
    cmd && gatherEffects(getEffectManager, gatheredEffects, true, cmd); // eslint-disable-line @typescript-eslint/no-unused-expressions
    sub && gatherEffects(getEffectManager, gatheredEffects, false, sub); // eslint-disable-line @typescript-eslint/no-unused-expressions
    for (const home of Object.keys(gatheredEffects)) {
      const { cmds, subs } = gatheredEffects[home];
      const manager = getEffectManager(home);
      managerStates[home] = manager.onEffects(
        enqueueProgramAction,
        enqueueManagerAction(home),
        cmds,
        subs,
        managerStates[home]
      );
    }
    render(view({ state, dispatch: enqueueProgramAction }));
  }

  function setup(): void {
    for (const em of effectManagers) {
      managerTeardowns.push(em.setup(enqueueProgramAction, enqueueManagerAction(em.home)));
    }
  }

  function teardown(): void {
    for (const mtd of managerTeardowns) {
      mtd();
    }
  }

  setup();

  isRunning = true;

  change(program.init(init));

  processActions();

  return function end(): void {
    if (isRunning) {
      isRunning = false;
      teardown();
    }
  };
}
