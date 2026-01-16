FROM node:20-alpine AS feaston-front
WORKDIR /front
COPY front/package*.json ./
RUN npm install
COPY front/ .
RUN npm run build

FROM node:20-alpine
WORKDIR /back
COPY back/package*.json ./
RUN npm install --production
COPY back/ .
COPY --from=FeastOn-front /front/dist ./public
CMD ["node", "server.js"]

