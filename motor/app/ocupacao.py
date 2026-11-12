"""RF-22: geração procedural determinística de assentos ocupados e perfis."""
import random

from app.config import ASSENTOS_POR_FILEIRA, TAXA_OCUPACAO, VARIACAO_OCUPACAO

_NOMES = [
    "Aeloria Vance", "Breno Kael", "Cora Lindqvist", "Davi Solis", "Elena Rostova",
    "Farid Al-Mansoor", "Gael Takahara", "Helena Novak", "Ícaro Menezes", "Juno Sato",
    "Kairos Vex", "Lia Drummond", "Milo Chen", "Nádia Kovács", "Orion Baptista",
    "Petra Volkov", "Quim Arantes", "Rhea Castellanos", "Soren Lindholm", "Talia Okafor",
    "Ulisses Prado", "Vera Stein", "Wren Barreto", "Ximena Paz", "Yuri Belov", "Zara Haddad",
]

_TRACOS = {
    "ECONOMICA": [
        "Minerador de cinturão em fim de contrato",
        "Estudante de xenobiologia com bolsa",
        "Mochileiro colecionando carimbos orbitais",
        "Técnico de manutenção de escudos",
        "Colono migrando com toda a família",
        "Comerciante de sementes hidropônicas",
    ],
    "EXECUTIVA": [
        "Engenheira de rotas lúmicas em inspeção",
        "Diplomata comercial da Federação Solar",
        "Cartógrafo estelar autônomo",
        "Auditor de postos de recarga",
        "Pesquisadora de propulsão a fusão",
        "Jornalista cobrindo a fronteira interestelar",
    ],
    "LUXO": [
        "Magnata da mineração de hélio-3",
        "Colecionador de artefatos pré-lúmicos",
        "Turista temporal evitando um século entediante",
        "Embaixadora plenipotenciária em férias",
        "Herdeiro de frota interplanetária",
        "Astrofísico laureado a caminho de palestra",
    ],
}


def listar_todos_assentos(total_assentos: int) -> list[str]:
    cols = ASSENTOS_POR_FILEIRA
    n_cols = len(cols)
    return [f"{i // n_cols + 1}{cols[i % n_cols]}" for i in range(total_assentos)]


def gerar_assentos_ocupados(
    viagem_id: int, total_assentos: int, categoria_conforto: str
) -> list[str]:
    """Seleciona de forma determinística os assentos já ocupados na publicação."""
    if total_assentos <= 0:
        return []
    rng = random.Random(viagem_id)
    taxa_base = TAXA_OCUPACAO.get(categoria_conforto.upper(), 0.6)
    taxa = min(0.95, max(0.05, taxa_base + rng.uniform(-VARIACAO_OCUPACAO, VARIACAO_OCUPACAO)))
    qtd = round(total_assentos * taxa)
    todos = listar_todos_assentos(total_assentos)
    escolhidos = rng.sample(todos, k=min(qtd, len(todos)))
    escolhidos.sort(key=lambda s: (int(s[:-1]), s[-1]))
    return escolhidos


def gerar_perfis(
    viagem_id: int, assentos: list[str], categoria_conforto: str
) -> list[dict[str, str]]:
    """Gera nome e traço de personalidade para cada assento ocupado."""
    tracos = _TRACOS.get(categoria_conforto.upper(), _TRACOS["ECONOMICA"])
    perfis = []
    for idx, assento in enumerate(assentos):
        rng = random.Random(f"{viagem_id}:{assento}:{idx}")
        perfis.append(
            {
                "poltrona": assento,
                "nomeGerado": rng.choice(_NOMES),
                "tracoPersonalidade": rng.choice(tracos),
            }
        )
    return perfis

