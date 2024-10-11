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
`npm run $ test.unit.standard --workspace host/adblockplus`. Those can be run 
together via `npm test -- --scope=adblockplus`.

### End-to-end testing

The `./test/end-to-end/tests` folder contains various end-to-end tests. These
tests can be executed locally, (in the latest stable Chrome, Firefox and Edge
browsers) or they can be executed using [LambdaTest](https://automation.lambdatest.com/).

#### Local run

To run the end-to-end tests locally:

```sh
npm run build:release -- --scope=adblockplus
npm run test:end-to-end -- --scope=adblockplus -- {chromium|edge|firefox} {2|3} [{all|filterlists|smoke}]
```

Note: Browser specified in the command is the browser that tests will be run on,
not the browser that we specify in build step.

The `FORCE_HEADFUL=true` environment variable may be used to run the browser in
headful mode instead of headless.

#### LambdaTest run

To run the end-to-end tests using [LambdaTest](https://automation.lambdatest.com/):

- Create a new .env.e2e file with your Lambda credentials. You can use the
[.env.e2e.defaults](./.env.e2e.defaults)
provided as a guide. The values in `.env.e2e.defaults` will be used as default
values, so you can choose to only copy the values you wish to override.
- Generate the [release builds](../../README.md#building-the-extensions-in-release-mode) 
of the extension.
- Additional steps are needed for running the tests with MV3 version of the extension:
  - Install the axios package globally: `npm install -g axios`
  - Upload the extension to LambdaTest by running (in this host folder): `export MV3_BUILD_CLOUD_URL=$(node test/end-to-end/upload-extension.js <LambdaTest username> <LambdaTest access key> dist/release/adblockplus-chrome-*-mv3.zip)`
- Run the test:end-to-end npm script 
`npm run --workspace host/adblockplus test:end-to-end-lambdatest-mv2 all` or
`npm run --workspace host/adblockplus test:end-to-end-lambdatest-mv3 all`.

#### Notes

- You can replace `all` tests with a specific test suite (`e2e`, `integration`,
`smoke`).
- If you only want to execute a single test file, you can replace the value of the
`all` property in [suites.js](./test/end-to-end/suites.js#L21)
to an array containing only the [path](./test/end-to-end/tests)
to the test(s) you want to run. Example:

  ```js
  all: ["./tests/test-options-page-dialog-links.js"],
  ```

- Allure reporter is used for displaying the results after the execution has been
completed. The report can be generated and opened using the
`npm run --workspace host/adblockplus test:generate-and-open-report` command.
- Screenshots of failing tests get saved to `./test/end-to-end/screenshots`

#### Docker run

These commands should be run from the repository root, not this host folder. 

Prerequisites: Docker

```sh
docker build -t end-to-end -f host/adblockplus/test/end-to-end/Dockerfile --build-arg MANIFEST_VERSION={2|3} --build-arg BROWSER={chromium|firefox|edge} --build-arg BUILD_EXTENSION={true|false} .
docker run --cpus=2 --shm-size=2g -it -e SUITE=smoke end-to-end
```

The default behaviour builds the extension inside the docker image. Setting the
`BUILD_EXTENSION` build argument to `false` will use the contents of the local
`dist` folder instead.

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
- CSS: `npm run --workspace host/adblockplus $ lint.css`
- Translation files: `npm run --workspace host/adblockplus $ lint.locale`

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
