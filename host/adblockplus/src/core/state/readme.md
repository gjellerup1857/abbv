# State Core Utility

This Core Utility provides state handling capabilities.

## Concept and Usage

The responsibilities of state handling are split between the host extensions and this core utility.

The host provides an object that is containing the actual state. That store also provides reactive capabilities utilizing [RxJS](https://rxjs.dev/guide/overview). This utility then takes care of automatically persisting the state on changes, hydrating the state on startup with persisted values, getting default values for managed installations and connecting the store to the cross-context messaging system.

### The Store

The store is a map of state property and values. The values are wrapped in a [RxJS BehaviorSubject](https://www.learnrxjs.io/learn-rxjs/subjects/behaviorsubject), which will allow to listen to changes. The type of the store is `Record<string, BehaviorSubject<any>>;`. Here's an example:

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

To read a snapshot of the current state, use the `value` property of the `BehaviorSubject`:

```typescript
const currentLicense = store.premiumLicense.value;
```

### Listening to State Changes

To subscribe to state value changes, use the `subscribe` method of the `BehaviorSubject`:

```typescript
store.premiumLicense.subscribe(license => {
  console.log('🔔 A value for "premiumLicense" was set:', license);
});
```

The calling `subscribe()` will return a subscription object. When you no longer need the subscription, or if you need to cleanup to avoid memory leaks, you can call the subscription's `unsubscribe` method.

```typescript
const subscription = store.premiumLicense.subscribe(/* ... */);
subscription.unsubscribe();

```

#### Pipes, Operators and More

It is possible to combine data streams and/or use operators on them, for example:

```typescript
store.premiumLicense.pipe(
    skip(1), // we're not interested in the initial value
    distinctUntilChanged(), // we only want to know when the value actually changes
  ).subscribe(license => {
    console.log('🔔 The value for "premiumLicense" has changed and now is:', license);
  });
```

### Modifying State

To modify state, use the `next` method of the `BehaviorSubject`:

```typescript
const newLicense = { 
  status: "active",
  // …
};
store.premiumLicense.next(newLicense);
```

### Reading and Modifying State from other Execution Contexts

The store lives in the ServiceWorker/background script. To read or modify state from other execution contexts, use the messaging API. The according message names are `state.read` and `state.modify`.

Besides the Messaging Core Utility, you can use also browser APIs.

#### Read

```typescript
const license = await browser.runtime.sendMessage({
  type: "state.read",
  key: "premiumLicense"
});
```

#### Modify

```typescript
browser.runtime.sendMessage({
  type: "state.modify",
  key: "premiumLicense",
  value: newLicense
});
```

## Tests

To run the tests, change to the main directory of the core utility and execute:

```bash
$ npm run test
```

## Docs

To generate the documentation, change to the main directory of the core utility and execute:

```bash
$ npm run docs
```

## ESLint

To run the linter, change to the main directory of the core utility and execute:

```bash
$ npm run lint
```

## Links and Resources

There's many sites providing docs and tutorials around RxJS. Two prominent ones are [rxjs.dev](https://rxjs.dev/), the official site of the ReactiveX JavaScript implementation, and [learnrxjs.io](https://www.learnrxjs.io/).

* [RxJS Overview](https://rxjs.dev/guide/overview)
* [Short and good introduction into RxJS concepts](https://www.learnrxjs.io/learn-rxjs/concepts/rxjs-primer)
* [Introduction to transforming streams with operators](https://www.learnrxjs.io/learn-rxjs/concepts/get-started-transforming)
* [RxJS guide on Subjects](https://rxjs.dev/guide/subject)
* [BehaviorSubject on learnrxjs.io](https://www.learnrxjs.io/learn-rxjs/subjects/behaviorsubject)

## Dependencies

In addition to what the AdblockPlus host provides, the State Core Utility has the following dependencies:

* rxjs
* ts-essentials
* jest-extended
* typedoc
