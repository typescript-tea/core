import { managersByHome, EffectManager, gatherEffects, GatheredEffects } from "../effect-manager";
import { Effect, InternalHome, MappedEffect } from "../effect";

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

test("managersByHome build map", () => {
  const map = managersByHome([manager1]);
  expect(Object.keys(map).length).toBe(1);
});

test("gather effects - single command", () => {
  const managersByHome = { manager1 };
  const gatheredEffects: GatheredEffects<unknown> = {};
  const effect: Effect<unknown> = { home: "manager1", type: "cmd1" };
  gatherEffects(managersByHome, gatheredEffects, true, effect);
  expect(gatheredEffects).toEqual({
    manager1: { cmds: [{ home: "manager1", type: "cmd1" }], subs: [] },
  });
});

test("gather effects - mapped command", () => {
  type Action1 = { type: "Action1"; result: string };
  type Action2 = { type: "Action2"; result: string };
  type MyCmd<A> = {
    home: "MyManager";
    type: "MyCmd";
    gotResult: (result: string) => A;
  };
  const myCmdUnmapped: MyCmd<Action1> = {
    home: "MyManager",
    type: "MyCmd",
    gotResult: (result) => ({ type: "Action1", result }),
  };
  const mappedEffect: MappedEffect<Action1, Action2> = {
    home: InternalHome,
    type: "Mapped",
    original: myCmdUnmapped,
    actionMapper: (action1: Action1) => ({ type: "Action2", result: action1.result }),
  };
  const myManager: EffectManager = {
    home: "MyManager",
    mapCmd: (actionMapper, cmd: MyCmd<Action1>) => {
      const mappedCmd: MyCmd<Action2> = {
        home: cmd.home,
        type: "MyCmd",
        gotResult: (result) => actionMapper(cmd.gotResult(result)),
      };
      return mappedCmd;
    },
    mapSub: (_actionMapper, effect) => effect,
    onEffects: () => {
      /* Not implemented */
    },
    onSelfAction: () => {
      /* Not implemented */
    },
  };
  const managersByHome = { mymanager: myManager };
  const gatheredEffects: GatheredEffects<unknown> = {};
  gatherEffects(managersByHome, gatheredEffects, true, mappedEffect);
  expect(gatheredEffects).toEqual({
    manager1: { cmds: [{ home: "manager1", type: "cmd1" }], subs: [] },
  });
});
