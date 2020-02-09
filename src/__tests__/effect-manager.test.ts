import { EffectManager, createGetEffectManager } from "../effect-manager";
import { Effect, InternalHome, MappedEffect, gatherEffects, GatheredEffects } from "../effect";
import { ActionMapper } from "../dispatch";

const manager1: EffectManager = {
  home: "manager1",
  mapCmd: (_, b) => b,
  mapSub: (_, b) => b,
  onEffects: () => {
    /* Not implemented */
  },
  onSelfAction: () => {
    /* Not implemented */
  },
};

test("gather effects - single command", () => {
  const gatheredEffects: GatheredEffects<unknown> = {};
  const effect: Effect<unknown> = { home: "manager1", type: "cmd1" };
  gatherEffects(createGetEffectManager([manager1]), gatheredEffects, true, effect);
  expect(gatheredEffects).toEqual({
    manager1: { cmds: [{ home: "manager1", type: "cmd1" }], subs: [] },
  });
});

test("gather effects - mapped command", () => {
  type ChildAction = { type: "ChildAction"; result: string };
  type ParentAction = { type: "ParentAction"; action: ChildAction };
  type MyCmd<A> = {
    home: "MyManager";
    type: "MyCmd";
    gotResult: (result: string) => A;
  };
  const myCmdUnmapped: MyCmd<ChildAction> = {
    home: "MyManager",
    type: "MyCmd",
    gotResult: (result) => ({ type: "ChildAction", result }),
  };
  const myManager: EffectManager = {
    home: "MyManager",
    mapCmd: (actionMapper: ActionMapper<ChildAction, ParentAction>, cmd: MyCmd<ChildAction>): MyCmd<ParentAction> => {
      return {
        ...cmd,
        gotResult: (result) => actionMapper(cmd.gotResult(result)),
      };
    },
    mapSub: (_actionMapper, effect) => effect,
    onEffects: () => {
      /* Not implemented */
    },
    onSelfAction: () => {
      /* Not implemented */
    },
  };
  const getEffectManager = createGetEffectManager([myManager]);
  const gatheredEffects: GatheredEffects<unknown> = {};
  const actionMapper = (action: ChildAction): ParentAction => ({ type: "ParentAction", action });
  const mappedEffect: MappedEffect<ChildAction, ParentAction> = {
    home: InternalHome,
    type: "Mapped",
    original: myCmdUnmapped,
    actionMapper,
  };
  gatherEffects(getEffectManager, gatheredEffects, true, mappedEffect);
  expect(gatheredEffects).toEqual({
    MyManager: { cmds: [{ home: "MyManager", type: "MyCmd", gotResult: expect.any(Function) }], subs: [] },
  });
  const resultOfGotResult = (gatheredEffects["MyManager"].cmds[0] as MyCmd<unknown>).gotResult("Hello");
  expect(resultOfGotResult).toEqual({ type: "ParentAction", action: { type: "ChildAction", result: "Hello" } });
});
