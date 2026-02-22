# Build stage
FROM hexpm/elixir:1.19.4-erlang-27.3.4.6-alpine-3.22.2 AS build

# Install build dependencies
RUN apk add --no-cache build-base git

# Set environment variables
ENV MIX_ENV=prod

# Create app directory
WORKDIR /app

# Install hex and rebar
RUN mix local.hex --force && \
    mix local.rebar --force

# Copy mix files
COPY mix.exs mix.lock ./
COPY config config

# Install and compile dependencies
RUN mix deps.get --only $MIX_ENV && \
    mix deps.compile

# Copy source code
COPY lib lib
COPY priv priv

# Compile the application
RUN mix compile

# Build release
RUN mix release

# Runtime stage
FROM alpine:3.22.2 AS runtime

# Install runtime dependencies
RUN apk add --no-cache openssl ncurses-libs libstdc++

# Set environment variables
ENV MIX_ENV=prod

# Create app user
RUN addgroup -S app && adduser -S app -G app

# Create app directory
WORKDIR /app

# Copy release from build stage
COPY --from=build /app/_build/prod/rel/ecredit ./

COPY docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
RUN chown -R app:app /app /entrypoint.sh

# Change ownership
RUN chown -R app:app /app

# Switch to app user
USER app

# Expose port
EXPOSE 4000

# Set entrypoint
ENTRYPOINT [ "/entrypoint.sh" ]
