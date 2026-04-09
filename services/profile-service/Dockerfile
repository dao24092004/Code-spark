# ==================== JVM Tuned Dockerfile ====================
# JVM Tuning: -Xms512m -Xmx768m (profile-service - JPA, Redis, Feign)
# GC: ZGC - tối ưu cho microservices với database operations
# Total Container: 1GB

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

# Now build profile-service
WORKDIR /app
COPY services/profile-service/.mvn/ .mvn/
COPY services/profile-service/mvnw ./mvnw
COPY services/profile-service/pom.xml ./pom.xml

# Fix line endings and make mvnw executable
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw

# Download dependencies first (cached layer)
RUN ./mvnw dependency:go-offline || \
    (echo "Dependency download failed, retrying..." && sleep 5 && ./mvnw dependency:go-offline)

# Copy source code
COPY services/profile-service/src/ src/

# Build the application with retry on network errors
RUN ./mvnw clean package -DskipTests || \
    (echo "Build failed, retrying..." && sleep 5 && ./mvnw clean package -DskipTests)

# Extract layers
RUN java -Djarmode=layertools -jar target/*.jar extract || \
    java -Djarmode=layertools -jar target/profile-service-*.jar extract

# Create final image
FROM eclipse-temurin:21-jre

WORKDIR /app

# Create non-root user (check if UID exists first)
RUN if ! id -u 1001 >/dev/null 2>&1; then \
        useradd -r -u 1001 -g root profile-user; \
    else \
        useradd -r -g root profile-user; \
    fi

COPY --from=builder /app/dependencies/ ./
COPY --from=builder /app/spring-boot-loader/ ./
COPY --from=builder /app/snapshot-dependencies/ ./
COPY --from=builder /app/application/ ./

# JVM Tuning for Profile Service
ENV JAVA_OPTS="\
  -Xms512m \
  -Xmx768m \
  -XX:+UseZGC \
  -XX:MaxGCPauseMillis=100 \
  -XX:+HeapDumpOnOutOfMemoryError \
  -XX:HeapDumpPath=/var/log/heapdump.hprof \
  -Djava.security.egd=file:/dev/./urandom \
  -Dspring.jpa.open-in-view=false"

ENV CONTAINER_MAX_MEMORY="1024m"

RUN mkdir -p /var/log && chown -R profile-user:root /var/log

USER profile-user

EXPOSE 9002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=45s --retries=3 \
  CMD curl -f http://localhost:9002/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS} org.springframework.boot.loader.launch.JarLauncher"]
