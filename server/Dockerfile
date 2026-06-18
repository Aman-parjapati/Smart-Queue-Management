# ── Stage 1: Build ────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Cache dependencies
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Build the application
COPY src src
RUN ./mvnw package -DskipTests -B

# ── Stage 2: Run ──────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

# Render sets PORT env var; Spring Boot reads server.port
ENTRYPOINT ["java", "-jar", "app.jar"]
