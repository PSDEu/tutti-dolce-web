package es.tuttidolce.api;

import java.time.Clock;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/** API de Tutti Dolce: pedidos, galería, membresía, borradores para redes. */
@SpringBootApplication
@ConfigurationPropertiesScan
@EnableAsync
@EnableScheduling
@EnableJpaRepositories(considerNestedRepositories = true)
public class TuttiDolceApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(TuttiDolceApiApplication.class, args);
    }

    /** Reloj inyectable: en los tests se puede fijar el día (p. ej. para probar los cumpleaños). */
    @Bean
    Clock reloj() {
        return Clock.systemUTC();
    }
}
