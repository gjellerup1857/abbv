FROM registry.gitlab.com/eyeo/docker/get-browser-binary:node18

ARG SKIP_BUILD=
ARG BROWSER=
# Caching npm install
# COPY package*.json webext-sdk/
# RUN cd webext-sdk/ && npm install

COPY . extensions/
WORKDIR extensions/
RUN npm ci

RUN if [ -z "$SKIP_BUILD" ]; then npm run build; fi
RUN if [ ! -z "$BROWSER" ]; then node webext-ad-filtering-solution/test/dockerfiles/get-browser-binaries.js $BROWSER; fi

ENV TEST_PARAMS="3 chromium"
ENV ONLY_FLAKY="false"
ENV TEST_RUNS=1
ENTRYPOINT webext-ad-filtering-solution/test/dockerfiles/functional-entrypoint.sh
