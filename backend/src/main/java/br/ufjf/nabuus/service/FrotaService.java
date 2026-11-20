package br.ufjf.nabuus.service;

import br.ufjf.nabuus.domain.entity.Fretista;
import br.ufjf.nabuus.domain.entity.OnibusEspacial;
import br.ufjf.nabuus.domain.entity.TipoPropulsao;
import br.ufjf.nabuus.dto.logistica.OnibusEspacialDTO;
import br.ufjf.nabuus.exception.RecursoNaoEncontradoException;
import br.ufjf.nabuus.exception.RegraDeNegocioException;
import br.ufjf.nabuus.repository.FretistaRepository;
import br.ufjf.nabuus.repository.OnibusEspacialRepository;
import br.ufjf.nabuus.repository.TipoPropulsaoRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FrotaService {

    private final OnibusEspacialRepository onibusRepository;
    private final FretistaRepository fretistaRepository;
    private final TipoPropulsaoRepository propulsaoRepository;

    public FrotaService(
        OnibusEspacialRepository onibusRepository,
        FretistaRepository fretistaRepository,
        TipoPropulsaoRepository propulsaoRepository
    ) {
        this.onibusRepository = onibusRepository;
        this.fretistaRepository = fretistaRepository;
        this.propulsaoRepository = propulsaoRepository;
    }

    @Transactional(readOnly = true)
    public List<OnibusEspacialDTO> listarPorFretista(UUID fretistaId) {
        return onibusRepository.findAtivosPorFretista(fretistaId).stream()
            .map(this::paraDTO)
            .toList();
    }

    @Transactional
    public OnibusEspacialDTO cadastrar(OnibusEspacialDTO dto, UUID fretistaId) {
        Fretista fretista = fretistaRepository.findById(fretistaId)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Fretista não encontrado."));
        TipoPropulsao propulsao = propulsaoRepository.findById(dto.tipoPropulsaoId())
            .orElseThrow(() -> new RecursoNaoEncontradoException("Tipo de propulsão não encontrado."));

        OnibusEspacial salvo = onibusRepository.save(
            new OnibusEspacial(fretista, propulsao, dto.identificacao(), dto.totalAssentos())
        );
        return paraDTO(salvo);
    }

    @Transactional
    public void inativar(Long id, UUID fretistaId) {
        OnibusEspacial onibus = onibusRepository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Ônibus espacial não encontrado."));
        if (!onibus.getFretista().getId().equals(fretistaId)) {
            throw new RegraDeNegocioException("Você só pode remover ônibus da sua própria frota.");
        }
        onibus.setAtivo(Boolean.FALSE);
        onibusRepository.save(onibus);
    }

    private OnibusEspacialDTO paraDTO(OnibusEspacial o) {
        return new OnibusEspacialDTO(
            o.getId(),
            o.getIdentificacao(),
            o.getTipoPropulsao().getId(),
            o.getTipoPropulsao().getNome(),
            o.getTotalAssentos(),
            o.getAtivo()
        );
    }
}
