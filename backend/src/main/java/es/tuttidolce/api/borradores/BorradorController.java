package es.tuttidolce.api.borradores;

import es.tuttidolce.api.comun.ErroresApi.Conflicto;
import es.tuttidolce.api.comun.ErroresApi.NoEncontrado;
import es.tuttidolce.api.config.TuttiDolceProperties;
import es.tuttidolce.api.disenos.DisenoRepository;
import es.tuttidolce.api.notificaciones.Brevo;
import es.tuttidolce.api.notificaciones.EventosN8n;
import es.tuttidolce.api.notificaciones.Plantillas;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Borradores para redes (todo bajo `/api/admin`, con la clave del panel).
 * - n8n los crea (POST) después de escribirlos con IA.
 * - La dueña los corrige y aprueba o descarta (PATCH) desde el panel.
 * - Al aprobar, se avisa a n8n para que publique; n8n marca PUBLICADO cuando termina.
 */
@RestController
public class BorradorController {

    public interface BorradorRepository extends JpaRepository<Borrador, UUID> {}

    public record NuevoBorrador(@NotBlank @Size(max = 20) String disenoCodigo, @NotBlank @Size(max = 30) String red, @NotBlank @Size(max = 4000) String texto) {}

    public record Decision(@NotBlank @Size(max = 4000) String texto, @NotNull Borrador.Estado estado) {}

    public record VistaBorrador(UUID id, String disenoCodigo, String red, String texto, Borrador.Estado estado, String imagen, Instant creado) {}

    private final BorradorRepository repo;
    private final DisenoRepository disenos;
    private final EventosN8n n8n;
    private final Brevo brevo;
    private final TuttiDolceProperties propiedades;

    public BorradorController(BorradorRepository repo, DisenoRepository disenos, EventosN8n n8n, Brevo brevo, TuttiDolceProperties propiedades) {
        this.repo = repo;
        this.disenos = disenos;
        this.n8n = n8n;
        this.brevo = brevo;
        this.propiedades = propiedades;
    }

    @GetMapping("/api/admin/borradores")
    public List<VistaBorrador> listar() {
        return repo.findAll(Sort.by(Sort.Direction.DESC, "creado")).stream().map(this::vista).toList();
    }

    /** Lo llama n8n. Solo se aceptan borradores de diseños aprobados (con permiso del cliente). */
    @PostMapping("/api/admin/borradores")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public VistaBorrador crear(@Valid @RequestBody NuevoBorrador n) {
        var diseno = disenos.findByCodigo(n.disenoCodigo())
                .filter(d -> d.isAprobado())
                .orElseThrow(() -> new Conflicto("El diseño no existe o no está aprobado para compartirse."));
        Borrador b = repo.save(new Borrador(n.disenoCodigo(), n.red(), n.texto(), diseno.getImagen()));
        String email = propiedades.emailPasteleria();
        if (email != null && !email.isBlank()) {
            brevo.enviar(new Brevo.Correo(
                    email,
                    "Tutti Dolce",
                    "Tienes un borrador para " + n.red() + " esperando tu aprobación",
                    Plantillas.marco(
                            "Nuevo borrador para " + n.red(),
                            "<p style=\"white-space:pre-line\">" + Plantillas.e(n.texto()) + "</p>"
                                    + Plantillas.boton("Revisar y aprobar", propiedades.webUrl() + "/admin"),
                            null),
                    null));
        }
        return vista(b);
    }

    @PatchMapping("/api/admin/borradores/{id}")
    @Transactional
    public VistaBorrador decidir(@PathVariable UUID id, @Valid @RequestBody Decision d) {
        Borrador b = repo.findById(id).orElseThrow(() -> new NoEncontrado("Borrador no encontrado"));
        boolean deN8n = d.estado() == Borrador.Estado.PUBLICADO && b.getEstado() == Borrador.Estado.APROBADO;
        if (b.getEstado() != Borrador.Estado.PENDIENTE && !deN8n) {
            throw new Conflicto("Este borrador ya se decidió.");
        }
        b.setTexto(d.texto().trim());
        b.setEstado(d.estado());
        if (d.estado() == Borrador.Estado.APROBADO) {
            n8n.publicar("borrador.aprobado", Map.of(
                    "id", b.getId().toString(),
                    "red", b.getRed(),
                    "texto", b.getTexto(),
                    "disenoCodigo", b.getDisenoCodigo()));
        }
        return vista(b);
    }

    private VistaBorrador vista(Borrador b) {
        return new VistaBorrador(b.getId(), b.getDisenoCodigo(), b.getRed(), b.getTexto(), b.getEstado(), b.getImagen(), b.getCreado());
    }
}
