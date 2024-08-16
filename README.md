# Eyeo Web Extensions Monorepo

## The Monorepo Architecture
A change!

The extension fragments architecture aims to provide a structured method for
developing complex browser extensions with a focus on adaptability and
scalability. It facilitates the integration of smaller, specialized components
called 'fragments' into the host extension, in order to create customized
extensions with different features and branding to suit various user needs.

This architecture also streamlines dependency management, making development and
collaboration more efficient.  

## Main architectural components

There are three main types of architectural components:

| Component type | Owner           |
|:---------------|:----------------|
| Core utilities | Extensions team |
| Fragment       | Any             |
| Host extension | Extensions team |

### Core utilities

Core functionality that any extension fragment can rely on. They help to
establish consistency in practices, discourage usage of unsafe APIs, and reduce
duplication.

Examples: feature flags, APIs to obtain browser and extension information.

### Fragment

Encapsulation of business logic and functionality, to enable modular development
and easy maintenance within the broader extension ecosystem.

A fragment is an NPM package that can be imported into an extension, which may
contain code that runs in the background, content-scripts, UI Fragments, UI
logic, etc; but it is not an extension on its own.

The package does not need to be published to an NPM repository, it can simply be
imported locally within the monorepository.

A fragment can be able to run in a standalone manner, outside a host extension
but that is irrelevant for integration purposes.

Examples: Readership Link, In-product messaging (IPM).

### Host extension

The extension that composes core packages and extension fragments together. What
we ship to the stores.

Examples: AdBlock, AdBlock Plus.

### Component relationship

The diagram below illustrates the interactions between the different types of
components:

```mermaid
graph LR;
  subgraph monorepo
  subgraph core
  core/ewe-sdk
  core/infos
  core/featureflags
  end
  subgraph fragment
  fragment/ipm
  fragment/cdp
  end
  subgraph host
  host/adblock
  host/adblockplus
  end
  end
  subgraph output
  Adblock[Adblock Extension]
  AdblockPlus[Adblock Plus Extension]
  end

  core/ewe-sdk-->fragment/cdp
  core/infos-->fragment/cdp;
  core/featureflags-->fragment/ipm;

  core/ewe-sdk-->host/adblock;
  core/infos-->host/adblock;
  core/featureflags-->host/adblock;
  fragment/ipm-->host/adblock;
  fragment/cdp-->host/adblock;
  host/adblock-->Adblock

  core/ewe-sdk-->host/adblockplus;
  core/infos-->host/adblockplus;
  core/featureflags-->host/adblockplus;
  fragment/ipm-->host/adblockplus;
  fragment/cdp-->host/adblockplus;
  host/adblockplus-->AdblockPlus
```

## CI pipeline

### Runners

Pipeline jobs use self-managed runners from Google Cloud Platform (GCP). The
the setup of the runner is defined in [the devops runner project](https://gitlab.com/eyeo/devops/terraform/projects/gitlab-runners/terraform-adblock-inc-runner/), and the runner status can be checked
[here](https://gitlab.com/groups/eyeo/extensions/-/runners). Access to GCP
resources like the GCloud console can be granted by devops as well.
