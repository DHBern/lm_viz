FROM node:14-alpine as production

RUN mkdir /home/node/app/ && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY --chown=node:node node-app/package*.json ./

USER node

RUN npm install

USER root

COPY --chown=node:node node-app/index.js ./index.js

COPY --chown=node:node frontend/public/ ./public

USER node

CMD [ "node", "index.js"]