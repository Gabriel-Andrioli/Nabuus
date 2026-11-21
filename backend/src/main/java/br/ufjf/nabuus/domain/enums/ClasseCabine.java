package br.ufjf.nabuus.domain.enums;

import java.math.BigDecimal;

public enum ClasseCabine {
    EXECUTIVA("Executiva", new BigDecimal("1.0")),
    PRIMEIRA_CLASSE("Primeira classe", new BigDecimal("1.5")),
    LUXO("Luxo", new BigDecimal("2.0"));

    private final String nomeExibicao;
    private final BigDecimal multiplicadorPreco;

    ClasseCabine(String nomeExibicao, BigDecimal multiplicadorPreco) {
        this.nomeExibicao = nomeExibicao;
        this.multiplicadorPreco = multiplicadorPreco;
    }

    public String getNomeExibicao() {
        return nomeExibicao;
    }

    public BigDecimal getMultiplicadorPreco() {
        return multiplicadorPreco;
    }

    /**
     * Deriva a classe da cabine a partir do assento escolhido e capacidade da nave,
     * alinhado à planta da cabine no front-end.
     */
    public static ClasseCabine porAssento(String assentoEscolhido, Integer totalAssentos) {
        int capacidade = (totalAssentos != null && totalAssentos > 0) ? totalAssentos : 24;
        int qtdFileiras = Math.max(6, (int) Math.ceil(capacidade / 4.0));
        int fimLuxo = qtdFileiras >= 12 ? 2 : 1;
        int fimPrimeira = qtdFileiras >= 12 ? 5 : (qtdFileiras >= 8 ? 3 : 2);

        int numFileira = extrairNumeroFileira(assentoEscolhido);
        if (numFileira <= fimLuxo) {
            return LUXO;
        }
        if (numFileira <= fimPrimeira) {
            return PRIMEIRA_CLASSE;
        }
        return EXECUTIVA;
    }

    private static int extrairNumeroFileira(String assentoEscolhido) {
        if (assentoEscolhido == null || assentoEscolhido.length() < 2) {
            return Integer.MAX_VALUE;
        }
        try {
            return Integer.parseInt(assentoEscolhido.substring(0, 2));
        } catch (NumberFormatException ex) {
            return Integer.MAX_VALUE;
        }
    }
}
