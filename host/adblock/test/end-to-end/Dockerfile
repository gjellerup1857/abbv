FROM registry.gitlab.com/eyeo/docker/get-browser-binary:node18

COPY . extensions/
RUN cd extensions/ && npm ci
WORKDIR extensions/host/adblock/

ENV MANIFEST_VERSION=3
ENV BROWSER=chromium
ENTRYPOINT npm run test:end-to-end $BROWSER $MANIFEST_VERSION
