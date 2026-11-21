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
import java.math.BigDecimal;

@Entity
@Table(name = "rota_lumica")
public class RotaLumica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "astronomo_id", nullable = false)
    private Astronomo astronomo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sistema_origem_id", nullable = false)
    private SistemaSolar sistemaOrigem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sistema_destino_id", nullable = false)
    private SistemaSolar sistemaDestino;

    @Column(name = "velocidade_c", nullable = false)
    private Double velocidadeC;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal pedagio;

    @Column(nullable = false)
    private Boolean ativa;

    protected RotaLumica() {
    }

    public RotaLumica(
        Astronomo astronomo,
        SistemaSolar sistemaOrigem,
        SistemaSolar sistemaDestino,
        Double velocidadeC,
        BigDecimal pedagio,
        Boolean ativa
    ) {
        this.astronomo = astronomo;
        this.sistemaOrigem = sistemaOrigem;
        this.sistemaDestino = sistemaDestino;
        this.velocidadeC = velocidadeC;
        this.pedagio = pedagio;
        this.ativa = ativa;
    }

    public Long getId() {
        return id;
    }

    public Astronomo getAstronomo() {
        return astronomo;
    }

    public SistemaSolar getSistemaOrigem() {
        return sistemaOrigem;
    }

    public SistemaSolar getSistemaDestino() {
        return sistemaDestino;
    }

    public Double getVelocidadeC() {
        return velocidadeC;
    }

    public void setVelocidadeC(Double velocidadeC) {
        this.velocidadeC = velocidadeC;
    }

    public BigDecimal getPedagio() {
        return pedagio;
    }

    public void setPedagio(BigDecimal pedagio) {
        this.pedagio = pedagio;
    }

    public Boolean getAtiva() {
        return ativa;
    }

    public void setAtiva(Boolean ativa) {
        this.ativa = ativa;
    }
}
