package es.tuttidolce.api.pedidos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import tools.jackson.databind.JsonNode;

/** Datos que entran y salen de la API de pedidos. */
public final class PedidoDtos {

    private PedidoDtos() {}

    public record LineaFicha(@NotBlank @Size(max = 60) String etiqueta, @NotBlank @Size(max = 300) String valor) {}

    public record NuevoPedido(
            @NotNull JsonNode diseno,
            @NotEmpty @Size(max = 30) List<@Valid LineaFicha> ficha,
            @NotNull @DecimalMin("0") BigDecimal precioEstimado,
            @NotNull LocalDate fechaEntrega,
            @NotNull Pedido.Entrega entrega,
            @Size(max = 300) String direccion,
            @NotBlank @Size(max = 120) String nombre,
            @NotBlank @Email @Size(max = 200) String email,
            @NotBlank @Size(max = 40) String telefono,
            @Size(max = 1000) String notas,
            @Size(max = 3_000_000) String imagen,
            boolean permitePublicar,
            @AssertTrue(message = "hay que aceptar la política de privacidad") boolean aceptaPrivacidad) {}

    public record CambioDeEstado(@NotNull EstadoPedido estado, @Size(max = 500) String nota, BigDecimal precioConfirmado) {}

    public record LineaHistorial(EstadoPedido estado, Instant fecha, String nota) {}

    public record VistaPedido(
            UUID id,
            String codigo,
            EstadoPedido estado,
            LocalDate fechaEntrega,
            Pedido.Entrega entrega,
            String direccion,
            String nombre,
            String email,
            String telefono,
            String notas,
            BigDecimal precioEstimado,
            BigDecimal precioConfirmado,
            List<LineaFicha> ficha,
            JsonNode diseno,
            String imagen,
            String tokenSeguimiento,
            Instant creado,
            List<LineaHistorial> historial) {}
}
