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

set -eux

# Do a full checkout of the Adblock repo to a temp location. This means we only
# pull once.

MONOREPO=$PWD
TEMPDIR=$(mktemp -d)
CHECKOUT="$TEMPDIR/upstream-extension"
git clone --bare git@gitlab.com:adblockinc/ext/adblock/adblock.git "$CHECKOUT"

# Get Adblock's Next branch, and merge it into the right part of the monorepo

git fetch "$CHECKOUT" "refs/heads/next"
git checkout -B "adblock-next" FETCH_HEAD

mkdir -p host/adblock

shopt -s dotglob
git mv -k * host/adblock/

git commit -m "refactor: Move Adblock to its new home for importing into the monorepo"
git checkout -B main origin/main

git merge --allow-unrelated-histories --no-commit adblock-next

cat >>.gitlab-ci.yml <<EOL
include:
  - local: 'host/adblock/.gitlab-ci.yml'
    inputs:
      hostpath: "host/adblock"
EOL

git add .gitlab-ci.yml
git commit -m "feat: Merge Adblock into the Monorepo"

# Copy over any other important branches

for BRANCH in "main" "release"; do
    git fetch "$CHECKOUT" "refs/heads/$BRANCH"
    git branch -f "adblock-$BRANCH" FETCH_HEAD
done

# Go get all the tags

pushd "$CHECKOUT"
git tag | while read TAG; do
    NEW_TAG="adblock-${TAG}"

    pushd "$MONOREPO"
    git fetch "$CHECKOUT" "refs/tags/$TAG"
    git tag -f "$NEW_TAG" FETCH_HEAD
    popd
done
popd

# Cleanup

rm -rf $TEMPDIR
