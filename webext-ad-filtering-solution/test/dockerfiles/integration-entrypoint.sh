#! /bin/bash

set -xeu

npm install --omit=dev
cd webext-ad-filtering-solution/test/scripts/test-extension
npm install
npm exec subs-init
npm exec subs-merge
npm exec subs-fetch
npm exec subs-convert -- -r
npm exec subs-generate