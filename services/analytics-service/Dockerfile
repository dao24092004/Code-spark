# ==================== JVM Tuned Dockerfile ====================
# JVM Tuning: -Xms512m -Xmx768m (analytics-service - JPA, Kafka, Security)
# GC: ZGC - tối ưu cho data processing và analytics
# Total Container: 1GB

# Multi-stage build for analytics-service with common-library dependency

# Stage 1: Build common-library and analytics-service
FROM eclipse-temurin:21-jdk AS builder

WORKDIR /app

# Install Maven
RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*

# Copy and build common-library first
COPY common-library/pom.xml /app/common-library/pom.xml
COPY common-library/src /app/common-library/src
WORKDIR /app/common-library
RUN mvn clean install -DskipTests

# Now build analytics-service
WORKDIR /app
COPY analytics-service/pom.xml pom.xml
COPY analytics-service/src src
RUN mvn clean package -DskipTests

# Extract layers
RUN java -Djarmode=layertools -jar target/*.jar extract || \
    java -Djarmode=layertools -jar target/analytics-service-*.jar extract

# Runtime stage
FROM eclipse-temurin:21-jre

WORKDIR /app

RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Copy the jar file from builder
COPY --from=builder /app/dependencies/ ./
COPY --from=builder /app/spring-boot-loader/ ./
COPY --from=builder /app/snapshot-dependencies/ ./
COPY --from=builder /app/application/ ./

# JVM Tuning for Analytics Service
# Kafka consumers có thể buffer messages
# JPA queries có thể tạo large result sets
ENV JAVA_OPTS="\
  -Xms512m \
  -Xmx768m \
  -XX:+UseZGC \
  -XX:MaxGCPauseMillis=100 \
  -XX:+HeapDumpOnOutOfMemoryError \
  -XX:HeapDumpPath=/var/log/heapdump.hprof \
  -Djava.security.egd=file:/dev/./urandom \
  -Dspring.kafka.consumer.max-poll-records=200"

ENV CONTAINER_MAX_MEMORY="1024m"

RUN mkdir -p /var/log && chown -R appuser:appgroup /var/log

USER appuser

EXPOSE 9007

HEALTHCHECK --interval=30s --timeout=3s --start-period=45s --retries=3 \
  CMD curl -f http://localhost:9007/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS} org.springframework.boot.loader.launch.JarLauncher"]
