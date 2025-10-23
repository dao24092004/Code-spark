FROM openjdk:21-jdk-slim

WORKDIR /app

# Copy Maven files
COPY pom.xml .
COPY src ./src

# Install Maven
RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*

# Build the application
RUN mvn clean package -DskipTests

# Copy the jar file
COPY target/analytics-service-*.jar app.jar

EXPOSE 9004

ENTRYPOINT ["java", "-jar", "app.jar"]