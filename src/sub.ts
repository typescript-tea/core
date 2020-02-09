import { LeafEffect, batchEffects, mapEffect } from "./effect";

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
export const batch = batchEffects;

/**
 * If you are using a fractal approach where a Sub can come from
 * a child's subscription function, you need to map the Sub in order for it
 * to produce an action that can be routed back to the child.
 */
export const map = mapEffect;
