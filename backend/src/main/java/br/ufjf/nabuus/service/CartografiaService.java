package br.ufjf.nabuus.service;

import br.ufjf.nabuus.domain.entity.Astronomo;
import br.ufjf.nabuus.domain.entity.Planeta;
import br.ufjf.nabuus.domain.entity.RotaLumica;
import br.ufjf.nabuus.domain.entity.SistemaSolar;
import br.ufjf.nabuus.domain.entity.TipoPropulsao;
import br.ufjf.nabuus.domain.enums.StatusViagem;
import br.ufjf.nabuus.dto.cartografia.PlanetaDTO;
import br.ufjf.nabuus.dto.cartografia.RotaLumicaDTO;
import br.ufjf.nabuus.dto.cartografia.SistemaSolarDTO;
import br.ufjf.nabuus.dto.cartografia.TipoPropulsaoDTO;
import br.ufjf.nabuus.exception.RecursoNaoEncontradoException;
import br.ufjf.nabuus.repository.AstronomoRepository;
import br.ufjf.nabuus.repository.PlanetaRepository;
import br.ufjf.nabuus.repository.RotaLumicaRepository;
import br.ufjf.nabuus.repository.SistemaSolarRepository;
import br.ufjf.nabuus.repository.TipoPropulsaoRepository;
import br.ufjf.nabuus.repository.ViagemRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CartografiaService {

    private final SistemaSolarRepository sistemaSolarRepository;
    private final PlanetaRepository planetaRepository;
    private final RotaLumicaRepository rotaLumicaRepository;
    private final TipoPropulsaoRepository tipoPropulsaoRepository;
    private final AstronomoRepository astronomoRepository;
    private final ViagemRepository viagemRepository;

    public CartografiaService(
        SistemaSolarRepository sistemaSolarRepository,
        PlanetaRepository planetaRepository,
        RotaLumicaRepository rotaLumicaRepository,
        TipoPropulsaoRepository tipoPropulsaoRepository,
        AstronomoRepository astronomoRepository,
        ViagemRepository viagemRepository
    ) {
        this.sistemaSolarRepository = sistemaSolarRepository;
        this.planetaRepository = planetaRepository;
        this.rotaLumicaRepository = rotaLumicaRepository;
        this.tipoPropulsaoRepository = tipoPropulsaoRepository;
        this.astronomoRepository = astronomoRepository;
        this.viagemRepository = viagemRepository;
    }

    @Transactional(readOnly = true)
    public List<SistemaSolarDTO> listarSistemas() {
        return sistemaSolarRepository.findAll().stream()
            .map(s -> new SistemaSolarDTO(
                s.getId(), s.getNome(), s.getEstrelaPrincipal(),
                s.getCoordenadaRA(), s.getCoordenadaDec(), s.getDistanciaSolAnosLuz()
            ))
            .toList();
    }

    @Transactional
    public SistemaSolarDTO cadastrarSistema(SistemaSolarDTO dto, UUID astronomoId) {
        Astronomo astronomo = buscarAstronomo(astronomoId);
        SistemaSolar salvo = sistemaSolarRepository.save(new SistemaSolar(
            astronomo, dto.nome(), dto.estrelaPrincipal(),
            dto.coordenadaRA(), dto.coordenadaDec(), dto.distanciaSolAnosLuz()
        ));
        return new SistemaSolarDTO(
            salvo.getId(), salvo.getNome(), salvo.getEstrelaPrincipal(),
            salvo.getCoordenadaRA(), salvo.getCoordenadaDec(), salvo.getDistanciaSolAnosLuz()
        );
    }

    @Transactional(readOnly = true)
    public List<PlanetaDTO> listarPlanetas() {
        return planetaRepository.findAllComSistema().stream()
            .map(p -> new PlanetaDTO(
                p.getId(), p.getSistemaSolar().getId(), p.getSistemaSolar().getNome(),
                p.getNome(), p.getRaioBase(), p.getMassaBase(), p.getZonaHabitavel(),
                p.getDistanciaEstrelaUA(), p.getPossuiPostoRecarga(), p.getDescricaoNabuus()
            ))
            .toList();
    }

    @Transactional
    public PlanetaDTO cadastrarPlaneta(PlanetaDTO dto) {
        SistemaSolar sistema = sistemaSolarRepository.findById(dto.sistemaSolarId())
            .orElseThrow(() -> new RecursoNaoEncontradoException("Sistema solar não encontrado."));
        Planeta salvo = planetaRepository.save(new Planeta(
            sistema, dto.nome(), dto.raioBase(), dto.massaBase(),
            dto.zonaHabitavel(), dto.distanciaEstrelaUA(), dto.possuiPostoRecarga(), dto.descricaoNabuus()
        ));
        return new PlanetaDTO(
            salvo.getId(), sistema.getId(), sistema.getNome(),
            salvo.getNome(), salvo.getRaioBase(), salvo.getMassaBase(), salvo.getZonaHabitavel(),
            salvo.getDistanciaEstrelaUA(), salvo.getPossuiPostoRecarga(), salvo.getDescricaoNabuus()
        );
    }

    @Transactional(readOnly = true)
    public List<TipoPropulsaoDTO> listarPropulsoes() {
        return tipoPropulsaoRepository.findAll().stream()
            .map(p -> new TipoPropulsaoDTO(
                p.getId(), p.getCodigo(), p.getNome(), p.getAceleracaoG(), p.getVelocidadeCruzeiroC(),
                p.getAutonomiaAnosLuz(), p.getCategoriaConforto(), p.getPrecoBaseReferencia(), p.getCustoAnoLuzReferencia()
            ))
            .toList();
    }

    @Transactional
    public TipoPropulsaoDTO cadastrarPropulsao(TipoPropulsaoDTO dto, UUID astronomoId) {
        Astronomo astronomo = buscarAstronomo(astronomoId);
        TipoPropulsao salvo = tipoPropulsaoRepository.save(new TipoPropulsao(
            astronomo, dto.codigo(), dto.nome(), dto.aceleracaoG(), dto.velocidadeCruzeiroC(),
            dto.autonomiaAnosLuz(), dto.categoriaConforto(), dto.precoBaseReferencia(), dto.custoAnoLuzReferencia()
        ));
        return new TipoPropulsaoDTO(
            salvo.getId(), salvo.getCodigo(), salvo.getNome(), salvo.getAceleracaoG(), salvo.getVelocidadeCruzeiroC(),
            salvo.getAutonomiaAnosLuz(), salvo.getCategoriaConforto(), salvo.getPrecoBaseReferencia(), salvo.getCustoAnoLuzReferencia()
        );
    }

    @Transactional(readOnly = true)
    public List<RotaLumicaDTO> listarRotasLumicas() {
        return rotaLumicaRepository.findAllComSistemas().stream()
            .map(this::paraRotaDTO)
            .toList();
    }

    @Transactional
    public RotaLumicaDTO cadastrarRotaLumica(RotaLumicaDTO dto, UUID astronomoId) {
        Astronomo astronomo = buscarAstronomo(astronomoId);
        SistemaSolar origem = sistemaSolarRepository.findById(dto.sistemaOrigemId())
            .orElseThrow(() -> new RecursoNaoEncontradoException("Sistema de origem não encontrado."));
        SistemaSolar destino = sistemaSolarRepository.findById(dto.sistemaDestinoId())
            .orElseThrow(() -> new RecursoNaoEncontradoException("Sistema de destino não encontrado."));
        RotaLumica salvo = rotaLumicaRepository.save(
            new RotaLumica(astronomo, origem, destino, dto.velocidadeC(), dto.pedagio(), dto.ativa())
        );
        return paraRotaDTO(salvo);
    }

    /** RF-05: Ao desativar uma Rota Lúmica, suspende automaticamente todas as viagens ativas vinculadas. */
    @Transactional
    public RotaLumicaDTO alternarStatusRotaLumica(Long rotaId, boolean ativa) {
        RotaLumica rota = rotaLumicaRepository.findById(rotaId)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Rota lúmica não encontrada."));
        rota.setAtiva(ativa);
        if (!ativa) {
            viagemRepository.suspenderPorRotaLumica(rotaId, StatusViagem.PUBLICADA, StatusViagem.SUSPENSA);
        }
        return paraRotaDTO(rotaLumicaRepository.save(rota));
    }

    private Astronomo buscarAstronomo(UUID id) {
        return astronomoRepository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Astrônomo não encontrado."));
    }

    private RotaLumicaDTO paraRotaDTO(RotaLumica r) {
        return new RotaLumicaDTO(
            r.getId(), r.getSistemaOrigem().getId(), r.getSistemaOrigem().getNome(),
            r.getSistemaDestino().getId(), r.getSistemaDestino().getNome(),
            r.getVelocidadeC(), r.getPedagio(), r.getAtiva()
        );
    }
}
