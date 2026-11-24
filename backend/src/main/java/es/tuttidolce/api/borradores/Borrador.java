package es.tuttidolce.api.borradores;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import java.time.Instant;
import java.util.UUID;

/**
 * Texto para redes escrito por IA con la voz de la dueña.
 * Flujo: PENDIENTE → (la dueña lo corrige y) APROBADO → n8n lo publica → PUBLICADO.
 * Si no le gusta: RECHAZADO. Nunca se publica nada sin su aprobación.
 */
@Entity
public class Borrador {

    public enum Estado {
        PENDIENTE,
        APROBADO,
        RECHAZADO,
        PUBLICADO
    }

    @Id
    private UUID id;

    private String disenoCodigo;
    private String red;
    private String texto;

    @Enumerated(EnumType.STRING)
    private Estado estado;

    private String imagen;
    private Instant creado;
    private Instant decidido;

    protected Borrador() {}

    public Borrador(String disenoCodigo, String red, String texto, String imagen) {
        this.id = UUID.randomUUID();
        this.disenoCodigo = disenoCodigo;
        this.red = red;
        this.texto = texto;
        this.imagen = imagen;
        this.estado = Estado.PENDIENTE;
        this.creado = Instant.now();
    }

    public UUID getId() { return id; }
    public String getDisenoCodigo() { return disenoCodigo; }
    public String getRed() { return red; }
    public String getTexto() { return texto; }
    public void setTexto(String v) { texto = v; }
    public Estado getEstado() { return estado; }
    public void setEstado(Estado v) { estado = v; decidido = Instant.now(); }
    public String getImagen() { return imagen; }
    public Instant getCreado() { return creado; }
    public Instant getDecidido() { return decidido; }
}
