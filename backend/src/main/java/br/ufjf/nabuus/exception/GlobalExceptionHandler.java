package br.ufjf.nabuus.exception;

import java.net.URI;
import java.time.Instant;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.RestClientException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger LOGGER = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(RecursoNaoEncontradoException.class)
    public ProblemDetail handleNaoEncontrado(RecursoNaoEncontradoException ex) {
        return criarProblem(HttpStatus.NOT_FOUND, "recurso-nao-encontrado", "Recurso não encontrado", ex.getMessage());
    }

    @ExceptionHandler(RegraDeNegocioException.class)
    public ProblemDetail handleRegraNegocio(RegraDeNegocioException ex) {
        return criarProblem(HttpStatus.UNPROCESSABLE_ENTITY, "regra-de-negocio", "Regra de domínio violada", ex.getMessage());
    }

    @ExceptionHandler(ConflitoDeEstadoException.class)
    public ProblemDetail handleConflito(ConflitoDeEstadoException ex) {
        return criarProblem(HttpStatus.CONFLICT, "conflito-estado", "Conflito de estado do recurso", ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidacao(MethodArgumentNotValidException ex) {
        String detalhes = ex.getBindingResult().getFieldErrors().stream()
            .map(err -> err.getField() + ": " + err.getDefaultMessage())
            .collect(Collectors.joining("; "));
        return criarProblem(HttpStatus.BAD_REQUEST, "validacao-entrada", "Dados de entrada inválidos", detalhes);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ProblemDetail handleCredenciaisInvalidas() {
        return criarProblem(HttpStatus.UNAUTHORIZED, "nao-autorizado", "Falha de autenticação", "E-mail ou senha inválidos.");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAcessoNegado() {
        return criarProblem(HttpStatus.FORBIDDEN, "acesso-negado", "Acesso negado", "Seu perfil não tem permissão para esta operação.");
    }

    @ExceptionHandler(RestClientException.class)
    public ProblemDetail handleMotorIndisponivel(RestClientException ex) {
        LOGGER.error("Falha ao comunicar com o Motor de Cálculo Físico", ex);
        return criarProblem(
            HttpStatus.SERVICE_UNAVAILABLE,
            "motor-indisponivel",
            "Motor Físico indisponível",
            "Não foi possível processar o cálculo físico no momento."
        );
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleErroInesperado(Exception ex) {
        LOGGER.error("Erro inesperado no servidor Nabuus", ex);
        return criarProblem(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "erro-interno",
            "Erro interno do servidor",
            "Ocorreu uma falha inesperada ao processar a solicitação."
        );
    }

    private ProblemDetail criarProblem(HttpStatus status, String slug, String title, String detail) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(status, detail);
        pd.setType(URI.create("https://nabuus.space/erros/" + slug));
        pd.setTitle(title);
        pd.setProperty("timestamp", Instant.now());
        return pd;
    }
}
