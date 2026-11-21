package br.ufjf.nabuus.service;

import br.ufjf.nabuus.domain.entity.Passagem;
import br.ufjf.nabuus.domain.entity.Passageiro;
import br.ufjf.nabuus.domain.entity.Viagem;
import br.ufjf.nabuus.domain.enums.ClasseCabine;
import br.ufjf.nabuus.domain.enums.StatusViagem;
import br.ufjf.nabuus.dto.logistica.PassagemComprarRequestDTO;
import br.ufjf.nabuus.dto.logistica.PassagemResponseDTO;
import br.ufjf.nabuus.exception.ConflitoDeEstadoException;
import br.ufjf.nabuus.exception.RecursoNaoEncontradoException;
import br.ufjf.nabuus.exception.RegraDeNegocioException;
import br.ufjf.nabuus.repository.PassagemRepository;
import br.ufjf.nabuus.repository.PassageiroRepository;
import br.ufjf.nabuus.repository.ViagemRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PassagemService {

    private final PassagemRepository passagemRepository;
    private final ViagemRepository viagemRepository;
    private final PassageiroRepository passageiroRepository;
    private final ObjectMapper objectMapper;

    public PassagemService(
        PassagemRepository passagemRepository,
        ViagemRepository viagemRepository,
        PassageiroRepository passageiroRepository,
        ObjectMapper objectMapper
    ) {
        this.passagemRepository = passagemRepository;
        this.viagemRepository = viagemRepository;
        this.passageiroRepository = passageiroRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public PassagemResponseDTO comprar(PassagemComprarRequestDTO dto, UUID passageiroId) {
        Viagem viagem = viagemRepository.findDetalhadaPorId(dto.viagemId())
            .orElseThrow(() -> new RecursoNaoEncontradoException("Viagem não encontrada."));
        Passageiro passageiro = passageiroRepository.findById(passageiroId)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Passageiro não encontrado."));

        if (viagem.getStatus() != StatusViagem.PUBLICADA) {
            throw new RegraDeNegocioException("Esta viagem não está disponível para venda.");
        }
        if (Boolean.TRUE.equals(dto.usaRotaLumica()) && !Boolean.TRUE.equals(viagem.getViavelComLumica())) {
            throw new RegraDeNegocioException("Modalidade com Rota Lúmica indisponível para esta viagem.");
        }

        List<String> ocupados = lerAssentosOcupados(viagem.getAssentosOcupadosJson());
        if (ocupados.contains(dto.assentoEscolhido())
            || passagemRepository.existsByViagemIdAndPassageiroIdAndAssentoEscolhido(
                viagem.getId(), passageiroId, dto.assentoEscolhido())) {
            throw new ConflitoDeEstadoException("Assento " + dto.assentoEscolhido() + " já está reservado.");
        }

        BigDecimal precoBaseCenario = Boolean.TRUE.equals(dto.usaRotaLumica())
            ? viagem.getPrecoComLumica()
            : viagem.getPrecoSemLumica();
        ClasseCabine classeCabine = ClasseCabine.porAssento(
            dto.assentoEscolhido(),
            viagem.getOnibusEspacial().getTotalAssentos()
        );
        BigDecimal valorPago = precoBaseCenario
            .multiply(classeCabine.getMultiplicadorPreco())
            .setScale(2, RoundingMode.HALF_UP);

        String comprovante = "NB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Passagem passagem = new Passagem(
            viagem,
            passageiro,
            dto.assentoEscolhido(),
            dto.usaRotaLumica(),
            valorPago,
            OffsetDateTime.now(ZoneOffset.UTC),
            comprovante
        );
        return paraDTO(passagemRepository.save(passagem));
    }

    @Transactional(readOnly = true)
    public List<PassagemResponseDTO> listarMinhas(UUID passageiroId) {
        return passagemRepository.findPorPassageiro(passageiroId).stream()
            .map(this::paraDTO)
            .toList();
    }

    @Transactional
    public void excluir(Long passagemId, UUID passageiroId) {
        Passagem passagem = passagemRepository.findById(passagemId)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Passagem não encontrada."));
        if (!passagem.getPassageiro().getId().equals(passageiroId)) {
            throw new RegraDeNegocioException("Você só pode remover suas próprias passagens.");
        }

        passagemRepository.delete(passagem);
    }

    private List<String> lerAssentosOcupados(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException ex) {
            throw new RegraDeNegocioException("Mapa de assentos corrompido.");
        }
    }

    private PassagemResponseDTO paraDTO(Passagem p) {
        return new PassagemResponseDTO(
            p.getId(),
            p.getViagem().getId(),
            p.getViagem().getPlanetaEmbarque().getNome(),
            p.getViagem().getPlanetaDesembarque().getNome(),
            p.getAssentoEscolhido(),
            p.getUsaRotaLumica(),
            p.getValorPago(),
            p.getDataCompra(),
            p.getCodigoComprovante()
        );
    }
}
