FROM registry.gitlab.com/eyeo/docker/get-browser-binary:node18

# Doing early `npm install` to cache those files on further image builds
COPY package*.json adblock/
RUN cd adblock/ && npm install --legacy-peer-deps

COPY . adblock/
WORKDIR adblock/
RUN npm install --legacy-peer-deps

ENTRYPOINT test/end-to-end/entrypoint.sh

ENV MANIFEST_VERSION=3
ENV BROWSER=chromium
ENTRYPOINT npm run test:end-to-end
