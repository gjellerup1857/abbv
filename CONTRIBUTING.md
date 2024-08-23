# Contributing

## Release notes

We want to simplify the process of submitting changes to the various web stores. Therefore, any commit that has any impact on the user facing deployable things (found in `hosts/`) should have release notes. This means adding items to the `Unreleased` section in relevant `hosts/*/RELEASE_NOTES.md` files.

### What does this mean for me as a person creating a merge request?

Assuming your changes have an impact on the extensions in a visible/feature way, please summarize those changes to relevant `RELEASE_NOTES.md` files. For example:

```
# Unreleased

- Updated the thing to be different. (EXT-77)
- Fixed the way we do that other thing to be much faster. (EXT-324)
```

### What does this mean for me as a reviewer of a merge request?

If you see a change that should probably have release notes, shout!

### What does this mean for me as a person doing the release?

The specifics will be defined in the release process, but on a high level the release manager is reviewing existing release notes and giving them a version number, not writing them from scratch.
