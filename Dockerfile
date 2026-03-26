FROM mcr.microsoft.com/playwright:v1.58.2-noble

WORKDIR /qa

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN mkdir -p test-results/checkpoints test-results/report test-results/artifacts test-results/diffs .auth .cache \
    && chmod -R 777 test-results .auth .cache

ENTRYPOINT ["npx", "playwright", "test"]
CMD ["--grep-invert", "perf:"]
