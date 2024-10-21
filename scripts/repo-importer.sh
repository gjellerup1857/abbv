#!/bin/bash

# This script imports the history of the Adblock repo. Specifically, it imports:
# - The "next" branch, which is merged into the appropriate part of the monorepo
# - All tags, which are prefixed with "adblock-". This includes tags which are
#   not merged into the "next" branch.
#
# To make local development and testing easier, this script does not push
# anything.
#
# While working on this, it's useful to know that you can run
# `git tag | while read tag; do git tag -d $tag; done` to clear out your local
# tags, including any that may have been created by this script.

set -eu

print_help()
{
cat << EOL
Script for importing the git history from another repo into this one.

Usage:
  $(basename ${0}) --upstream <value> --project <value> --source-branch <value>
                   --target-path <value> [--target-branch <value>]
                   [--remote <value>] [{--help|-h}]

Options:
  --upstream       Clone URL for the upstream repo to be merged in.
                   Example: git@gitlab.com:adblockinc/ext/adblockplus/adblockplus.git

  --project        Name to refer to the subproject being merged in. Used as the
                   name for it's CI child pipeline, and the prefix for any
                   imported git tags.
                   Example: adblockplus

  --source-branch  The branch from the upstream repo to merge into the monorepo.
                   Example: next

  --target-path    Which subdirectory to put the merged code into.
                   Example: host/adblockplus

Optional Options:
  --target-branch  The branch to merge the new repo into on the monorepo.
                   Default: main

  --remote         The name of the git remote for the monorepo.
                   Default: origin

Other Options:
  --help / -h      Displays this help text.

EOL
}

check_parameter_set()
{
    if [ -z "$2" ]; then
        echo "$1 must be set"
        echo ""
        print_help
        exit -1
    fi
}

UPSTREAM=""
PROJECT=""
SOURCE_BRANCH=""
TARGET_PATH=""

TARGET_BRANCH="main"
REMOTE="origin"

while [[ $# -gt 0 ]]; do
    case $1 in
        --upstream)
            UPSTREAM="$2"
            shift 2
            ;;
        --project)
            PROJECT="$2"
            shift 2
            ;;
        --target-path)
            TARGET_PATH="$2"
            shift 2
            ;;
        --source-branch)
            SOURCE_BRANCH="$2"
            shift 2
            ;;
        --target-branch)
            TARGET_BRANCH="$2"
            shift 2
            ;;
        --remote)
            REMOTE="$2"
            shift 2
            ;;
        -h|--help)
            print_help
            exit 0
            ;;
        *)
            echo "Unexpected argument $1"
            echo ""
		    print_help
		    exit -1
    esac
done

check_parameter_set "--upstream" "$UPSTREAM"
check_parameter_set "--project" "$PROJECT"
check_parameter_set "--source-branch" "$SOURCE_BRANCH"
check_parameter_set "--target-path" "$TARGET_PATH"

set -x

MONOREPO=$PWD
TEMPDIR=$(mktemp -d)
CHECKOUT="$TEMPDIR/upstream-extension"

# Do a full checkout of the Adblock repo to a temp location. This means we only
# pull once.

git clone --bare "$UPSTREAM" "$CHECKOUT"

# Get the upstream repo's Next branch, and merge it into the right part of the monorepo

git fetch "$CHECKOUT" "refs/heads/$SOURCE_BRANCH"
git checkout -B "$PROJECT-$SOURCE_BRANCH" FETCH_HEAD

mkdir -p "$TARGET_PATH"

shopt -s dotglob
git mv -k * "$TARGET_PATH/"

git commit -m "refactor: Move $PROJECT to its new home for importing into the monorepo"
git checkout -B "$TARGET_BRANCH" "$REMOTE/$TARGET_BRANCH"

git merge --allow-unrelated-histories --no-commit "$PROJECT-$SOURCE_BRANCH"

# Go get all the tags

pushd "$CHECKOUT"
git tag | while read TAG; do
    NEW_TAG="$PROJECT-${TAG}"

    pushd "$MONOREPO"
    git fetch "$CHECKOUT" "refs/tags/$TAG"
    git tag -f "$NEW_TAG" FETCH_HEAD
    popd
done
popd

# Cleanup

rm -rf $TEMPDIR
