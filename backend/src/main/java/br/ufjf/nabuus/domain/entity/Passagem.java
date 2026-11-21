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
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(
    name = "passagem",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_passagem_viagem_passageiro_assento",
            columnNames = {"viagem_id", "passageiro_id", "assento_escolhido"}
        )
    }
)
public class Passagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "viagem_id", nullable = false)
    private Viagem viagem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "passageiro_id", nullable = false)
    private Passageiro passageiro;

    @Column(name = "assento_escolhido", nullable = false, length = 10)
    private String assentoEscolhido;

    @Column(name = "usa_rota_lumica", nullable = false)
    private Boolean usaRotaLumica;

    @Column(name = "valor_pago", nullable = false, precision = 18, scale = 2)
    private BigDecimal valorPago;

    @Column(name = "data_compra", nullable = false)
    private OffsetDateTime dataCompra;

    @Column(name = "codigo_comprovante", nullable = false, unique = true, length = 40)
    private String codigoComprovante;

    protected Passagem() {
    }

    public Passagem(
        Viagem viagem,
        Passageiro passageiro,
        String assentoEscolhido,
        Boolean usaRotaLumica,
        BigDecimal valorPago,
        OffsetDateTime dataCompra,
        String codigoComprovante
    ) {
        this.viagem = viagem;
        this.passageiro = passageiro;
        this.assentoEscolhido = assentoEscolhido;
        this.usaRotaLumica = usaRotaLumica;
        this.valorPago = valorPago;
        this.dataCompra = dataCompra;
        this.codigoComprovante = codigoComprovante;
    }

    public Long getId() {
        return id;
    }

    public Viagem getViagem() {
        return viagem;
    }

    public Passageiro getPassageiro() {
        return passageiro;
    }

    public String getAssentoEscolhido() {
        return assentoEscolhido;
    }

    public Boolean getUsaRotaLumica() {
        return usaRotaLumica;
    }

    public BigDecimal getValorPago() {
        return valorPago;
    }

    public OffsetDateTime getDataCompra() {
        return dataCompra;
    }

    public String getCodigoComprovante() {
        return codigoComprovante;
    }
}
