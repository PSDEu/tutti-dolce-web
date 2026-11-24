package es.tuttidolce.api.pedidos;

import java.util.Set;

/**
 * Estados de un pedido: solicitado → confirmado → en preparación → listo → entregado.
 * Se puede cancelar hasta que está listo. El pago online se añadirá como un estado más
 * (p. ej. PAGADO entre CONFIRMADO y EN_PREPARACION) sin rehacer nada.
 */
public enum EstadoPedido {
    SOLICITADO("Solicitado"),
    CONFIRMADO("Confirmado"),
    EN_PREPARACION("En preparación"),
    LISTO("Listo"),
    ENTREGADO("Entregado"),
    CANCELADO("Cancelado");

    private final String nombre;

    EstadoPedido(String nombre) {
        this.nombre = nombre;
    }

    public String nombre() {
        return nombre;
    }

    public Set<EstadoPedido> siguientes() {
        return switch (this) {
            case SOLICITADO -> Set.of(CONFIRMADO, CANCELADO);
            case CONFIRMADO -> Set.of(EN_PREPARACION, CANCELADO);
            case EN_PREPARACION -> Set.of(LISTO, CANCELADO);
            case LISTO -> Set.of(ENTREGADO, CANCELADO);
            case ENTREGADO, CANCELADO -> Set.of();
        };
    }

    public boolean puedePasarA(EstadoPedido otro) {
        return siguientes().contains(otro);
    }
}
