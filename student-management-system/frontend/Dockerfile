# ──────────────────────────────────────────────────────────────
# Frontend Dockerfile  (Nginx static file server + API proxy)
# ──────────────────────────────────────────────────────────────
#
# HOW IT WORKS:
#   1. Start from the official lightweight Nginx image.
#   2. Copy our HTML / CSS / JS files into Nginx's web root.
#   3. Replace Nginx's default config with our custom one that
#      also proxies /api/* requests to the backend container.
#
# The result: one container that both serves the UI AND routes
# API calls to the right place — just like a real production setup.
# ──────────────────────────────────────────────────────────────

FROM nginx:stable-alpine

# Remove the default Nginx welcome page config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom Nginx config (handles static files + API proxy)
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copy all frontend static files into Nginx's web-serving directory
COPY index.html      /usr/share/nginx/html/index.html
COPY css/            /usr/share/nginx/html/css/
COPY js/             /usr/share/nginx/html/js/

# Nginx listens on port 80 by default
EXPOSE 80

# Start Nginx in the foreground (required for Docker containers)
CMD ["nginx", "-g", "daemon off;"]
