# ==================== JVM Tuned Dockerfile ====================
# JVM Tuning: -Xms256m -Xmx384m (notification-service - Kafka, Email)
# GC: ZGC - tối ưu cho message processing
# Total Container: 512MB

FROM eclipse-temurin:21-jdk
ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} app.jar

# JVM Tuning for Notification Service
# Lightweight service - xử lý messages và emails
ENV JAVA_OPTS="\
  -Xms256m \
  -Xmx384m \
  -XX:+UseZGC \
  -XX:MaxGCPauseMillis=100 \
  -XX:+HeapDumpOnOutOfMemoryError \
  -XX:HeapDumpPath=/var/log/heapdump.hprof \
  -Djava.security.egd=file:/dev/./urandom \
  -Dspring.kafka.consumer.max-poll-records=50"

ENV CONTAINER_MAX_MEMORY="512m"

RUN mkdir -p /var/log

EXPOSE 9006

HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:9006/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS} -jar /app.jar"]
