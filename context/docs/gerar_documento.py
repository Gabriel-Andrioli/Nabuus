"""Compila o arquivo LaTeX `documento_modelagem.tex` (ou `.txt`) em `context/docs/` para PDF.

Uso (a partir da raiz do projeto):
    python context/docs/gerar_documento.py

Estratégia:
 1. Mantém `documento_modelagem.tex` e `documento_modelagem.txt` sincronizados.
 2. Copia os diagramas gerados em `context/` para `context/docs/figuras/` com nomes padronizados.
 3. Se `xelatex` ou `lualatex` estiver instalado localmente, compila localmente (2 passadas para o sumário).
 4. Caso contrário, envia o `.tex` e todas as imagens referenciadas (Base64) para a API TeX Live (`https://latex.ytotech.com/builds/sync`).
"""
from pathlib import Path
import base64
import json
import re
import shutil
import subprocess
import sys
import urllib.request

PASTA = Path(__file__).resolve().parent
PASTA_CONTEXT = PASTA.parent
PASTA_FIGURAS = PASTA / "figuras"
ARQ_TEX = PASTA / "documento_modelagem.tex"
ARQ_TXT = PASTA / "documento_modelagem.txt"
ARQ_PDF = PASTA / "documento_modelagem.pdf"
API_LATEX = "https://latex.ytotech.com/builds/sync"

MAPA_DIAGRAMAS = {
    "figuras/casos-de-uso.pdf": PASTA_CONTEXT / "use_case_diagram" / "use_case_diagram.pdf",
    "figuras/ad01-comprar-passagem.pdf": PASTA_CONTEXT / "flow_diagram" / "AD01_Comprar_Passagem.pdf",
    "figuras/ad02-gerenciar-malha.pdf": PASTA_CONTEXT / "flow_diagram" / "AD02_Gerenciar_Malha.pdf",
    "figuras/ad03-publicar-linha.pdf": PASTA_CONTEXT / "flow_diagram" / "AD03_Publicar_Linha.pdf",
    "figuras/diagrama-classes.pdf": PASTA_CONTEXT / "class_diagram" / "class_diagram.pdf",
    "figuras/diagrama-er.pdf": PASTA_CONTEXT / "er_diagram" / "er_diagram.pdf",
    "figuras/c4-contexto.png": PASTA_CONTEXT / "c4_diagram" / "c4_diagram.png",
    "figuras/c4-conteineres.png": PASTA_CONTEXT / "c4_diagram" / "c4_nivel2_containers.png",
    "figuras/sd1-gerenciar-malha.pdf": PASTA_CONTEXT / "sequence_diagram" / "SD1_Gerenciar_Malha.pdf",
    "figuras/sd2-publicar-viagem.pdf": PASTA_CONTEXT / "sequence_diagram" / "SD2_Publicar_Viagem.pdf",
    "figuras/sd3-consultar-viagens.pdf": PASTA_CONTEXT / "sequence_diagram" / "SD3_Consultar_Viagens.pdf",
    "figuras/sd4-comprar-passagem.pdf": PASTA_CONTEXT / "sequence_diagram" / "SD4_Comprar_Passagem.pdf",
}

PADRAO_INCLUDEGRAPHICS = re.compile(r"\\includegraphics(?:\[[^\]]*\])?\{([^}]+)\}")


def _sincronizar_fontes() -> str:
    if ARQ_TXT.exists() and (not ARQ_TEX.exists() or ARQ_TXT.stat().st_mtime > ARQ_TEX.stat().st_mtime):
        conteudo = ARQ_TXT.read_text(encoding="utf-8")
        ARQ_TEX.write_text(conteudo, encoding="utf-8")
    else:
        conteudo = ARQ_TEX.read_text(encoding="utf-8")
        ARQ_TXT.write_text(conteudo, encoding="utf-8")
    return conteudo


def _sincronizar_figuras() -> None:
    PASTA_FIGURAS.mkdir(parents=True, exist_ok=True)
    for rel_destino, origem in MAPA_DIAGRAMAS.items():
        if origem.exists():
            destino = PASTA / rel_destino
            destino.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(origem, destino)


def _coletar_recursos_imagens(codigo_tex: str) -> list[dict[str, str]]:
    recursos: list[dict[str, str]] = []
    vistos: set[str] = set()
    for bruto in PADRAO_INCLUDEGRAPHICS.findall(codigo_tex):
        rel = bruto.strip().replace("\\", "/")
        if rel in vistos:
            continue
        vistos.add(rel)
        caminho = PASTA / rel
        if not caminho.exists():
            raise FileNotFoundError(f"Imagem referenciada no .tex não encontrada: {caminho}")
        b64 = base64.b64encode(caminho.read_bytes()).decode("ascii")
        recursos.append({"path": rel, "file": b64})
    return recursos


def _reportar_pdf(modo: str) -> None:
    tamanho_kb = ARQ_PDF.stat().st_size // 1024
    paginas_info = ""
    try:
        import pymupdf

        with pymupdf.open(ARQ_PDF) as doc:
            paginas_info = f", {doc.page_count} páginas"
    except Exception:
        pass
    print(f"[ok] {ARQ_PDF.name} compilado {modo} ({tamanho_kb} KB{paginas_info})")


def _compilar_local() -> bool:
    for compilador in ("xelatex", "lualatex"):
        binario = shutil.which(compilador)
        if binario:
            for _ in range(2):
                subprocess.run(
                    [binario, "-interaction=nonstopmode", ARQ_TEX.name],
                    cwd=str(PASTA),
                    check=True,
                )
            _reportar_pdf(f"localmente via {compilador}")
            return True
    return False


def _compilar_remoto(codigo_tex: str) -> None:
    recursos = [{"main": True, "content": codigo_tex}, *_coletar_recursos_imagens(codigo_tex)]
    payload = json.dumps(
        {
            "compiler": "xelatex",
            "resources": recursos,
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        API_LATEX,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "User-Agent": "nabuus-latex-builder",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=180) as resp:
        pdf_bytes = resp.read()
    if not pdf_bytes.startswith(b"%PDF"):
        raise RuntimeError(f"Resposta inesperada do compilador LaTeX: {pdf_bytes[:500]!r}")
    ARQ_PDF.write_bytes(pdf_bytes)
    _reportar_pdf("via TeX Live remoto (xelatex)")


def main() -> int:
    codigo_tex = _sincronizar_fontes()
    _sincronizar_figuras()
    if not _compilar_local():
        _compilar_remoto(codigo_tex)
    return 0


if __name__ == "__main__":
    sys.exit(main())

