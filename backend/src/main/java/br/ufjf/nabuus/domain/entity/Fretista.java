package br.ufjf.nabuus.domain.entity;

import br.ufjf.nabuus.domain.enums.Role;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;

@Entity
@Table(name = "fretista")
@PrimaryKeyJoinColumn(name = "usuario_id")
public class Fretista extends Usuario {

    @Column(name = "cnpj_intergalactico", nullable = false, unique = true, length = 30)
    private String cnpjIntergalactico;

    @Column(name = "razao_social", nullable = false, length = 150)
    private String razaoSocial;

    protected Fretista() {
    }

    public Fretista(String nome, String email, String hashSenha, String cnpjIntergalactico, String razaoSocial) {
        super(nome, email, hashSenha, Role.FRETISTA);
        this.cnpjIntergalactico = cnpjIntergalactico;
        this.razaoSocial = razaoSocial;
    }

    public String getCnpjIntergalactico() {
        return cnpjIntergalactico;
    }

    public void setCnpjIntergalactico(String cnpjIntergalactico) {
        this.cnpjIntergalactico = cnpjIntergalactico;
    }

    public String getRazaoSocial() {
        return razaoSocial;
    }

    public void setRazaoSocial(String razaoSocial) {
        this.razaoSocial = razaoSocial;
    }
}
