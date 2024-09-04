# Eyeo Web Extensions Monorepo

## The Monorepo Architecture

The extension fragments architecture aims to provide a structured method for
developing complex browser extensions with a focus on adaptability and
scalability. It facilitates the integration of smaller, specialized components
called 'fragments' into the host extension, in order to create customized
extensions with different features and branding to suit various user needs.

This architecture also streamlines dependency management, making development and
collaboration more efficient.  

Read more about the architecture [here](./docs/ARCHITECTURE.md).

## Using this repository 

### Prerequisites 

  node: 18.17.1
  npm: 9.6.7

### Working in workspaces

The `package-lock.json` file and the `node_modules` folder are in the 
root of the project. Any subfolder with a package.json might still have a local 
`node_modules` folder when different versions of the same dependency are used.

#### Running scripts in all workspaces

  (Using build:source as an example)

  From the root of the project:
    1. run `npm i`
    2. run `npm run build:source --workspaces`. This runs the `build:source` script in all of the workspace packages.

#### Running scripts in a single workspace

  From the root of the project:
    1. run `npm i`
    2. run `npm run build:source --workspace=host/adblock` This runs `build:source` script in AdBlock alone.

#### `node-gyp` error?

If you're using an apple machine with apple silicon (arm64 CPU), you may
encounter an error where `node-gyp` fails to build during `npm install`. In that
case you need to run `arch -x86_64 zsh` before any other commands, and make sure
you are not using `nvm` to run the node version.

Another possible cause is that `node-gyp` cannot find the binary online,
then tries to build the binary locally and fails because of Python 3.12 being
installed, [which does not work work with some versions of `node-gyp`](https://github.com/nodejs/node-gyp/issues/2869).
That could be solved by installing Python 3.11 locally, and
[`pyenv`](https://github.com/pyenv/pyenv) could be used for that.

## CI pipeline

### Runners

Pipeline jobs use self-managed runners from Google Cloud Platform (GCP). The
the setup of the runner is defined in [the devops runner project](https://gitlab.com/eyeo/devops/terraform/projects/gitlab-runners/terraform-adblock-inc-runner/), and the runner status can be checked
[here](https://gitlab.com/groups/eyeo/extensions/-/runners). Access to GCP
resources like the GCloud console can be granted by devops as well.

## Contributing

Please see [contributing](CONTRIBUTING.md)
