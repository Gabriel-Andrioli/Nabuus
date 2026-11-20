package br.ufjf.nabuus.repository;

import br.ufjf.nabuus.domain.entity.Viagem;
import br.ufjf.nabuus.domain.enums.StatusViagem;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ViagemRepository extends JpaRepository<Viagem, Long> {

    @Query(
        "SELECT v FROM Viagem v "
            + "JOIN FETCH v.onibusEspacial o "
            + "JOIN FETCH o.tipoPropulsao "
            + "JOIN FETCH v.planetaEmbarque pe "
            + "JOIN FETCH pe.sistemaSolar "
            + "JOIN FETCH v.planetaDesembarque pd "
            + "JOIN FETCH pd.sistemaSolar "
            + "WHERE v.status = :status "
            + "AND (:origemId IS NULL OR pe.id = :origemId) "
            + "AND (:destinoId IS NULL OR pd.id = :destinoId)"
    )
    List<Viagem> findPublicadas(
        @Param("status") StatusViagem status,
        @Param("origemId") Long origemId,
        @Param("destinoId") Long destinoId
    );

    @Query(
        "SELECT v FROM Viagem v "
            + "JOIN FETCH v.onibusEspacial o "
            + "JOIN FETCH o.tipoPropulsao "
            + "JOIN FETCH v.planetaEmbarque pe "
            + "JOIN FETCH pe.sistemaSolar "
            + "JOIN FETCH v.planetaDesembarque pd "
            + "JOIN FETCH pd.sistemaSolar "
            + "WHERE v.fretista.id = :fretistaId"
    )
    List<Viagem> findPorFretista(@Param("fretistaId") UUID fretistaId);

    @Query(
        "SELECT v FROM Viagem v "
            + "JOIN FETCH v.onibusEspacial o "
            + "JOIN FETCH o.tipoPropulsao "
            + "JOIN FETCH v.planetaEmbarque "
            + "JOIN FETCH v.planetaDesembarque "
            + "WHERE v.id = :id"
    )
    Optional<Viagem> findDetalhadaPorId(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Viagem v SET v.status = :novoStatus WHERE v.rotaLumica.id = :rotaLumicaId AND v.status = :statusAtual")
    int suspenderPorRotaLumica(
        @Param("rotaLumicaId") Long rotaLumicaId,
        @Param("statusAtual") StatusViagem statusAtual,
        @Param("novoStatus") StatusViagem novoStatus
    );
}
