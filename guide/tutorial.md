# Tutorial

The main goal of The Elm Architecture (TEA) is to be able to write a program that consists of only [pure functions](https://en.wikipedia.org/wiki/Pure_function). Pure functions have no side effects (eg. server fetching, reading/writing local storage etc.), and they always return the same value for the same inputs. These properites makes them very predictable and easy to test. So if we have a program consisting only of pure functions the program becomes very predictable, easy to test and reason about. So let's begin with the definition of the program:

```ts
type Program<State, Action, View> = {
  init: (url: string, key: () => void) => [State, Cmd<Action>?];
  update: (action: Action, state: State) => [State, Cmd<Action>?];
  view: (props: { state: State; dispatch: Dispatch<Action> }) => View;
};
```

The program type has generic parameters for `State`, `Action` and `View`, which means you can provide your own types for them. So let's write a simple program using react as view framework, that uses a `number` as state, and a `string` as action (you can play with this example [here](https://react-ts-c4g6kq.stackblitz.io)):

```ts
import React from "react";
import ReactDOM from "react-dom";
import { Program } from "@typescript-tea/core";

// Define the program
const program: Program<number, "increment" | "decrement", JSX.Element> = {
  init: () => [0],
  update: (action, state) => (action === "increment" ? [state + 1] : [state - 1]),
  view: ({ state, dispatch }) => (
    <div>
      <button onClick={() => dispatch("increment")} />
      <button onClick={() => dispatch("decrement")} />
      {state}
    </div>
  ),
};

// Run the program
const app = document.getElementById("app");
const render = (view: JSX.Element) => ReactDOM.render(view, app);
Program.run(program, render);
```

This program will initialize the state to 0, show a view with the state and buttons to dispatch actions to increment or decrement. With each dispatch, the update() function will be called which will return a new state incremented or decremented by one depending on the action. After the state is updated the view will be re-rendered. The program will continue in this runtime-loop forever.

The last section of the code above starts the program by calling `Program.run()` passing the program and a function that can handle rendering the return value of the `view()` function in the program.
