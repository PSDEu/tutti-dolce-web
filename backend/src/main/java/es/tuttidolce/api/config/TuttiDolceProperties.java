package es.tuttidolce.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Propiedades `tutti.*` de application.yml. */
@ConfigurationProperties(prefix = "tutti")
public record TuttiDolceProperties(
        String webUrl,
        String adminKey,
        String emailPasteleria,
        String zonaHoraria,
        Brevo brevo,
        N8n n8n,
        Cumpleanos cumpleanos) {

    public record Brevo(String apiKey, String remitente, String nombreRemitente, long listaNewsletter) {
        public boolean activo() {
            return apiKey != null && !apiKey.isBlank();
        }
    }

    public record N8n(String webhookUrl) {
        public boolean activo() {
            return webhookUrl != null && !webhookUrl.isBlank();
        }
    }

    public record Cumpleanos(int descuento, String cron) {}
}
