import { exhaustiveCheck } from "ts-exhaustive-check";
import { Dispatch, ActionMapper } from "./dispatch";

// -- COMMANDS

/**
 * A command is a way of telling an EffectManager, “Hey, I want you to do this thing!”
 * So if you want to send an HTTP request, you would need to command an EffectManager to do it.
 * Or if you wanted to ask for geolocation, you would need to command an EffectManager to go
 * get it.
 * Every `Cmd` specifies (1) which effects you need access to and (2) the type of
 * messages that will come back into your application.
 */
export type Cmd<A> = LeafEffect<A>;

/**
 * When you need the runtime system to perform a couple commands, you
 * can batch them together. Each is handed to the runtime at the same time,
 * and since each can perform arbitrary operations in the world, there are
 * no ordering guarantees about the results.
 */
export const batchCmds = batchEffects;

/**
 * If you are using a fractal approach where a Cmd can come from
 * a child's update function, you need to map the command in order for it
 * to produce an action that can be routed back to the child.
 */
export const mapCmd = mapEffect;

// -- SUBSCRIPTIONS

/**
 * A subscription is a way of telling an EffectManager, "Hey, let me know if anything
 * interesting happens over there!" So if you want to listen for messages on a web
 * socket, you would tell an EffectManager to create a subscription. If you want to get clock
 * ticks, you would tell an EffectManager to subscribe to that. The cool thing here is that
 * this means an *EffectManager* manages all the details of subscriptions instead of *you*.
 * So if a web socket goes down, *you* do not need to manually reconnect with an
 * exponential backoff strategy, the *EffectManager* does this all for you behind the scenes!
 * Every `Sub` specifies (1) which effects you need access to and (2) the type of
 * messages that will come back into your application.
 */
export type Sub<A> = LeafEffect<A>;

/**
 * When you need to subscribe to multiple things, you can create a `batch` of
 * subscriptions.
 */
export const batchSubs = batchEffects;

/**
 * If you are using a fractal approach where a Sub can come from
 * a child's subscription function, you need to map the Sub in order for it
 * to produce an action that can be routed back to the child.
 */
export const mapSub = mapEffect;

/** @ignore */
export type Effect<A> =
  | BatchedEffect<A>
  | MappedEffect<A, unknown>
  | LeafEffect<A>;

const InternalHome = "__internal";
type InternalHome = typeof InternalHome;

export type LeafEffect<_A> = {
  readonly home: string;
  readonly type: string;
};

type BatchedEffect<A> = {
  readonly home: InternalHome;
  readonly type: "Batched";
  readonly list: ReadonlyArray<Effect<A>>;
};

type MappedEffect<A1, A2> = {
  readonly home: InternalHome;
  readonly type: "Mapped";
  readonly actionMapper: ActionMapper<A1, A2>;
  readonly original: BatchedEffect<A1> | MappedEffect<A1, A2> | LeafEffect<A1>;
};

function batchEffects<A>(
  effects: ReadonlyArray<Effect<A> | undefined>
): BatchedEffect<A> {
  return {
    home: InternalHome,
    type: "Batched",
    list: effects.filter(c => c !== undefined) as ReadonlyArray<Effect<A>>
  };
}

function mapEffect<A1, A2>(
  mapper: ActionMapper<A1, A2>,
  c: BatchedEffect<A1> | MappedEffect<A1, A2> | LeafEffect<A1> | undefined
): MappedEffect<A1, A2> | undefined {
  return c === undefined
    ? undefined
    : { home: InternalHome, type: "Mapped", actionMapper: mapper, original: c };
}

export type LeafEffectMapper<A1 = unknown, A2 = unknown> = (
  actionMapper: ActionMapper<A1, A2>,
  effect: Effect<A1>
) => LeafEffect<A2>;

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
