/* eslint-disable functional/prefer-readonly-type */
import { Program, run } from "../program";
import { createMockEffectManager } from "./helpers/mock-effect-manager";
import { createMockProgram } from "./helpers/mock-program";
import { createMockRender } from "./helpers/mock-render";

beforeAll(() => {
  globalThis.window = {
    ...globalThis.window,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    navigator: { userAgent: "thisIsTheUserAgent" },
    location: { pathname: "thisIsThePathname" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
});

afterAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  globalThis.window = undefined as any;
});

test("Run simple program", () => {
  const program: Program<undefined, string, string, string> = {
    init: () => ["Hello"],
    update: () => ["Hello"],
    view: () => "Hello",
  };
  const render = (): void => {
    // Do nothing
  };
  const endProgram = run(program, undefined, render, []);
  expect(endProgram).toBeInstanceOf(Function);
  // expect(globalThis.window.addEventListener).toBeCalled();
});

test("View can dispatch", (done) => {
  const render = (): void => {
    // Do nothing
  };
  const program: Program<undefined, number, string, string> = {
    init: () => [0],
    update: () => [1],
    view: ({ dispatch, state }) => {
      if (state === 0) {
        dispatch("increment");
      } else {
        expect(state).toEqual(1);
        done();
      }
      return "view";
    },
  };
  run(program, undefined, render, []);
});

test("View can dispatch with mocks", (done) => {
  // Create mocks
  const mp = createMockProgram();
  const mr = createMockRender();
  // Setup mokcs
  mp.update.mockImplementationOnce(() => [1]);
  mp.view
    .mockImplementationOnce(({ dispatch }) => dispatch("increment"))
    .mockImplementationOnce(({ state }) => {
      expect(state).toEqual(1);
      done();
    });
  // Run
  run(mp, undefined, mr, []);
});

test("onEffects is called when subscriptions is not undefined", (done) => {
  // Create mocks
  const emHome = "mock1" as const;
  const me = createMockEffectManager(emHome);
  const mp = createMockProgram();
  const mr = createMockRender();
  // Setup mocks
  mp.update.mockImplementationOnce(() => [1]);
  mp.subscriptions.mockReturnValue({ home: emHome, type: "nisse" });
  mp.view
    .mockImplementationOnce(({ dispatch }) => dispatch("increment"))
    .mockImplementationOnce(({ state }) => {
      expect(state).toEqual(1);
      expect(me.onEffects.mock.calls.length).toBe(2);
      done();
    });
  me.onEffects.mockReturnValueOnce(0);
  // Run
  run(mp, undefined, mr, [me]);
});

/**
 * onEffects must be called with undefined subscriptions becuase
 * the previous call may have had subscriptions so teh effect
 * manager must know to clear those subscriptions when undefined
 * is returned from program.subscription().
 */
test.only("onEffects is called when subscriptions is undefined", (done) => {
  // Create mocks
  const emHome = "mock1" as const;
  const me = createMockEffectManager(emHome);
  const mp = createMockProgram();
  const mr = createMockRender();
  // Setup mocks
  mp.update.mockImplementationOnce(() => [1]);
  mp.subscriptions.mockReturnValueOnce(undefined);
  mp.view.mockImplementationOnce(({ state }) => {
    expect(state).toEqual(0);
    expect(me.onEffects.mock.calls.length).toBe(1);
    done();
  });
  me.onEffects.mockReturnValueOnce(0);
  // Run
  run(mp, undefined, mr, [me]);
});
