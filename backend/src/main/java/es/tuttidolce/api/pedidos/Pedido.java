package es.tuttidolce.api.pedidos;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.hibernate.annotations.ColumnTransformer;

/** Un pedido = una orden de trabajo para la pastelería. */
@Entity
public class Pedido {

    public enum Entrega {
        RECOGIDA,
        DOMICILIO
    }

    @Id
    private UUID id;

    private String codigo;

    @Enumerated(EnumType.STRING)
    private EstadoPedido estado;

    private LocalDate fechaEntrega;

    @Enumerated(EnumType.STRING)
    private Entrega entrega;

    private String direccion;
    private String nombre;
    private String email;
    private String telefono;
    private String notas;
    private BigDecimal precioEstimado;
    private BigDecimal precioConfirmado;

    /** Diseño tal cual lo envía la web (JSON). */
    @Column(columnDefinition = "jsonb")
    @ColumnTransformer(write = "?::jsonb")
    private String diseno;

    /** Ficha técnica en palabras (JSON: lista de {etiqueta, valor}). */
    @Column(columnDefinition = "jsonb")
    @ColumnTransformer(write = "?::jsonb")
    private String ficha;

    /** Captura PNG del 3D como data URL. */
    private String imagen;

    private boolean permitePublicar;
    /** Token del enlace de seguimiento (así el email no va en la URL). */
    private String tokenSeguimiento;
    private Instant creado;
    private Instant actualizado;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("fecha asc")
    private List<CambioEstado> historial = new ArrayList<>();

    protected Pedido() {}

    public Pedido(String codigo) {
        this.id = UUID.randomUUID();
        this.codigo = codigo;
        this.estado = EstadoPedido.SOLICITADO;
        this.tokenSeguimiento = es.tuttidolce.api.comun.Codigos.token();
        this.creado = Instant.now();
        this.actualizado = this.creado;
        this.historial.add(new CambioEstado(this, EstadoPedido.SOLICITADO, null));
    }

    /** Cambia de estado respetando las transiciones permitidas y lo anota en el historial. */
    public void cambiarEstado(EstadoPedido nuevo, String nota) {
        if (!estado.puedePasarA(nuevo)) {
            throw new IllegalStateException(
                    "Un pedido " + estado.nombre().toLowerCase() + " no puede pasar a " + nuevo.nombre().toLowerCase());
        }
        estado = nuevo;
        actualizado = Instant.now();
        historial.add(new CambioEstado(this, nuevo, nota));
    }

    public UUID getId() { return id; }
    public String getCodigo() { return codigo; }
    public EstadoPedido getEstado() { return estado; }
    public LocalDate getFechaEntrega() { return fechaEntrega; }
    public void setFechaEntrega(LocalDate v) { fechaEntrega = v; }
    public Entrega getEntrega() { return entrega; }
    public void setEntrega(Entrega v) { entrega = v; }
    public String getDireccion() { return direccion; }
    public void setDireccion(String v) { direccion = v; }
    public String getNombre() { return nombre; }
    public void setNombre(String v) { nombre = v; }
    public String getEmail() { return email; }
    public void setEmail(String v) { email = v; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String v) { telefono = v; }
    public String getNotas() { return notas; }
    public void setNotas(String v) { notas = v; }
    public BigDecimal getPrecioEstimado() { return precioEstimado; }
    public void setPrecioEstimado(BigDecimal v) { precioEstimado = v; }
    public BigDecimal getPrecioConfirmado() { return precioConfirmado; }
    public void setPrecioConfirmado(BigDecimal v) { precioConfirmado = v; actualizado = Instant.now(); }
    public String getDiseno() { return diseno; }
    public void setDiseno(String v) { diseno = v; }
    public String getFicha() { return ficha; }
    public void setFicha(String v) { ficha = v; }
    public String getImagen() { return imagen; }
    public void setImagen(String v) { imagen = v; }
    public boolean isPermitePublicar() { return permitePublicar; }
    public void setPermitePublicar(boolean v) { permitePublicar = v; }
    public String getTokenSeguimiento() { return tokenSeguimiento; }
    public Instant getCreado() { return creado; }
    public List<CambioEstado> getHistorial() { return historial; }
}
