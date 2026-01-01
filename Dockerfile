FROM node:20-alpine AS build
WORKDIR /app
RUN npm install -g bun
COPY package.json bun.lockb ./
RUN bun install
COPY . .
RUN bun run build
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Ensure favicon is available at /logo.jpg in the final image
COPY src/assets/logo.jpg /usr/share/nginx/html/logo.jpg
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
