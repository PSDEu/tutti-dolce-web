package es.tuttidolce.api.notificaciones;

import es.tuttidolce.api.config.TuttiDolceProperties;
import java.time.Instant;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Envía eventos a n8n (automatizaciones). Todos los eventos van al mismo webhook con la forma
 * `{ "evento": "...", "fecha": "...", "datos": {...} }` y n8n decide qué hacer con cada uno.
 *
 * Eventos: pedido.creado · pedido.estado · diseno.compartible · miembro.confirmado · borrador.aprobado
 */
@Service
public class EventosN8n {

    private static final Logger log = LoggerFactory.getLogger(EventosN8n.class);

    private final TuttiDolceProperties.N8n config;
    private final RestClient http;

    public EventosN8n(TuttiDolceProperties propiedades) {
        this.config = propiedades.n8n();
        this.http = RestClient.create();
    }

    @Async
    public void publicar(String evento, Map<String, ?> datos) {
        if (!config.activo()) {
            log.debug("[n8n desactivado] {} {}", evento, datos.keySet());
            return;
        }
        try {
            http.post()
                    .uri(config.webhookUrl())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("evento", evento, "fecha", Instant.now().toString(), "datos", datos))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            log.warn("n8n no recibió el evento {}: {}", evento, e.getMessage());
        }
    }
}
