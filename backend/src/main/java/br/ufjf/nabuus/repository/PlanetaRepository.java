package br.ufjf.nabuus.repository;

import br.ufjf.nabuus.domain.entity.Planeta;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface PlanetaRepository extends JpaRepository<Planeta, Long> {

    @Query("SELECT p FROM Planeta p JOIN FETCH p.sistemaSolar")
    List<Planeta> findAllComSistema();

    @Query("SELECT p FROM Planeta p JOIN FETCH p.sistemaSolar WHERE p.possuiPostoRecarga = TRUE")
    List<Planeta> findAllPostosRecarga();
}
