package br.ufjf.nabuus.domain.entity;

import br.ufjf.nabuus.domain.enums.Role;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;

@Entity
@Table(name = "astronomo")
@PrimaryKeyJoinColumn(name = "usuario_id")
public class Astronomo extends Usuario {

    @Column(name = "credencial_cientifica", nullable = false, unique = true, length = 60)
    private String credencialCientifica;

    protected Astronomo() {
    }

    public Astronomo(String nome, String email, String hashSenha, String credencialCientifica) {
        super(nome, email, hashSenha, Role.ASTRONOMO);
        this.credencialCientifica = credencialCientifica;
    }

    public String getCredencialCientifica() {
        return credencialCientifica;
    }

    public void setCredencialCientifica(String credencialCientifica) {
        this.credencialCientifica = credencialCientifica;
    }
}
