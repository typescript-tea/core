import { Mock, vi } from "vitest";
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
  // readonly mapCmd: Mock<ReturnType<EffectManager["mapCmd"]>, Parameters<EffectManager["mapCmd"]>>;
  // eslint-disable-next-line functional/prefer-readonly-type,@typescript-eslint/no-explicit-any
  readonly mapCmd: Mock<(actionMapper: (a1: any) => any, cmd: Cmd<any>) => Cmd<any>>;
  // readonly mapSub: Mock<ReturnType<EffectManager["mapSub"]>, Parameters<EffectManager["mapSub"]>>;
  // eslint-disable-next-line functional/prefer-readonly-type,@typescript-eslint/no-explicit-any
  readonly mapSub: Mock<(actionMapper: (a1: any) => any, cmd: Sub<any>) => Sub<any>>;
  readonly setup: Mock<(dispatchProgram: Dispatch<ProgramAction>, dispatchSelf: Dispatch<SelfAction>) => () => void>;
  readonly onEffects: Mock<
    (
      dispatchProgram: Dispatch<ProgramAction>,
      dispatchSelf: Dispatch<SelfAction>,
      cmds: ReadonlyArray<MyCmd>,
      subs: ReadonlyArray<MySub>,
      state: SelfState
    ) => SelfState
  >;
  readonly onSelfAction: Mock<
    (
      dispatchProgram: Dispatch<ProgramAction>,
      dispatchSelf: Dispatch<SelfAction>,
      action: SelfAction,
      state: SelfState
    ) => SelfState
  >;
};

export function createMockEffectManager<THome extends string>(
  home: THome
): MockEffectManager<THome, MockProgramAction, MockSelfAction, MockSelfState> {
  return {
    home,
    mapCmd: vi.fn(<A1, A2>(_actionMapper: (a: A1) => A2, cmd: MockCmd<A1>): MockCmd<A2> => cmd),
    mapSub: vi.fn(<A1, A2>(_actionMapper: (a: A1) => A2, sub: MockSub<A1>): MockSub<A2> => sub),
    onEffects: vi.fn(
      (
        _dispatchProgram: Dispatch<MockProgramAction>,
        _dispatchSelf: Dispatch<MockSelfAction>,
        _cmds: ReadonlyArray<MockCmd<MockProgramAction>>,
        _subs: ReadonlyArray<MockSub<MockProgramAction>>,
        _state: MockSelfState
      ): MockSelfState => 0
    ),
    onSelfAction: vi.fn(
      (
        _dispatchProgram: Dispatch<MockProgramAction>,
        _dispatchSelf: Dispatch<MockSelfAction>,
        _action: MockSelfAction,
        _state: MockSelfState
      ): MockSelfState => 0
    ),
    setup: vi.fn(
      (_dispatchProgram: Dispatch<MockProgramAction>, _dispatchSelf: Dispatch<MockSelfAction>): (() => void) =>
        () =>
          0
    ),
  };
}
