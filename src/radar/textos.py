import io
import re
import sys
from difflib import SequenceMatcher

import httpx
from pypdf import PdfReader

from radar import camara

TIPOS_DE_VERSAO = {
    "SBT": "Substitutivo do relator",
    "SBT-A": "Substitutivo adotado pela comissão",
    "RDF": "Redação final",
}

INICIO_DO_TEXTO = re.compile(r"^\s*Art\.\s*1\s*[ºo°]", re.MULTILINE)
TITULO_DE_SUBSTITUTIVO = re.compile(r"^\s*SUBSTITUTIVO\b", re.MULTILINE)
FIM_DO_TEXTO = re.compile(
    r"^\s*(JUSTIFICA[CÇ][AÃ]O|JUSTIFICATIVA|Sala d[ao]s? (Sess|Comiss|Reuni)|Plenário,)",
    re.MULTILINE | re.IGNORECASE,
)
INICIO_DE_TRECHO = re.compile(
    r"^[“\"]?(Art\.\s*\d|§\s*\d|Parágrafo único|[IVXLC]+\s*[-–—]\s|[a-z]\)\s)"
)
PONTILHADO = re.compile(r"(\.\s*){4,}")
SEMELHANCA_MINIMA = 0.3


def listar_versoes(id_proposicao: int, ja_salvas: set[int] | None = None) -> list[dict]:
    ja_salvas = ja_salvas or set()
    versoes = []

    if id_proposicao not in ja_salvas:
        original = camara.buscar_proposicao(id_proposicao)
        if original is None:
            return []
        versoes.append(
            {
                "id": original["id"],
                "rotulo": "Texto original",
                "data": original["dataApresentacao"],
                "url": original.get("urlInteiroTeor"),
            }
        )

    for relacionada in camara.buscar_relacionadas(id_proposicao):
        rotulo = TIPOS_DE_VERSAO.get(relacionada["siglaTipo"])
        if rotulo is None or relacionada["id"] in ja_salvas:
            continue
        detalhe = camara.buscar_proposicao(relacionada["id"])
        if detalhe is None:
            continue
        versoes.append(
            {
                "id": detalhe["id"],
                "rotulo": rotulo,
                "data": detalhe["dataApresentacao"],
                "url": detalhe.get("urlInteiroTeor"),
            }
        )

    return sorted(versoes, key=lambda versao: versao["data"] or "")


def extrair_texto(url: str) -> str | None:
    resposta = httpx.get(url, follow_redirects=True, timeout=60)
    resposta.raise_for_status()
    if not resposta.content.startswith(b"%PDF"):
        return None

    leitor = PdfReader(io.BytesIO(resposta.content))
    paginas = [pagina.extract_text() or "" for pagina in leitor.pages]
    texto = "\n".join(paginas).strip()
    return texto or None


def recortar_dispositivo(texto: str) -> str | None:
    titulos = list(TITULO_DE_SUBSTITUTIVO.finditer(texto))
    a_partir_de = titulos[-1].end() if titulos else 0

    inicio = INICIO_DO_TEXTO.search(texto, a_partir_de)
    if inicio is None:
        return None

    fim = FIM_DO_TEXTO.search(texto, inicio.end())
    return texto[inicio.start() : fim.start() if fim else len(texto)].strip()


def dividir_em_trechos(texto: str) -> list[str]:
    trechos: list[str] = []
    for linha in texto.replace("\u00a0", " ").splitlines():
        linha = " ".join(linha.split())
        if not linha:
            continue
        if INICIO_DE_TRECHO.match(linha) or not trechos:
            trechos.append(linha)
        else:
            trechos[-1] = f"{trechos[-1]} {linha}"

    return [_limpar(trecho) for trecho in trechos]


def _limpar(trecho: str) -> str:
    sem_pontilhado = PONTILHADO.sub(" ", trecho)
    return " ".join(sem_pontilhado.split()).replace("“ ", "“")


def _sem_espacos(texto: str) -> str:
    return re.sub(r"\s+", "", texto)


def _comparar_palavras(antes: str, depois: str) -> list[dict]:
    palavras_antes = antes.split()
    palavras_depois = depois.split()
    comparador = SequenceMatcher(None, palavras_antes, palavras_depois, autojunk=False)

    partes: list[dict] = []

    def acrescentar(tipo: str, palavras: list[str]) -> None:
        if not palavras:
            return
        texto = " ".join(palavras)
        if partes and partes[-1]["tipo"] == tipo:
            partes[-1]["texto"] += f" {texto}"
        else:
            partes.append({"tipo": tipo, "texto": texto})

    for operacao, a1, a2, d1, d2 in comparador.get_opcodes():
        retiradas = palavras_antes[a1:a2]
        incluidas = palavras_depois[d1:d2]
        so_espacamento = "".join(retiradas) == "".join(incluidas)

        if operacao == "equal" or so_espacamento:
            acrescentar("igual", incluidas)
        else:
            acrescentar("retirado", retiradas)
            acrescentar("incluido", incluidas)

    return partes


def comparar_textos(antes: str, depois: str) -> list[dict]:
    trechos_antes = dividir_em_trechos(antes)
    trechos_depois = dividir_em_trechos(depois)
    comparador = SequenceMatcher(
        None,
        [_sem_espacos(trecho) for trecho in trechos_antes],
        [_sem_espacos(trecho) for trecho in trechos_depois],
        autojunk=False,
    )

    resultado: list[dict] = []
    for operacao, a1, a2, d1, d2 in comparador.get_opcodes():
        retirados = trechos_antes[a1:a2]
        incluidos = trechos_depois[d1:d2]

        if operacao == "equal":
            resultado += [{"tipo": "igual", "texto": trecho} for trecho in incluidos]
            continue

        texto_antes = " ".join(retirados)
        texto_depois = " ".join(incluidos)
        semelhanca = SequenceMatcher(
            None, texto_antes.split(), texto_depois.split(), autojunk=False
        ).ratio()

        if operacao == "replace" and semelhanca >= SEMELHANCA_MINIMA:
            partes = _comparar_palavras(texto_antes, texto_depois)
            if all(parte["tipo"] == "igual" for parte in partes):
                resultado.append({"tipo": "igual", "texto": texto_depois})
            else:
                resultado.append({"tipo": "alterado", "partes": partes})
            continue

        resultado += [{"tipo": "retirado", "texto": trecho} for trecho in retirados]
        resultado += [{"tipo": "incluido", "texto": trecho} for trecho in incluidos]

    return resultado


if __name__ == "__main__":
    for versao in listar_versoes(int(sys.argv[1])):
        print(f"\n== {versao['rotulo']} ({versao['data']}) ==")
        print(versao["url"])
        if not versao["url"]:
            print("sem endereço de texto")
            continue
        texto = extrair_texto(versao["url"])
        if texto is None:
            print("não foi possível extrair texto")
            continue
        print(f"{len(texto)} caracteres")
        print(texto[:600])