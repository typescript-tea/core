# Tutorial

The main goal of The Elm Architecture (TEA) is to be able to write a program that consists of only [pure functions](https://en.wikipedia.org/wiki/Pure_function). Pure functions have no side effects (eg. server fetching, reading/writing local storage etc.), and they always return the same value for the same inputs. These properties makes them very predictable and easy to test. So if we have a program consisting only of pure functions the program becomes very predictable, easy to test, and easy to reason about.

So let's begin with looking at the definition of the program type. It has three main functions which should all be pure:

```ts
type Program<State, Action, View> = {
  init: (url: string, key: () => void) => [State, Cmd<Action>?];
  update: (action: Action, state: State) => [State, Cmd<Action>?];
  view: (props: { state: State; dispatch: Dispatch<Action> }) => View;
};
```

The program type has generic parameters for `State`, `Action` and `View`, which means you can provide your own types for them. Let's write a simple program using React as view framework, a `number` as state, and a union type of `string` as action (you can play with this example [here](https://stackblitz.com/edit/react-ts-c4g6kq)):

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
      <button onClick={() => dispatch("decrement")}>-</button>
      {state}
      <button onClick={() => dispatch("increment")}>+</button>
    </div>
  ),
};

// Run the program
const el = document.getElementById("root");
const render = (view: JSX.Element) => ReactDOM.render(view, el);
Program.run(program, render);
```

This program will initialize the state to 0, show a view with the state and buttons to dispatch actions to increment or decrement. With each dispatch, the update() function will be called which will return a new state incremented or decremented by one depending on the action. After the state is updated the view will be re-rendered. The program will continue in this runtime-loop forever.

The last section of the code above starts the program by calling `Program.run()` passing the program and a function that can handle rendering the return value of the `view()` function in the program.

You may notice that the return value from init() and update() is an array. Specifcially it is an array of exactly 2 items which is also known as a 2-tuple. The second item is optional so we can also return a 1-tuple which is what is done in the above program. The first item in the tuple is the state, and the second item is a `Cmd<Action>` which is used to tell the runtime that our program wants to do an effect, such as fetching data from a server. So lets make a little more interesting program where we fetch som data and display it:

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
      <button onClick={() => dispatch("decrement")}>-</button>
      {state}
      <button onClick={() => dispatch("increment")}>+</button>
    </div>
  ),
};

// Run the program
const el = document.getElementById("root");
const render = (view: JSX.Element) => ReactDOM.render(view, el);
Program.run(program, render);
```

The above program is very simple and it does not do any effects like fetching from the server or saving state into local storage. In order to do effects we must also use the `Cmd<Action>` parameter. The `Cmd<Action>` type consists of only data and a function to create an `Action`. The data describes what effect we want to do, for example if we want to fetch from the server, the data would be something like `{ type: "fetch", url: "http://whaterver.we.want.to.fetch }`. The fact that the `Cmd<Action>` type is only that is what makes it possible for the program to be 100% pure and still do side-effects. The program "commands" the "runtime" to do the effect for it.
