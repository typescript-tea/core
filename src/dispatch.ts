// export type ActionMapper<ChildAction, ParentAction> = (childAction: ChildAction) => ParentAction;

export type Dispatch<A> = (action: A) => void;

// eslint-disable-next-line functional/prefer-readonly-type
type DispatchMemoizationMap<ChildAction, ParentAction> = Map<
  Dispatch<ParentAction>,
  // eslint-disable-next-line functional/prefer-readonly-type
  Map<(childAction: ChildAction) => ParentAction, Dispatch<ChildAction>>
>;

const memoizedDispatch: DispatchMemoizationMap<unknown, unknown> = new Map();

/**
 * Maps a parent dispatch function to child dispatch function.
 * The resulting function is memoized so it will be consistent
 * for future calls. This makes it possible to avoid re-render in
 * e.g. react becuase the dispach prop will not change like it
 * would if a lambda like (a) => dispatch(mapper(a)) was used.
 */
export function map<ChildAction, ParentAction>(
  actionMapper: (childAction: ChildAction) => ParentAction,
  dispatch: Dispatch<ParentAction>
): Dispatch<ChildAction> {
  let dispatchMap = memoizedDispatch.get(dispatch);
  const mappedDispatch = dispatchMap && dispatchMap.get(actionMapper);
  if (mappedDispatch) {
    return mappedDispatch;
  }
  const childDispatch = (a: ChildAction): void => dispatch(actionMapper(a));
  if (!dispatchMap) {
    dispatchMap = new Map();
    memoizedDispatch.set(dispatch, dispatchMap);
  }
  dispatchMap.set(actionMapper, childDispatch);
  return childDispatch;
}
