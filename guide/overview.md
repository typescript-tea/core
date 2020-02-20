# Overview

The architecture in typescript-tea is very close to the original one used in elm itself although there are some implementation details that differ. This document will explain how typescript-tea works in detail.

The archtiecture consists of these main pieces:

1. The runtime.
2. The application program (this is the code you write).
3. Effect Managers.
4. Application State
5. The rendered View (in the browser)
6. Actions.

> NOTE: You may also have heard the term "fractal" mentioned in The Elm Archtiecture. This is an optional way to organize your application code (2). Please note that organizing your program in a fractal way is optional and not part of the archtiture. We will cover fractal code organization later as it is an optional piece and not actually part of the archtiture. (Did I mention it is optional?)

To start a program in typescript-tea you call the `run()` function which is part of the runtime (1). The `run()` function is passed the application's `Program` (2) and an array of `EffectManagers` (3). The signature of the run function looks like this:

```ts
function run(program: Program, effectManagers: EffectManager[]): () => void;
```

As you can see the `run()` function returns a function which accepts no arguments and returns nothing. You can call this function if you want to terminate the program. You see, once you call `run()` the runtime starts a loop that will go on forever (well, at least until you call the terminate function it returns). But don't worry, this loop is not CPU intensive as most of the time in the loop is spent idle waiting for user input.

We will walk through all the steps in the runtime loop, but before we do that let's see how `Program` is defined (we omit some optional parts here for clarity):

```ts
type Program<S, A, V> = {
  init: () => [S, Cmd<A>?];
  update: (action: A, state: S) => [S, Cmd<A>?];
  view: (props: { state: S; dispatch: Dispatch<A> }) => V;
};
```

The program consists of only three functions: `init()`, `update()`, and `view()`. You may also notice that the `Program` type has some generics parameters in `<S, A, V>`. They are abbreviations for `State`, `Action`, and `View` which are types that your program can define in any way it wants.

If you are using React for rendering then the `View` type is simply JSX.

The `State` type is an object that holds any data your program need to keep track of. If you are building a simple counter program, the state can be a `number`. If you are building a complex program it can be a large object, with lots of keys and sub-keys.

The `Action` type is used to describe actions that the user can make in the program, or things that happens outside the program that the program is interested in. For example an action can be that the users clicks a button, or that some data arrives from the server. Usually the action type is defined as an object with a `type` field and some payload data that depends on which type of action it is.

An interesting aspect of the three functions in the program is that they must (or at least should) be "pure". So what does that mean? A pure function is a function that for the same input always returns the same output, and does not have any effect on anything external to itself. So what does not having any effect mean? Well for example it cannot call the server, it cannot read or write to a database, as these things are causing effects to things outside the function.

When I first encountered pure functions, I thought that programs that consists of only pure functions cannot be useful at all unless your whole program is only doing math operations. I mean not calling the server? Not writing to a database? How can I ever get some real work done without that? But then again, if it was possible to have useful programs with only pure functions, that would be really interesting. As you could imagine, pure functions are extremely pretictable and easy to test. So if you can have a program that consists of only pure functions, your program becomes extremely predictable and easy to test. It also becomes easier to reason about the program and usually such programs have fewer bugs than programs that consists of impure functions. In fact, with only pure functions, you have to debug stuff less often as you can already predict the outcome of every function.

But then again, a program of only pure functions that does meaningful enterprise application work cannot really be possible? It must be a pipe dream? Well, it turns out that having the program consist of only pure functions is the whole key to the Elm Archticture (TEA). It is actually the whole reasons TEA exists at all. Having your program consist of only pure functions is the "raison d'etre" of TEA. So how does TEA pull this incredible feat off? Well, to discover that we need to look closer at the return values of the three functions in the program.
