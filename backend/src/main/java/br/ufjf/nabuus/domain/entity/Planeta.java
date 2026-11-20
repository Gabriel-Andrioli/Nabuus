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
@Table(name = "planeta")
public class Planeta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sistema_solar_id", nullable = false)
    private SistemaSolar sistemaSolar;

    @Column(nullable = false, unique = true, length = 100)
    private String nome;

    @Column(name = "raio_base", nullable = false)
    private Double raioBase;

    @Column(name = "massa_base", nullable = false)
    private Double massaBase;

    @Column(name = "zona_habitavel", nullable = false)
    private Boolean zonaHabitavel;

    @Column(name = "distancia_estrela_ua", nullable = false)
    private Double distanciaEstrelaUA;

    @Column(name = "possui_posto_recarga", nullable = false)
    private Boolean possuiPostoRecarga;

    @Column(name = "descricao_nabuus", columnDefinition = "TEXT")
    private String descricaoNabuus;

    protected Planeta() {
    }

    public Planeta(
        SistemaSolar sistemaSolar,
        String nome,
        Double raioBase,
        Double massaBase,
        Boolean zonaHabitavel,
        Double distanciaEstrelaUA,
        Boolean possuiPostoRecarga,
        String descricaoNabuus
    ) {
        this.sistemaSolar = sistemaSolar;
        this.nome = nome;
        this.raioBase = raioBase;
        this.massaBase = massaBase;
        this.zonaHabitavel = zonaHabitavel;
        this.distanciaEstrelaUA = distanciaEstrelaUA;
        this.possuiPostoRecarga = possuiPostoRecarga;
        this.descricaoNabuus = descricaoNabuus;
    }

    public Long getId() {
        return id;
    }

    public SistemaSolar getSistemaSolar() {
        return sistemaSolar;
    }

    public void setSistemaSolar(SistemaSolar sistemaSolar) {
        this.sistemaSolar = sistemaSolar;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public Double getRaioBase() {
        return raioBase;
    }

    public Double getMassaBase() {
        return massaBase;
    }

    public Boolean getZonaHabitavel() {
        return zonaHabitavel;
    }

    public Double getDistanciaEstrelaUA() {
        return distanciaEstrelaUA;
    }

    public Boolean getPossuiPostoRecarga() {
        return possuiPostoRecarga;
    }

    public void setPossuiPostoRecarga(Boolean possuiPostoRecarga) {
        this.possuiPostoRecarga = possuiPostoRecarga;
    }

    public String getDescricaoNabuus() {
        return descricaoNabuus;
    }
}
