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

# Runtime stage
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy the jar file from builder
COPY --from=builder /app/target/analytics-service-*.jar app.jar

EXPOSE 9004

ENTRYPOINT ["java", "-jar", "app.jar"]
