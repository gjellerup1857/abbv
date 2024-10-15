FROM registry.gitlab.com/eyeo/docker/get-browser-binary:node18

ARG BROWSER=chrome

# WebdriverIO can't handle Edge installation on Debian. Running
# get-browser-binary tests as a workaround to install Edge and msedgedriver
RUN if [ "$BROWSER" = "edge" ]; then \
  git clone https://gitlab.com/eyeo/developer-experience/get-browser-binary.git; \
  cd get-browser-binary; \
  npm install; \
  npm test -- --grep "edge.*latest.*runs"; \
fi

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

# EDGDEDRIVER_PATH is used by `local-test.conf.js`
RUN if [ "$BROWSER" = "edge" ]; then \
  echo EDGDEDRIVER_PATH=$(find / -path '*linux64*msedgedriver') >> .env.e2e; \
fi

ARG MANIFEST_VERSION=3
ARG BUILD_EXTENSION=true

RUN if [ "$BUILD_EXTENSION" = "true" ]; then \
  browserBuild=$(if [ "$BROWSER" = "edge" ]; then echo "chrome"; else echo $BROWSER; fi); \
  npm run build:release -- --scope=adblockplus -- $browserBuild $MANIFEST_VERSION; \
fi

ENV SUITE=all
ENV MANIFEST_VERSION=$MANIFEST_VERSION
ENV BROWSER=$BROWSER
ENTRYPOINT npm run test:end-to-end -- --scope=adblockplus -- $BROWSER $MANIFEST_VERSION $SUITE
