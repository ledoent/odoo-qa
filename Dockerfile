FROM mcr.microsoft.com/playwright:v1.50.0-noble

WORKDIR /qa

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN mkdir -p test-results/checkpoints test-results/report test-results/artifacts .auth .cache

ENTRYPOINT ["npx", "playwright", "test"]
CMD ["--grep-invert", "perf:"]
