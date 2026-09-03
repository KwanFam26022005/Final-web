FROM php:8.3-cli-alpine

# Install system dependencies and build libraries for PHP extensions
RUN apk add --no-cache \
    curl \
    libzip-dev \
    oniguruma-dev \
    linux-headers \
    mysql-client \
    && docker-php-ext-install pdo_mysql mbstring pcntl bcmath

# Install Composer from official image
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy composer manifests first for layer caching
COPY composer.json composer.lock ./

# Install production dependencies without dev packages
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --no-scripts

# Copy application source code
COPY . .

# Run composer autoload optimization and package discovery
RUN composer dump-autoload --optimize --no-dev \
    && php artisan package:discover --ansi

# Setup storage directory permissions
RUN mkdir -p storage/framework/cache/data \
             storage/framework/sessions \
             storage/framework/views \
             storage/logs \
             bootstrap/cache \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 8000

# Healthcheck probing /api/health
HEALTHCHECK --interval=5s --timeout=5s --start-period=10s --retries=10 \
    CMD php -r "file_get_contents('http://127.0.0.1:8000/api/health') ?: exit(1);"

# Run migration infrastructure check followed by artisan serve
CMD ["sh", "-c", "php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=8000"]
