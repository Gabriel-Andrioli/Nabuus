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
@Table(name = "sistema_solar")
public class SistemaSolar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "astronomo_id", nullable = false)
    private Astronomo astronomo;

    @Column(nullable = false, unique = true, length = 100)
    private String nome;

    @Column(name = "estrela_principal", nullable = false, length = 100)
    private String estrelaPrincipal;

    @Column(name = "coordenada_ra", nullable = false)
    private Double coordenadaRA;

    @Column(name = "coordenada_dec", nullable = false)
    private Double coordenadaDec;

    @Column(name = "distancia_sol_anos_luz", nullable = false)
    private Double distanciaSolAnosLuz;

    protected SistemaSolar() {
    }

    public SistemaSolar(
        Astronomo astronomo,
        String nome,
        String estrelaPrincipal,
        Double coordenadaRA,
        Double coordenadaDec,
        Double distanciaSolAnosLuz
    ) {
        this.astronomo = astronomo;
        this.nome = nome;
        this.estrelaPrincipal = estrelaPrincipal;
        this.coordenadaRA = coordenadaRA;
        this.coordenadaDec = coordenadaDec;
        this.distanciaSolAnosLuz = distanciaSolAnosLuz;
    }

    public Long getId() {
        return id;
    }

    public Astronomo getAstronomo() {
        return astronomo;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getEstrelaPrincipal() {
        return estrelaPrincipal;
    }

    public void setEstrelaPrincipal(String estrelaPrincipal) {
        this.estrelaPrincipal = estrelaPrincipal;
    }

    public Double getCoordenadaRA() {
        return coordenadaRA;
    }

    public void setCoordenadaRA(Double coordenadaRA) {
        this.coordenadaRA = coordenadaRA;
    }

    public Double getCoordenadaDec() {
        return coordenadaDec;
    }

    public void setCoordenadaDec(Double coordenadaDec) {
        this.coordenadaDec = coordenadaDec;
    }

    public Double getDistanciaSolAnosLuz() {
        return distanciaSolAnosLuz;
    }

    public void setDistanciaSolAnosLuz(Double distanciaSolAnosLuz) {
        this.distanciaSolAnosLuz = distanciaSolAnosLuz;
    }
}
