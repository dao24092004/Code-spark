# ======================
# Stage 1: Build
# ======================
FROM maven:3.9.9-eclipse-temurin-21 AS builder
WORKDIR /app

# Copy source code
COPY . .

# Build project (skip tests for speed)
RUN mvn clean install -DskipTests

# ======================
# Stage 2: Runtime
# ======================
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy only the built jar from the builder stage
COPY --from=builder /app/services/exam-service/target/*.jar app.jar

# Expose the application port
EXPOSE 9003

# Run the Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
