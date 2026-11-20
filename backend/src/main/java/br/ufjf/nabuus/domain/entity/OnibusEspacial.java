package br.ufjf.nabuus.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "onibus_espacial")
public class OnibusEspacial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "fretista_id", nullable = false)
    private Fretista fretista;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tipo_propulsao_id", nullable = false)
    private TipoPropulsao tipoPropulsao;

    @Column(nullable = false, unique = true, length = 60)
    private String identificacao;

    @Column(name = "total_assentos", nullable = false)
    private Integer totalAssentos;

    @Column(name = "velocidade_cruzeiro_c", nullable = false)
    private Double velocidadeCruzeiroC;

    @Column(nullable = false)
    private Boolean ativo;

    protected OnibusEspacial() {
    }

    public OnibusEspacial(
        Fretista fretista,
        TipoPropulsao tipoPropulsao,
        String identificacao,
        Integer totalAssentos
    ) {
        this(
            fretista,
            tipoPropulsao,
            identificacao,
            totalAssentos,
            tipoPropulsao != null ? tipoPropulsao.getVelocidadeCruzeiroC() : 0.5
        );
    }

    public OnibusEspacial(
        Fretista fretista,
        TipoPropulsao tipoPropulsao,
        String identificacao,
        Integer totalAssentos,
        Double velocidadeCruzeiroC
    ) {
        this.fretista = fretista;
        this.tipoPropulsao = tipoPropulsao;
        this.identificacao = identificacao;
        this.totalAssentos = totalAssentos;
        this.velocidadeCruzeiroC = velocidadeCruzeiroC;
        this.ativo = Boolean.TRUE;
    }

    public Long getId() {
        return id;
    }

    public Fretista getFretista() {
        return fretista;
    }

    public TipoPropulsao getTipoPropulsao() {
        return tipoPropulsao;
    }

    public void setTipoPropulsao(TipoPropulsao tipoPropulsao) {
        this.tipoPropulsao = tipoPropulsao;
    }

    public String getIdentificacao() {
        return identificacao;
    }

    public void setIdentificacao(String identificacao) {
        this.identificacao = identificacao;
    }

    public Integer getTotalAssentos() {
        return totalAssentos;
    }

    public void setTotalAssentos(Integer totalAssentos) {
        this.totalAssentos = totalAssentos;
    }

    public Double getVelocidadeCruzeiroC() {
        return velocidadeCruzeiroC;
    }

    public void setVelocidadeCruzeiroC(Double velocidadeCruzeiroC) {
        this.velocidadeCruzeiroC = velocidadeCruzeiroC;
    }

    public Boolean getAtivo() {
        return ativo;
    }

    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }
}
