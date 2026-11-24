# Imagen de la API: se compila con Maven y se ejecuta con un JRE 25 ligero.
FROM eclipse-temurin:25-jdk AS compilacion
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN ./mvnw -q dependency:go-offline
COPY src src
RUN ./mvnw -q -DskipTests package && cp target/*.jar api.jar

FROM eclipse-temurin:25-jre
WORKDIR /app
RUN useradd --system tutti
USER tutti
COPY --from=compilacion /app/api.jar api.jar
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "api.jar"]
