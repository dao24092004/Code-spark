FROM openjdk:21-jdk-slim

WORKDIR /app

# Copy Maven wrapper and pom.xml
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Download dependencies
RUN ./mvnw dependency:resolve

# Copy source code
COPY src/ src/

# Build the application
RUN ./mvnw clean package -DskipTests

# Create final image
FROM openjdk:21-slim

WORKDIR /app

# Copy the jar file
COPY --from=0 /app/target/*.jar app.jar

# Create non-root user
RUN useradd -r -u 1000 -g root identity-user
USER identity-user

# Expose port
EXPOSE 9000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:9000/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
