/* eslint-disable functional/prefer-readonly-type */
import { Cmd } from "../../cmd";
import { Dispatch } from "../../dispatch";
import { EffectManager } from "../../effect-manager";
import { Sub } from "../../sub";

export type MockRender<View> = (view: View) => void;

export function createMockRender<View>(): MockRender<View> {
  return jest.fn(() => "");
}

export type MockHome = "mock";
export type MockSelfState = number;
export type MockProgramAction = number;
export type MockSelfAction = number;
export type MockCmd<_ignoredA> = never;
export type MockSub<_ignoredA> = never;

export type MockProgram<Init, State, Action, View> = {
  readonly init: jest.Mock<readonly [State, Cmd<Action>?], [init: Init]>;
  readonly update: jest.Mock<readonly [State, Cmd<Action>?], [action: Action, state: State]>;
  readonly view: jest.Mock<View, [props: { readonly state: State; readonly dispatch: Dispatch<Action> }]>;
  readonly subscriptions: jest.Mock<Sub<Action> | undefined, [state: State]>;
};

export function createMockProgram<Init, State, Action, View>(): MockProgram<Init, State, Action, View> {
  const init = jest.fn((_init: Init) => [(0 as unknown) as State] as const);
  const update = jest.fn((_action: Action, state: State) => [state] as const);
  const view = jest.fn(
    (_props: { readonly state: State; readonly dispatch: Dispatch<Action> }) => (0 as unknown) as View
  );
  const subscriptions = jest.fn((_state: State) => undefined);
  const mp: MockProgram<Init, State, Action, View> = { init, update, view, subscriptions };
  return mp;
}

export type MockEffectManager = {
  readonly home: MockHome;
  // readonly mapCmd: jest.Mock<ReturnType<EffectManager["mapCmd"]>, Parameters<EffectManager["mapCmd"]>>;
  // eslint-disable-next-line functional/prefer-readonly-type,@typescript-eslint/no-explicit-any
  readonly mapCmd: jest.Mock<Cmd<any>, [(a1: any) => any, Cmd<any>]>;
  // readonly mapSub: jest.Mock<ReturnType<EffectManager["mapSub"]>, Parameters<EffectManager["mapSub"]>>;
  // eslint-disable-next-line functional/prefer-readonly-type,@typescript-eslint/no-explicit-any
  readonly mapSub: jest.Mock<Sub<any>, [(a1: any) => any, Sub<any>]>;
  readonly setup: jest.Mock<ReturnType<EffectManager["setup"]>, Parameters<EffectManager["setup"]>>;
  readonly onEffects: jest.Mock<ReturnType<EffectManager["onEffects"]>, Parameters<EffectManager["onEffects"]>>;
  readonly onSelfAction: jest.Mock<
    ReturnType<EffectManager["onSelfAction"]>,
    Parameters<EffectManager["onSelfAction"]>
  >;
};

export function createMockEffectManager(): MockEffectManager {
  const onEffects = jest.fn(
    (
      _dispatchProgram: Dispatch<MockProgramAction>,
      _dispatchSelf: Dispatch<MockSelfAction>,
      _cmds: ReadonlyArray<MockCmd<MockProgramAction>>,
      _subs: ReadonlyArray<MockSub<MockProgramAction>>,
      _state: MockSelfState
    ): MockSelfState => 0
  );

  const mapCmd = jest.fn(<A1, A2>(_actionMapper: (a: A1) => A2, cmd: MockCmd<A1>): MockCmd<A2> => cmd);
  const mapSub = jest.fn(<A1, A2>(_actionMapper: (a: A1) => A2, sub: MockSub<A1>): MockSub<A2> => sub);

  const onSelfAction = jest.fn(
    (
      _dispatchProgram: Dispatch<MockProgramAction>,
      _dispatchSelf: Dispatch<MockSelfAction>,
      _action: MockSelfAction,
      _state: MockSelfState
    ): MockSelfState => 0
  );

  const setup = jest.fn(
    (_dispatchProgram: Dispatch<MockProgramAction>, _dispatchSelf: Dispatch<MockSelfAction>): (() => void) => () => 0
  );

  const em: MockEffectManager = {
    home: "mock",
    mapCmd,
    mapSub,
    onEffects,
    onSelfAction,
    setup,
  };
  return em;
}
