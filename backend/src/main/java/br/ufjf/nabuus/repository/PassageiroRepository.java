package br.ufjf.nabuus.repository;

import br.ufjf.nabuus.domain.entity.Passageiro;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PassageiroRepository extends JpaRepository<Passageiro, UUID> {
}
