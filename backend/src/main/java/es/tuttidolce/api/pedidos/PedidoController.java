package es.tuttidolce.api.pedidos;

import es.tuttidolce.api.pedidos.PedidoDtos.CambioDeEstado;
import es.tuttidolce.api.pedidos.PedidoDtos.NuevoPedido;
import es.tuttidolce.api.pedidos.PedidoDtos.VistaPedido;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * API de pedidos.
 * - Pública: crear un pedido y consultarlo (código + email en la cabecera `X-Email`).
 * - Panel (`/api/admin`, con `X-Admin-Key`): listar y cambiar de estado.
 */
@RestController
public class PedidoController {

    private final PedidoService servicio;

    public PedidoController(PedidoService servicio) {
        this.servicio = servicio;
    }

    @PostMapping("/api/pedidos")
    @ResponseStatus(HttpStatus.CREATED)
    public VistaPedido crear(@Valid @RequestBody NuevoPedido pedido) {
        return servicio.crear(pedido);
    }

    /**
     * El email (o el token del enlace) va en una cabecera y no en la URL,
     * para que no quede en logs ni en el historial del navegador.
     */
    @GetMapping("/api/pedidos/{codigo}")
    public VistaPedido consultar(
            @PathVariable String codigo,
            @RequestHeader(name = "X-Email", required = false) String email,
            @RequestHeader(name = "X-Token", required = false) String token) {
        return servicio.consultar(codigo, email, token);
    }

    @GetMapping("/api/admin/pedidos")
    public List<VistaPedido> listar() {
        return servicio.paraPanel();
    }

    @PatchMapping("/api/admin/pedidos/{id}/estado")
    public VistaPedido cambiarEstado(@PathVariable UUID id, @Valid @RequestBody CambioDeEstado cambio) {
        return servicio.cambiarEstado(id, cambio);
    }
}
