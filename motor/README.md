# Motor de Cálculo Físico — Nabuus

Microsserviço científico stateless em Python (ASGI / FastAPI + Uvicorn) responsável por:
- **RF-18 / RF-19:** Cinemática relativística (aceleração própria constante, cruzeiro e frenagem simétrica) e cálculo de dívida temporal ($D_{\text{temporal}} = \Delta t_{\text{estacionário}} - \Delta t_{\text{bordo}}$).
- **RF-20 / RF-21:** Trajetórias **sem rota lúmica** (planeta → planeta direto com paradas gulosas no posto de recarga mais avançado via `scipy.spatial.cKDTree`) e **com rota lúmica** (planeta → estrela → portal lúmico → estrela → planeta).
- **RF-09:** Sugestão de preço base e custo por ano-luz a partir do tipo de propulsão/conforto e cálculo do preço final.
- **RF-22:** Ocupação de assentos e geração procedural determinística de co-passageiros.
- **RF-23:** Conversão de grandezas astronômicas e temporais para linguagem leiga.

---

## Como executar

Na raiz de `motor/`:

```powershell
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

Para rodar a suíte de testes:

```powershell
$env:PYTHONPATH="motor"
pytest motor/tests -v
```

---

## Endpoints REST

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET`  | `/health` | Verificação de saúde do microsserviço |
| `GET`  | `/v1/propulsoes` | Catálogo de referência de tipos de propulsão para o Astrônomo |
| `POST` | `/v1/precos/sugerir` | Sugere `precoBase` e `custoAnoLuz` conforme tipo de propulsão e conforto |
| `POST` | `/v1/viagens/simular` | Calcula os cenários `semLumica` e `comLumica`, valida autonomia, calcula preços e assentos ocupados |
| `POST` | `/v1/rotas/tracar` | Retorna os trechos detalhados e coordenadas 3D para o mapa galáctico (RF-17) |
| `POST` | `/v1/ocupacao/perfis` | Gera os perfis determinísticos (`poltrona`, `nomeGerado`, `tracoPersonalidade`) |

---

## Exemplo ponta a ponta (Terra → Proxima Centauri b)

### Requisição `POST /v1/viagens/simular`

```json
{
  "viagemId": 42,
  "origem": {
    "planetaId": 3,
    "sistemaId": 0,
    "ra": 0.0,
    "dec": 0.0,
    "distanciaSolAnosLuz": 0.0,
    "distanciaEstrelaUA": 1.0,
    "nome": "Terra"
  },
  "destino": {
    "planetaId": 9,
    "sistemaId": 1,
    "ra": 217.42895,
    "dec": -62.67948,
    "distanciaSolAnosLuz": 4.2465,
    "distanciaEstrelaUA": 0.0485,
    "nome": "Proxima Centauri b"
  },
  "nave": {
    "aceleracaoG": 0.05,
    "velocidadeCruzeiroC": 0.12,
    "autonomiaAnosLuz": 8.0,
    "categoriaConforto": "EXECUTIVA",
    "totalAssentos": 80
  },
  "precoBase": 4200.0,
  "custoAnoLuz": 750.0,
  "postosRecarga": [],
  "rotaLumica": {
    "id": 1,
    "velocidadeC": 0.8,
    "pedagio": 50000.0,
    "ativa": true
  }
}
```

