/**
 * This is the runtime that provides the main loop to run a Program
 */

import { Program } from "./program";
import { Dispatch } from "./dispatch";
import {
  EffectManager,
  Cmd,
  ManagersByHome,
  managersByHome,
  GatheredEffects,
  gatherEffects,
  getEffectManager,
} from "./effect-manager";

export type EndProgram = () => void;

export function runtime<S, A, V>(
  program: Program<S, A, V>,
  effectManagers: ReadonlyArray<EffectManager<unknown, unknown, unknown>>
): EndProgram {
  const managers: ManagersByHome = managersByHome(effectManagers);
  const { update, view, subscriptions } = program;
  let state: S;
  const managerStates: { [home: string]: unknown } = {};
  let isRunning = true;
  let isProcessing = false;
  const actionQueue: Array<{ dispatch: Dispatch<unknown>; action: unknown }> = [];

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
      const manager = getEffectManager(home, managers);
      const enqueueSelfAction = enqueueManagerAction(home);
      managerStates[home] = manager.onSelfAction(enqueueAppAction, enqueueSelfAction, action, managerStates[home]);
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

  const enqueueAppAction = (action: A): void => {
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
    cmd && gatherEffects(managers, gatheredEffects, true, cmd); // eslint-disable-line no-unused-expressions
    sub && gatherEffects(managers, gatheredEffects, false, sub); // eslint-disable-line no-unused-expressions
    for (const home of Object.keys(gatheredEffects)) {
      const { cmds, subs } = gatheredEffects[home];
      const manager = getEffectManager(home, managers);
      managerStates[home] = manager.onEffects(
        enqueueAppAction,
        enqueueManagerAction(home),
        cmds,
        subs,
        managerStates[home]
      );
    }
    view({ state, dispatch: enqueueAppAction });
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
      enqueueAppAction(program.onUrlChange(getCurrentUrl()));
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
