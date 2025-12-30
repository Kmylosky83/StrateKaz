# ═══════════════════════════════════════════════════
# BACKUP SERVICE DOCKERFILE
# Grasas y Huesos del Norte S.A.S
# ═══════════════════════════════════════════════════

FROM alpine:3.19

# Labels
LABEL maintainer="Grasas y Huesos del Norte S.A.S"
LABEL description="Automated Backup Service"
LABEL version="1.0.0"

# Install required packages
RUN apk add --no-cache \
    bash \
    mysql-client \
    tar \
    gzip \
    dcron \
    tzdata \
    && rm -rf /var/cache/apk/*

# Set timezone
ENV TZ=America/Bogota
RUN cp /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Create backup script
COPY backup.sh /usr/local/bin/backup.sh
RUN chmod +x /usr/local/bin/backup.sh

# Create entrypoint script
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Create backup directory
RUN mkdir -p /backups

WORKDIR /backups

# Run entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
