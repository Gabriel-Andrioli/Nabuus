package br.ufjf.nabuus.service;

import br.ufjf.nabuus.client.MotorCalculoClient;
import br.ufjf.nabuus.domain.entity.Fretista;
import br.ufjf.nabuus.domain.entity.OnibusEspacial;
import br.ufjf.nabuus.domain.entity.Planeta;
import br.ufjf.nabuus.domain.entity.RotaLumica;
import br.ufjf.nabuus.domain.entity.TipoPropulsao;
import br.ufjf.nabuus.domain.entity.Viagem;
import br.ufjf.nabuus.domain.enums.StatusViagem;
import br.ufjf.nabuus.dto.logistica.ViagemPublicarRequestDTO;
import br.ufjf.nabuus.dto.logistica.ViagemResponseDTO;
import br.ufjf.nabuus.dto.motor.CenarioSimuladoDTO;
import br.ufjf.nabuus.dto.motor.MotorNaveDTO;
import br.ufjf.nabuus.dto.motor.MotorPlanetaDTO;
import br.ufjf.nabuus.dto.motor.MotorRotaLumicaDTO;
import br.ufjf.nabuus.dto.motor.ResultadoCenariosDTO;
import br.ufjf.nabuus.dto.motor.RotaDetalhadaResponseDTO;
import br.ufjf.nabuus.dto.motor.SimulacaoRequestDTO;
import br.ufjf.nabuus.dto.motor.SugestaoPrecoRequestDTO;
import br.ufjf.nabuus.dto.motor.SugestaoPrecoResponseDTO;
import br.ufjf.nabuus.exception.RecursoNaoEncontradoException;
import br.ufjf.nabuus.exception.RegraDeNegocioException;
import br.ufjf.nabuus.repository.FretistaRepository;
import br.ufjf.nabuus.repository.OnibusEspacialRepository;
import br.ufjf.nabuus.repository.PlanetaRepository;
import br.ufjf.nabuus.repository.RotaLumicaRepository;
import br.ufjf.nabuus.repository.TipoPropulsaoRepository;
import br.ufjf.nabuus.repository.ViagemRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ViagemService {

    private final ViagemRepository viagemRepository;
    private final FretistaRepository fretistaRepository;
    private final OnibusEspacialRepository onibusRepository;
    private final PlanetaRepository planetaRepository;
    private final RotaLumicaRepository rotaLumicaRepository;
    private final TipoPropulsaoRepository tipoPropulsaoRepository;
    private final MotorCalculoClient motorClient;
    private final ObjectMapper objectMapper;

    public ViagemService(
        ViagemRepository viagemRepository,
        FretistaRepository fretistaRepository,
        OnibusEspacialRepository onibusRepository,
        PlanetaRepository planetaRepository,
        RotaLumicaRepository rotaLumicaRepository,
        TipoPropulsaoRepository tipoPropulsaoRepository,
        MotorCalculoClient motorClient,
        ObjectMapper objectMapper
    ) {
        this.viagemRepository = viagemRepository;
        this.fretistaRepository = fretistaRepository;
        this.onibusRepository = onibusRepository;
        this.planetaRepository = planetaRepository;
        this.rotaLumicaRepository = rotaLumicaRepository;
        this.tipoPropulsaoRepository = tipoPropulsaoRepository;
        this.motorClient = motorClient;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public SugestaoPrecoResponseDTO sugerirPreco(Long tipoPropulsaoId) {
        TipoPropulsao prop = tipoPropulsaoRepository.findById(tipoPropulsaoId)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Tipo de propulsão não encontrado."));
        return motorClient.sugerirPreco(new SugestaoPrecoRequestDTO(
            prop.getPrecoBaseReferencia(),
            prop.getCustoAnoLuzReferencia(),
            prop.getCategoriaConforto()
        ));
    }

    /** Publica a viagem acionando o Motor Físico uma única vez e persistindo cenários, rota 2D e ocupação. */
    @Transactional
    public ViagemResponseDTO publicar(ViagemPublicarRequestDTO dto, UUID fretistaId) {
        if (dto.planetaEmbarqueId().equals(dto.planetaDesembarqueId())) {
            throw new RegraDeNegocioException("Planeta de embarque e desembarque devem ser diferentes.");
        }
        Fretista fretista = fretistaRepository.findById(fretistaId)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Fretista não encontrado."));
        OnibusEspacial onibus = onibusRepository.findById(dto.onibusEspacialId())
            .orElseThrow(() -> new RecursoNaoEncontradoException("Ônibus espacial não encontrado."));
        Planeta origem = planetaRepository.findById(dto.planetaEmbarqueId())
            .orElseThrow(() -> new RecursoNaoEncontradoException("Planeta de embarque não encontrado."));
        Planeta destino = planetaRepository.findById(dto.planetaDesembarqueId())
            .orElseThrow(() -> new RecursoNaoEncontradoException("Planeta de desembarque não encontrado."));

        if (!onibus.getFretista().getId().equals(fretistaId)) {
            throw new RegraDeNegocioException("Você só pode publicar viagens utilizando ônibus da sua frota.");
        }

        List<MotorPlanetaDTO> postos = planetaRepository.findAllPostosRecarga().stream()
            .map(this::paraMotorPlaneta)
            .toList();
        RotaLumica rotaLumica = rotaLumicaRepository.findAtivaEntreSistemas(
            origem.getSistemaSolar().getId(),
            destino.getSistemaSolar().getId()
        ).orElse(null);

        SimulacaoRequestDTO simulacaoReq = new SimulacaoRequestDTO(
            System.currentTimeMillis(),
            paraMotorPlaneta(origem),
            paraMotorPlaneta(destino),
            new MotorNaveDTO(
                onibus.getTipoPropulsao().getAceleracaoG(),
                onibus.getVelocidadeCruzeiroC(),
                onibus.getTipoPropulsao().getAutonomiaAnosLuz(),
                onibus.getTipoPropulsao().getCategoriaConforto(),
                onibus.getTotalAssentos()
            ),
            dto.precoBase().setScale(2, RoundingMode.HALF_UP),
            dto.custoAnoLuz().setScale(2, RoundingMode.HALF_UP),
            postos,
            rotaLumica != null
                ? new MotorRotaLumicaDTO(rotaLumica.getId(), rotaLumica.getVelocidadeC(), rotaLumica.getPedagio(), rotaLumica.getAtiva())
                : null
        );

        ResultadoCenariosDTO resultado = motorClient.simularViagem(simulacaoReq);
        boolean semViavel = Boolean.TRUE.equals(resultado.semLumica().viavel());
        boolean comViavel = Boolean.TRUE.equals(resultado.comLumica().viavel());
        if (!semViavel && !comViavel) {
            throw new RegraDeNegocioException(resultado.semLumica().motivoInviabilidade());
        }

        RotaDetalhadaResponseDTO rotaDetalhada = motorClient.tracarRota(simulacaoReq);

        Viagem viagem = new Viagem(
            fretista, onibus, origem, destino, rotaLumica,
            dto.dataPartida(), StatusViagem.PUBLICADA,
            dto.precoBase().setScale(2, RoundingMode.HALF_UP),
            dto.custoAnoLuz().setScale(2, RoundingMode.HALF_UP)
        );
        preencherCenarios(viagem, resultado, rotaDetalhada);

        return paraResponseDTO(viagemRepository.save(viagem));
    }

    @Transactional(readOnly = true)
    public List<ViagemResponseDTO> buscarPublicadas(Long origemId, Long destinoId) {
        return viagemRepository.findPublicadas(StatusViagem.PUBLICADA, origemId, destinoId).stream()
            .map(this::paraResponseDTO)
            .toList();
    }

    @Transactional(readOnly = true)
    public ViagemResponseDTO buscarPorId(Long id) {
        Viagem viagem = viagemRepository.findDetalhadaPorId(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Viagem não encontrada."));
        return paraResponseDTO(viagem);
    }

    @Transactional(readOnly = true)
    public List<ViagemResponseDTO> listarDoFretista(UUID fretistaId) {
        return viagemRepository.findPorFretista(fretistaId).stream()
            .map(this::paraResponseDTO)
            .toList();
    }

    private void preencherCenarios(Viagem v, ResultadoCenariosDTO res, RotaDetalhadaResponseDTO rota) {
        CenarioSimuladoDTO sem = res.semLumica();
        CenarioSimuladoDTO com = res.comLumica();

        v.setViavelSemLumica(Boolean.TRUE.equals(sem.viavel()));
        v.setDuracaoBordoAnosSemLumica(sem.duracaoBordoAnos());
        v.setDividaTemporalAnosSemLumica(sem.dividaTemporalAnos());
        v.setPrecoSemLumica(sem.precoFinal() != null ? sem.precoFinal().setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO);
        v.setParadasReabastecimento(sem.paradas() != null ? sem.paradas() : 0);

        v.setViavelComLumica(Boolean.TRUE.equals(com.viavel()));
        v.setDuracaoBordoAnosComLumica(com.duracaoBordoAnos());
        v.setDividaTemporalAnosComLumica(com.dividaTemporalAnos());
        v.setPrecoComLumica(com.precoFinal() != null ? com.precoFinal().setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO);

        v.setRota2dJson(serializarJson(rota));
        v.setAssentosOcupadosJson(serializarJson(res.assentosOcupados()));
    }

    private MotorPlanetaDTO paraMotorPlaneta(Planeta p) {
        return new MotorPlanetaDTO(
            p.getId(),
            p.getSistemaSolar().getId(),
            p.getSistemaSolar().getCoordenadaRA(),
            p.getSistemaSolar().getCoordenadaDec(),
            p.getSistemaSolar().getDistanciaSolAnosLuz(),
            p.getDistanciaEstrelaUA(),
            p.getNome()
        );
    }

    private String serializarJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException ex) {
            throw new RegraDeNegocioException("Falha ao serializar dados da simulação.");
        }
    }

    private ViagemResponseDTO paraResponseDTO(Viagem v) {
        TipoPropulsao prop = v.getOnibusEspacial().getTipoPropulsao();
        return new ViagemResponseDTO(
            v.getId(), v.getStatus(), v.getDataPartida(),
            v.getOnibusEspacial().getIdentificacao(), prop.getNome(),
            v.getOnibusEspacial().getVelocidadeCruzeiroC(), prop.getAutonomiaAnosLuz(),
            prop.getCategoriaConforto(), v.getOnibusEspacial().getTotalAssentos(),
            v.getPlanetaEmbarque().getId(), v.getPlanetaEmbarque().getNome(),
            v.getPlanetaDesembarque().getId(), v.getPlanetaDesembarque().getNome(),
            v.getPrecoBase(), v.getCustoAnoLuz(),
            v.getViavelSemLumica(), v.getDuracaoBordoAnosSemLumica(), v.getDividaTemporalAnosSemLumica(),
            v.getPrecoSemLumica(), v.getParadasReabastecimento(),
            v.getViavelComLumica(), v.getDuracaoBordoAnosComLumica(), v.getDividaTemporalAnosComLumica(),
            v.getPrecoComLumica(), v.getRota2dJson(), v.getAssentosOcupadosJson()
        );
    }
}
