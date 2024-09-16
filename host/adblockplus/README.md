# Adblock Plus

Welcome to the repository for the Adblock Plus extension!

The main project is hosted on [GitLab][abp-ext] and, in addition to the user
interface and the web extension code, the Adblock Plus extension also includes
[static filter lists][adblockinc-rules],
[eyeo's Web Extension Ad Blocking Toolkit (EWE)][eyeo-ewe] and
[eyeo's snippets][eyeo-snippets].

- [About Adblock Plus](#about-adblock-plus)
- [Prerequisites](#prerequisites)
- [UI elements](#ui-elements)
- [Testing](#testing)
- [Building](#building)
- [Contributing](#contributing)

## About Adblock Plus

Adblock Plus is a free extension that allows users to customize their web
experience. Users can block annoying ads, disable tracking and lots more. It’s
available for all major desktop browsers and for mobile devices.

Adblock Plus is an open source project licensed under [GPLv3][gpl3] and subject
to its [Terms of Use][eyeo-terms]. [eyeo GmbH][eyeo] is the parent company of
Adblock Plus.

## Prerequisites

To contribute to this project, you'll need:

- [Node][nodejs] 18.17.1
- [npm][npm] 9.6.7

`Node` should come installed with `npm`. If it doesn't, you can
download `npm` [here][npm].


### `node-gyp` error?

If you're using an apple machine with apple silicon (arm64 CPU), you may
encounter an error where `node-gyp` fails to build during `npm install`. In that
case you need to run `arch -x86_64 zsh` before any other commands, and make sure
you are not using `nvm` to run the node version.

Another possible cause is that `node-gyp` cannot find the binary online,
then tries to build the binary locally and fails because of Python 3.12 being
installed, [which does not work work with some versions of `node-gyp`](https://github.com/nodejs/node-gyp/issues/2869).
That could be solved by installing Python 3.11 locally, and
[`pyenv`](https://github.com/pyenv/pyenv) could be used for that.

**Important:** On Windows, you need a [Linux environment running on WSL][ms-wsl]
and run the commands from within Bash.

**Tip**: If you're installing `node` in ArchLinux, please remember to install
`npm`, too.

After cloning this repository, open its folder and run `npm install`.

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
environment using a local web server. This can be done by running `npm start`,
which allows you to access the HTML pages under the URL shown in the terminal,
e.g. http://127.0.0.1:8080.

Various aspects of the pages can be tested by setting parameters in the URL (see
[list of URL parameters](docs/test-env.md#url-parameters)).

**Note**: You need to [create the bundles](#bundling-the-ui) for the UI page(s)
that you want to test.

### Unit testing

The `./test/unit` folder contains various mocha unit tests files
which can be run via `npm run $ test.unit.legacy`. For `.ts` files we have jest
unit tests that can be run via `npm run $ test.unit.standard`.
Those can be run together via `npm test`.

### End-to-end testing

The `./test/end-to-end/tests` folder contains various end-to-end tests. These
tests can be executed locally, (in the latest stable Chrome, Firefox and Edge
browsers) or they can be executed using [LambdaTest](https://automation.lambdatest.com/).

#### Local run

To run the end-to-end tests locally:

- Generate the [release builds](#building-the-extension) of the extension.
- Run the test:end-to-end-local script.

Example:

```sh
npm run build:release {chrome|firefox} {2|3}
MANIFEST_VERSION={2|3} BROWSER={chrome|firefox|edge} npm run test:end-to-end-local all
```

The `FORCE_HEADFUL=true` environment variable may be used to run the browser in
headful mode instead of headless.

#### LambdaTest run

To run the end-to-end tests using [LambdaTest](https://automation.lambdatest.com/):

- Create a new .env.e2e file with your Lambda credentials. You can use the
[.env.e2e.defaults](https://gitlab.com/adblockinc/ext/adblockplus/adblockplus/-/blob/next/.env.e2e.defaults?ref_type=heads)
provided as a guide. The values in `.env.e2e.defaults` will be used as default
values, so you can choose to only copy the values you wish to override.
- Generate the [release builds](#building-the-extension) of the extension.
- Additional steps are needed for running the tests with MV3 version of the extension:
  - Install the axios package globally: `npm install -g axios`
  - Upload the extension to LambdaTest by running: `export MV3_BUILD_CLOUD_URL=$(node test/end-to-end/upload-extension.js <LambdaTest username> <LambdaTest access key> dist/release/adblockplus-chrome-*-mv3.zip)`
- Run the test:end-to-end npm script `npm run test:end-to-end all` or
`npm run test:end-to-end-mv3 all`.

#### Notes

- You can replace `all` tests with a specific test suite (`e2e`, `integration`,
`smoke`).
- If you only want to execute a single test file, you can replace the value of the
`all` property in [suites.js](https://gitlab.com/adblockinc/ext/adblockplus/adblockplus/-/blob/next/test/end-to-end/suites.js#L21)
to an array containing only the [path](https://gitlab.com/adblockinc/ext/adblockplus/adblockplus/-/tree/next/test/end-to-end/tests)
to the test(s) you want to run. Example:

  ```js
  all: ["./tests/test-options-page-dialog-links.js"],
  ```

- Allure reporter is used for displaying the results after the execution has been
completed. The report can be generated and opened using the
`npm run test:generate-and-open-report` command.
- Screenshots of failing tests get saved to `test/end-to-end/screenshots`

#### Docker run

Prerequisites: Docker

```sh
docker build -t end-to-end -f test/end-to-end/Dockerfile --build-arg MANIFEST_VERSION={2|3} --build-arg BROWSER={chrome|firefox|edge} --build-arg BUILD_EXTENSION={true|false} .
docker run --cpus=2 --shm-size=2g -it -e SUITE=smoke end-to-end
```

The default behaviour builds the extension inside the docker image. Setting the
`BUILD_EXTENSION` build argument to `false` will use the contents of the local
`dist` folder instead.

To access the screenshots for failing tests run the following command, which
copies them to the `test/end-to-end/screenshots` folder:

```shell
docker cp $(docker ps -aqf ancestor=end-to-end | head -n 1):/adblockplus/test/end-to-end/screenshots ./test/end-to-end
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
EXTENSION=dist/release/<build file> MANIFEST={mv2|mv3} ./test/compliance.sh
```

Optional environment variables:

- BROWSER: Browser and version to run. The default is "chromium latest".
- IMAGE_NAME: Name of the docker container. The default is "compliance".

### Linting

You can lint all files via `npm run lint` or lint only specific file types:
- JavaScript/TypeScript: `npm run $ lint.js`
- CSS: `npm run $ lint.css`
- Translation files: `npm run $ lint.locale`

**Note**: Both `eslint` and `stylelint` can help fix issues via `--fix` flag.
You can try the example below via [npx][npx] which should be automatically
included when you install `npm`.

`npx stylelint --fix css/real-file-name.css`

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

## Building

### Building the extension

Copy the `.env.defaults` file in the root directory to a `.env` file and fill in
the variables accordingly. This step can be skipped, and is only required if
you wish to enable the sending of CDP data.

In order to build the extension you need to first
[update its dependencies](#updating-the-dependencies). You can then run one of
the following command for the type of build you'd like to generate:

```sh
npm run build {chrome|firefox|local} {2|3}
npm run build:release {chrome|firefox|local} {2|3}
npm run build:source
```

Targets:
- **chrome**: Chromium-based browsers
- **firefox**: Firefox
- **local**: [Local test environment](#testing)

**`build`:** Creates unpacked extension in _dist/devenv/\<target\>/_. It
can be loaded under _chrome://extensions/_ in Chromium-based browsers, and under
_about:debugging_ in Firefox.

**`build:release`:** Creates the following extension build files in
_dist/release/_ that can be published to the various extension stores:

- adblockpluschrome-\*.zip
- adblockplusfirefox-\*.xpi

**`build:source`:** Creates the following source archive file in _dist/release/_
that can be provided to extension stores for review purposes:

- adblockplus-\*.tar.gz

#### Updating the dependencies

Install the required npm packages:

`npm install`

Rerun the above commands when the dependencies might have changed,
e.g. after checking out a new revision.

### Bundling the UI

Various files need to be generated before using the UI. When building the UI
for inclusion in the extension, this is achieved using `npm run dist`.

For usage [in the test environment](#testing), run the
[`build`](#building-the-extension) script to generate the various bundles
for all [UI elements](#ui-elements).

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
