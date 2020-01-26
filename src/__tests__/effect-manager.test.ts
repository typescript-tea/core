import { managersByHome, EffectManager } from "../effect-manager";

const manager1: EffectManager = {
  home: "manager1",
  mapCmd: (_, b) => b,
  mapSub: (_, b) => b,
  onEffects: () => {
    /* Not implemented */
  },
  onSelfAction: () => {
    /* Not implemented */
  }
};

test("managersByHome build map", () => {
  const map = managersByHome([manager1]);
  expect(Object.keys(map).length).toBe(1);
});
