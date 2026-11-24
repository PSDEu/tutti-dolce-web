package es.tuttidolce.api.pedidos;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface PedidoRepository extends JpaRepository<Pedido, UUID> {

    Optional<Pedido> findByCodigo(String codigo);

    /** Para el panel: primero los que se entregan antes; los terminados al final. */
    @Query("""
            select p from Pedido p
            order by case when p.estado in (es.tuttidolce.api.pedidos.EstadoPedido.ENTREGADO, es.tuttidolce.api.pedidos.EstadoPedido.CANCELADO) then 1 else 0 end, p.fechaEntrega, p.creado
            """)
    List<Pedido> paraPanel();

    @Query(value = "select nextval('pedido_numero_seq')", nativeQuery = true)
    long siguienteNumero();
}
