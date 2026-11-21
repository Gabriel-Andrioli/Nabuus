package br.ufjf.nabuus.repository;

import br.ufjf.nabuus.domain.entity.Astronomo;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AstronomoRepository extends JpaRepository<Astronomo, UUID> {

    boolean existsByCredencialCientifica(String credencialCientifica);
}
