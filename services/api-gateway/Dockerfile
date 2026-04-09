# ==================== JVM Tuned Dockerfile ====================
# JVM Tuning: -Xms384m -Xmx512m (api-gateway - reactive/Netty)
# GC: ZGC - tối ưu cho reactive workloads
# Total Container: 768MB

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

# JVM Tuning for Reactive/Netty workloads
# -XX:+UseZGC: Low latency GC cho Netty async operations
# Netty allocates direct ByteBuffers, ZGC xử lý tốt hơn
ENV JAVA_OPTS="\
  -Xms384m \
  -Xmx512m \
  -XX:+UseZGC \
  -XX:MaxGCPauseMillis=100 \
  -XX:+HeapDumpOnOutOfMemoryError \
  -XX:HeapDumpPath=/var/log/heapdump.hprof \
  -Djava.security.egd=file:/dev/./urandom \
  -Dnetty.tryReflectionEquals=false \
  -Dio.netty.tryReflectionEquals=false"

ENV CONTAINER_MAX_MEMORY="768m"

RUN mkdir -p /var/log && chown -R appuser:appgroup /var/log

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS} org.springframework.boot.loader.launch.JarLauncher"]
