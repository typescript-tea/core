/**
 * **Note:** TEA has **managed effects**, meaning that things like HTTP
 * requests or writing to disk are all treated as *data* in TEA. When this
 * data is given to the TEA runtime system, it can do some “query optimization”
 * before actually performing the effect. Perhaps unexpectedly, this managed
 * effects idea is the heart of why TEA is so nice for testing, reuse,
 * reproducibility, etc.
 *
 * TEA has two kinds of managed effects: commands and subscriptions.
 * @packageDocumentation
 */
import { batchEffects, mapEffect } from "./effect";

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
 * @category Subscriptions
 */
export type Sub<_Action, Home = string> = {
  readonly home: Home;
  readonly type: string;
};

/**
 * When you need to subscribe to multiple things, you can create a `batch` of
 * subscriptions.
 * @category Subscriptions
 */
export function batch<A>(cmds: ReadonlyArray<Sub<A> | undefined>): Sub<A> {
  return batchEffects(cmds);
}
// export const batch = batchEffects;

/**
 * If you are using a fractal approach where a Sub can come from
 * a child's subscription function, you need to map the Sub in order for it
 * to produce an action that can be routed back to the child.
 * @category Fancy Stuff
 */
export function map<A1, A2>(actionMapper: (a1: A1) => A2, cmd: Sub<A1> | undefined): Sub<A2> | undefined {
  return mapEffect(actionMapper, cmd);
}
// export const map = mapEffect;
