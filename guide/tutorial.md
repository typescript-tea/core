# Tutorial

The main goal of The Elm Architecture (TEA) is to be able to write a program that consists of only [pure functions](https://en.wikipedia.org/wiki/Pure_function). Pure functions have no side effects (eg. server fetching, reading/writing local storage etc.), and they always return the same value for the same inputs. These properties makes them very predictable and easy to test. So if we have a program consisting only of pure functions the program becomes very predictable, easy to test, and easy to reason about.

## Simplest possible program

So let's begin with looking at the definition of the program type. It has three main functions which should all be pure:

```ts
type Program<State, Action, View> = {
  init: (url: string, key: () => void) => [State, Cmd<Action>?];
  update: (action: Action, state: State) => [State, Cmd<Action>?];
  view: (props: { state: State; dispatch: Dispatch<Action> }) => View;
};
```

The program type has generic parameters for `State`, `Action` and `View`, which means you can provide your own types for them. Let's write a simple program using React as view framework, a `number` as state, and a union type of `string` as action (you can play with this example [here](https://stackblitz.com/edit/react-ts-c4g6kq?file=index.tsx)):

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

The last section of the code above starts the program by calling `Program.run()` passing the program and a function that can handle rendering the return value of the `view()` function in the program. This is sometimes refered to as the "runtime". The runtime lives outside your program and you start your program by giving it to the runtime, and then as your program runs it may communicate with the runtime in a few different way that we will explore later. The important part to know for now it that there are two main pieces to the archtiecture: your program which is 100% pure functions, and the runtime that can handle impure operations.

## Using commands

You may notice that the return value from `init()` and `update()` is an array. Specifcially it is an array of exactly 2 items which is also known as a 2-tuple. The second item is optional so we can also return a 1-tuple which is what is done in the above program. The first item in the tuple is the state, and the second item is a `Cmd<Action>` which is used to tell the runtime that our program wants to do an effect, such as fetching data from a server. So lets make a little more interesting program where we fetch som data and display it (you can play with it [here](https://stackblitz.com/edit/react-ts-fp8roj)):

```ts
import React from "react";
import ReactDOM from "react-dom";
import { Program, Result } from "@typescript-tea/core";
import * as Http from "@typescript-tea/http";

// Define actions
type Action = { type: "GotData"; result: Result<string, { data: { image_url: string } }> };

// Define the program
const program: Program<string, Action, JSX.Element> = {
  init: () => [
    "Getting url...",
    Http.get(
      "https://api.giphy.com/v1/gifs/random?api_key=fynIjQH0KtzG1JeEkZZGT3cTie9KFm1T&tag=cat",
      Http.expectJson(
        (result) => ({ type: "GotData", result }),
        (s) => Result.Ok(JSON.parse(s))
      )
    ),
  ],
  update: (action, state) =>
    action.result.type === "Ok" ? [action.result.value.data.image_url] : ["Error getting url.."],
  view: ({ state, dispatch }) => (
    <div>
      <img src={state} />
    </div>
  ),
};

// Run the program
const el = document.getElementById("root");
const render = (view: JSX.Element) => ReactDOM.render(view, el);
Program.run(program, render, [Http.createEffectManager()]);
```

The above program uses an "EffectManager" called `Http`. An EffectManager is a library that plugs into the runtime and handles the second item of the `init()` and `update()` return tuples, the `Cmd<Action>` item. The EffectMangager also provides factory functions for creating `Cmd<Action>` objects that the program can return. In the above program the `Http.get()` function is such a factory function. It returns an object of type `Cmd<Action>` that represents the request to fetch a certain url. The runtime can handle the first item in the return tuple and update the state, but it cannot handle the second item which is of type`Cmd<Action>`. Instead it will pass that item on to an EffectManager. The runtime must therefore know which effect managers are available, and that is why the program above passes `[Http.createEffectManager()]` to the`Program.ru()` function. The parameter is an array of effect managers becuase you may use more than one. Each EffectManager is responsible for handling all of the`Cmd<Action>` objects it can create.

## Effect managers

The purpose of effect managers is to handle effects outside of the program. This is what makes it possible to have the program consist of 100% pure functions. Since the effect managers reside outside of the program they also become re-usable between different programs. A well-written effect manager can be used by any program. This means that common tasks like fetching from a server, reading and writing to local storage, logging in using OpenID connect etc. can be packaged up as an effect manager and re-used. So you will not have to worry about writing code for those taks, instead you can concentrate on writing the core logic of your program. Writing the effectful logic that an effect manager contains is often tricky so using one that is ready-made and battle-tested can be a real boost in productivity.

However in certain circumstances there might not be a ready-made effect manager available to accomplish what you want to do, so you will have to write your own. Fortunately this is pretty straightforward to do. So in order to understand effect managers a litle bit better, let's write our own simple effect manager. First lets look at the `EffectManager` type:

```ts
type EffectManager<ProgramAction, SelfAction, State, Home> = {
  readonly home: Home;
  readonly mapCmd: (map: (a1: Action1) => Action2, cmd: Cmd<Action1>) => Cmd<Action2>;
  readonly mapSub: (map: (a1: Action1) => Action2, sub: Sub<Action1>) => Sub<Action2>;
  readonly onEffects: (
    dispatchProgram: Dispatch<ProgramAction>,
    dispatchSelf: Dispatch<SelfAction>,
    cmds: ReadonlyArray<Cmd<ProgramAction>>,
    subs: ReadonlyArray<Sub<ProgramAction>>,
    state: State
  ) => State;
  readonly onSelfAction: (
    dispatchProgram: Dispatch<ProgramAction>,
    dispatchSelf: Dispatch<SelfAction>,
    action: SelfAction,
    state: State
  ) => State;
};
```

The EffectManager type has the following generic parameters:

- `Home` - This is a string that identifies this effect manager.
- `ProgramAction` - This is the same action type as the program is using.
- `SelfAction` - Actions defined for internal use in the effect manager.
- `State` - This is state used internally in the effect manager.

The `Home` string is just used by the runtime to know where to send the `Cmd<Acion>` objects returned by `init()` and `update()`. All `Cmd<Action>` objects have a `home` field that is set to this string. It is up to each effect manager to produce objects with its own home string. Note that `State` is not the program's state but an internal state that the effect manager may use if it needs to keep state.

Let's discuss the fields of the `EffectManager` type:

- `home` - A constant string to correlate that this effectmanager handles the `Cmd` objects that has the same `home` value.
- `mapCmd` - This function is called by the runtime when the program calls `Cmd.map`. It is only used for the fractal design pattern that will be discussed later.
- `mapSub` - We can disregard this function for now, we'll discuss subscriptions later.
- `onEffects` - Called by the runtime with the `Cmd` objects that was returned by `init()` and `update()`. This is were most of the work in an effect manager happens.
- `onSelfAction` - Can be used by the effect manager to send actions to itself. Useful if the effect manager does async operations.

For the simplest type of effect manager that only handles `Cmd`, has no internal state, and does not support fractal commands, we only need to use `home`, and `onEffects`. Lets make such an effect manager that has a single command for fetching data and use it to fetch an url. We will use it in the same type of program as demonstrated above (instead of the read-made http effect manager), you can play with it [here](https://stackblitz.com/edit/react-ts-vs4g5x):

```ts
import React from "react";
import ReactDOM from "react-dom";
import { Program, EffectManager, Cmd } from "@typescript-tea/core";

// Define actions
type Action = { type: "GotData"; result: { data: { image_url: string } } };

// Define the program
const program: Program<string, Action, JSX.Element> = {
  init: () => [
    "",
    getUrl("https://api.giphy.com/v1/gifs/random?api_key=fynIjQH0KtzG1JeEkZZGT3cTie9KFm1T&tag=cat", (data) => ({
      type: "GotData",
      result: data,
    })),
  ],
  update: (action, state) => (action.type === "GotData" ? [action.result.data.image_url] : ["Error getting url.."]),
  view: ({ state, dispatch }) => (
    <div>
      <img src={state} />
    </div>
  ),
};

// Define the effect manager
const myEffMgr: EffectManager<"MyEffMgr", Action, never, {}, GetUrl<Action>> = {
  home: "MyEffMgr",
  mapCmd: (map, cmd) => cmd,
  mapSub: (map, sub) => sub,
  onEffects: (dispatchProgram, dispatchSelf, cmds, subs, state) => {
    for (const c of cmds) {
      fetch(c.url)
        .then((res) => res.json())
        .then((json) => dispatchProgram(c.gotUrl(json)));
    }
    return {};
  },
  onSelfAction: () => ({}),
};

// Define the effect manager's command
type GetUrl<A> = { home: "MyEffMgr"; type: "GetUrl"; url: string; gotUrl: (data) => A };
function getUrl<A>(url: string, gotUrl: (data) => A): GetUrl<A> {
  return { home: "MyEffMgr", type: "GetUrl", url, gotUrl };
}

// Run the program
const el = document.getElementById("root");
const render = (view: JSX.Element) => ReactDOM.render(view, el);
Program.run(program, render, [myEffMgr]);
```

The runtime will collect all `Cmd` with our `Home` and call `onEffects()` with them. We will fetch the url for each `Cmd` and when we receive a response we will create and action with the response using the action creator function that was passed `Action` it to the program. This action gets dispacted to the program using the `dispatchProgram` function.
