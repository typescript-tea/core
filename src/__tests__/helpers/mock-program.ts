/* eslint-disable functional/prefer-readonly-type */
import { Cmd } from "../../cmd";
import { Dispatch } from "../../dispatch";
import { Sub } from "../../sub";

export type MockProgram<Init, State, Action, View> = {
  readonly init: jest.Mock<readonly [State, Cmd<Action>?], [init: Init]>;
  readonly update: jest.Mock<readonly [State, Cmd<Action>?], [action: Action, state: State]>;
  readonly view: jest.Mock<View, [props: { readonly state: State; readonly dispatch: Dispatch<Action> }]>;
  readonly subscriptions: jest.Mock<Sub<Action> | undefined, [state: State]>;
};

export function createMockProgram<Init, State, Action, View>(): MockProgram<Init, State, Action, View> {
  const init = jest.fn((_init: Init) => [0 as unknown as State] as const);
  const update = jest.fn((_action: Action, state: State) => [state] as const);
  const view = jest.fn(
    (_props: { readonly state: State; readonly dispatch: Dispatch<Action> }) => 0 as unknown as View
  );
  const subscriptions = jest.fn((_state: State) => undefined);
  const mp: MockProgram<Init, State, Action, View> = { init, update, view, subscriptions };
  return mp;
}
