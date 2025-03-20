FROM amazoncorretto:11-alpine

# Set working directory
WORKDIR /app

# Copy the JAR file
COPY build/libs/report-generator.jar /app/report-generator.jar

# Set entry point
ENTRYPOINT ["java", "-jar", "/app/report-generator.jar"]