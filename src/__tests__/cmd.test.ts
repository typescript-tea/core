import { expect, test } from "vitest";
import * as Cmd from "../cmd";

test("Cmd.map exists", () => {
  expect(Cmd.map).toBeInstanceOf(Function);
});
