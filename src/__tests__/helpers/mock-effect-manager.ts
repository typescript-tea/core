/* eslint-disable functional/prefer-readonly-type */
import { Cmd } from "../../cmd";
import { Dispatch } from "../../dispatch";
import { Sub } from "../../sub";

export type MockHome = "mock";
export type MockSelfState = number;
export type MockProgramAction = number;
export type MockSelfAction = number;
export type MockCmd<_ignoredA> = never;
export type MockSub<_ignoredA> = never;

export type MockEffectManager<
  Home,
  ProgramAction,
  SelfAction,
  SelfState,
  MyCmd extends Cmd<ProgramAction, Home> = Cmd<ProgramAction, Home>,
  MySub extends Sub<ProgramAction, Home> = Sub<ProgramAction, Home>
> = {
  readonly home: Home;
  // readonly mapCmd: jest.Mock<ReturnType<EffectManager["mapCmd"]>, Parameters<EffectManager["mapCmd"]>>;
  // eslint-disable-next-line functional/prefer-readonly-type,@typescript-eslint/no-explicit-any
  readonly mapCmd: jest.Mock<Cmd<any>, [actionMapper: (a1: any) => any, cmd: Cmd<any>]>;
  // readonly mapSub: jest.Mock<ReturnType<EffectManager["mapSub"]>, Parameters<EffectManager["mapSub"]>>;
  // eslint-disable-next-line functional/prefer-readonly-type,@typescript-eslint/no-explicit-any
  readonly mapSub: jest.Mock<Sub<any>, [actionMapper: (a1: any) => any, cmd: Sub<any>]>;
  readonly setup: jest.Mock<() => void, [dispatchProgram: Dispatch<ProgramAction>, dispatchSelf: Dispatch<SelfAction>]>;
  readonly onEffects: jest.Mock<
    SelfState,
    [
      dispatchProgram: Dispatch<ProgramAction>,
      dispatchSelf: Dispatch<SelfAction>,
      cmds: ReadonlyArray<MyCmd>,
      subs: ReadonlyArray<MySub>,
      state: SelfState
    ]
  >;
  readonly onSelfAction: jest.Mock<
    SelfState,
    [dispatchProgram: Dispatch<ProgramAction>, dispatchSelf: Dispatch<SelfAction>, action: SelfAction, state: SelfState]
  >;
};

export function createMockEffectManager<THome extends string>(
  home: THome
): MockEffectManager<THome, MockProgramAction, MockSelfAction, MockSelfState> {
  return {
    home,
    mapCmd: jest.fn(<A1, A2>(_actionMapper: (a: A1) => A2, cmd: MockCmd<A1>): MockCmd<A2> => cmd),
    mapSub: jest.fn(<A1, A2>(_actionMapper: (a: A1) => A2, sub: MockSub<A1>): MockSub<A2> => sub),
    onEffects: jest.fn(
      (
        _dispatchProgram: Dispatch<MockProgramAction>,
        _dispatchSelf: Dispatch<MockSelfAction>,
        _cmds: ReadonlyArray<MockCmd<MockProgramAction>>,
        _subs: ReadonlyArray<MockSub<MockProgramAction>>,
        _state: MockSelfState
      ): MockSelfState => 0
    ),
    onSelfAction: jest.fn(
      (
        _dispatchProgram: Dispatch<MockProgramAction>,
        _dispatchSelf: Dispatch<MockSelfAction>,
        _action: MockSelfAction,
        _state: MockSelfState
      ): MockSelfState => 0
    ),
    setup: jest.fn(
      (_dispatchProgram: Dispatch<MockProgramAction>, _dispatchSelf: Dispatch<MockSelfAction>): (() => void) =>
        () =>
          0
    ),
  };
}
