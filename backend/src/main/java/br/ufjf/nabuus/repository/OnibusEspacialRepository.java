package br.ufjf.nabuus.repository;

import br.ufjf.nabuus.domain.entity.OnibusEspacial;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OnibusEspacialRepository extends JpaRepository<OnibusEspacial, Long> {

    @Query("SELECT o FROM OnibusEspacial o JOIN FETCH o.tipoPropulsao WHERE o.fretista.id = :fretistaId AND o.ativo = TRUE")
    List<OnibusEspacial> findAtivosPorFretista(@Param("fretistaId") UUID fretistaId);
}
