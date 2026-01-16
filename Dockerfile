FROM ubuntu:22.04 AS feaston-front

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y curl ca-certificates bash && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /front

COPY front/package*.json ./
RUN npm install

COPY front/ .
RUN npm run build


FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y curl ca-certificates bash && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /back

COPY back/package*.json ./
RUN npm install --production

COPY back/ .

COPY --from=feaston-front /front/dist ./public

EXPOSE 3000

CMD ["node", "server.js"]

