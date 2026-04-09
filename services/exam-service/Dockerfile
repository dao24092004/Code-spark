# ==================== JVM Tuned Dockerfile ====================
# JVM Tuning: -Xms768m -Xmx1536m (exam-service - heaviest: JPA, Kafka, AI, POI)
# GC: ZGC - tối ưu cho các tác vụ nặng (AI scoring, Excel processing)
# Total Container: 2GB

# ======================
# Stage 1: Build
# ======================
FROM maven:3.9.9-eclipse-temurin-21 AS builder
WORKDIR /app

# Copy source code
COPY . .

# Build project with Maven JVM tuning
RUN mvn clean install -DskipTests \
    -Dmaven.jvm.args="-Xmx1024m"

# Extract layers
RUN java -Djarmode=layertools -jar services/exam-service/target/*.jar extract || \
    java -Djarmode=layertools -jar services/exam-service/target/exam-service-*.jar extract

# ======================
# Stage 2: Runtime
# ======================
FROM eclipse-temurin:21-jre

WORKDIR /app

RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Copy layers from builder
COPY --from=builder /app/dependencies/ ./
COPY --from=builder /app/spring-boot-loader/ ./
COPY --from=builder /app/snapshot-dependencies/ ./
COPY --from=builder /app/application/ ./

# JVM Tuning for Exam Service (HEAVIEST service)
# - Apache POI for Excel processing: cần buffer lớn
# - Spring AI for essay scoring: model inference
# - Kafka consumers: batch processing
ENV JAVA_OPTS="\
  -Xms768m \
  -Xmx1536m \
  -XX:+UseZGC \
  -XX:MaxGCPauseMillis=200 \
  -XX:+HeapDumpOnOutOfMemoryError \
  -XX:HeapDumpPath=/var/log/heapdump.hprof \
  -Djava.security.egd=file:/dev/./urandom \
  -Dspring.kafka.consumer.max-poll-records=100 \
  -Dspring.ai.openai.timeout=120s \
  -Dspring.jpa.open-in-view=false"

ENV CONTAINER_MAX_MEMORY="2048m"

RUN mkdir -p /var/log && chown -R appuser:appgroup /var/log

USER appuser

EXPOSE 9003

HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:9003/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS} org.springframework.boot.loader.launch.JarLauncher"]
