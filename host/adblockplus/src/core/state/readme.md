# State Core Utility

This Core Utility provides state handling capabilities.

## Concept and Usage

The idea behind this is that the host provides an object that is containing the actual state. That store also provides reactive capabilities. This utility then takes care of automatically persisting the state on changes, hydrating the state on startup with persisted values, getting default values for managed installations and connecting the store to the cross-context messaging system.

### The Store

The store is a map of state property and values. The values are wrapped in a BehaviorSubject, which will allow to listen to changes. The type of the store is `Record<string, BehaviorSubject<any>>;`. Here's an example:

```typescript
export const store = {
  /**
   * The interval in which to ping the IPM server, in ms. Defaults to 24 hours.
   */
  ipmPingInterval: new BehaviorSubject(24 * 60 * 60 * 1000),

  /**
   * Current license
   * 
   * Note: To prevent mutation, we mark this non-primitive as read-only.
   */
  premiumLicense: new BehaviorSubject<DeepReadonly<License>>(emptyLicense),

  /**
   * Premium user ID
   */
  premiumUserId: new BehaviorSubject("")
};
```

When setting up the store, provide the keys that you need, and a BehaviorSubject with the default value for that key.

### Mutability

In order to make sure that non-primitive state values are immutable, they need to be marked as read-only. To do this, use the `DeepReadOnly` helper type provided by `ts-essentials`.

### Startup

The Core Utility exports an async function named `start()`. In order to use state, call this function. It returns a Promise that will resolve once the state is ready to be worked with.

The function takes your [store](#the-store) as only parameter.

In order to check whether the state is ready to be worked with outside of the `start()` function, the utility exports the `ready` property, which is a Promise that will resolve once it's ready.

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
* ts-essentials
* jest-extended
