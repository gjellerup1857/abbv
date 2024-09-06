# Example Core Utility

This is the simplest core utility, which can be used as a template for creating
new core utilities.

Fill this readme with anything relevant for people working on or using your
utility.

## Using the example core utility

These cheat sheet commands are all run from the root of the monorepo.

Adding the utility as a dependency on another repo:
```sh
npm i -w host/adblock --save @eyeo/example
```

Running the tests for this utility:
```sh
npm test -w core/example
```

## FAQ

- Can we update stuff and see it immediately from the host perspective?
  - Yes! This package is just bundling JavaScript files. The workspace symlinks
    it all together. So changes reflect immediately.
  - If your core module needs a build step, this might need some consideration.
- What do we name things?
  - Everything in the monorepo should fall under the `@eyeo` namespace.
- What does running this in terms of our gitlab pipelines look like? 
  - If the core module tests everything it needs to efficiently with the `npm
    test` command, then this is already covered in the gitlab config.
  - If the core module needs anything more, consider adding a child pipeline for
    it.


## Open questions

- "What do we name things?" probably needs a bit more guidance.
- What meta do we want to add around these core utilities? Some might only be
  usable in some contexts (browser vs node)
