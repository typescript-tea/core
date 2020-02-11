import * as Runtime from "../runtime";
import { Program } from "../program";

test("Run simple program", () => {
  const program: Program<string, string, string> = {
    init: () => ["Hello"],
    update: () => ["Hello"],
    view: () => "Hello",
  };
  globalThis.window = {
    ...globalThis.window,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    navigator: { userAgent: "asdfdf" },
    location: { pathname: "sdafd" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
  const endProgram = Runtime.runtime(program, []);
  expect(endProgram).toBeInstanceOf(Function);
});
