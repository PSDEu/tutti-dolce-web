package es.tuttidolce.api.notificaciones;

import es.tuttidolce.api.pedidos.PedidoDtos.LineaFicha;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import org.springframework.web.util.HtmlUtils;

/** Plantillas HTML de los emails, con la paleta de la marca. Todo el texto del usuario se escapa. */
public final class Plantillas {

    private static final DateTimeFormatter FECHA =
            DateTimeFormatter.ofPattern("EEEE d 'de' MMMM", Locale.forLanguageTag("es-ES"));

    private Plantillas() {}

    public static String e(String texto) {
        return texto == null ? "" : HtmlUtils.htmlEscape(texto);
    }

    public static String fecha(LocalDate f) {
        return f.format(FECHA);
    }

    public static String boton(String texto, String url) {
        return "<p style=\"margin:28px 0\"><a href=\"" + e(url) + "\" style=\"background:#8E5E56;color:#fff;"
                + "padding:12px 26px;border-radius:999px;text-decoration:none;font-weight:bold\">" + e(texto) + "</a></p>";
    }

    public static String ficha(List<LineaFicha> lineas) {
        StringBuilder sb = new StringBuilder("<table style=\"border-collapse:collapse;width:100%;font-size:14px\">");
        for (LineaFicha l : lineas) {
            sb.append("<tr><td style=\"padding:4px 12px 4px 0;color:#5F6652;font-weight:bold;vertical-align:top\">")
                    .append(e(l.etiqueta()))
                    .append("</td><td style=\"padding:4px 0\">")
                    .append(e(l.valor()))
                    .append("</td></tr>");
        }
        return sb.append("</table>").toString();
    }

    /** Envoltorio común: cabecera con el nombre de la marca y pie con el enlace de baja (si lo hay). */
    public static String marco(String titulo, String cuerpoHtml, String enlaceBaja) {
        String pie = enlaceBaja == null
                ? ""
                : "<p style=\"font-size:12px;color:#8E5E56\">¿No quieres recibir más emails? "
                        + "<a href=\"" + e(enlaceBaja) + "\" style=\"color:#8E5E56\">Darme de baja</a></p>";
        return """
                <!doctype html><html lang="es"><body style="margin:0;background:#FBF7F4;font-family:Segoe UI,Arial,sans-serif;color:#3E3A38">
                <div style="max-width:600px;margin:0 auto;padding:32px 24px">
                  <p style="font-family:Georgia,serif;font-size:28px;margin:0 0 24px">
                    <span style="color:#A0A18F">tutti</span> <span style="color:#CEA59D">dolce</span></p>
                  <div style="background:#fff;border-radius:14px;padding:28px">
                    <h1 style="font-family:Georgia,serif;color:#5F6652;font-size:24px;margin-top:0">%s</h1>
                    %s
                  </div>
                  <p style="font-size:12px;color:#8E5E56;margin-top:24px">Tutti Dolce Pastelería</p>
                  %s
                </div></body></html>
                """.formatted(e(titulo), cuerpoHtml, pie);
    }
}
