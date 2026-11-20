package br.ufjf.nabuus.domain.entity;

import br.ufjf.nabuus.domain.enums.Role;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "passageiro")
@PrimaryKeyJoinColumn(name = "usuario_id")
public class Passageiro extends Usuario {

    @Column(nullable = false, unique = true, length = 14)
    private String cpf;

    @Column(name = "data_nascimento", nullable = false)
    private LocalDate dataNascimento;

    protected Passageiro() {
    }

    public Passageiro(String nome, String email, String hashSenha, String cpf, LocalDate dataNascimento) {
        super(nome, email, hashSenha, Role.PASSAGEIRO);
        this.cpf = cpf;
        this.dataNascimento = dataNascimento;
    }

    public String getCpf() {
        return cpf;
    }

    public void setCpf(String cpf) {
        this.cpf = cpf;
    }

    public LocalDate getDataNascimento() {
        return dataNascimento;
    }

    public void setDataNascimento(LocalDate dataNascimento) {
        this.dataNascimento = dataNascimento;
    }
}
