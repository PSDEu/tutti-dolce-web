package es.tuttidolce.api.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Protege `/api/admin/**` con la cabecera `X-Admin-Key`.
 * Es una protección sencilla para un solo usuario (la pastelería); si el panel crece,
 * se sustituye por Spring Security con usuarios.
 */
@Component
public class FiltroAdmin extends OncePerRequestFilter {

    private final TuttiDolceProperties propiedades;

    public FiltroAdmin(TuttiDolceProperties propiedades) {
        this.propiedades = propiedades;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/admin/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain cadena)
            throws ServletException, IOException {
        String esperada = propiedades.adminKey();
        String recibida = req.getHeader("X-Admin-Key");
        if (esperada == null || esperada.isBlank() || recibida == null || !iguales(esperada, recibida)) {
            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            res.setContentType("application/problem+json");
            res.getWriter().write("{\"title\":\"No autorizado\",\"status\":401}");
            return;
        }
        cadena.doFilter(req, res);
    }

    /** Comparación en tiempo constante (no revela cuántos caracteres coinciden). */
    private static boolean iguales(String a, String b) {
        return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }
}
