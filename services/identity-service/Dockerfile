# ==================== JVM Tuned Dockerfile ====================
# JVM Tuning: -Xms512m -Xmx1024m (identity-service - heavy: JWT, OAuth2, WebAuthn, Mail, Thymeleaf)
# GC: ZGC - tối ưu cho các tác vụ authentication nặng
# Total Container: 1.5GB

FROM eclipse-temurin:21-jdk AS builder

WORKDIR /app

# Install Maven
RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*

# Copy parent POM and install it first
COPY pom.xml /root/pom.xml
RUN mvn install:install-file \
    -Dfile=/root/pom.xml \
    -DgroupId=com.codespark \
    -DartifactId=code_spark \
    -Dversion=1.0.0-SNAPSHOT \
    -Dpackaging=pom

# Build common-library first (required dependency)
COPY services/common-library/pom.xml /app/common-library/pom.xml
COPY services/common-library/src /app/common-library/src
WORKDIR /app/common-library
RUN mvn clean install -DskipTests

# Now build identity-service
WORKDIR /app
COPY services/identity-service/.mvn/ .mvn/
COPY services/identity-service/mvnw ./mvnw
COPY services/identity-service/pom.xml ./pom.xml

# Fix line endings and make mvnw executable
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw

# Copy source code
COPY services/identity-service/src/ src/

# Build the application with retry on network errors
RUN ./mvnw clean package -DskipTests || \
    (echo "Build failed, retrying..." && sleep 5 && ./mvnw clean package -DskipTests)

# Extract layers
RUN java -Djarmode=layertools -jar target/*.jar extract || \
    java -Djarmode=layertools -jar target/identity-service-*.jar extract

# Create final image
FROM eclipse-temurin:21-jre

WORKDIR /app

# Create non-root user (check if UID exists first)
RUN if ! id -u 1000 >/dev/null 2>&1; then \
        useradd -r -u 1000 -g root identity-user; \
    else \
        useradd -r -g root identity-user; \
    fi

# Copy layers
COPY --from=builder /app/dependencies/ ./
COPY --from=builder /app/spring-boot-loader/ ./
COPY --from=builder /app/snapshot-dependencies/ ./
COPY --from=builder /app/application/ ./

# JVM Tuning for Identity Service
# -Xms512m -Xmx1024m: Heap lớn vì service xử lý nhiều JWT tokens, sessions, OAuth2
# WebAuthn sử dụng reflection nhiều -> cần headroom
ENV JAVA_OPTS="\
  -Xms512m \
  -Xmx1024m \
  -XX:+UseZGC \
  -XX:MaxGCPauseMillis=100 \
  -XX:+HeapDumpOnOutOfMemoryError \
  -XX:HeapDumpPath=/var/log/heapdump.hprof \
  -Djava.security.egd=file:/dev/./urandom \
  -Dspring.session.store-type=redis \
  -Dspring.data.redis.timeout=5000"

ENV CONTAINER_MAX_MEMORY="1536m"

RUN mkdir -p /var/log && chown -R identity-user:root /var/log

USER identity-user

EXPOSE 9000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=45s --retries=3 \
  CMD curl -f http://localhost:9000/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS} org.springframework.boot.loader.launch.JarLauncher"]
