# AdBlock

## Intro

[AdBlock](https://getadblock.com/) is a popular ad blocking extension for Chrome,
Edge and Firefox.

## Requirements

This project requires [node.js](https://nodejs.org) and `npm` (which comes bundled with `node.js`).

The exact version requirements can be found in the [package descriptor file](package.json) under the `engines` field.

## Usage

## Building

### Building on Windows

On Windows, you need a [Linux environment running on WSL](https://docs.microsoft.com/windows/wsl/install-win10).
Then install the above requirements and run the commands below from within Bash.

### Updating the dependencies

In order to build the extension, you need to run the following command to install all of the required packages

`npm install`

The above script will install the required npm packages for AdBlock, Adblock Plus, and run any pre & post install processing scripts.

Rerun the above commands when the dependencies might have changed,
e.g. after checking out a new revison.

### Building the extension

Copy the `.env.defaults` file in the root directory to a `.env` file and fill in the variables accordingly. This step can be skipped, and is only required if you wish to enable the sending of telemetry.

Run one of the following commands in the project directory:

`npx gulp build -t {chrome|firefox} -m {2|3}`

`npm run build:release:{chrome|firefox}`

The second is a shorter version of the first, and it will build only a manifest v2 version.

Both will create a build with a name in the form
_adblockpluschrome-n.n.n.zip_ or _adblockplusfirefox-n.n.n.xpi_. These builds
are unsigned. They can be submitted as-is to the extension stores, or if
unpacked loaded in development mode for testing (same as devenv builds below).

### Development environment

To simplify the process of testing your changes you can create an unpacked
development environment. For that run one of the following commands:

`npx gulp devenv -t {chrome|firefox} -m {2|3}`

`npm run build:dev:{chrome|firefox}`

`npm run build:dev:all`

The second two are aliases for the first. Both build manifest v2 versions, where the second also by default builds both the Chrome and Firefox versions.

All will create a _devenv.\*_ directory in the project directory. You can load
the directory as an unpacked extension under _chrome://extensions_ in
Chromium-based browsers, and under _about:debugging_ in Firefox. After making
changes to the source code re-run the command to update the development
environment, and the extension should reload automatically after a few seconds.

### Other Build options

Two other build options are provided to aid in testing of the extension.

`--ext-version` - specifiying this parameter at build time will override the version specified in the `build/config/base.mjs` file. Most information about the format of the version in the manifest.json file can be found [here](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/version/format).

`--ext-id` - specifiying this parameter at build time will override the Firefox / Mozilla extension id specified in the `build/manifest.json` file. More information about the format and when to provide the Extension / Add-on ID can be found [here](https://extensionworkshop.com/documentation/develop/extensions-and-the-add-on-id/).

`--outputDirectory` - specifiying this parameter at build time will override the default build directory (a _devenv.\*_ directory in the project directory) This option is only applicable to developer ('devenv') builds.

`--manifest-path` specifiying this parameter at build time will override the default 'base' manifest file that used during the build process. It can be used for both MV2 and MV3 builds, and it can be used for both development and production builds ('devenv' or 'build' options). This build option can be used to create the AdBlock beta extension. The AdBlock beta version can be built with the included `\build\beta_manifest.base.json` file. The following command will create a manifest V2 development build of the AdBlock beta extension for Chrome:

`npx gulp devenv -t chrome -m 2 --manifest-path ./build/beta_manifest.base.json --basename adblockbeta --outputDirectory ./devenv.chrome.beta/`

## Testing

### Compliance tests

Compliance tests run on a local version of [testpages](https://abptestpages.org)
to assure compliance between AdBlock and other eyeo adblocking solutions. They
run the tests from the [testpages project](https://gitlab.com/eyeo/developer-experience/testpages.adblockplus.org/)
using a local build of the AdBlock extension.

Prerequisites:

- Docker

To run the tests:

```bash
EXTENSION=<build file> ./test/compliance.sh
```

Optional environment variables:

- BROWSER: Browser and version to run. The default is "chromium latest".
- IMAGE_NAME: Name of the docker container. The default is "compliance".

## Code Style

We use a standard code style enforced by [eslint](https://eslint.org) for JavaScript and [Prettier](https://prettier.io) for HTML, CSS and JSON. We use [HTMLhint](https://github.com/htmlhint/HTMLHint) for HTML accessibility and standards checking. To use these tools, install [Node.js](https://nodejs.org) and run the following command in the project directory:

```bash
npm install
```

Specifically, the standard JavaScript code style we've adopted is the [Airbnb JavaScript style guide](https://github.com/airbnb/javascript/blob/master/README.md)

The following npm commands are then available:

- `npm run lint` runs eslint and prints out all JavaScript violations.
- `npm run lint-fix` runs eslint and automatically fixes JavaScript style violations in place (be sure to commit before running this command in case you need to revert the changes eslint makes).
- `npm run prettier` runs prettier on HTML, CSS, and JSON files in the adblock-betafish directory and list all files that need to be Prettier.
- `npm run prettier-fix` runs prettier and automatically replaces with Prettier versions for HTML, CSS, and JSON files in the adblock-betafish directory.
- `npm run html-hint` runs HTMLhint and flags any issues with the HTML templates such as missing `DOCTYPE`, tags and/or attributes. This does not run on pre-commits so it must be run manually. New AdBlock custom attributes should be added in `/rules/static/custom_attributes.json`. If mistakenly flagged, standard HTML attributes should be added in `/rules/static/aria_attributes.json` or `/rules/static/mapped_attributes.json`.

### Aliases

As we update the extension structure and add Typescript, we will find ourselves importing files from mutiple levels within peer directories, as well as relocating files within a given subdirectory. To help make this easier, we have added a `~` shortcut, which maps to `adblock-betafish`.

This means that rather than needing to use `../` to navigate out of a file's directory, the import address can be given from the perspective of `adblock-betafish`. So an import like `from '../../ipm/background/command-library.types';` can be replaced with from `'~/ipm/background/command-library.types';`.

## Developer Guide

General guidelines for developing AdBlock specific code.

### Icons and Graphics

All graphics use SVG when at all possible. The current exception is the extension toolbar icon which is currently a PNG. There is work in progress to replace this image with SVG.

Icons use SVG web fonts. We primarily use [Material Design Icons](https://www.material.io/resources/icons/?style=baseline) and provide a few custom icons via the AdBlock Icons project. Standard markup to display the "settings" icon would be:

```html
<i class="material-icons">settings</i>
```

For <abbr title="Web Content Accessibility Guidelines">WCAG</abbr> compliance, we use <abbr title="Accessible Rich Internet Applications">ARIA</abbr> content to make the web icons accessible for screen readers. Read the [full description](https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA24) for details, but a summary of the steps are:

- mark the web icon element using attribute `role="img"`
- if the web icon is purely visual, use `aria-hidden="true"`
- if the web icon is semantic, use `aria-label="Settings"` to provide the screen reader description of the icon.

An example of an icon used as a button:

```html
<i class="material-icons" role="img" aria-label="Extension settings">settings</i>
```

An example of an icon that "decorates" text and does not need to be read by the screen reader:

```html
<i class="material-icons" role="img" aria-hidden="true">check_circle</i> We are OK
```

### Accessibility

The following are notes for improving the accessibility of the AdBlock user interface.

#### Assistive Technologies

Assistive Technologies (<abbr>AT</abbr>) such as screen readers present the web content to users dramatically differently than the visual renderer.

It is important to optimize AT UX for "skipping" content. Important information should be presented first, followed by additional details. This allows the user to skip the reading of the detailed information if they are trying to navigate to particular sections of the UI.

AT use the HTML document structure and the semantic meaning associated with different HTML elements to assist in making content easy to understand. Many AT and their end users create custom stylesheets assigning different presentations (volumes, tone, etc) to different element types (i.e. `<h1>` elements may be spoken more loudly and with a deeper tone). Whenever possible use appropriate HTML elements to assist these stylesheets.

AT present the screen content as a "snapshot" of the content at the point in time when the element is visited. Dynamic content should carefully consider what the AT presentation should be when presented, and whether it's worth the distraction to the user when deciding if alerting the user of a change is desired. Content that should be dynamic should be marked the appropriate ARIA [live region roles](https://www.w3.org/TR/wai-aria-1.1/#live_region_roles) and [live region attributes](https://www.w3.org/TR/wai-aria-1.1/#attrs_liveregions). It is much harder for a user of a AT to "ignore" notifications.

`tabindex` is a good "quick fix" for controlling AT focus. Assign a value of `0` for items that should receive keyboard focus, and a `-1` for items that normally receive focus but should not for an AT. However, `tabindex` is a crutch - elements that receive focus should use the proper HTML elements and ARIA `role` attribute so the browser can automatically and "naturally" determine focus. Many users will have custom stylesheets for their AT that helps with their particular disability and those will be bypassed by using `div` elements for everything and brute forcing particular AT behaviors. We should consider the presence of `tabindex` as an "automatic technical debt" for improving the HTML in the future.

`tabindex` trivia: `tabindex` set on the `label` for an `input` transfers the focus to the `input`. Focus on the `input` reads it's `label`. The AT won't go into a loop or double-read the `label`. So setting a `tabindex` on the label reads the label when the input gets focus. Entering tab will go to the `label` but the AT won't read anything - so it feels like the tab is "broken/stuck" for the AT (visually you see the focus switch but the AT does not speak anything). The third tab then moves to the next input. Setting `tabindex="-1"` on the `input` and `tabindex="0"` on the `label` looks more correct - the label highlights and is spoken when it gets focus and keyboard input toggles (in the case of a checkbox) the input. However (on Chrome) the AT freaks out and reads all the `label` entries that are "nearby" in the DOM when the first input gets focus and then does not read anything else as focus moves in the "nearby group" (aka don't do it).

It is important to test using a screen reader. There is no substitute for experiencing and trying to operate the UI regularly using AT. Some small changes create amazing improvements to the AT UX and some unexpected outputs can be unusually annoying when using an AT. On Mac, use `cmd-F5` to toggle Voice Over on/off (or open System Preferences | Accessibility | Voice Over) and use the keyboard for navigation. TODO Windows and Linux testing options?

### Help Flow Map

The help flow structure is defined in `help-map.json`. Each entry represents a page in the help flow, and the key for each entry needs to be unique.

Each page can contain any combination of the following:

- `title`: displayed at the top of page, i18n string key, max one per page
- `seques`: displayed first in body of page, can have multiple per page
  - `content`: i18n string key, max one per segue
  - `segueTo`: key for help flow page to transition to on click, max one per segue
  - `sequeToIfPaused`: key for help flow page to transition to on click if paused, max one per segue
  - `segueToIfWhitelisted`: key for help flow page to transition to on click if whitelisted, max one per segue
- `sections`: displayed second in body of page, can have multiple per page
  - `content`: array of objects representing sentences to be displayed as a paragraph, can have multiple per section
    - `text`: i18n string key
    - `linkURL`: URL to be subbed into a string with link placeholders ("[[" and "]]")
- `buttons`: displayed third in body of page, can have multiple per page
  - `text`: i18n string key
  - `action`: function from `help-action.js` to be called on click
  - `icon`: material icons key of icon to be displayed on button, displayed before text
- `footer`: displayed at bottom of page, i18n string key, max one per page


Testing a change. 