FROM mcr.microsoft.com/playwright:v1.61.1-noble

ENV PATH=/opt/corepack/bin:$PATH
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN mkdir -p /opt/corepack/bin \
  && corepack enable --install-directory /opt/corepack/bin

WORKDIR /app
