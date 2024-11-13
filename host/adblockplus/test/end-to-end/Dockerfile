FROM registry.gitlab.com/eyeo/docker/get-browser-binary:node18

# WebdriverIO can't handle Edge installation on Debian. Running
# get-browser-binary tests as a workaround to install Edge and msedgedriver
RUN git clone https://gitlab.com/eyeo/developer-experience/get-browser-binary.git; \
  cd get-browser-binary; \
  npm install; \
  npm test -- --grep "edge.*latest.*runs";

# Doing early `npm install` to cache those files on further image builds If this
# fails saying that the package-lock.json is out of sync, it could mean that a
# new package.json was added which isn't copied here.
COPY *.json .npmrc extensions/
COPY host/adblock/*.json extensions/host/adblock/
COPY host/adblockplus/*.json extensions/host/adblockplus/
COPY ui-components/*.json extensions/ui-components/
RUN cd extensions && npm ci

COPY . extensions/
WORKDIR /extensions/

# EDGDEDRIVER_PATH is used by `local.conf.js`
RUN echo EDGDEDRIVER_PATH=$(find / -path '*linux64*msedgedriver') >> .env.e2e

ENV SUITE=filterlists
ENV MANIFEST_VERSION=3
ENV BROWSER=chromium
ENTRYPOINT npm run test:end-to-end -- --scope=adblockplus -- $BROWSER $MANIFEST_VERSION $SUITE
