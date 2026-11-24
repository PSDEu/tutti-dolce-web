package es.tuttidolce.api.pedidos;

import es.tuttidolce.api.comun.Codigos;
import es.tuttidolce.api.comun.ErroresApi.Conflicto;
import es.tuttidolce.api.comun.ErroresApi.DatosInvalidos;
import es.tuttidolce.api.comun.ErroresApi.NoEncontrado;
import es.tuttidolce.api.config.TuttiDolceProperties;
import es.tuttidolce.api.disenos.DisenoCompartido;
import es.tuttidolce.api.disenos.DisenoRepository;
import es.tuttidolce.api.notificaciones.Brevo;
import es.tuttidolce.api.notificaciones.EventosN8n;
import es.tuttidolce.api.notificaciones.Plantillas;
import es.tuttidolce.api.pedidos.PedidoDtos.CambioDeEstado;
import es.tuttidolce.api.pedidos.PedidoDtos.LineaFicha;
import es.tuttidolce.api.pedidos.PedidoDtos.LineaHistorial;
import es.tuttidolce.api.pedidos.PedidoDtos.NuevoPedido;
import es.tuttidolce.api.pedidos.PedidoDtos.VistaPedido;
import java.time.Clock;
import java.time.LocalDate;
import java.time.Year;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

/**
 * Pedidos: alta desde la web, consulta del cliente y cambios de estado desde el panel.
 *
 * El precio que llega es orientativo (lo calcula la web con el catálogo); la pastelería
 * fija el precio final al confirmar. Así no hay que duplicar las reglas de precio en Java.
 */
@Service
public class PedidoService {

    private static final String PREFIJO_IMAGEN = "data:image/png;base64,";
    private static final TypeReference<List<LineaFicha>> TIPO_FICHA = new TypeReference<>() {};

    private final PedidoRepository repo;
    private final DisenoRepository disenos;
    private final JsonMapper json;
    private final Brevo brevo;
    private final EventosN8n n8n;
    private final TuttiDolceProperties propiedades;
    private final Clock reloj;

    public PedidoService(
            PedidoRepository repo,
            DisenoRepository disenos,
            JsonMapper json,
            Brevo brevo,
            EventosN8n n8n,
            TuttiDolceProperties propiedades,
            Clock reloj) {
        this.repo = repo;
        this.disenos = disenos;
        this.json = json;
        this.brevo = brevo;
        this.n8n = n8n;
        this.propiedades = propiedades;
        this.reloj = reloj;
    }

    @Transactional
    public VistaPedido crear(NuevoPedido n) {
        LocalDate hoy = LocalDate.now(reloj.withZone(ZoneId.of(propiedades.zonaHoraria())));
        if (!n.fechaEntrega().isAfter(hoy)) {
            throw new DatosInvalidos("La fecha de entrega tiene que ser posterior a hoy.");
        }
        if (n.entrega() == Pedido.Entrega.DOMICILIO && (n.direccion() == null || n.direccion().isBlank())) {
            throw new DatosInvalidos("Falta la dirección de entrega.");
        }
        String imagen = n.imagen();
        if (imagen != null && !imagen.startsWith(PREFIJO_IMAGEN)) {
            imagen = null; // solo aceptamos PNG en data URL
        }

        String codigo = "TD-%d-%05d".formatted(Year.now(reloj).getValue(), repo.siguienteNumero());
        Pedido p = new Pedido(codigo);
        p.setFechaEntrega(n.fechaEntrega());
        p.setEntrega(n.entrega());
        p.setDireccion(n.entrega() == Pedido.Entrega.DOMICILIO ? n.direccion().trim() : null);
        p.setNombre(n.nombre().trim());
        p.setEmail(n.email().trim().toLowerCase());
        p.setTelefono(n.telefono().trim());
        p.setNotas(n.notas() == null || n.notas().isBlank() ? null : n.notas().trim());
        p.setPrecioEstimado(n.precioEstimado());
        p.setDiseno(json.writeValueAsString(n.diseno()));
        p.setFicha(json.writeValueAsString(n.ficha()));
        p.setImagen(imagen);
        p.setPermitePublicar(n.permitePublicar());
        repo.save(p);

        if (n.permitePublicar()) {
            disenos.save(new DisenoCompartido(
                    "D-" + Codigos.corto(6), p.getId(), nombreDeGaleria(n.ficha()), p.getDiseno(), imagen));
        }

        avisarPedidoNuevo(p, n.ficha());
        n8n.publicar("pedido.creado", Map.of(
                "codigo", codigo,
                "fechaEntrega", p.getFechaEntrega().toString(),
                "precioEstimado", p.getPrecioEstimado(),
                "permitePublicar", p.isPermitePublicar()));
        return vista(p);
    }

    /** El cliente consulta su pedido con el código y su email, o con el token del enlace del email. */
    @Transactional(readOnly = true)
    public VistaPedido consultar(String codigo, String email, String token) {
        Pedido p = repo.findByCodigo(codigo.trim().toUpperCase())
                .filter(x -> (email != null && x.getEmail().equalsIgnoreCase(email.trim()))
                        || (token != null && java.security.MessageDigest.isEqual(
                                x.getTokenSeguimiento().getBytes(), token.trim().getBytes())))
                .orElseThrow(() -> new NoEncontrado("No hay ningún pedido con ese código y email."));
        return vista(p);
    }

    @Transactional(readOnly = true)
    public List<VistaPedido> paraPanel() {
        return repo.paraPanel().stream().map(this::vista).toList();
    }

    @Transactional
    public VistaPedido cambiarEstado(UUID id, CambioDeEstado c) {
        Pedido p = repo.findById(id).orElseThrow(() -> new NoEncontrado("Pedido no encontrado"));
        if (c.precioConfirmado() != null) {
            if (c.precioConfirmado().signum() < 0) {
                throw new DatosInvalidos("El precio no puede ser negativo.");
            }
            p.setPrecioConfirmado(c.precioConfirmado());
        }
        if (c.estado() != p.getEstado()) {
            try {
                p.cambiarEstado(c.estado(), c.nota() == null || c.nota().isBlank() ? null : c.nota().trim());
            } catch (IllegalStateException e) {
                throw new Conflicto(e.getMessage());
            }
            avisarCambioDeEstado(p);
            n8n.publicar("pedido.estado", Map.of("codigo", p.getCodigo(), "estado", p.getEstado().name()));
        }
        return vista(p);
    }

    // ---------------------------------------------------------------------------------------------

    /** Nombre para la galería a partir de la ficha (sin datos personales). */
    static String nombreDeGaleria(List<LineaFicha> ficha) {
        String bizcocho = valor(ficha, "Bizcocho");
        String cobertura = valor(ficha, "Cobertura").replaceAll("\\s*\\(.*\\)", "");
        String forma = valor(ficha, "Forma");
        StringBuilder sb = new StringBuilder("Torta");
        if (!forma.isEmpty() && !forma.equalsIgnoreCase("Redonda")) sb.append(" ").append(forma.toLowerCase());
        if (!bizcocho.isEmpty()) sb.append(" de ").append(bizcocho.toLowerCase());
        if (!cobertura.isEmpty()) sb.append(" con ").append(cobertura.toLowerCase());
        return sb.toString();
    }

    private static String valor(List<LineaFicha> ficha, String etiqueta) {
        return ficha.stream().filter(l -> l.etiqueta().equals(etiqueta)).map(LineaFicha::valor).findFirst().orElse("");
    }

    private String enlaceSeguimiento(Pedido p) {
        return propiedades.webUrl() + "/pedido/" + p.getCodigo() + "?t=" + p.getTokenSeguimiento();
    }

    private void avisarPedidoNuevo(Pedido p, List<LineaFicha> ficha) {
        String precio = p.getPrecioEstimado().toPlainString() + " €";
        brevo.enviar(new Brevo.Correo(
                p.getEmail(),
                p.getNombre(),
                "Hemos recibido tu pedido " + p.getCodigo(),
                Plantillas.marco(
                        "¡Gracias, " + p.getNombre() + "!",
                        "<p>Hemos recibido la solicitud de tu torta. La revisaremos y te escribiremos para confirmarla "
                                + "y darte el precio final.</p>"
                                + "<p><strong>Código:</strong> " + Plantillas.e(p.getCodigo()) + "<br>"
                                + "<strong>Entrega:</strong> " + Plantillas.fecha(p.getFechaEntrega()) + "<br>"
                                + "<strong>Precio orientativo:</strong> " + precio + "</p>"
                                + Plantillas.ficha(ficha)
                                + Plantillas.boton("Seguir mi pedido", enlaceSeguimiento(p)),
                        null),
                null));

        String paraPasteleria = propiedades.emailPasteleria();
        if (paraPasteleria != null && !paraPasteleria.isBlank()) {
            brevo.enviar(new Brevo.Correo(
                    paraPasteleria,
                    "Tutti Dolce",
                    "Nuevo pedido " + p.getCodigo() + " para el " + Plantillas.fecha(p.getFechaEntrega()),
                    Plantillas.marco(
                            "Nueva orden de trabajo",
                            "<p><strong>" + Plantillas.e(p.getCodigo()) + "</strong> · "
                                    + Plantillas.fecha(p.getFechaEntrega()) + " · "
                                    + (p.getEntrega() == Pedido.Entrega.RECOGIDA ? "Recogida" : "Domicilio: " + Plantillas.e(p.getDireccion()))
                                    + "</p><p>" + Plantillas.e(p.getNombre()) + " · " + Plantillas.e(p.getEmail()) + " · "
                                    + Plantillas.e(p.getTelefono()) + "</p>"
                                    + (p.getNotas() == null ? "" : "<p><em>" + Plantillas.e(p.getNotas()) + "</em></p>")
                                    + Plantillas.ficha(ficha)
                                    + "<p>Precio orientativo: " + precio + "</p>"
                                    + Plantillas.boton("Abrir el panel", propiedades.webUrl() + "/admin"),
                            null),
                    null));
        }
    }

    private void avisarCambioDeEstado(Pedido p) {
        String texto = switch (p.getEstado()) {
            case CONFIRMADO -> "¡Tu pedido está confirmado! "
                    + (p.getPrecioConfirmado() != null ? "El precio final es " + p.getPrecioConfirmado().toPlainString() + " €. " : "")
                    + "Lo tendremos listo para el " + Plantillas.fecha(p.getFechaEntrega()) + ".";
            case EN_PREPARACION -> "Ya estamos preparando tu torta.";
            case LISTO -> p.getEntrega() == Pedido.Entrega.RECOGIDA
                    ? "¡Tu torta está lista! Puedes pasar a recogerla."
                    : "¡Tu torta está lista y sale hacia tu casa!";
            case ENTREGADO -> "Tu pedido está entregado. ¡Que lo disfrutes! Nos encantará ver fotos.";
            case CANCELADO -> "Tu pedido se ha cancelado. Si tienes cualquier duda, responde a este email.";
            case SOLICITADO -> "Hemos recibido tu pedido.";
        };
        String nota = p.getHistorial().getLast().getNota();
        brevo.enviar(new Brevo.Correo(
                p.getEmail(),
                p.getNombre(),
                "Pedido " + p.getCodigo() + ": " + p.getEstado().nombre().toLowerCase(),
                Plantillas.marco(
                        p.getEstado().nombre(),
                        "<p>" + Plantillas.e(texto) + "</p>"
                                + (nota == null ? "" : "<p><em>" + Plantillas.e(nota) + "</em></p>")
                                + Plantillas.boton("Ver mi pedido", enlaceSeguimiento(p)),
                        null),
                null));
    }

    private VistaPedido vista(Pedido p) {
        return new VistaPedido(
                p.getId(),
                p.getCodigo(),
                p.getEstado(),
                p.getFechaEntrega(),
                p.getEntrega(),
                p.getDireccion(),
                p.getNombre(),
                p.getEmail(),
                p.getTelefono(),
                p.getNotas(),
                p.getPrecioEstimado(),
                p.getPrecioConfirmado(),
                json.readValue(p.getFicha(), TIPO_FICHA),
                json.readTree(p.getDiseno()),
                p.getImagen(),
                p.getTokenSeguimiento(),
                p.getCreado(),
                p.getHistorial().stream().map(h -> new LineaHistorial(h.getEstado(), h.getFecha(), h.getNota())).toList());
    }
}
