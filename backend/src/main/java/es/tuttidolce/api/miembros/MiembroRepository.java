package es.tuttidolce.api.miembros;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface MiembroRepository extends JpaRepository<Miembro, UUID> {

    Optional<Miembro> findByEmail(String email);

    Optional<Miembro> findByTokenConfirmacion(String token);

    Optional<Miembro> findByTokenBaja(String token);

    /** Miembros confirmados, con newsletter aceptada, que cumplen años en ese día y mes. */
    @Query("""
            select m from Miembro m
            where m.estado = es.tuttidolce.api.miembros.Miembro.Estado.CONFIRMADO
              and m.aceptaNewsletter = true
              and m.cumpleMes = :mes and m.cumpleDia in :dias
            """)
    List<Miembro> cumplenAnios(short mes, List<Short> dias);
}
