# State Core Utility

This Core Utility provides state handling capabilities.

## Usage



### Core Concepts

The idea behind this is that the host provides an object that is containing the actual state. This utility then takes care of automatically persisting the state on changes, hydrating the state on startup with persisted values, getting default values for managed installations and connecting the store to the cross-context messaging system.

### The Store

### Startup

The Core Utility exports an async function named `start()`. In order to use state, call this function. It returns a Promise that will resolve once the state is ready to be worked with.

The function takes your [store](#the-store) as only parameter.

In order to check whether the state is ready to be worked with outside of the start() function, the utility exports the `ready` property, which is a Promise that will resolve once it's ready.

### Reading State

### Listening to State Changes

### Modifying State

### Reading and Modifying State from other Execution Contexts

## Tests

To run the tests, change to the main directory of the core utility and execute:

```bash
$ npm run test
```

## ESLint

To run the linter, change to the main directory of the core utility and execute:

```bash
$ npm run lint
```

## Dependencies

The State Core Utility has the following dependencies:

* rxjs
* jest-extended
