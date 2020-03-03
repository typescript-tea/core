import { Cmd } from "./cmd";
import { Sub } from "./sub";
import { Dispatch } from "./dispatch";
import { EffectManager, createGetEffectManager } from "./effect-manager";
import { GatheredEffects, gatherEffects } from "./effect";

/**
 * A program represents the root of an application.
 */
export type Program<State, Action, View> = {
  readonly init: (url: string, key: () => void) => readonly [State, Cmd<Action>?];
  readonly update: (action: Action, state: State) => readonly [State, Cmd<Action>?];
  readonly view: (props: { readonly state: State; readonly dispatch: Dispatch<Action> }) => View;
  readonly subscriptions?: (state: State) => Sub<Action> | undefined;
  readonly onUrlChange?: (url: string) => Action;
};

/**
 * This is the runtime that provides the main loop to run a Program.
 * Given a Program and an array of EffectManagers it will start the program
 * and progress the state each time the program calls update().
 * You can use the returned function to terminate the program.
 */
export function run<S, A, V>(
  program: Program<S, A, V>,
  render: (view: V) => void,
  effectManagers?: ReadonlyArray<EffectManager<unknown, unknown, unknown>>
): () => void {
  const getEffectManager = createGetEffectManager(effectManagers || []);
  const { update, view, subscriptions } = program;
  let state: S;
  const managerStates: { [home: string]: unknown } = {};
  let isRunning = true;
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

  const dispatchManager = (home: string) => (action: A): void => {
    if (isRunning) {
      const manager = getEffectManager(home);
      const enqueueSelfAction = enqueueManagerAction(home);
      managerStates[home] = manager.onSelfAction(enqueueProgramAction, enqueueSelfAction, action, managerStates[home]);
    }
  };

  function dispatchApp(action: A): void {
    if (isRunning) {
      change(update(action, state));
    }
  }

  const enqueueManagerAction = (home: string) => (action: unknown): void => {
    enqueueRaw(dispatchManager(home), action);
  };

  const enqueueProgramAction = (action: A): void => {
    enqueueRaw(dispatchApp, action);
  };

  function enqueueRaw(dispatch: Dispatch<A>, action: unknown): void {
    if (isRunning) {
      actionQueue.push({ dispatch, action });
      processActions();
    }
  }

  function change(change: readonly [S, Cmd<A>?]): void {
    state = change[0];
    const cmd = change[1];
    const sub = subscriptions && subscriptions(state);
    const gatheredEffects: GatheredEffects<A> = {};
    cmd && gatherEffects(getEffectManager, gatheredEffects, true, cmd); // eslint-disable-line no-unused-expressions
    sub && gatherEffects(getEffectManager, gatheredEffects, false, sub); // eslint-disable-line no-unused-expressions
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
    window.addEventListener("popstate", key);
    // eslint-disable-next-line no-unused-expressions
    window.navigator.userAgent.indexOf("Trident") < 0 || window.addEventListener("hashchange", key);
  }

  function teardown(): void {
    window.removeEventListener("popstate", key);
  }

  function key(): void {
    if (program.onUrlChange) {
      enqueueProgramAction(program.onUrlChange(getCurrentUrl()));
    }
  }

  setup();

  change(program.init(getCurrentUrl(), key));

  return function end(): void {
    if (isRunning) {
      isRunning = false;
      teardown();
    }
  };
}

function getCurrentUrl(): string {
  // return window.location.href;
  return window.location.pathname;
}
