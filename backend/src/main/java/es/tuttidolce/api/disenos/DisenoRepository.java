package es.tuttidolce.api.disenos;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DisenoRepository extends JpaRepository<DisenoCompartido, UUID> {

    List<DisenoCompartido> findTop48ByAprobadoTrueOrderByCreadoDesc();

    List<DisenoCompartido> findAllByOrderByCreadoDesc();

    Optional<DisenoCompartido> findByCodigo(String codigo);
}
