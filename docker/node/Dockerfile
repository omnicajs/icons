FROM node:24

USER node

ENV PATH=/home/node/.local/bin:$PATH
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN mkdir -p /home/node/.local/bin \
  && corepack enable --install-directory /home/node/.local/bin

WORKDIR /app
