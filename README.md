# Nabuus — Simulador Interativo de Viagens Interestelares

> *"Como seria viajar pelas estrelas?"* — Plataforma de simulação de viagens espaciais inspirada na experiência de compra de passagens rodoviárias (**ClickBus**), exibindo duração a bordo ($\Delta t_{\text{bordo}}$), dívida temporal relativística ($D_{\text{temporal}}$), comparação entre viagens **Com** e **Sem Rota Lúmica**, ocupação de poltronas por categoria de conforto e **Mapa Galáctico 2D**.

---

## Como rodar tudo com 1 comando (Docker Compose)

Esta é a forma recomendada para subir **PostgreSQL + Motor Físico (Python) + Back-end (Java) + Front-end (Nginx)** juntos a partir da raiz do repositório.

### Pré-requisitos
- Docker e Docker Compose v2 instalados (Docker Desktop ativo)

### Subir toda a aplicação
Na raiz do repositório (`Nabuus/`):
```powershell
docker compose up --build
```

Para executar em segundo plano (modo daemon), parar os contêineres ou reiniciar o banco do zero:
```powershell
# Subir em segundo plano
docker compose up -d --build

# Acompanhar logs
docker compose logs -f

# Parar os serviços (mantendo os dados do PostgreSQL)
docker compose down

# Parar os serviços e apagar o volume do banco PostgreSQL
docker compose down -v
```

### URLs de acesso
| Serviço | Porta | URL |
|---|---|---|
| **Front-end Web** (`frontend/` via Nginx) | `3000` | `http://localhost:3000` |
| **Back-end API / Swagger UI** (`backend/` Spring Boot) | `8080` | `http://localhost:8080/swagger-ui.html` |
| **Motor de Cálculo Físico / Docs** (`motor/` FastAPI) | `8001` | `http://localhost:8001/docs` (healthcheck em `/health`) |
| **Banco PostgreSQL 16** | `5432` | `localhost:5432` (banco `nabuus`, usuário/senha `nabuus`) |

> Variáveis de ambiente opcionais (`NABUUS_DB_NAME`, `NABUUS_DB_USER`, `NABUUS_DB_PASSWORD`, `NABUUS_JWT_SECRET`, `NABUUS_JWT_EXPIRATION_MS`) possuem valores padrão configurados no [docker-compose.yml](docker-compose.yml).

---

## Estrutura do Repositório

```text
Nabuus/
├── docker-compose.yml               # Orquestração completa: postgres + motor + backend + frontend
├── data/
│   └── nabuus_planetas.csv          # Catálogo real com 50 planetas, coordenadas (RA/Dec) e distâncias
├── frontend/                        # Interface Web estática (HTML, CSS BEM, ES6 Modules) + Nginx
│   ├── index.html
│   ├── pages/                       # Telas de rotas, detalhes, compra, astrônomo e fretista
│   ├── css/
│   ├── js/
│   ├── assets/
│   ├── tests/
│   ├── nginx.conf
│   └── Dockerfile
├── backend/                         # API REST Java 21 / Spring Boot 3.4 + Flyway + PostgreSQL
│   ├── src/
│   ├── pom.xml
│   ├── docker-compose.yml           # Compose isolado apenas para subir o PostgreSQL em dev local
│   └── Dockerfile
├── motor/                           # Microsserviço Python (FastAPI) do Motor de Cálculo Físico
│   ├── app/                         # Módulos de física relativística, geometria, rotas, preço, ocupação e API
│   ├── tests/                       # Suíte de testes unitários, integração com CSV real e teste de carga
│   ├── requirements.txt
│   └── Dockerfile
└── context/
    ├── gerar_diagrama.py            # Gerador automático de diagramas PlantUML (.txt -> .pdf vetorial e .png)
    ├── c4_diagram/                  # Diagramas C4 Nível 1 (Contexto) e Nível 2 (Contêineres)
    ├── use_case_diagram/            # Diagrama de Casos de Uso
    ├── class_diagram/               # Diagrama de Classes UML
    ├── flow_diagram/                # Diagramas de Atividades (AD01, AD02 e AD03)
    ├── sequence_diagram/            # Diagramas de Sequência (SD1..SD4)
    ├── er_diagram/                  # Diagrama Entidade-Relacionamento (DER PostgreSQL)
    ├── docs/                        # Documento de Modelagem em LaTeX (.tex/.txt) e script compilador
    └── sci_sources/                 # Fontes e análises científicas de apoio
```

---

## Execução Local sem Docker (por serviço)

### 1. Banco de Dados (`PostgreSQL 16`)
Se preferir rodar apenas o banco via Docker e os apps diretamente na máquina:
```powershell
docker compose -f backend/docker-compose.yml up -d
```
*(Ou garanta um PostgreSQL 16 local com banco `nabuus`, usuário `nabuus` e senha `nabuus` na porta `5432`.)*

### 2. Motor de Cálculo Físico (`motor/` — porta `8001`)
Pré-requisito: Python 3.11+
```powershell
pip install -r motor/requirements.txt
cd motor
uvicorn app.main:app --reload --port 8001
```

Endpoints principais do motor:
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | Verificação de saúde do microsserviço |
| `GET` | `/v1/propulsoes` | Catálogo de referência de tipos de propulsão |
| `POST` | `/v1/precos/sugerir` | Sugere `precoBase` e `custoAnoLuz` conforme propulsão e conforto |
| `POST` | `/v1/viagens/simular` | Simulação de autonomia, paradas (`cKDTree`), duração, dívida temporal, preços e ocupação |
| `POST` | `/v1/rotas/tracar` | Trechos detalhados e coordenadas para o Mapa Galáctico 2D |
| `POST` | `/v1/ocupacao/perfis` | Ocupação e perfis determinísticos por `viagemId` |

Testes do motor (na raiz do repositório):
```powershell
$env:PYTHONPATH="motor"
pytest motor/tests -v
```

### 3. Back-end REST (`backend/` — porta `8080`)
Pré-requisitos: Java 21 + Maven
```powershell
mvn -f backend/pom.xml spring-boot:run
```
Swagger UI disponível em `http://localhost:8080/swagger-ui.html`.

Testes do back-end:
```powershell
mvn -f backend/pom.xml test
```

### 4. Front-end Web (`frontend/` — porta `3000`)
Pré-requisito: Python 3 ou Node.js (apenas para servidor estático / testes):
```powershell
python -m http.server 3000 --directory frontend
```
Acesse `http://localhost:3000` no navegador.

Testes do front-end (Node 20+):
```powershell
node --test frontend/tests/*.test.js
```

---

## Geração de Diagramas e Documento de Modelagem (`context/`)

### Diagramas UML / C4 / DER
Os arquivos-fonte ficam versionados como `.txt` (PlantUML) e as imagens `.png` e `.pdf` vetoriais são geradas por `context/gerar_diagrama.py`:
```powershell
# Gera PDF vetorial + PNG de todos os diagramas
python context/gerar_diagrama.py

# Gera apenas PDFs vetoriais
python context/gerar_diagrama.py --pdf

# Gera apenas os diagramas de uma pasta específica (ex.: flow_diagram ou c4_diagram)
python context/gerar_diagrama.py flow_diagram

# Modo contínuo: observa alterações nos .txt e regera automaticamente
python context/gerar_diagrama.py --watch
```

### Documento de Modelagem em LaTeX (`context/docs/`)
O código-fonte LaTeX fica em `context/docs/documento_modelagem.tex` (sincronizado com `documento_modelagem.txt`). Para compilar o `documento_modelagem.pdf`:
```powershell
python context/docs/gerar_documento.py
```
*(Utiliza `xelatex`/`lualatex` local se estiver instalado na máquina ou compila automaticamente via TeX Live remoto).*
