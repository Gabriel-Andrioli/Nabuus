package br.ufjf.nabuus.domain.entity;

import br.ufjf.nabuus.domain.enums.StatusViagem;
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
import java.time.OffsetDateTime;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "viagem")
public class Viagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "fretista_id", nullable = false)
    private Fretista fretista;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "onibus_espacial_id", nullable = false)
    private OnibusEspacial onibusEspacial;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "planeta_embarque_id", nullable = false)
    private Planeta planetaEmbarque;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "planeta_desembarque_id", nullable = false)
    private Planeta planetaDesembarque;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rota_lumica_id")
    private RotaLumica rotaLumica;

    @Column(name = "data_partida", nullable = false)
    private OffsetDateTime dataPartida;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusViagem status;

    @Column(name = "preco_base", nullable = false, precision = 18, scale = 2)
    private BigDecimal precoBase;

    @Column(name = "custo_ano_luz", nullable = false, precision = 18, scale = 2)
    private BigDecimal custoAnoLuz;

    @Column(name = "viavel_sem_lumica", nullable = false)
    private Boolean viavelSemLumica;

    @Column(name = "duracao_bordo_anos_sem_lumica")
    private Double duracaoBordoAnosSemLumica;

    @Column(name = "divida_temporal_anos_sem_lumica")
    private Double dividaTemporalAnosSemLumica;

    @Column(name = "preco_sem_lumica", precision = 18, scale = 2)
    private BigDecimal precoSemLumica;

    @Column(name = "paradas_reabastecimento", nullable = false)
    private Integer paradasReabastecimento;

    @Column(name = "viavel_com_lumica", nullable = false)
    private Boolean viavelComLumica;

    @Column(name = "duracao_bordo_anos_com_lumica")
    private Double duracaoBordoAnosComLumica;

    @Column(name = "divida_temporal_anos_com_lumica")
    private Double dividaTemporalAnosComLumica;

    @Column(name = "preco_com_lumica", precision = 18, scale = 2)
    private BigDecimal precoComLumica;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "rota_2d_json", nullable = false, columnDefinition = "jsonb")
    private String rota2dJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "assentos_ocupados_json", nullable = false, columnDefinition = "jsonb")
    private String assentosOcupadosJson;

    protected Viagem() {
    }

    public Viagem(
        Fretista fretista,
        OnibusEspacial onibusEspacial,
        Planeta planetaEmbarque,
        Planeta planetaDesembarque,
        RotaLumica rotaLumica,
        OffsetDateTime dataPartida,
        StatusViagem status,
        BigDecimal precoBase,
        BigDecimal custoAnoLuz
    ) {
        this.fretista = fretista;
        this.onibusEspacial = onibusEspacial;
        this.planetaEmbarque = planetaEmbarque;
        this.planetaDesembarque = planetaDesembarque;
        this.rotaLumica = rotaLumica;
        this.dataPartida = dataPartida;
        this.status = status;
        this.precoBase = precoBase;
        this.custoAnoLuz = custoAnoLuz;
    }

    public Long getId() {
        return id;
    }

    public Fretista getFretista() {
        return fretista;
    }

    public OnibusEspacial getOnibusEspacial() {
        return onibusEspacial;
    }

    public Planeta getPlanetaEmbarque() {
        return planetaEmbarque;
    }

    public Planeta getPlanetaDesembarque() {
        return planetaDesembarque;
    }

    public RotaLumica getRotaLumica() {
        return rotaLumica;
    }

    public void setRotaLumica(RotaLumica rotaLumica) {
        this.rotaLumica = rotaLumica;
    }

    public OffsetDateTime getDataPartida() {
        return dataPartida;
    }

    public void setDataPartida(OffsetDateTime dataPartida) {
        this.dataPartida = dataPartida;
    }

    public StatusViagem getStatus() {
        return status;
    }

    public void setStatus(StatusViagem status) {
        this.status = status;
    }

    public BigDecimal getPrecoBase() {
        return precoBase;
    }

    public void setPrecoBase(BigDecimal precoBase) {
        this.precoBase = precoBase;
    }

    public BigDecimal getCustoAnoLuz() {
        return custoAnoLuz;
    }

    public void setCustoAnoLuz(BigDecimal custoAnoLuz) {
        this.custoAnoLuz = custoAnoLuz;
    }

    public Boolean getViavelSemLumica() {
        return viavelSemLumica;
    }

    public void setViavelSemLumica(Boolean viavelSemLumica) {
        this.viavelSemLumica = viavelSemLumica;
    }

    public Double getDuracaoBordoAnosSemLumica() {
        return duracaoBordoAnosSemLumica;
    }

    public void setDuracaoBordoAnosSemLumica(Double duracaoBordoAnosSemLumica) {
        this.duracaoBordoAnosSemLumica = duracaoBordoAnosSemLumica;
    }

    public Double getDividaTemporalAnosSemLumica() {
        return dividaTemporalAnosSemLumica;
    }

    public void setDividaTemporalAnosSemLumica(Double dividaTemporalAnosSemLumica) {
        this.dividaTemporalAnosSemLumica = dividaTemporalAnosSemLumica;
    }

    public BigDecimal getPrecoSemLumica() {
        return precoSemLumica;
    }

    public void setPrecoSemLumica(BigDecimal precoSemLumica) {
        this.precoSemLumica = precoSemLumica;
    }

    public Integer getParadasReabastecimento() {
        return paradasReabastecimento;
    }

    public void setParadasReabastecimento(Integer paradasReabastecimento) {
        this.paradasReabastecimento = paradasReabastecimento;
    }

    public Boolean getViavelComLumica() {
        return viavelComLumica;
    }

    public void setViavelComLumica(Boolean viavelComLumica) {
        this.viavelComLumica = viavelComLumica;
    }

    public Double getDuracaoBordoAnosComLumica() {
        return duracaoBordoAnosComLumica;
    }

    public void setDuracaoBordoAnosComLumica(Double duracaoBordoAnosComLumica) {
        this.duracaoBordoAnosComLumica = duracaoBordoAnosComLumica;
    }

    public Double getDividaTemporalAnosComLumica() {
        return dividaTemporalAnosComLumica;
    }

    public void setDividaTemporalAnosComLumica(Double dividaTemporalAnosComLumica) {
        this.dividaTemporalAnosComLumica = dividaTemporalAnosComLumica;
    }

    public BigDecimal getPrecoComLumica() {
        return precoComLumica;
    }

    public void setPrecoComLumica(BigDecimal precoComLumica) {
        this.precoComLumica = precoComLumica;
    }

    public String getRota2dJson() {
        return rota2dJson;
    }

    public void setRota2dJson(String rota2dJson) {
        this.rota2dJson = rota2dJson;
    }

    public String getAssentosOcupadosJson() {
        return assentosOcupadosJson;
    }

    public void setAssentosOcupadosJson(String assentosOcupadosJson) {
        this.assentosOcupadosJson = assentosOcupadosJson;
    }
}
