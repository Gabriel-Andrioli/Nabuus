package br.ufjf.nabuus.repository;

import br.ufjf.nabuus.domain.entity.Passagem;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PassagemRepository extends JpaRepository<Passagem, Long> {

    boolean existsByViagemIdAndAssentoEscolhido(Long viagemId, String assentoEscolhido);

    boolean existsByViagemIdAndPassageiroIdAndAssentoEscolhido(Long viagemId, UUID passageiroId, String assentoEscolhido);

    @Query(
        "SELECT p FROM Passagem p "
            + "JOIN FETCH p.viagem v "
            + "JOIN FETCH v.planetaEmbarque "
            + "JOIN FETCH v.planetaDesembarque "
            + "WHERE p.passageiro.id = :passageiroId"
    )
    List<Passagem> findPorPassageiro(@Param("passageiroId") UUID passageiroId);
}
