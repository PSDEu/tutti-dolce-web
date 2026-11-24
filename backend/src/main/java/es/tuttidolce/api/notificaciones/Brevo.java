package es.tuttidolce.api.notificaciones;

import es.tuttidolce.api.config.TuttiDolceProperties;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Envío de emails y gestión de la lista de newsletter con Brevo (API v3).
 *
 * Sin `BREVO_API_KEY` no se llama a Brevo: los emails se escriben en el log, para poder
 * desarrollar y probar sin enviar nada real.
 */
@Service
public class Brevo {

    private static final Logger log = LoggerFactory.getLogger(Brevo.class);

    public record Correo(String para, String nombre, String asunto, String html, String enlaceBaja) {}

    private final TuttiDolceProperties.Brevo config;
    private final RestClient http;

    public Brevo(TuttiDolceProperties propiedades) {
        this.config = propiedades.brevo();
        this.http = RestClient.builder()
                .baseUrl("https://api.brevo.com/v3")
                .defaultHeader("api-key", config.apiKey() == null ? "" : config.apiKey())
                .build();
    }

    /** Email transaccional (asíncrono: un fallo de Brevo no rompe el pedido ni el registro). */
    @Async
    public void enviar(Correo c) {
        if (!config.activo()) {
            log.info("[email sin enviar: Brevo no configurado] Para: {} · Asunto: {}\n{}", c.para(), c.asunto(), c.html());
            return;
        }
        Map<String, Object> cuerpo = new HashMap<>();
        cuerpo.put("sender", Map.of("name", config.nombreRemitente(), "email", config.remitente()));
        cuerpo.put("to", List.of(Map.of("email", c.para(), "name", c.nombre() == null ? c.para() : c.nombre())));
        cuerpo.put("subject", c.asunto());
        cuerpo.put("htmlContent", c.html());
        if (c.enlaceBaja() != null) {
            // Permite darse de baja con un clic desde el propio cliente de correo.
            cuerpo.put("headers", Map.of("List-Unsubscribe", "<" + c.enlaceBaja() + ">"));
        }
        try {
            http.post().uri("/smtp/email").contentType(MediaType.APPLICATION_JSON).body(cuerpo).retrieve().toBodilessEntity();
        } catch (RestClientException e) {
            log.error("No se pudo enviar el email '{}' a {}: {}", c.asunto(), c.para(), e.getMessage());
        }
    }

    /** Añade (o actualiza) el contacto en la lista de newsletter. Solo con consentimiento confirmado. */
    @Async
    public void altaNewsletter(String email, String nombre) {
        if (!config.activo() || config.listaNewsletter() <= 0) {
            log.info("[newsletter sin Brevo] Alta de {}", email);
            return;
        }
        Map<String, Object> cuerpo = Map.of(
                "email", email,
                "attributes", Map.of("FIRSTNAME", nombre),
                "listIds", List.of(config.listaNewsletter()),
                "updateEnabled", true);
        try {
            http.post().uri("/contacts").contentType(MediaType.APPLICATION_JSON).body(cuerpo).retrieve().toBodilessEntity();
        } catch (RestClientException e) {
            log.error("No se pudo dar de alta {} en Brevo: {}", email, e.getMessage());
        }
    }

    /** Quita el contacto de la lista de newsletter. */
    @Async
    public void bajaNewsletter(String email) {
        if (!config.activo() || config.listaNewsletter() <= 0) {
            log.info("[newsletter sin Brevo] Baja de {}", email);
            return;
        }
        try {
            http.post()
                    .uri("/contacts/lists/{lista}/contacts/remove", config.listaNewsletter())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("emails", List.of(email)))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            log.error("No se pudo dar de baja {} en Brevo: {}", email, e.getMessage());
        }
    }
}
