/**
 * **Note:** Elm has **managed effects**, meaning that things like HTTP
 * requests or writing to disk are all treated as *data* in Elm. When this
 * data is given to the Elm runtime system, it can do some “query optimization”
 * before actually performing the effect. Perhaps unexpectedly, this managed
 * effects idea is the heart of why Elm is so nice for testing, reuse,
 * reproducibility, etc.
 *
 * Elm has two kinds of managed effects: commands and subscriptions.
 * @packageDocumentation
 */

import { batchEffects, mapEffect } from "./effect";

// -- COMMANDS

/**
 * A command is a way of telling an EffectManager, “Hey, I want you to do this thing!”
 * So if you want to send an HTTP request, you would need to command an EffectManager to do it.
 * Or if you wanted to ask for geolocation, you would need to command an EffectManager to go
 * get it.
 * Every `Cmd` specifies (1) which effects you need access to and (2) the type of
 * messages that will come back into your application.
 * @category Commands
 */
export type Cmd<_Action, Home = string> = {
  readonly home: Home;
  readonly type: string;
};
// export type Cmd<Action> = LeafEffect<Action>;

/**
 * When you need the runtime system to perform a couple commands, you
 * can batch them together. Each is handed to the runtime at the same time,
 * and since each can perform arbitrary operations in the world, there are
 * no ordering guarantees about the results.
 * @category Commands
 */
export function batch<A>(cmds: ReadonlyArray<Cmd<A> | undefined>): Cmd<A> {
  return batchEffects(cmds);
}

/**
 * If you are using a fractal approach where a Cmd can come from
 * a child's update function, you need to map the command in order for it
 * to produce an action that can be routed back to the child.
 * @category Fancy Stuff
 */
export function map<A1, A2>(actionMapper: (a1: A1) => A2, cmd: Cmd<A1> | undefined): Cmd<A2> | undefined {
  return mapEffect(actionMapper, cmd);
}
// export const map = mapEffect;
