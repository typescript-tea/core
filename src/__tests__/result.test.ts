import { expect, test } from "vitest";
import * as Result from "../result";

test("Can create Ok", () => {
  const r = Result.Ok("OK");
  expect(r).toEqual({ type: "Ok", value: "OK" });
});

test("Can create Err", () => {
  const r = Result.Err("ERR");
  expect(r).toEqual({ type: "Err", error: "ERR" });
});
