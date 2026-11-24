package es.tuttidolce.api.comun;

import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Convierte las excepciones en respuestas `application/problem+json` (RFC 9457) en español. */
@RestControllerAdvice
public class ErroresApi {

    /** No existe el recurso pedido. */
    public static class NoEncontrado extends RuntimeException {
        public NoEncontrado(String mensaje) {
            super(mensaje);
        }
    }

    /** La petición es correcta pero no se puede aplicar (p. ej. un cambio de estado no permitido). */
    public static class Conflicto extends RuntimeException {
        public Conflicto(String mensaje) {
            super(mensaje);
        }
    }

    /** Datos inválidos detectados en el servicio. */
    public static class DatosInvalidos extends RuntimeException {
        public DatosInvalidos(String mensaje) {
            super(mensaje);
        }
    }

    @ExceptionHandler(NoEncontrado.class)
    ProblemDetail noEncontrado(NoEncontrado e) {
        return problema(HttpStatus.NOT_FOUND, "No encontrado", e.getMessage());
    }

    @ExceptionHandler(Conflicto.class)
    ProblemDetail conflicto(Conflicto e) {
        return problema(HttpStatus.CONFLICT, "No permitido", e.getMessage());
    }

    @ExceptionHandler(DatosInvalidos.class)
    ProblemDetail invalidos(DatosInvalidos e) {
        return problema(HttpStatus.BAD_REQUEST, "Datos no válidos", e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail validacion(MethodArgumentNotValidException e) {
        String detalle = e.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + ": " + f.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return problema(HttpStatus.BAD_REQUEST, "Datos no válidos", detalle);
    }

    private static ProblemDetail problema(HttpStatus estado, String titulo, String detalle) {
        ProblemDetail p = ProblemDetail.forStatusAndDetail(estado, detalle);
        p.setTitle(titulo);
        return p;
    }
}
