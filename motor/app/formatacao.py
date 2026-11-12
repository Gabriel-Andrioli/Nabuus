"""RF-23: grandezas em linguagem acessível (pt-BR)."""
from app.config import ANO

_ESCALAS = [
    (1e12, "trilhão", "trilhões"),
    (1e9, "bilhão", "bilhões"),
    (1e6, "milhão", "milhões"),
    (1e3, "mil", "mil"),
]


def _num(valor: float) -> str:
    texto = f"{valor:,.1f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return texto[:-2] if texto.endswith(",0") else texto


def _plural(valor: float, singular: str, plural: str) -> str:
    return f"{_num(valor)} {singular if round(valor, 1) < 2 else plural}"


def tempo(segundos: float) -> str:
    if segundos < 0:
        segundos = 0.0
    anos = segundos / ANO
    if anos >= 1e3:
        for fator, sing, plur in _ESCALAS:
            if anos >= fator:
                v = anos / fator
                nome = sing if round(v, 1) < 2 else plur
                return f"{_num(v)} {nome} de anos"
    if anos >= 1:
        return _plural(anos, "ano", "anos")
    dias = segundos / 86_400
    if dias >= 30:
        return _plural(dias / 30.4375, "mês", "meses")
    if dias >= 1:
        return _plural(dias, "dia", "dias")
    horas = segundos / 3_600
    if horas >= 1:
        return _plural(horas, "hora", "horas")
    return _plural(segundos / 60, "minuto", "minutos")


def distancia_al(anos_luz: float) -> str:
    if anos_luz >= 1e3:
        for fator, sing, plur in _ESCALAS:
            if anos_luz >= fator:
                v = anos_luz / fator
                nome = sing if round(v, 1) < 2 else plur
                return f"{_num(v)} {nome} de anos-luz"
    if anos_luz >= 0.01:
        return _plural(anos_luz, "ano-luz", "anos-luz")
    # Escala intrasistema em UA
    ua = anos_luz * 63_241.077
    return f"{_num(ua)} UA"

