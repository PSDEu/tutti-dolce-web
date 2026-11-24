package es.tuttidolce.api.disenos;

import es.tuttidolce.api.comun.ErroresApi.NoEncontrado;
import es.tuttidolce.api.notificaciones.EventosN8n;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/** Galería pública (solo aprobados) y moderación desde el panel. */
@RestController
public class DisenoController {

    public record VistaDiseno(UUID id, String codigo, String nombre, String imagen, JsonNode diseno, boolean aprobado, Instant creado) {}

    public record Moderacion(boolean aprobado) {}

    private final DisenoRepository repo;
    private final JsonMapper json;
    private final EventosN8n n8n;

    public DisenoController(DisenoRepository repo, JsonMapper json, EventosN8n n8n) {
        this.repo = repo;
        this.json = json;
        this.n8n = n8n;
    }

    @GetMapping("/api/disenos/publicos")
    public List<VistaDiseno> publicos() {
        return repo.findTop48ByAprobadoTrueOrderByCreadoDesc().stream().map(this::vista).toList();
    }

    @GetMapping("/api/admin/disenos")
    public List<VistaDiseno> todos() {
        return repo.findAllByOrderByCreadoDesc().stream().map(this::vista).toList();
    }

    /** Aprobar un diseño lo publica en la galería y avisa a n8n para preparar el borrador para redes. */
    @PatchMapping("/api/admin/disenos/{id}")
    @Transactional
    public VistaDiseno moderar(@PathVariable UUID id, @RequestBody Moderacion m) {
        DisenoCompartido d = repo.findById(id).orElseThrow(() -> new NoEncontrado("Diseño no encontrado"));
        boolean nuevoAprobado = m.aprobado() && !d.isAprobado();
        d.setAprobado(m.aprobado());
        if (nuevoAprobado) {
            n8n.publicar("diseno.compartible", Map.of(
                    "codigo", d.getCodigo(),
                    "nombre", d.getNombre(),
                    "diseno", json.readTree(d.getDiseno()),
                    "tieneImagen", d.getImagen() != null));
        }
        return vista(d);
    }

    /** Imagen de un diseño aprobado (la usa n8n para publicar en redes). */
    @GetMapping("/api/admin/disenos/codigo/{codigo}")
    public VistaDiseno porCodigo(@PathVariable String codigo) {
        return repo.findByCodigo(codigo).map(this::vista).orElseThrow(() -> new NoEncontrado("Diseño no encontrado"));
    }

    /** Imagen PNG de un diseño aprobado (URL pública que necesita Instagram para publicar). */
    @GetMapping(value = "/api/disenos/imagen/{codigo}", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> imagen(@PathVariable String codigo) {
        return repo.findByCodigo(codigo)
                .filter(d -> d.isAprobado() && d.getImagen() != null)
                .map(d -> ResponseEntity.ok()
                        .cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic())
                        .body(Base64.getDecoder().decode(d.getImagen().substring(d.getImagen().indexOf(',') + 1))))
                .orElseThrow(() -> new NoEncontrado("Imagen no encontrada"));
    }

    private VistaDiseno vista(DisenoCompartido d) {
        return new VistaDiseno(d.getId(), d.getCodigo(), d.getNombre(), d.getImagen(), json.readTree(d.getDiseno()), d.isAprobado(), d.getCreado());
    }
}
