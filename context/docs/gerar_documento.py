"""Compila o arquivo LaTeX `documento_modelagem.tex` (ou `.txt`) em `context/docs/` para PDF.

Uso (a partir da raiz do projeto):
    python context/docs/gerar_documento.py

Estratégia:
 1. Mantém `documento_modelagem.tex` e `documento_modelagem.txt` sincronizados.
 2. Se `xelatex` ou `lualatex` estiver instalado localmente, compila localmente (2 passadas para o sumário).
 3. Caso contrário, compila via API TeX Live (`https://latex.ytotech.com/builds/sync` com `xelatex`).
"""
from pathlib import Path
import json
import shutil
import subprocess
import sys
import urllib.request

PASTA = Path(__file__).resolve().parent
ARQ_TEX = PASTA / "documento_modelagem.tex"
ARQ_TXT = PASTA / "documento_modelagem.txt"
ARQ_PDF = PASTA / "documento_modelagem.pdf"
API_LATEX = "https://latex.ytotech.com/builds/sync"


def _sincronizar_fontes() -> str:
    if ARQ_TXT.exists() and (not ARQ_TEX.exists() or ARQ_TXT.stat().st_mtime > ARQ_TEX.stat().st_mtime):
        conteudo = ARQ_TXT.read_text(encoding="utf-8")
        ARQ_TEX.write_text(conteudo, encoding="utf-8")
    else:
        conteudo = ARQ_TEX.read_text(encoding="utf-8")
        ARQ_TXT.write_text(conteudo, encoding="utf-8")
    return conteudo


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
            print(f"[ok] {ARQ_PDF.name} compilado localmente via {compilador}")
            return True
    return False


def _compilar_remoto(codigo_tex: str) -> None:
    payload = json.dumps(
        {
            "compiler": "xelatex",
            "resources": [{"main": True, "content": codigo_tex}],
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
    with urllib.request.urlopen(req, timeout=90) as resp:
        pdf_bytes = resp.read()
    if not pdf_bytes.startswith(b"%PDF"):
        raise RuntimeError(f"Resposta inesperada do compilador LaTeX: {pdf_bytes[:300]!r}")
    ARQ_PDF.write_bytes(pdf_bytes)
    print(f"[ok] {ARQ_PDF.name} compilado via TeX Live remoto (xelatex)")


def main() -> int:
    codigo_tex = _sincronizar_fontes()
    if not _compilar_local():
        _compilar_remoto(codigo_tex)
    return 0


if __name__ == "__main__":
    sys.exit(main())

