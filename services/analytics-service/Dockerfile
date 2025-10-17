FROM openjdk:21-jdk-slim

WORKDIR /app

COPY target/analytics-service-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 9008

ENTRYPOINT ["java", "-jar", "app.jar"]