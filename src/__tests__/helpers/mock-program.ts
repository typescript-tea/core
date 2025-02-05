import { Mock, vi } from "vitest";
/* eslint-disable functional/prefer-readonly-type */
import { Cmd } from "../../cmd";
import { Dispatch } from "../../dispatch";
import { Sub } from "../../sub";

export type MockProgram<Init, State, Action, View> = {
  readonly init: Mock<(init: Init) => readonly [State, Cmd<Action>?]>;
  readonly update: Mock<(action: Action, state: State) => readonly [State, Cmd<Action>?]>;
  readonly view: Mock<(props: { readonly state: State; readonly dispatch: Dispatch<Action> }) => View>;
  readonly subscriptions: Mock<(state: State) => Sub<Action> | undefined>;
};

export function createMockProgram<Init, State, Action, View>(): MockProgram<Init, State, Action, View> {
  const init = vi.fn((_init: Init) => [0 as unknown as State] as const);
  const update = vi.fn((_action: Action, state: State) => [state] as const);
  const view = vi.fn((_props: { readonly state: State; readonly dispatch: Dispatch<Action> }) => 0 as unknown as View);
  const subscriptions = vi.fn((_state: State) => undefined);
  const mp: MockProgram<Init, State, Action, View> = { init, update, view, subscriptions };
  return mp;
}
