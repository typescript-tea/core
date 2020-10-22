import * as Cmd from "../cmd";

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
  type OtherCmd<_A> = {
    readonly home: "home";
    readonly type: "type";
    readonly __$$dummy_action_tag_do_not_use?: _A;
  };

  let theCmd: TheCmd<ChildAction> = { home: "home", type: "type", onSuccess: () => ({ type: "C1" }) };
  const theCmd2: TheCmd<ParentAction> = { home: "home", type: "type", onSuccess: () => ({ type: "P2" }) };
  theCmd = theCmd2; // Compile error

  // eslint-disable-next-line prefer-const
  let otherCmd: OtherCmd<ChildAction> = { home: "home", type: "type" };
  const otherCmd2: OtherCmd<ParentAction> = { home: "home", type: "type" };
  otherCmd = otherCmd2; // Also Compile error!!!

  console.log(theCmd2, otherCmd, otherCmd2);

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
