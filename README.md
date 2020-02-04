# @typescript-tea/core

[![npm version][version-image]][version-url]
[![build][build-image]][build-url]
[![Coverage Status][codecov-image]][codecov-url]
[![code style: prettier][prettier-image]][prettier-url]
[![MIT license][license-image]][license-url]

The Elm Architecture for typescript

## Introduction

This is an implementation of The Elm Architecture (TEA) for typescript.

Note: TEA has managed effects, meaning that things like HTTP requests or writing to disk are all treated as data in TEA. When this data is given to an Effect Manager, it can do some "query optimization" before actually performing the effect. Your application should consist of pure functions only and all effects should be handled in Effect Managers outside your application.

TEA has two kinds of managed effects: commands and subscriptions.

## How to use

```
yarn add @typescript-tea/core
```

## Documentation

Please see the [documentation site](https://typescript-tea.github.io/core).

## Example

This is the usual counter app example using the react runtime. It is also available in [this repo](https://github.com/typescript-tea/simple-counter-example).

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

## Differences from TEA in Elm

There are some naming differences from TEA in Elm:

- `Msg` was renamed to `Action`
- `Model` was renamed to `State`

Elm is a pure language with strict guarantees and the Effect Managers are part of kernel in Elm and you cannot (for good reasons) write your own Effect Managers in Elm. Typescript is an impure lanauge without any guarantees so it (probably) does not make sense to have this restriction. Therefore in typescript-tea it is possible to write your own Effect Manager to do whatever you want.

It does not have a built-in view library, instead it is possible to integrate with existing view libraries like React.

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
