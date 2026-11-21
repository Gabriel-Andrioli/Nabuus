package br.ufjf.nabuus.domain.enums;

import java.math.BigDecimal;

public enum TipoAlimentacao {
    PADRAO("Padrão", new BigDecimal("0.02")),
    VEGETARIANA("Vegetariana", new BigDecimal("0.03")),
    GOURMET("Gourmet", new BigDecimal("0.05"));

    private final String nomeExibicao;
    private final BigDecimal percentual;

    TipoAlimentacao(String nomeExibicao, BigDecimal percentual) {
        this.nomeExibicao = nomeExibicao;
        this.percentual = percentual;
    }

    public String getNomeExibicao() {
        return nomeExibicao;
    }

    public BigDecimal getPercentual() {
        return percentual;
    }

    public static TipoAlimentacao porNome(String nome) {
        if (nome == null || nome.isBlank()) {
            return null;
        }
        String chave = nome.trim().toLowerCase();
        if ("vegetariana".equals(chave)) {
            return VEGETARIANA;
        }
        if ("gourmet".equals(chave)) {
            return GOURMET;
        }
        if ("padrão".equals(chave) || "padrao".equals(chave)) {
            return PADRAO;
        }
        return null;
    }
}
