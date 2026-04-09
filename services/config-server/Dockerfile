# ==================== JVM Tuned Dockerfile ====================
# JVM Tuning: -Xms384m -Xmx384m (config-server)
# GC: ZGC - low latency garbage collector
# Total Container: 512MB

FROM eclipse-temurin:21-jdk AS builder
ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} app.jar
RUN java -Djarmode=layertools -jar app.jar extract

FROM eclipse-temurin:21-jre

WORKDIR /app

RUN groupadd -r appgroup && useradd -r -g appgroup appuser

COPY --from=builder /app/dependencies/ ./
COPY --from=builder /app/spring-boot-loader/ ./
COPY --from=builder /app/snapshot-dependencies/ ./
COPY --from=builder /app/application/ ./

ENV JAVA_OPTS="\
  -Xms384m \
  -Xmx384m \
  -XX:+UseZGC \
  -XX:MaxGCPauseMillis=100 \
  -XX:+HeapDumpOnOutOfMemoryError \
  -XX:HeapDumpPath=/var/log/heapdump.hprof \
  -Djava.security.egd=file:/dev/./urandom"

ENV CONTAINER_MAX_MEMORY="512m"

RUN mkdir -p /var/log && chown -R appuser:appgroup /var/log

USER appuser

EXPOSE 8888

HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8888/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS} org.springframework.boot.loader.launch.JarLauncher"]
