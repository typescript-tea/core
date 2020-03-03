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

This is the usual counter app example using the react as view library. It is also available in [this repo](https://github.com/typescript-tea/simple-counter-example).

```ts
import React from "react";
import ReactDOM from "react-dom";
import { exhaustiveCheck } from "ts-exhaustive-check";
import { Dispatch, Program } from "@typescript-tea/core";

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

const view = ({ dispatch, state }: { readonly dispatch: Dispatch<Action>; readonly state: State }) => (
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
  view,
};

// -- RUN

const app = document.getElementById("app");
const render = (view: JSX.Element) => ReactDOM.render(view, app);
Program.run(program, render);
```

## Differences from TEA in Elm

There are some naming differences from TEA in Elm:

- `Msg` was renamed to `Action`
- `Model` was renamed to `State`

Elm is a pure language with strict guarantees and the Effect Managers are part of kernel in Elm and you cannot (for good [reasons](https://groups.google.com/forum/#!msg/elm-dev/1JW6wknkDIo/H9ZnS71BCAAJ)) write your own Effect Managers in Elm. Typescript is an impure lanauge without any guarantees so it (probably) does not make sense to have this restriction. Therefore in typescript-tea it is possible to write your own Effect Manager to do whatever you want.

It does not have a built-in view library, instead it is possible to integrate with existing view libraries like React.

## How to import

### Whole module from the root

This package (and others in `@typescript-tea` organization) exports only `function`s and `type`s grouped into modules. You can import a module from the root of the package in the following way:

```ts
import { ModuleName1, ModuleName2 } from "@typescript-tea/package-name";
```

For example:

```ts
import { Result } from "@typescript-tea/core";

const result = Result.Ok("It is OK");
```

### Unprefixed named imports from the module file

If you don't want to prefix with `ModuleName` you can also use named imports directly from the module file:

```ts
import { function1, function2 } from "@typescript-tea/package-name/module-name";
```

For example:

```ts
import { Ok } from "@typescript-tea/core/result";

const result = Ok("It is OK");
```

### Modules that export a single type

A common pattern is to have a module that exports a single type with the same name as the module. For example the `Result` module does this, it exports the `Result` type, some constructor functions that create a `Result` type, and some utility funcitons that operate on or return a `Result` type. In these cases it can become annoying to prefix the type with the module name, like `Result.Result`. Consider the following example. Note that this is **not** how it is done for modules with single type exports in typescript-tea, it is just to illustrate how it would be done normally:

```ts
import { Result } from "@typescript-tea/core";

function itsOk(): Result.Result<string, string> {
  const ok: Result.Result<string, string> = Result.Ok("It is OK");
  const err: Result.Result<string, string> = Result.Ok("It is not OK");
  return ok;
}
```

To avoid having to write `Result.Result` in these cases, the `Result` module uses a trick so that both the module name and the type can be named simply `Result`. So the code above will become this (notice use of `Result` for the type annotations instead of `Result.Result`):

```ts
import { Result } from "@typescript-tea/core";

function itsOk(): Result<string, string> {
  const ok: Result<string, string> = Result.Ok("It is OK");
  const err: Result<string, string> = Result.Ok("It is not OK");
  return ok;
}
```

How can this work? Well, the index file in the package does this to make it work:

```ts
import * as ResultNs from "./result";

export const Result = ResultNs;
export type Result<TError, TValue> = ResultNs.Result<TError, TValue>;
```

I think it is somehow related to [declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html) in typescript :-).

Please note that this only work for modules that export a single type. If two types are exported it is not possible to use this shortcut because the exported `const` will not contain any types.

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
