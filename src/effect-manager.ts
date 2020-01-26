import { exhaustiveCheck } from "ts-exhaustive-check";
import { Dispatch, ActionMapper } from "./dispatch";

export type Cmd<A> = Effect<A>;
export const batchCmds = batchEffects;
export const mapCmd = mapEffect;

export type Sub<A> = Effect<A>;
export const batchSubs = batchEffects;
export const mapSub = mapEffect;

export type Effect<A> = BatchedEffect<A> | MappedEffect<A, unknown> | LeafEffect<A>;

const InternalHome = "__internal";
type InternalHome = typeof InternalHome;

export interface LeafEffect<_A> {
  readonly home: string;
  readonly type: string;
}

interface BatchedEffect<A> {
  readonly home: InternalHome;
  readonly type: "Batched";
  readonly list: ReadonlyArray<Effect<A>>;
}

interface MappedEffect<A1, A2> {
  readonly home: InternalHome;
  readonly type: "Mapped";
  readonly actionMapper: ActionMapper<A1, A2>;
  readonly original: BatchedEffect<A1> | MappedEffect<A1, A2> | LeafEffect<A1>;
}

function batchEffects<A>(effects: ReadonlyArray<Effect<A> | undefined>): BatchedEffect<A> {
  return {
    home: InternalHome,
    type: "Batched",
    list: effects.filter((c) => c !== undefined) as ReadonlyArray<Effect<A>>,
  };
}

function mapEffect<A1, A2>(
  mapper: ActionMapper<A1, A2>,
  c: BatchedEffect<A1> | MappedEffect<A1, A2> | LeafEffect<A1> | undefined
): MappedEffect<A1, A2> | undefined {
  return c === undefined ? undefined : { home: InternalHome, type: "Mapped", actionMapper: mapper, original: c };
}

export type LeafEffectMapper<A1, A2> = (actionMapper: ActionMapper<A1, A2>, effect: Effect<A1>) => LeafEffect<A2>;

export interface EffectManager<AppAction = unknown, ManagerAction = unknown, ManagerState = unknown, THome = unknown> {
  readonly home: THome;
  readonly mapCmd: LeafEffectMapper<AppAction, ManagerAction>;
  readonly mapSub: LeafEffectMapper<AppAction, ManagerAction>;
  readonly onEffects: (
    dispatchApp: Dispatch<AppAction>,
    dispatchSelf: Dispatch<ManagerAction>,
    cmds: ReadonlyArray<LeafEffect<AppAction>>,
    subs: ReadonlyArray<LeafEffect<AppAction>>,
    state: ManagerState
  ) => ManagerState;
  readonly onSelfAction: (
    dispatchApp: Dispatch<AppAction>,
    dispatchSelf: Dispatch<ManagerAction>,
    action: ManagerAction,
    state: ManagerState
  ) => ManagerState;
}

export interface ManagersByHome {
  readonly [home: string]: EffectManager<unknown, unknown, unknown>;
}

export function managersByHome(
  effectManagers: ReadonlyArray<EffectManager<unknown, unknown, unknown>>
): ManagersByHome {
  return Object.fromEntries(effectManagers.map((em) => [em.home, em]));
}

export function getEffectManager(home: string, managers: ManagersByHome): EffectManager<unknown> {
  const managerModule = managers[home];
  if (!managerModule) {
    throw new Error(`Could not find effect manager '${home}'. Make sure it was passed to the runtime.`);
  }
  return managerModule;
}

export interface GatheredEffects<A> {
  // This interface is mutable for efficency
  // eslint-disable-next-line
  [home: string]: { readonly cmds: Array<LeafEffect<A>>; readonly subs: Array<LeafEffect<A>> };
}

export function gatherEffects<A>(
  managers: ManagersByHome,
  gatheredEffects: GatheredEffects<A>,
  isCmd: boolean,
  effect: Effect<unknown>,
  actionMapper: ActionMapper<unknown, unknown> | undefined = undefined
): void {
  if (effect.home === InternalHome) {
    const internalEffect = effect as BatchedEffect<unknown> | MappedEffect<unknown, unknown>;
    switch (internalEffect.type) {
      case "Batched": {
        internalEffect.list.flatMap((c) => gatherEffects(managers, gatheredEffects, isCmd, c, actionMapper));
        return;
      }
      case "Mapped":
        gatherEffects(
          managers,
          gatheredEffects,
          isCmd,
          internalEffect.original,
          actionMapper ? (a) => actionMapper(internalEffect.actionMapper(a)) : internalEffect.actionMapper
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
    const list = isCmd ? gatheredEffects[effect.home].cmds : gatheredEffects[effect.home].subs;
    const mapper = isCmd ? manager.mapCmd : manager.mapSub;
    list.push(actionMapper ? mapper(actionMapper, effect) : effect);
  }
}
