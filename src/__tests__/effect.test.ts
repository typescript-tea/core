import { Effect, InternalHome, MappedEffect, gatherEffects, GatheredEffects, EffectMapper } from "../effect";
import { ActionMapper } from "../dispatch";

test("gather effects - single command", () => {
  const manager1: EffectMapper = {
    home: "manager1",
    mapCmd: (_, b) => b,
    mapSub: (_, b) => b,
  };
  const effect: Effect<unknown> = { home: "manager1", type: "cmd1" };
  const gatheredEffects: GatheredEffects<unknown> = {};
  gatherEffects(() => manager1, gatheredEffects, true, effect);
  expect(gatheredEffects).toEqual({
    manager1: { cmds: [{ home: "manager1", type: "cmd1" }], subs: [] },
  });
});

test("gather effects - mapped command", () => {
  type ChildAction = { type: "ChildAction"; result: string };
  type ParentAction = { type: "ParentAction"; action: ChildAction };
  type MyCmd<A> = { home: "MyManager"; type: "MyCmd"; gotResult: (result: string) => A };
  const myCmdFromChild: MyCmd<ChildAction> = {
    home: "MyManager",
    type: "MyCmd",
    gotResult: (result) => ({ type: "ChildAction", result }),
  };
  const actionMapper = (action: ChildAction): ParentAction => ({ type: "ParentAction", action });
  const myCmdFromParent: MappedEffect<ChildAction, ParentAction> = {
    home: InternalHome,
    type: "Mapped",
    original: myCmdFromChild,
    actionMapper,
  };
  const mapper: EffectMapper<unknown, unknown, "MyManager"> = {
    home: "MyManager",
    mapCmd: (actionMapper: ActionMapper<ChildAction, ParentAction>, cmd: MyCmd<ChildAction>): MyCmd<ParentAction> => {
      return { ...cmd, gotResult: (result) => actionMapper(cmd.gotResult(result)) };
    },
    mapSub: (_actionMapper, effect) => effect,
  };
  const gatheredEffects: GatheredEffects<unknown> = {};
  gatherEffects(() => mapper, gatheredEffects, true, myCmdFromParent);
  expect(gatheredEffects).toEqual({
    MyManager: { cmds: [{ home: "MyManager", type: "MyCmd", gotResult: expect.any(Function) }], subs: [] },
  });
  const resultOfGotResult = (gatheredEffects["MyManager"].cmds[0] as MyCmd<unknown>).gotResult("Hello");
  expect(resultOfGotResult).toEqual({ type: "ParentAction", action: { type: "ChildAction", result: "Hello" } });
});
