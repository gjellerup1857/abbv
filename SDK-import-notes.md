# Try these steps: 

1) Clear all your node_modules folders everywhere. 
1) Clear the SDK's dist folder
1) run `npm i` in the root
1) Check that /node_modules/@eyoe/webext-ad-filtering-solution is symlinked.
1) Run `npm run build:release --workspace=host/adblockplus -- chrome -m 3` this should fail because it can't find the SDK files. Should fail with: File not found with singular glob: /Users/rdeysel/Work/extensions/host/adblockplus/../../node_modules/@eyeo/webext-ad-filtering-solution/dist/ewe-content.js
1) Building the SDK: `npm run build --workspace=core/webext-ad-filtering-solution --if-present`. This fails. 
1) Run `npm run build:release --workspace=host/adblockplus -- chrome -m 3` should now work. This generates a release zip file of a working extension. Yay.

Things done.
- Copied the SDK to its core folder 
- Moved everything from the SDK's .npmrc to the root .npmrc. Removed the original.
- Added a workspace entry for core/SDK/core specifically in the root package.json. Yay for naming!
- Commented out `generateTypeDefs` in scripts/build.js temporarily

Things not done: 
- Types: Our build script automatically runs types:generate and this fails currently. Temporarily solved by removing the `generateTypeDefs` step in scripts/build.js
- Pipelines: No changes made in gitlab-ci.yml yet
- Lerna or any meaningful way of managing the dependency chain (Yes, I think this is where we start using Lerna)

# Things to think about: 

1) Should we have _some_ shared devdependencies in the root?
I can see us have something like this in the root package.json: 
- "eslint"
- "prettier"
- "typescript"
- "webpack"
- "lerna"

2) Does it make sense to have a few foundational root scripts? Each project will then have similarish approaches for:

```json
scripts": {
    "build": "npm run build --workspaces --if-present",
    "test": "npm run test --workspaces --if-present",
    "lint": "npm run lint --workspaces --if-present"
  },
```