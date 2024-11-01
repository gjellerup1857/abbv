FROM node:18.17.1

COPY *.json .npmrc extensions/
COPY host/adblock/*.json extensions/host/adblock/
COPY host/adblockplus/*.json extensions/host/adblockplus/
COPY ui-components/*.json extensions/ui-components/
COPY scripts/release-utils/*.json scripts/release-utils/
RUN cd extensions && npm ci --cache /.npm --prefer-offline

COPY . extensions/

RUN git config --global user.email "test" && git config --global user.email "test@eyeo.com" && cd extensions && git add --all && git commit -m "WIP"

RUN git clone extensions checkout && cd checkout && npm ci --cache /.npm --prefer-offline
WORKDIR checkout

ENTRYPOINT npm run -w scripts/release-utils test:end-to-end