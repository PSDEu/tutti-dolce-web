package es.tuttidolce.api.miembros;

import es.tuttidolce.api.comun.Codigos;
import es.tuttidolce.api.comun.ErroresApi.DatosInvalidos;
import es.tuttidolce.api.comun.ErroresApi.NoEncontrado;
import es.tuttidolce.api.config.TuttiDolceProperties;
import es.tuttidolce.api.notificaciones.Brevo;
import es.tuttidolce.api.notificaciones.EventosN8n;
import es.tuttidolce.api.notificaciones.Plantillas;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.MonthDay;
import java.time.Year;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Membresía: registro con doble opt-in, confirmación, baja y regalo de cumpleaños. */
@Service
public class MiembroService {

    private static final Logger log = LoggerFactory.getLogger(MiembroService.class);

    public record Registro(String nombre, String email, Integer cumpleDia, Integer cumpleMes, boolean aceptaNewsletter, boolean aceptaPrivacidad) {}

    private final MiembroRepository repo;
    private final Brevo brevo;
    private final EventosN8n n8n;
    private final TuttiDolceProperties propiedades;
    private final Clock reloj;

    public MiembroService(MiembroRepository repo, Brevo brevo, EventosN8n n8n, TuttiDolceProperties propiedades, Clock reloj) {
        this.repo = repo;
        this.brevo = brevo;
        this.n8n = n8n;
        this.propiedades = propiedades;
        this.reloj = reloj;
    }

    /**
     * Registro. Si el email ya existe y está confirmado no se revela (respuesta igual) para no
     * permitir averiguar quién es miembro; solo se reenvía el email de confirmación si hace falta.
     */
    @Transactional
    public void registrar(Registro r) {
        if (!r.aceptaPrivacidad()) {
            throw new DatosInvalidos("Hay que aceptar la política de privacidad.");
        }
        validarCumple(r.cumpleDia(), r.cumpleMes());
        String email = r.email().trim().toLowerCase();
        Instant ahora = reloj.instant();
        Miembro m = repo.findByEmail(email).orElseGet(() -> new Miembro(email));
        if (m.getEstado() == Miembro.Estado.CONFIRMADO) {
            log.info("Registro repetido de un miembro ya confirmado (no se hace nada)");
            return;
        }
        m.setNombre(r.nombre().trim());
        m.setCumple(r.cumpleDia() == null ? null : r.cumpleDia().shortValue(), r.cumpleMes() == null ? null : r.cumpleMes().shortValue());
        m.setAceptaNewsletter(r.aceptaNewsletter(), ahora);
        m.setPrivacidadFecha(ahora);
        m.setEstado(Miembro.Estado.PENDIENTE);
        String token = m.nuevoTokenConfirmacion(ahora);
        repo.save(m);

        String enlace = propiedades.webUrl() + "/membresia/confirmar?token=" + token;
        brevo.enviar(new Brevo.Correo(
                m.getEmail(),
                m.getNombre(),
                "Confirma tu suscripción a Tutti Dolce",
                Plantillas.marco(
                        "Hola, " + m.getNombre(),
                        "<p>Para terminar de unirte a Tutti Dolce, confirma que este email es tuyo.</p>"
                                + Plantillas.boton("Confirmar mi email", enlace)
                                + "<p style=\"font-size:13px\">El enlace caduca en 48 horas. Si no te has registrado tú, ignora este mensaje.</p>",
                        null),
                null));
    }

    @Transactional
    public void confirmar(String token) {
        Instant ahora = reloj.instant();
        Miembro m = repo.findByTokenConfirmacion(token)
                .filter(x -> x.getTokenConfirmacionCaduca() != null && x.getTokenConfirmacionCaduca().isAfter(ahora))
                .orElseThrow(() -> new NoEncontrado("Enlace no válido o caducado."));
        m.confirmar(ahora);
        if (m.isAceptaNewsletter()) {
            brevo.altaNewsletter(m.getEmail(), m.getNombre());
        }
        brevo.enviar(new Brevo.Correo(
                m.getEmail(),
                m.getNombre(),
                "¡Bienvenida a Tutti Dolce!",
                Plantillas.marco(
                        "¡Ya eres de la familia!",
                        "<p>Gracias por unirte. Ya puedes diseñar tu torta en 3D y seguir tus pedidos.</p>"
                                + (m.getCumpleMes() != null && m.isAceptaNewsletter()
                                        ? "<p>Y el día de tu cumpleaños te llegará un regalo. 🎂</p>"
                                        : "")
                                + Plantillas.boton("Diseñar mi torta", propiedades.webUrl() + "/configurador"),
                        enlaceBaja(m)),
                enlaceBaja(m)));
        n8n.publicar("miembro.confirmado", Map.of("newsletter", m.isAceptaNewsletter()));
    }

    @Transactional
    public void darDeBaja(String token) {
        Miembro m = repo.findByTokenBaja(token).orElseThrow(() -> new NoEncontrado("Suscripción no encontrada."));
        m.darDeBaja();
        brevo.bajaNewsletter(m.getEmail());
    }

    /**
     * Envía el regalo de cumpleaños a quien cumple hoy (una vez al año).
     * Quien nació el 29 de febrero lo recibe el 28 en los años no bisiestos.
     */
    @Transactional
    public int enviarRegalosDeCumpleanos() {
        ZoneId zona = ZoneId.of(propiedades.zonaHoraria());
        LocalDate hoy = LocalDate.now(reloj.withZone(zona));
        List<Short> dias = new ArrayList<>(List.of((short) hoy.getDayOfMonth()));
        if (MonthDay.from(hoy).equals(MonthDay.of(2, 28)) && !Year.isLeap(hoy.getYear())) {
            dias.add((short) 29);
        }
        int enviados = 0;
        for (Miembro m : repo.cumplenAnios((short) hoy.getMonthValue(), dias)) {
            if (m.getUltimoRegaloAnio() != null && m.getUltimoRegaloAnio() == hoy.getYear()) {
                continue;
            }
            String codigo = "CUMPLE-" + Codigos.corto(6);
            brevo.enviar(new Brevo.Correo(
                    m.getEmail(),
                    m.getNombre(),
                    "¡Feliz cumpleaños, " + m.getNombre() + "! Tienes un regalo",
                    Plantillas.marco(
                            "¡Feliz cumpleaños!",
                            "<p>En Tutti Dolce queremos celebrarlo contigo: tienes un <strong>"
                                    + propiedades.cumpleanos().descuento() + "% de descuento</strong> en tu próxima torta "
                                    + "durante los próximos 30 días.</p>"
                                    + "<p style=\"font-size:22px;letter-spacing:.1em\"><strong>" + codigo + "</strong></p>"
                                    + "<p>Indica el código en las notas de tu pedido.</p>"
                                    + Plantillas.boton("Diseñar mi torta", propiedades.webUrl() + "/configurador"),
                            enlaceBaja(m)),
                    enlaceBaja(m)));
            m.setUltimoRegaloAnio(hoy.getYear());
            enviados++;
        }
        return enviados;
    }

    private String enlaceBaja(Miembro m) {
        return propiedades.webUrl() + "/membresia/baja?token=" + m.getTokenBaja();
    }

    private static void validarCumple(Integer dia, Integer mes) {
        if (dia == null && mes == null) return;
        if (dia == null || mes == null || mes < 1 || mes > 12 || dia < 1 || dia > MonthDay.of(mes, 1).getMonth().maxLength()) {
            throw new DatosInvalidos("El cumpleaños no es válido: indica día y mes, o ninguno.");
        }
    }
}
