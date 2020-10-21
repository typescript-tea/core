import * as Cmd from "../cmd";
import { LeafEffect } from "../effect";

test("Cmd.map exists", () => {
  expect(Cmd.map).toBeInstanceOf(Function);
});

test("Cmd.map is needed for child commans", () => {
  type ParentAction = { type: "P1"; a: ChildAction } | { type: "P2" };
  type ChildAction = { type: "C1" } | { type: "C2" };
  type TheCmd<A> = {
    readonly home: "home";
    readonly type: "type";
    readonly onSuccess: (response: string) => A;
  };
  // const childCmd: TheCmd<ChildAction> | undefined = { home: "home", type: "type", onSuccess: () => ({ type: "C1" }) };

  // type MyCmd<A> = LeafEffect<A>;

  const theCmd: TheCmd<ChildAction> = { home: "home", type: "type", onSuccess: () => ({ type: "C1" }) };

  const theCmd2: LeafEffect<ParentAction> = theCmd as LeafEffect<ChildAction>;
  console.log(theCmd2);

  const returnValueFromChild: [number, Cmd.Cmd<ChildAction>?] = [0, theCmd];
  const [childState, childCmd] = returnValueFromChild;
  const returnValueValid: [{ c: number }, Cmd.Cmd<ParentAction>?] = [
    { c: childState },
    Cmd.map((a: ChildAction): ParentAction => ({ type: "P1", a }), childCmd),
  ];
  const returnValueInvalid: [{ c: number }, Cmd.Cmd<ParentAction>?] = [{ c: childState }, childCmd];
  expect(returnValueValid).toBeInstanceOf(Array);
  expect(returnValueInvalid).toBeInstanceOf(Array);
});
