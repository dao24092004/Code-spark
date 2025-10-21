# Builder stage
FROM maven:3.9.6-eclipse-temurin-21 AS builder
WORKDIR /app
COPY . .
RUN mvn clean install -DskipTests

# Final stage
FROM openjdk:21-jdk-slim
WORKDIR /app
COPY --from=builder /app/services/exam-service/target/*.jar app.jar
ENTRYPOINT ["java","-jar","app.jar"]