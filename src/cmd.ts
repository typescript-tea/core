import { LeafEffect, batchEffects, mapEffect } from "./effect";

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
export const batch = batchEffects;

/**
 * If you are using a fractal approach where a Cmd can come from
 * a child's update function, you need to map the command in order for it
 * to produce an action that can be routed back to the child.
 */
export const map = mapEffect;
