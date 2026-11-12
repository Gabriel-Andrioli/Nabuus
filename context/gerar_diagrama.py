"""Gera diagramas PlantUML (`.txt`) nas subpastas de `context/` em PNG, SVG ou PDF vetorial.

Uso (a partir da raiz do projeto):
    python context/gerar_diagrama.py                          # gera PNG e PDF vetorial de todos os .txt
    python context/gerar_diagrama.py --pdf                    # gera apenas PDF vetorial (via SVG -> PDF)
    python context/gerar_diagrama.py --png                    # gera apenas PNG
    python context/gerar_diagrama.py --svg                    # gera apenas SVG
    python context/gerar_diagrama.py flow_diagram             # gera apenas de uma subpasta
    python context/gerar_diagrama.py --watch                  # regera automaticamente ao salvar qualquer .txt
"""
import argparse
import shutil
import subprocess
import sys
import time
import urllib.request
import zlib
from pathlib import Path

PASTA_CONTEXT = Path(__file__).resolve().parent
JAR = PASTA_CONTEXT / "plantuml.jar"
SERVIDOR = "https://www.plantuml.com/plantuml"

_ALFABETO = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_"


def _codificar_plantuml(texto: str) -> str:
    """Codificação oficial do PlantUML: deflate bruto + base64 com alfabeto próprio."""
    comp = zlib.compressobj(9, zlib.DEFLATED, -15)
    dados = comp.compress(texto.encode("utf-8")) + comp.flush()
    saida = []
    for i in range(0, len(dados), 3):
        bloco = dados[i:i + 3] + b"\x00" * (3 - len(dados[i:i + 3]))
        b1, b2, b3 = bloco
        saida.append(_ALFABETO[b1 >> 2])
        saida.append(_ALFABETO[((b1 & 0x3) << 4) | (b2 >> 4)])
        saida.append(_ALFABETO[((b2 & 0xF) << 2) | (b3 >> 6)])
        saida.append(_ALFABETO[b3 & 0x3F])
    return "".join(saida)


def _baixar_plantuml(fonte: Path, formato_servidor: str) -> bytes:
    url = f"{SERVIDOR}/{formato_servidor}/{_codificar_plantuml(fonte.read_text(encoding='utf-8'))}"
    req = urllib.request.Request(url, headers={"User-Agent": "nabuus-diagram-generator"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()


def _svg_para_pdf_vetorial(svg_bytes: bytes) -> bytes:
    """Converte SVG vetorial em PDF 100% vetorial usando PyMuPDF."""
    import pymupdf

    svg_doc = pymupdf.open(stream=svg_bytes, filetype="svg")
    return svg_doc.convert_to_pdf()


def _gerar_local(fonte: Path, formato: str) -> Path | None:
    if not JAR.exists() or shutil.which("java") is None:
        return None
    fmt_jar = "svg" if formato == "pdf" else formato
    subprocess.run(
        ["java", "-jar", str(JAR), f"-t{fmt_jar}", "-charset", "UTF-8", "-o", str(fonte.parent), str(fonte)],
        check=True,
    )
    gerado = fonte.parent / f"{fonte.stem}.{fmt_jar}"
    if formato == "pdf":
        destino_pdf = fonte.parent / f"{fonte.stem}.pdf"
        destino_pdf.write_bytes(_svg_para_pdf_vetorial(gerado.read_bytes()))
        gerado.unlink(missing_ok=True)
        return destino_pdf
    return gerado


def _gerar_servidor(fonte: Path, formato: str) -> Path:
    destino = fonte.parent / f"{fonte.stem}.{formato}"
    if formato == "pdf":
        svg_bytes = _baixar_plantuml(fonte, "svg")
        destino.write_bytes(_svg_para_pdf_vetorial(svg_bytes))
    else:
        destino.write_bytes(_baixar_plantuml(fonte, formato))
    return destino


def gerar_arquivo(fonte: Path, formato: str) -> Path:
    caminho = _gerar_local(fonte, formato)
    origem = "local (plantuml.jar)"
    if caminho is None:
        caminho = _gerar_servidor(fonte, formato)
        origem = "servidor PlantUML (vetorial)" if formato in ("pdf", "svg") else "servidor PlantUML"
    rel = caminho.relative_to(PASTA_CONTEXT)
    print(f"[ok] {rel} gerado via {origem}")
    return caminho


def _resolver_caminho(alvo: str) -> Path:
    p = Path(alvo)
    if p.exists():
        return p.resolve()
    em_context = PASTA_CONTEXT / p
    if em_context.exists():
        return em_context.resolve()
    raise FileNotFoundError(f"Caminho não encontrado: {alvo}")


def _eh_plantuml(arquivo: Path) -> bool:
    texto = arquivo.read_text(encoding="utf-8", errors="ignore")
    return "startuml" in texto


def _listar_fontes(alvos: list[str]) -> list[Path]:
    if not alvos:
        return [p for p in sorted(PASTA_CONTEXT.rglob("*.txt")) if _eh_plantuml(p)]
    fontes: list[Path] = []
    for a in alvos:
        caminho = _resolver_caminho(a)
        if caminho.is_dir():
            fontes.extend(p for p in sorted(caminho.rglob("*.txt")) if _eh_plantuml(p))
        elif _eh_plantuml(caminho):
            fontes.append(caminho)
    return fontes


def _formatos_solicitados(args: argparse.Namespace) -> list[str]:
    escolhidos = [fmt for fmt, flag in (("pdf", args.pdf), ("png", args.png), ("svg", args.svg)) if flag]
    return escolhidos or ["pdf", "png"]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("alvos", nargs="*", help="arquivos .txt ou subpastas (padrão: todas as subpastas de context/)")
    parser.add_argument("--pdf", action="store_true", help="gera PDF vetorial (via SVG -> PDF)")
    parser.add_argument("--png", action="store_true", help="gera PNG")
    parser.add_argument("--svg", action="store_true", help="gera SVG vetorial")
    parser.add_argument("--watch", action="store_true", help="regera automaticamente ao salvar qualquer .txt")
    args = parser.parse_args()
    formatos = _formatos_solicitados(args)

    if not args.watch:
        for fonte in _listar_fontes(args.alvos):
            for fmt in formatos:
                gerar_arquivo(fonte, fmt)
        return 0

    mtimes: dict[Path, float] = {}
    print(f"Observando arquivos .txt em {PASTA_CONTEXT} (Ctrl+C para sair)...")
    try:
        while True:
            for fonte in _listar_fontes(args.alvos):
                mtime = fonte.stat().st_mtime
                if mtimes.get(fonte) != mtime:
                    mtimes[fonte] = mtime
                    for fmt in formatos:
                        try:
                            gerar_arquivo(fonte, fmt)
                        except Exception as exc:
                            print(f"[erro em {fonte.name} ({fmt})] {exc}")
            time.sleep(1)
    except KeyboardInterrupt:
        return 0


if __name__ == "__main__":
    sys.exit(main())
