FROM registry.gitlab.com/eyeo/docker/get-browser-binary:node18

# Doing early `npm install` to cache those files on further image builds If this
# fails saying that the package-lock.json is out of sync, it could mean that a
# new package.json was added which isn't copied here.
COPY *.json .npmrc extensions/
COPY host/adblock/*.json extensions/host/adblock/
COPY host/adblockplus/*.json extensions/host/adblockplus/
COPY ui-components/*.json extensions/ui-components/
COPY test-utils/*.json extensions/test-utils/
RUN cd extensions && npm ci

COPY . extensions/
WORKDIR /extensions/

ENV MANIFEST_VERSION=3
ENV BROWSER=chromium
ENTRYPOINT npm run --workspace host/adblockplus test:end-to-end-selenium
