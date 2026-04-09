# ==================== JVM Tuned Dockerfile ====================
# JVM Tuning: -Xms384m -Xmx384m (discovery-service)
# GC: ZGC - low latency garbage collector for minimal pause times
# Total Container: 512MB (384m heap + ~128m native/Metaspace)

FROM eclipse-temurin:21-jdk AS builder
ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} app.jar
RUN java -Djarmode=layertools -jar app.jar extract

FROM eclipse-temurin:21-jre

WORKDIR /app

# Create non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Copy layers from builder
COPY --from=builder /app/dependencies/ ./
COPY --from=builder /app/spring-boot-loader/ ./
COPY --from=builder /app/snapshot-dependencies/ ./
COPY --from=builder /app/application/ ./

# JVM Tuning Environment Variables
ENV JAVA_OPTS="\
  -Xms384m \
  -Xmx384m \
  -XX:+UseZGC \
  -XX:MaxGCPauseMillis=100 \
  -XX:+HeapDumpOnOutOfMemoryError \
  -XX:HeapDumpPath=/var/log/heapdump.hprof \
  -Djava.security.egd=file:/dev/./urandom \
  -Dspring.backgroundpreinitializer.ignore=true"

# Set container memory limit (should match -Xmx for best performance)
ENV CONTAINER_MAX_MEMORY="512m"

# Logging
RUN mkdir -p /var/log && chown -R appuser:appgroup /var/log

USER appuser

EXPOSE 8761

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8761/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS} org.springframework.boot.loader.launch.JarLauncher"]
