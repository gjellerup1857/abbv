FROM registry.gitlab.com/eyeo/docker/get-browser-binary:node18

# Doing early `npm install` to cache those files on further image builds If this
# fails saying that the package-lock.json is out of sync, it could mean that a
# new package.json was added which isn't copied here.
# COPY *.json .npmrc extensions/
# COPY host/adblock/*.json extensions/host/adblock/
# COPY host/adblockplus/*.json extensions/host/adblockplus/
# COPY ui-components/*.json extensions/ui-components/
# COPY webext-ad-filtering-solution/*.json extensions/webext-ad-filtering-solution/
# RUN cd extensions && npm ci

COPY . extensions/
WORKDIR extensions/
RUN npm ci

ENV MANIFEST_VERSION=3
ENV BROWSER=chromium
ENTRYPOINT npm run test:end-to-end -- --scope=adblock -- $BROWSER $MANIFEST_VERSION
