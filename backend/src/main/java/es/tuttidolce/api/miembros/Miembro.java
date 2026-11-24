package es.tuttidolce.api.miembros;

import es.tuttidolce.api.comun.Codigos;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import java.time.Instant;
import java.util.UUID;

/**
 * Miembro de la membresía gratuita.
 * RGPD: consentimiento de newsletter separado y fechado, cumpleaños solo día y mes,
 * doble opt-in (PENDIENTE hasta confirmar desde el email) y token de baja en cada email.
 */
@Entity
public class Miembro {

    public enum Estado {
        PENDIENTE,
        CONFIRMADO,
        BAJA
    }

    @Id
    private UUID id;

    private String email;
    private String nombre;
    private Short cumpleDia;
    private Short cumpleMes;

    @Enumerated(EnumType.STRING)
    private Estado estado;

    private boolean aceptaNewsletter;
    private Instant consentimientoFecha;
    private Instant privacidadFecha;
    private String tokenConfirmacion;
    private Instant tokenConfirmacionCaduca;
    private String tokenBaja;
    private Instant confirmado;
    private Integer ultimoRegaloAnio;
    private Instant creado;

    protected Miembro() {}

    public Miembro(String email) {
        this.id = UUID.randomUUID();
        this.email = email;
        this.estado = Estado.PENDIENTE;
        this.tokenBaja = Codigos.token();
        this.creado = Instant.now();
    }

    /** Nuevo enlace de confirmación válido 48 horas. */
    public String nuevoTokenConfirmacion(Instant ahora) {
        tokenConfirmacion = Codigos.token();
        tokenConfirmacionCaduca = ahora.plusSeconds(48 * 3600);
        return tokenConfirmacion;
    }

    public void confirmar(Instant ahora) {
        estado = Estado.CONFIRMADO;
        confirmado = ahora;
        tokenConfirmacion = null;
        tokenConfirmacionCaduca = null;
    }

    public void darDeBaja() {
        estado = Estado.BAJA;
        aceptaNewsletter = false;
    }

    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public String getNombre() { return nombre; }
    public void setNombre(String v) { nombre = v; }
    public Short getCumpleDia() { return cumpleDia; }
    public Short getCumpleMes() { return cumpleMes; }
    public void setCumple(Short dia, Short mes) { cumpleDia = dia; cumpleMes = mes; }
    public Estado getEstado() { return estado; }
    public void setEstado(Estado v) { estado = v; }
    public boolean isAceptaNewsletter() { return aceptaNewsletter; }
    public void setAceptaNewsletter(boolean v, Instant ahora) {
        aceptaNewsletter = v;
        consentimientoFecha = v ? ahora : null;
    }
    public void setPrivacidadFecha(Instant v) { privacidadFecha = v; }
    public String getTokenConfirmacion() { return tokenConfirmacion; }
    public Instant getTokenConfirmacionCaduca() { return tokenConfirmacionCaduca; }
    public String getTokenBaja() { return tokenBaja; }
    public Integer getUltimoRegaloAnio() { return ultimoRegaloAnio; }
    public void setUltimoRegaloAnio(Integer v) { ultimoRegaloAnio = v; }
}
