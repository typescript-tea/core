import * as Dispatch from "../dispatch";

test("Function is memoized", () => {
  const dispatch: Dispatch.Dispatch<string> = () => "AString";
  const actionMapper: (a1: string) => string = () => "parentaction";
  const mappedDispatch1 = Dispatch.map(actionMapper, dispatch);
  const mappedDispatch2 = Dispatch.map(actionMapper, dispatch);
  expect(mappedDispatch1).toBe(mappedDispatch2);
});
