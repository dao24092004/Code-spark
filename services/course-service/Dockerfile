# ==================== JVM Tuned Dockerfile ====================
# JVM Tuning: -Xms512m -Xmx1024m (course-service - AI, S3, Rate Limiting)
# GC: ZGC - tối ưu cho AI/ML workloads với Spring AI
# Total Container: 1.5GB

FROM eclipse-temurin:21-jdk
ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} app.jar

# JVM Tuning for Course Service
# Spring AI sử dụng nhiều memory cho model inference缓存
# S3 operations có thể buffer large files
ENV JAVA_OPTS="\
  -Xms512m \
  -Xmx1024m \
  -XX:+UseZGC \
  -XX:MaxGCPauseMillis=100 \
  -XX:+HeapDumpOnOutOfMemoryError \
  -XX:HeapDumpPath=/var/log/heapdump.hprof \
  -Djava.security.egd=file:/dev/./urandom \
  -Dspring.ai.openai.timeout=60s \
  -Dspring.jpa.open-in-view=false"

ENV CONTAINER_MAX_MEMORY="1536m"

RUN mkdir -p /var/log

EXPOSE 9004

HEALTHCHECK --interval=30s --timeout=3s --start-period=45s --retries=3 \
  CMD curl -f http://localhost:9004/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS} -jar /app.jar"]
