import { Cmd } from "./cmd";
import { Sub } from "./sub";
import { Dispatch } from "./dispatch";

/**
 * A program represents the root of an application.
 */
export type Program<S, A, V> = {
  readonly init: (url: string, key: Key) => readonly [S, Cmd<A>?];
  readonly update: (action: A, state: S) => readonly [S, Cmd<A>?];
  readonly view: (props: {
    readonly state: S;
    readonly dispatch: Dispatch<A>;
  }) => V;
  readonly subscriptions?: (state: S) => Sub<A> | undefined;
  readonly onUrlChange?: (url: string) => A;
};

export type Key = () => void;
