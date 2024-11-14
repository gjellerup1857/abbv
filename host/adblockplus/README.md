# Adblock Plus

Welcome to the repository for the Adblock Plus extension!

The main project is hosted on [GitLab][abp-ext] and, in addition to the user
interface and the web extension code, the Adblock Plus extension also includes
[static filter lists][adblockinc-rules],
[eyeo's Web Extension Ad Blocking Toolkit (EWE)][eyeo-ewe] and
[eyeo's snippets][eyeo-snippets].

- [About Adblock Plus](#about-adblock-plus)
- [Building](#building)
- [UI elements](#ui-elements)
- [Testing](#testing)
- [Contributing](#contributing)

## About Adblock Plus

Adblock Plus is a free extension that allows users to customize their web
experience. Users can block annoying ads, disable tracking and lots more. It’s
available for all major desktop browsers and for mobile devices.

Adblock Plus is an open source project licensed under [GPLv3][gpl3] and subject
to its [Terms of Use][eyeo-terms]. [eyeo GmbH][eyeo] is the parent company of
Adblock Plus.

## Running scripts

Please note that all scripts should be run from the root of the repository, not
this host folder.

## Building

See the [readme at the root of the monorepo](../../README.md) for general
instructions on prerequisites, dependency management, how to build the
extensions.

### Building with secrets

Copy the `.env.defaults` file in the `host/adblockplus` directory to a `.env`
file and fill in the variables accordingly. This step can be skipped, and is
only required if you wish to enable the sending of telemetry.

### Bundling the UI

Various files need to be generated before using the UI. When building the UI
for inclusion in the extension, this is achieved using
`npm run dist -w=host/adblockplus` from the root folder (not this host folder).

For usage [in the test environment](#testing), run the
[`build`](../../README.md#building-the-extensions-in-development-mode) script to
generate the various bundles for all [UI elements](#ui-elements).

Beyond that, this repository contains [various utilities][wiki-utils] that we
rely on across our development process.

### Error reporting

We use [Sentry](https://sentry.io/) to report the errors. In order to initialize it
during the build one has to pass `SENTRY_DSN` and `SENTRY_ENVIRONMENT`
variables in either `.env` file or as environment variable during the (CI) build. If not
initialized, console warning is shown. By default `SENTRY_ENVIRONMENT=production`.
User emails are cut on client side and data scrubbing on
[server side](https://docs.sentry.io/security-legal-pii/scrubbing/server-side-scrubbing/) is
configured by default.

## UI elements

Specifications for Adblock Plus elements can be found in [eyeo's spec
repository][abp-spec].

### UI pages

These are pages that users primarily interact with because they are exposed to
them via the browser's UI.

- Bubble UI (popup)
- Developer tools panel (devtools-panel)
- Options
  - Desktop (desktop-options)
  - Mobile (Firefox) (mobile-options)

### Dialogs

These are pages that are dedicated to a specific feature and can be accessed via
UI pages.

- Filter composer (composer)
- Issue reporter (issue-reporter)

### Landing pages

These are pages that cannot be accessed via UI pages. They are either directly
or indirectly opened by the extension under certain conditions.

- Day 1 (day1)
- First run (first-run)
- Problem (problem)
- Updates (updates)

### Helper pages

These are pages that are part of another page. They are not meant to be shown on
their own.

- Bubble UI dummy (popup-dummy)
- Proxy (proxy)

### Additional extension functionality

These are parts of the extension logic which are running alongside the other
extension code in the extension's background process.

- Notifications
- Preferences

## Testing

If you don't want to build the entire extension, you can open UI pages in a test
environment using a local web server. This should be run from the root of the
monorepo.

```sh
npm run build:local
npm start --workspace host/adblockplus
```

After running `npm start --workspace host/adblockplus`, you can access the HTML
pages under the URL shown in the terminal, e.g. http://127.0.0.1:8080.

Various aspects of the pages can be tested by setting parameters in the URL (see
[list of URL parameters](docs/test-env.md#url-parameters)).

**Note**: You need to [create the bundles](#bundling-the-ui) for the UI page(s)
that you want to test.

### Unit testing

The `./test/unit` folder contains various mocha unit tests files
which can be run via `npm run $ test.unit.legacy --workspace host/adblockplus`.
For `.ts` files we have jest unit tests that can be run via
`npm run $ test.unit.love --workspace host/adblockplus`. Those can be run
together via `npm test -- --scope=adblockplus`.

### End-to-end tests

End-to-end tests load the release build of the Adblock Plus extension in the
browser to run the end to end test suites.

Notes:

- Release builds are needed for both local and Docker runs. The commands for
  that are added to the examples.
- Commands given below should be run from the root directory of this
  repository, the same as the build commands.
- The browser specified in the command is the browser that tests will be run
  on, not the browser that we specify in build step.
- DNS mapping from `testpages.adblockplus.org` to `127.0.0.1` is used in
  browsers in order to test with locally served pages and AA-related filter
  rules.

#### Local run

To run the end-to-end tests locally:

```sh
npm run build:release -- --scope=adblockplus
npm run test:end-to-end -- --scope=adblockplus -- {chromium|edge|firefox} {2|3} [{all|filterlists|smoke}]
```

By default browsers run headless. Setting the environment variable
`FORCE_HEADFUL=true` will trigger a headful run instead.

By default webDriverIO in Firefox is opening every tab or window as a new tab.
More details can be found in this
[link](https://gitlab.com/eyeo/extensions/extensions/-/merge_requests/206).

If you only want to execute a single test file, you can replace the values of
properties in [suites.js](./test/end-to-end/suites.js) to an array containing
only the [path](./test/end-to-end/tests) to the test(s) you want to run.
Example:

```js
all: ["./tests/test-options-page-dialog-links.js"],
```

Screenshots for failing tests are stored in `host/adblockplus/test/end-to-end/screenshots`.

#### Docker run

Prerequisites: Docker

```sh
npm run build:release -- --scope=adblockplus
docker build -t end-to-end -f host/adblockplus/test/end-to-end/Dockerfile .
docker run --cpus=2 --shm-size=2g -it -e BROWSER={chromium|firefox|edge} -e MANIFEST_VERSION={2|3} -e SUITE={all|filterlists|smoke} end-to-end
```

To access the screenshots for failing tests run the following command, which
copies them to the `host/adblockplus/test/end-to-end/screenshots` folder:

```shell
docker cp $(docker ps -aqf ancestor=end-to-end | head -n 1):/extensions/host/adblockplus/test/end-to-end/screenshots ./host/adblockplus/test/end-to-end
```

### Compliance tests

Compliance tests run on a local version of [testpages](https://abptestpages.org)
to assure compliance between Adblock Plus and other eyeo adblocking solutions.
They run the tests from the [testpages project](https://gitlab.com/eyeo/developer-experience/testpages.adblockplus.org/)
using a local build of the Adblock Plus extension.

Prerequisites:

- Docker

To run the tests:

```sh
EXTENSION=host/adblockplus/dist/release/<build file> MANIFEST={mv2|mv3} ./host/adblockplus/test/compliance.sh
```

Optional environment variables:

- BROWSER: Browser and version to run. The default is "chromium latest".
- IMAGE_NAME: Name of the docker container. The default is "compliance".

### Linting

You can lint all files via `npm run lint` or lint only specific file types:

- JavaScript/TypeScript: `npm run --workspace host/adblockplus $ lint.js`
- Translation files: `npm run --workspace host/adblockplus $ lint.locale`
- Other files: `npm run --workspace host/adblockplus $ lint.prettier`

The following can help fix issues:

- JavaScript/TypeScript: `npx eslint --fix <file path>`
- Other files: `npm run prettier-fix`

## CI pipeline

The project uses Gitlab CI to run pipelines which contain build and test jobs.

### Nightlies

Nightly builds for feature and release [branches][wiki-branches] can be found
as artifacts [from this page][abp-ext-nightlies].

### Runners

Pipeline jobs use self-managed runners from Google Cloud Platform (GCP). The
the setup of the runner is defined in [the devops runner project](https://gitlab.com/eyeo/devops/terraform/projects/gitlab-runners/terraform-adblock-inc-runner/), and the runner status can be checked
[here](https://gitlab.com/groups/adblockinc/ext/-/runners). Access to GCP
resources like the GCloud console can be granted by devops as well.

## Uploading sourcemaps

The gitlab CI configuration has `release` stage and `upload_sourcemaps` job
which is runs for tags like `adblockplus-v<number>` and uploads the releases sourcemaps to Sentry.
It requires `SENTRY_AUTH_TOKEN` global variable configured for the project.
To do the same manually on the command line one has to:

1. Login to Sentry with `npm run sentry:login` and provide Sentry auth token.
2. Create a release with `VERSION=<version> npm run sentry:release-new`
3. Prepare unzipped file:

```
mkdir ./dist/release/sourcemaps-mv3
&& unzip dist/release/adblockplus-*mv3.zip '*.js.map' -d ./dist/release/sourcemaps-mv3
```

4. Upload the sourcemaps with `VERSION=<version> npm run sentry:sourcemaps`.
   The sourcemaps are overwritten.
5. Finalize the release with `VERSION=<version> npm run sentry:release-finalize`

## Release history

[Extension releases (since 3.11)][abp-ext-tags]

[Extension releases (prior to 3.11)][abp-webext-releases]

[abp-ext]: https://gitlab.com/adblockinc/ext/adblockplus/adblockplus
[abp-ext-nightlies]: https://gitlab.com/adblockinc/ext/adblockplus/adblockplus/-/pipelines?scope=branches
[abp-ext-tags]: https://gitlab.com/adblockinc/ext/adblockplus/adblockplus/-/tags
[abp-spec]: https://gitlab.com/eyeo/specs/spec/tree/master/spec/abp
[abp-webext-releases]: https://github.com/adblockplus/adblockpluschrome/releases
[adblockinc-rules]: https://gitlab.com/adblockinc/ext/rules
[badge-pipeline-image]: https://gitlab.com/adblockinc/ext/adblockplus/adblockplus/badges/main/pipeline.svg
[badge-pipeline-link]: https://gitlab.com/adblockinc/ext/adblockplus/adblockplus/-/commits/main
[eyeo]: https://eyeo.com/
[eyeo-ewe]: https://gitlab.com/eyeo/adblockplus/abc/webext-ad-filtering-solution
[eyeo-snippets]: https://gitlab.com/eyeo/snippets
[eyeo-terms]: https://adblockplus.org/terms
[gpl3]: https://www.gnu.org/licenses/gpl.html
[ms-wsl]: https://docs.microsoft.com/windows/wsl/install-win10
[nodejs]: https://nodejs.org/en/
[npm]: https://www.npmjs.com/get-npm
[npx]: https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b
[wiki-branches]: https://gitlab.com/adblockinc/ext/adblockplus/adblockplus/-/wikis/development-workflow#branches
[wiki-utils]: https://gitlab.com/adblockinc/ext/adblockplus/adblockplus/-/wikis/utilities
