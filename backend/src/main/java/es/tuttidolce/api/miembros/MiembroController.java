package es.tuttidolce.api.miembros;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Membresía: registro (doble opt-in), confirmación y baja. También lanza el envío diario de cumpleaños. */
@RestController
public class MiembroController {

    public record NuevoMiembro(
            @NotBlank @Size(max = 120) String nombre,
            @NotBlank @Email @Size(max = 200) String email,
            @Min(1) @Max(31) Integer cumpleDia,
            @Min(1) @Max(12) Integer cumpleMes,
            boolean aceptaNewsletter,
            boolean aceptaPrivacidad) {}

    public record Token(@NotBlank @Size(max = 64) String token) {}

    private final MiembroService servicio;

    public MiembroController(MiembroService servicio) {
        this.servicio = servicio;
    }

    @PostMapping("/api/miembros")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void registrar(@Valid @RequestBody NuevoMiembro m) {
        servicio.registrar(new MiembroService.Registro(
                m.nombre(), m.email(), m.cumpleDia(), m.cumpleMes(), m.aceptaNewsletter(), m.aceptaPrivacidad()));
    }

    @PostMapping("/api/miembros/confirmar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void confirmar(@Valid @RequestBody Token t) {
        servicio.confirmar(t.token());
    }

    @PostMapping("/api/miembros/baja")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void baja(@Valid @RequestBody Token t) {
        servicio.darDeBaja(t.token());
    }

    /** Todos los días (por defecto a las 9:00, hora de Madrid): regalos de cumpleaños. */
    @Scheduled(cron = "${tutti.cumpleanos.cron}", zone = "${tutti.zona-horaria}")
    public void cumpleanosDelDia() {
        servicio.enviarRegalosDeCumpleanos();
    }
}
