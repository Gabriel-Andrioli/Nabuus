# Nabuus — Simulador Interativo de Viagens Interestelares

> *"Como seria viajar pelas estrelas?"* — Plataforma de simulação de viagens espaciais inspirada na experiência de compra de passagens rodoviárias (**ClickBus**), exibindo duração a bordo ($\Delta t_{\text{bordo}}$), dívida temporal relativística ($D_{\text{temporal}}$), comparação entre viagens **Com** e **Sem Rota Lúmica**, ocupação de poltronas por categoria de conforto e **Mapa Galáctico 2D**.

---

## Estrutura do Repositório

```text
Nabuus/
├── data/
│   └── nabuus_planetas.csv          # Catálogo real com 50 planetas, coordenadas (RA/Dec) e distâncias
├── context/
│   ├── gerar_diagrama.py            # Gerador automático de diagramas PlantUML (.txt -> .pdf vetorial e .png)
│   ├── c4_diagram/                  # Diagramas C4 Nível 1 (Contexto) e Nível 2 (Contêineres)
│   ├── use_case_diagram/            # Diagrama de Casos de Uso
│   ├── class_diagram/               # Diagrama de Classes UML
│   ├── flow_diagram/                # Diagramas de Atividades (AD01, AD02 e AD03)
│   ├── sequence_diagram/            # Diagrama de Sequência
│   ├── er_diagram/                  # Diagrama Entidade-Relacionamento (DER PostgreSQL)
│   ├── docs/                        # Documento de Modelagem em LaTeX (.tex/.txt) e script compilador
│   └── sci_sources/                 # Fontes e análises científicas de apoio
└── motor/                           # Microsserviço Python (FastAPI) do Motor de Cálculo Físico
    ├── app/                         # Módulos de física relativística, geometria, rotas, preço, ocupação e API
    ├── tests/                       # Suíte de testes unitários, integração com CSV real e teste de carga
    └── requirements.txt
```

---

## 1. Como rodar o Motor de Cálculo Físico (`motor/`)

### Pré-requisitos
- Python 3.11+

### Instalação das dependências
```powershell
pip install -r motor/requirements.txt
```

### Iniciar o servidor da API REST (porta 8001)
```powershell
cd motor
uvicorn app.main:app --reload --port 8001
```

Com o servidor rodando, a documentação interativa (Swagger / OpenAPI) fica disponível em `http://localhost:8001/docs` e o healthcheck em `http://localhost:8001/health`.

### Endpoints disponíveis
| Método | Rota | Descrição |
|--------|------|-----------|
| `GET`  | `/health` | Verificação de saúde do microsserviço |
| `GET`  | `/v1/propulsoes` | Catálogo de referência de tipos de propulsão (`QUIMICA`, `VELA_SOLAR`, `VELA_LASER`, `FISSAO_PULSADA`, `FUSAO`, `ANTIMATERIA`) |
| `POST` | `/v1/precos/sugerir` | Sugere `precoBase` e `custoAnoLuz` conforme o tipo de propulsão e conforto |
| `POST` | `/v1/viagens/simular` | **Cálculo único na publicação:** valida autonomia, define paradas (regra gulosa com `cKDTree`), calcula duração a bordo, dívida temporal, preços finais (`semLumica` e `comLumica`) e ocupação inicial de assentos |
| `POST` | `/v1/rotas/tracar` | Retorna os trechos detalhados e coordenadas para o Mapa Galáctico 2D |
| `POST` | `/v1/ocupacao/perfis` | Gera a ocupação e perfis determinísticos por `viagemId` |

### Executar a suíte de testes automatizados
Na raiz do repositório:
```powershell
$env:PYTHONPATH="motor"
pytest motor/tests -v
```

---

## 2. Como gerar os Diagramas UML / C4 / DER (`context/`)

Os arquivos-fonte dos diagramas ficam versionados como `.txt` (código PlantUML) e as imagens `.png` e `.pdf` vetoriais são geradas pelo script `context/gerar_diagrama.py` (requer conexão com a internet ou `plantuml.jar` local + `pymupdf` para conversão vetorial):

```powershell
# Gera PDF vetorial + PNG de todos os diagramas (C4, Classes, Casos de Uso, Fluxos, Sequência e DER)
python context/gerar_diagrama.py

# Gera apenas PDFs vetoriais
python context/gerar_diagrama.py --pdf

# Gera apenas os diagramas de uma pasta específica (ex.: flow_diagram ou c4_diagram)
python context/gerar_diagrama.py flow_diagram

# Modo contínuo: observa alterações nos .txt e regera automaticamente ao salvar
python context/gerar_diagrama.py --watch
```

---

## 3. Como compilar o Documento de Modelagem em LaTeX (`context/docs/`)

O código-fonte LaTeX fica em `context/docs/documento_modelagem.tex` (sincronizado com `documento_modelagem.txt`). Para compilar o `documento_modelagem.pdf`:

```powershell
python context/docs/gerar_documento.py
```
*(Utiliza `xelatex`/`lualatex` local se estiver instalado na máquina ou compila automaticamente via TeX Live remoto).*
