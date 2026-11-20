package br.ufjf.nabuus.repository;

import br.ufjf.nabuus.domain.entity.Fretista;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FretistaRepository extends JpaRepository<Fretista, UUID> {
}
