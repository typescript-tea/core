# @typescript-tea/core

[![npm version][version-image]][version-url]
[![build][build-image]][build-url]
[![Coverage Status][codecov-image]][codecov-url]
[![code style: prettier][prettier-image]][prettier-url]
[![MIT license][license-image]][license-url]

The Elm Architecture for typescript

## Introduction

This is an implementation of The Elm Architecture for typescript.

It has "managed effects" in the same way Elm does and it has "Effect Managers" to handle those effects.

## Differences from Elm

There are some naming differences from Elm:

- `Msg` was renamed to `Action`
- `Model` was renamed to `State`

It is possible to write your own effect manager which is not possible in Elm. Since Elm is a pure language with strict guarantees the effect managers are part of kernel there. However typescript is not pure so writing your own effect manager to integrate already existing effectful packages may make more sense.

## Example

This is the usual counter app example:

```ts
import React from "react";
import ReactDOM from "react-dom";
import { exhaustiveCheck } from "ts-exhaustive-check";
import { Dispatch, Program } from "@typescript-tea/core";
import { reactRuntime } from "@typescript-tea/react-runtime";

// -- STATE

type State = number;
const init = (): readonly [State] => [0];

// -- UPDATE

type Action = { type: "Increment" } | { type: "Decrement" };

function update(action: Action, state: State): readonly [State] {
  switch (action.type) {
    case "Increment":
      return [state + 1];
    case "Decrement":
      return [state - 1];
    default:
      return exhaustiveCheck(action, true);
  }
}

// -- VIEW

const view = ({
  dispatch,
  state
}: {
  readonly dispatch: Dispatch<Action>;
  readonly state: State;
}) => (
  <div>
    <button onClick={() => dispatch({ type: "Decrement" })}>-</button>
    <div>{state}</div>
    <button onClick={() => dispatch({ type: "Increment" })}>+</button>
  </div>
);

// -- PROGRAM

const program: Program<State, Action, JSX.Element> = {
  init,
  update,
  view
};

// -- RUNTIME

const Root = reactRuntime(program, []);
const app = document.getElementById("app");
ReactDOM.render(<Root />, app);
```

## How to develop

Node version >=12.6.0 is needed for development.

To execute the tests run `yarn test`.

## How to publish

```
yarn version --patch
yarn version --minor
yarn version --major
```

[version-image]: https://img.shields.io/npm/v/@typescript-tea/core.svg?style=flat
[version-url]: https://www.npmjs.com/package/@typescript-tea/core
[build-image]: https://github.com/typescript-tea/core/workflows/Build/badge.svg
[build-url]: https://github.com/typescript-tea/core/actions?query=workflow%3ABuild+branch%3Amaster
[codecov-image]: https://codecov.io/gh/typescript-tea/core/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/typescript-tea/core
[prettier-image]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat
[prettier-url]: https://github.com/prettier/prettier
[license-image]: https://img.shields.io/github/license/typescript-tea/core.svg?style=flat
[license-url]: https://opensource.org/licenses/MIT
