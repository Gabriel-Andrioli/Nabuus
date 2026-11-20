package br.ufjf.nabuus.repository;

import br.ufjf.nabuus.domain.entity.RotaLumica;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RotaLumicaRepository extends JpaRepository<RotaLumica, Long> {

    @Query("SELECT r FROM RotaLumica r JOIN FETCH r.sistemaOrigem JOIN FETCH r.sistemaDestino")
    List<RotaLumica> findAllComSistemas();

    @Query(
        "SELECT r FROM RotaLumica r "
            + "WHERE r.sistemaOrigem.id = :origemId AND r.sistemaDestino.id = :destinoId AND r.ativa = TRUE"
    )
    Optional<RotaLumica> findAtivaEntreSistemas(
        @Param("origemId") Long origemId,
        @Param("destinoId") Long destinoId
    );
}
