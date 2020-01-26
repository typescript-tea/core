import { Sub, Cmd } from "./effect-manager";
import { Dispatch } from "./dispatch";

export interface Program<S, A, V> {
  readonly init: (url: string, key: Key) => readonly [S, Cmd<A>?];
  readonly update: (action: A, state: S) => readonly [S, Cmd<A>?];
  readonly view: (props: { readonly state: S; readonly dispatch: Dispatch<A> }) => V;
  readonly subscriptions?: (state: S) => Sub<A> | undefined;
  readonly onUrlChange?: (url: string) => A;
}

export type Key = () => void;
