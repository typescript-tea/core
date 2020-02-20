import * as Dispatch from "../dispatch";

test("Function is memoized", () => {
  const dispatch: Dispatch.Dispatch<string> = () => "AString";
  const actionMapper: Dispatch.ActionMapper<string, string> = () => "parentaction";
  const mappedDispatch1 = Dispatch.mapDispatch(actionMapper, dispatch);
  const mappedDispatch2 = Dispatch.mapDispatch(actionMapper, dispatch);
  expect(mappedDispatch1).toBe(mappedDispatch2);
});
