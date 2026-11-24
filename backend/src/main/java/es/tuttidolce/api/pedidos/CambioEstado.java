package es.tuttidolce.api.pedidos;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.time.Instant;

/** Una línea del historial de estados de un pedido. */
@Entity
public class CambioEstado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "pedido_id")
    private Pedido pedido;

    @Enumerated(EnumType.STRING)
    private EstadoPedido estado;

    private String nota;
    private Instant fecha;

    protected CambioEstado() {}

    CambioEstado(Pedido pedido, EstadoPedido estado, String nota) {
        this.pedido = pedido;
        this.estado = estado;
        this.nota = nota;
        this.fecha = Instant.now();
    }

    public EstadoPedido getEstado() { return estado; }
    public String getNota() { return nota; }
    public Instant getFecha() { return fecha; }
}
