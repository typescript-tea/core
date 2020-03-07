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

If it helps you can think of the `Cmd` that your return from the update function as an action that is sent to the effect manager. The effect manager responds to this action by doing the requested task and then it fires an action back to your update function with the result. Which action it should fire back to your update function is determined by the action creator function that you send along in the `Cmd` object.

## Effect managers

The purpose of effect managers is to handle effects outside of the program. This is what makes it possible to have the program consist of 100% pure functions. Since the effect managers reside outside of the program they also become re-usable between different programs. A well-written effect manager can be used by any program. This means that common tasks like fetching from a server, reading and writing to local storage, logging in using OpenID connect etc. can be packaged up as an effect manager and re-used. So you will not have to worry about writing code for those taks, instead you can concentrate on writing the core logic of your program. Writing the effectful logic that an effect manager contains is often tricky so using one that is ready-made and battle-tested can be a real boost in productivity.

However in certain circumstances there might not be a ready-made effect manager available to accomplish what you want to do, so you will have to write your own. Fortunately this is pretty straightforward to do. So in order to understand effect managers a litle bit better, let's write our own simple effect manager. First lets look at the `EffectManager` type:

```ts
export type EffectManager<Home, ProgramAction, SelfAction, SelfState, MyCmd, MySub> = {
  readonly home: Home;
  readonly mapCmd: (map: (a1: Action1) => Action2, cmd: Cmd<Action1>) => Cmd<Action2>;
  readonly mapSub: (map: (a1: Action1) => Action2, sub: Sub<Action1>) => Sub<Action2>;
  readonly onEffects: (
    dispatchProgram: Dispatch<ProgramAction>,
    dispatchSelf: Dispatch<SelfAction>,
    cmds: ReadonlyArray<MyCmd>,
    subs: ReadonlyArray<MySub>,
    state: SelfState
  ) => SelfState;
  readonly onSelfAction: (
    dispatchProgram: Dispatch<ProgramAction>,
    dispatchSelf: Dispatch<SelfAction>,
    action: SelfAction,
    state: SelfState
  ) => SelfState;
};
```

The EffectManager type has the following generic parameters:

- `Home` - This is a string that identifies this effect manager.
- `ProgramAction` - This is the same action type as the program is using.
- `SelfAction` - Actions defined for internal use in the effect manager.
- `SelfState` - This is state used internally in the effect manager.
- `MyCmd` - The type of command that this effect manager handles, usually a union type.
- `MySub` - The type of subscription that this effect manager handles, usually a union type.

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

## How to organize larger programs

### Split pattern

We have only looked at some tiny programs here. Once your program grows you will want to divide it into multiple, `init()`, `update()`, and `view()` functions. I would strongly recommend the watching the lecture [Scaling Elm Apps](https://www.youtube.com/watch?v=DoA4Txr4GUs) by Richard Feldman. It uses the Elm language, however much of the advice in the lecture is valid for any implementation of TEA.

Lets look at a simple example of how to divide your program into parts. It is actually very simple, since all we have to work with is pure functions, we just delegate to more functions. We also split the types and let each function handle part of the type. We join all the types up as a union type to form the main types of the program. You could imagine putting each of the different functions and types into their own files but here we show all of them at once (you can play with this example [here](https://stackblitz.com/edit/react-ts-dcmupt)):

**index.tsx**

```ts
import React from "react";
import ReactDOM from "react-dom";
import { Program } from "@typescript-tea/core";
import * as Header from "./header";
import * as Content from "./content";
import * as Footer from "./footer";

type State = {
  header: Header.State;
  content: Content.State;
  footer: Footer.State;
};

function init(): [State] {
  return [{ header: Header.init(), content: Content.init(), footer: Footer.init() }];
}

type Action = Header.Action | Content.Action | Footer.Action;

function update(action: Action, state: State): [State] {
  switch (action.type) {
    case "DecrementHeader":
    case "IncrementHeader":
      return [{ ...state, header: Header.update(action, state.header) }];
    case "DecrementContent":
    case "IncrementContent":
      return [{ ...state, content: Content.update(action, state.content) }];
    case "DecrementFooter":
    case "IncrementFooter":
      return [{ ...state, footer: Footer.update(action, state.footer) }];
  }
}

// Define the program
const program: Program<State, Action, JSX.Element> = {
  init,
  update,
  view: ({ state, dispatch }) => (
    <div>
      <Header.View dispatch={dispatch} state={state.header} />
      <Content.View dispatch={dispatch} state={state.content} />
      <Footer.View dispatch={dispatch} state={state.footer} />
    </div>
  ),
};

// Run the program
const el = document.getElementById("root");
const render = (view: JSX.Element) => ReactDOM.render(view, el);
Program.run(program, render);
```

**header.ts**

```ts
import React from "react";
import { Dispatch } from "@typescript-tea/core";
import { exhaustiveCheck } from "ts-exhaustive-check";

export type State = { count: number };

export function init(): State {
  return { count: 0 };
}

export type Action = { type: "DecrementHeader" } | { type: "IncrementHeader" };

export function update(action: Action, state: State): State {
  switch (action.type) {
    case "DecrementHeader":
      return { count: state.count - 1 };
    case "IncrementHeader":
      return { count: state.count + 1 };
    default:
      return exhaustiveCheck(action, true);
  }
}

export function View({ dispatch, state }: { dispatch: Dispatch<Action>; state: State }) {
  return (
    <div>
      <span>This is the header</span>
      <button onClick={() => dispatch({ type: "DecrementHeader" })}>-</button>
      {state.count}
      <button onClick={() => dispatch({ type: "IncrementHeader" })}>+</button>
    </div>
  );
}
```

**content.tsx**

```ts
import React from "react";
import { Dispatch } from "@typescript-tea/core";
import { exhaustiveCheck } from "ts-exhaustive-check";

export type State = { count: number };

export function init(): State {
  return { count: 0 };
}

export type Action = { type: "DecrementContent" } | { type: "IncrementContent" };

export function update(action: Action, state: State): State {
  switch (action.type) {
    case "DecrementContent":
      return { count: state.count - 1 };
    case "IncrementContent":
      return { count: state.count + 1 };
    default:
      return exhaustiveCheck(action, true);
  }
}

export function View({ dispatch, state }: { dispatch: Dispatch<Action>; state: State }) {
  return (
    <div>
      <span>This is the content</span>
      <button onClick={() => dispatch({ type: "DecrementContent" })}>-</button>
      {state.count}
      <button onClick={() => dispatch({ type: "IncrementContent" })}>+</button>
    </div>
  );
}
```

**footer.tsx**

```ts
import React from "react";
import { Dispatch } from "@typescript-tea/core";
import { exhaustiveCheck } from "ts-exhaustive-check";

export type State = { count: number };

export function init(): State {
  return { count: 0 };
}

export type Action = { type: "DecrementFooter" } | { type: "IncrementFooter" };

export function update(action: Action, state: State): State {
  switch (action.type) {
    case "DecrementFooter":
      return { count: state.count - 1 };
    case "IncrementFooter":
      return { count: state.count + 1 };
    default:
      return exhaustiveCheck(action, true);
  }
}

export function View({ dispatch, state }: { dispatch: Dispatch<Action>; state: State }) {
  return (
    <div>
      <span>This is the footer</span>
      <button onClick={() => dispatch({ type: "DecrementFooter" })}>-</button>
      {state.count}
      <button onClick={() => dispatch({ type: "IncrementFooter" })}>+</button>
    </div>
  );
}
```

Some things to notice about this pattern is that the main types that goes into the Program at the top-level joins up all the types from the other files. So there is still a single `Action` type, it's declaration is just split into several files. However since each file only accepts its own part of the top-level `Action` type we can reason about only those actions, so there is less to keep in our head when looking at each of the `update()` functions (compared to have a one big update function that handles all of the acitons).

### Fractal pattern

For larger apps it might be useful to break out some parts that are re-usable thorughout the app, use multiple instances of a part, or simply isolate parts from each other. This can be done by using the fractal pattern. Note that this pattern is for organizing your program's code. TEA does not require you to organize your code in a fractal pattern and you should probably think twice before using it as it can be confusing to newcomers.

In a fractal pattern you have a parent that contains a child which has the same strucutre as the parent. That child can in turn contain another child that has the same structure and so on forever. The strucure in our case is a triplet of `init()`, `update()`, and `view()` functions. So the root would have these tree functions, and all its children has these three functions, and all of their children have these theree funcitons and so on. As we saw earlier when we split the `Action` type up into several files, we needed to have unique Action names and also delegate the actions down to the correct `update()` function. This limits us in some ways, for example we cannot use multiple instances of the same module since that would mean having the same `Action` names several times. The fractal pattern solves this problem by introducing a separate action in the parent that wraps the child's action. Let's look at a simple fractal example (you can play with this example [here](https://stackblitz.com/edit/react-ts-ampadd)):

**index.tsx**

```ts
import React from "react";
import ReactDOM from "react-dom";
import { Program } from "@typescript-tea/core";
import * as Counter from "./counter";
import { exhaustiveCheck } from "ts-exhaustive-check";

type State = {
  doItMessage: string;
  counter1: Counter.State;
  counter2: Counter.State;
  counter3: Counter.State;
};

function init(): [State] {
  return [{ doItMessage: "Do it", counter1: Counter.init(), counter2: Counter.init(), counter3: Counter.init() }];
}

type Action =
  | { type: "DoIt" }
  | { type: "DispatchCounter1"; action: Counter.Action }
  | { type: "DispatchCounter2"; action: Counter.Action }
  | { type: "DispatchCounter3"; action: Counter.Action };

function update(action: Action, state: State): [State] {
  switch (action.type) {
    case "DoIt":
      return [{ ...state, doItMessage: "It is done" }];
    case "DispatchCounter1":
      return [{ ...state, counter1: Counter.update(action.action, state.counter1) }];
    case "DispatchCounter2":
      return [{ ...state, counter2: Counter.update(action.action, state.counter2) }];
    case "DispatchCounter3":
      return [{ ...state, counter3: Counter.update(action.action, state.counter3) }];
    default:
      return exhaustiveCheck(action, true);
  }
}

// Define the program
const program: Program<State, Action, JSX.Element> = {
  init,
  update,
  view: ({ state, dispatch }) => (
    <div>
      <button onClick={() => dispatch({ type: "DoIt" })}>{state.doItMessage}</button>
      <Counter.View dispatch={(action) => dispatch({ type: "DispatchCounter1", action })} state={state.counter1} />
      <Counter.View dispatch={(action) => dispatch({ type: "DispatchCounter2", action })} state={state.counter2} />
      <Counter.View dispatch={(action) => dispatch({ type: "DispatchCounter3", action })} state={state.counter3} />
    </div>
  ),
};

// Run the program
const el = document.getElementById("root");
const render = (view: JSX.Element) => ReactDOM.render(view, el);
Program.run(program, render);
```

**counter.tsx**

```ts
import React from "react";
import { Dispatch } from "@typescript-tea/core";

export type State = { count: number };

export function init(): State {
  return { count: 0 };
}

export type Action = { type: "DecrementFooter" } | { type: "IncrementFooter" };

export function update(action: Action, state: State): State {
  switch (action.type) {
    case "DecrementFooter":
      return { count: state.count - 1 };
    case "IncrementFooter":
      return { count: state.count + 1 };
  }
}

export function View({ dispatch, state }: { dispatch: Dispatch<Action>; state: State }) {
  return (
    <div>
      <span>This is the footer</span>
      <button onClick={() => dispatch({ type: "Decrement" })}>-</button>
      {state.count}
      <button onClick={() => dispatch({ type: "Increment" })}>+</button>
    </div>
  );
}
```

What is interesting about the above example is that we are using the same module `Counter` several times. The root view has state for 3 counters and it wraps the actions dispatched by each counter in its own actions called `DispatchCounter1`, `DispatchCounter2`, and `DispatchCounter3`. This wrapping is accomplished by giving each of the counters a different dispatch function. Lets look at one of them:

```ts
<Counter.View dispatch={(action) => dispatch({ type: "DispatchCounter1", action })} state={state.counter1} />
```

Looking closer att the dispatch prop, we can see that we pass in a function that takes an `action` parameter and it will then use this parameter to create an object `{ type: "DispatchCounter1", action }` which will look like this once the function is called with the counter's Increment action:

```ts
{
  type: "DispatchCounter1", action: { type: "Increment" };
}
```

So the Counter module's `Increment` action is now wrapped inside the root module's `DispatchCounter1` action and it is that object that will be dispatched to the runtime (since the root module's dispatch function is the one the program got from the runtime). This runtime will call the root module's update function with this action and the `case` statement that will handle it will in turn call the Counter module's `update()` with the inner action which is `{ type: "Increment" }`.

Note that the function that the parent pass down to the child's dispatch prop is a lamda:

```ts
<Counter.View dispatch={(action) => dispatch({ type: "DispatchCounter1", action })} state={state.counter1} />
```

This can become a problem if you are using React as a rendering library because a new lamda function will be created for each render so the dispatch prop will always get a new value which will cause the child to re-render even if the stat prop has not changed. To avoid this, typescript-tea provides the function `Dispatch.map()` which will do exacctly what is done above but it will also memoize the resulting function and re-use the same if possible in order to now cause re-renders:

```ts
<Counter.View dispatch={Dispatch.map((action) => ({ type: "DispatchCounter1", action }), dispatch} state={state.counter1} />
```

If you are returning a `Cmd<Action>` from the child's update function, this must also be mapped so the action creator function inside that `Cmd` will create a wrapped action. To do this use the `Cmd.map` function.

So to summarize the fractal pattern is about a parent holding state for a child and calling the child's update function. Note that the parent does not know what is inside the child's state or what kind of actions the child has. The child is like a black-box for the parent. This is a kind of encapsulation of state and logic.

## Subscriptions

There are two types of effects in TEA, commands and subscriptions. We examined commands earlier and saw that the program could send a command to an effect manager to get some task done. So commands are a way for the program to tell an effect manager that it wants some work done in the world outside the program. Subscriptions on the other hand is a way for an effect manager to tell the program that something happened in the world outside the program. However in order for the effect manager to know that the program is interested in some outside event, the program first needs to tell the effect manager what it is interested in. Let's look a the program type again, there is an optional `subscriptions()` funtion that we omitted earlier. This function is used to tell effect managers what types of outside events the program is interested in:

```ts
type Program<State, Action, View> = {
  init: (url: string, key: () => void) => [State, Cmd<Action>?];
  update: (action: Action, state: State) => [State, Cmd<Action>?];
  view: (props: { state: State; dispatch: Dispatch<Action> }) => View;
  subscriptions?: (state: State) => Sub<Action> | undefined;
};
```

We can see that the `subscriptions()` function returns a `Sub<Action>`. A `Sub` specifies some data to describe what to subsribe to and an action creator function with the action we want the effect manager to send us each time the event occurs. A `Sub` is very much like a `Cmd` but the action can happen multiple times in a `Sub`.

## Routing

TODO!!
