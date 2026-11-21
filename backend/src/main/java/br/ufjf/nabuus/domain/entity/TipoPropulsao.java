package br.ufjf.nabuus.domain.entity;

import br.ufjf.nabuus.domain.enums.CategoriaConforto;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "tipo_propulsao")
public class TipoPropulsao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "astronomo_id", nullable = false)
    private Astronomo astronomo;

    @Column(nullable = false, unique = true, length = 40)
    private String codigo;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(name = "aceleracao_g", nullable = false)
    private Double aceleracaoG;

    @Column(name = "velocidade_cruzeiro_c", nullable = false)
    private Double velocidadeCruzeiroC;

    @Column(name = "autonomia_anos_luz", nullable = false)
    private Double autonomiaAnosLuz;

    @Enumerated(EnumType.STRING)
    @Column(name = "categoria_conforto", nullable = false, length = 20)
    private CategoriaConforto categoriaConforto;

    @Column(name = "preco_base_referencia", nullable = false, precision = 18, scale = 2)
    private BigDecimal precoBaseReferencia;

    @Column(name = "custo_ano_luz_referencia", nullable = false, precision = 18, scale = 2)
    private BigDecimal custoAnoLuzReferencia;

    protected TipoPropulsao() {
    }

    public TipoPropulsao(
            Astronomo astronomo,
            String codigo,
            String nome,
            Double aceleracaoG,
            Double velocidadeCruzeiroC,
            Double autonomiaAnosLuz,
            CategoriaConforto categoriaConforto,
            BigDecimal precoBaseReferencia,
            BigDecimal custoAnoLuzReferencia) {
        this.astronomo = astronomo;
        this.codigo = codigo;
        this.nome = nome;
        this.aceleracaoG = aceleracaoG;
        this.velocidadeCruzeiroC = velocidadeCruzeiroC;
        this.autonomiaAnosLuz = autonomiaAnosLuz;
        this.categoriaConforto = categoriaConforto;
        this.precoBaseReferencia = precoBaseReferencia;
        this.custoAnoLuzReferencia = custoAnoLuzReferencia;
    }

    public Long getId() {
        return id;
    }

    public String getCodigo() {
        return codigo;
    }

    public String getNome() {
        return nome;
    }

    public Double getAceleracaoG() {
        return aceleracaoG;
    }

    public Double getVelocidadeCruzeiroC() {
        return velocidadeCruzeiroC;
    }

    public Double getAutonomiaAnosLuz() {
        return autonomiaAnosLuz;
    }

    public CategoriaConforto getCategoriaConforto() {
        return categoriaConforto;
    }

    public BigDecimal getPrecoBaseReferencia() {
        return precoBaseReferencia;
    }

    public BigDecimal getCustoAnoLuzReferencia() {
        return custoAnoLuzReferencia;
    }
}
