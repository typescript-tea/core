import { expect, test } from "vitest";
import * as Sub from "../sub";

test("Sub.map exists", () => {
  expect(Sub.map).toBeInstanceOf(Function);
});
