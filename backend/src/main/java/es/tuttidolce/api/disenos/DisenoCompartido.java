package es.tuttidolce.api.disenos;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.ColumnTransformer;

/**
 * Diseño que su autor permitió compartir. Sale en la galería (y puede ir a redes)
 * solo cuando la pastelería lo aprueba. No guarda datos personales.
 */
@Entity
public class DisenoCompartido {

    @Id
    private UUID id;

    private String codigo;
    private UUID pedidoId;
    private String nombre;

    @Column(columnDefinition = "jsonb")
    @ColumnTransformer(write = "?::jsonb")
    private String diseno;

    private String imagen;
    private boolean aprobado;
    private Instant creado;

    protected DisenoCompartido() {}

    public DisenoCompartido(String codigo, UUID pedidoId, String nombre, String diseno, String imagen) {
        this.id = UUID.randomUUID();
        this.codigo = codigo;
        this.pedidoId = pedidoId;
        this.nombre = nombre;
        this.diseno = diseno;
        this.imagen = imagen;
        this.creado = Instant.now();
    }

    public UUID getId() { return id; }
    public String getCodigo() { return codigo; }
    public UUID getPedidoId() { return pedidoId; }
    public String getNombre() { return nombre; }
    public String getDiseno() { return diseno; }
    public String getImagen() { return imagen; }
    public boolean isAprobado() { return aprobado; }
    public void setAprobado(boolean v) { aprobado = v; }
    public Instant getCreado() { return creado; }
}
