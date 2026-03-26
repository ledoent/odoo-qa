FROM mcr.microsoft.com/playwright:v1.58.2-noble

WORKDIR /qa

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN chmod +x docker-entrypoint.sh

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["--grep-invert", "perf:"]
