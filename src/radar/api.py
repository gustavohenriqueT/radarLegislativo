import os
from collections.abc import Iterator
from typing import Annotated

import psycopg
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from psycopg.rows import dict_row

from radar import consultas, explicacoes, textos
from radar.banco import DATABASE_URL
from radar.organizacao import agrupar_por_tipo, classificar_comparacao

ORIGENS = os.environ.get("ORIGENS_PERMITIDAS", "http://localhost:5173").split(",")

app = FastAPI(title="Radar Legislativo")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGENS,
    allow_methods=["GET"],
    allow_headers=["*"],
)


def obter_conexao() -> Iterator[psycopg.Connection]:
    with psycopg.connect(
        DATABASE_URL, row_factory=dict_row, prepare_threshold=None
    ) as conexao:
        yield conexao


Conexao = Annotated[psycopg.Connection, Depends(obter_conexao)]


@app.get("/proposicoes")
def listar_proposicoes(
    conexao: Conexao,
    busca: str | None = None,
    tipo: str | None = None,
    pagina: Annotated[int, Query(ge=1)] = 1,
) -> list[dict]:
    return consultas.listar_proposicoes(conexao, busca, tipo, pagina)


@app.get("/proposicoes/{id_proposicao}")
def detalhar_proposicao(conexao: Conexao, id_proposicao: int) -> dict:
    proposicao = consultas.detalhar_proposicao(conexao, id_proposicao)
    if proposicao is None:
        raise HTTPException(status_code=404, detail="Proposição não encontrada")
    for votacao in proposicao["votacoes"]:
        votacao["glossario"] = explicacoes.termos_da_descricao(votacao["descricao"])
        votacao["natureza"] = explicacoes.natureza_da_votacao(votacao["descricao"])
    versoes = consultas.listar_versoes(conexao, id_proposicao)
    proposicao["versoes_com_texto"] = sum(versao["tem_texto"] for versao in versoes)
    proposicao["tipo"] = explicacoes.TIPOS_DE_PROJETO.get(proposicao["sigla_tipo"])
    proposicao["caminho"] = explicacoes.etapa_do_projeto(
        proposicao["sigla_tipo"], proposicao["situacao"], proposicao["orgao_situacao"]
    )
    return proposicao


@app.get("/proposicoes/{id_proposicao}/versoes")
def listar_versoes(conexao: Conexao, id_proposicao: int) -> list[dict]:
    return consultas.listar_versoes(conexao, id_proposicao)


@app.get("/proposicoes/{id_proposicao}/mudancas")
def comparar_versoes(conexao: Conexao, id_proposicao: int, de: int, para: int) -> dict:
    antes = consultas.buscar_versao(conexao, id_proposicao, de)
    depois = consultas.buscar_versao(conexao, id_proposicao, para)
    if not antes or not depois or not antes["texto"] or not depois["texto"]:
        raise HTTPException(status_code=404, detail="Versão sem texto para comparar")

    trechos = textos.comparar_textos(antes.pop("texto"), depois.pop("texto"))
    return {"de": antes, "para": depois, "trechos": trechos}


@app.get("/votacoes")
def listar_votacoes_recentes(
    conexao: Conexao, limite: Annotated[int, Query(ge=1, le=50)] = 5
) -> list[dict]:
    return consultas.listar_votacoes_recentes(conexao, limite)


@app.get("/votacoes/{id_votacao}")
def detalhar_votacao(conexao: Conexao, id_votacao: str) -> dict:
    votacao = consultas.detalhar_votacao(conexao, id_votacao)
    if votacao is None:
        raise HTTPException(status_code=404, detail="Votação não encontrada")
    votacao["grupos"] = agrupar_por_tipo(votacao.pop("votos"))
    votacao["fatos"] = explicacoes.fatos_da_votacao(votacao["grupos"])
    votacao["quorum"] = explicacoes.quorum_exigido(
        votacao["sigla_tipo"], votacao["descricao"]
    )
    votacao["glossario"] = explicacoes.termos_da_descricao(votacao["descricao"])
    votacao["natureza"] = explicacoes.natureza_da_votacao(votacao["descricao"])
    votacao["partidos"] = consultas.votos_por_partido(conexao, id_votacao)
    return votacao


@app.get("/deputados")
def listar_deputados(
    conexao: Conexao, busca: str | None = None, uf: str | None = None
) -> list[dict]:
    return consultas.listar_deputados(conexao, busca, uf)


@app.get("/deputados/{id_deputado}")
def detalhar_deputado(conexao: Conexao, id_deputado: int) -> dict:
    deputado = consultas.detalhar_deputado(conexao, id_deputado)
    if deputado is None:
        raise HTTPException(status_code=404, detail="Deputado não encontrado")
    return deputado


@app.get("/status")
def status(conexao: Conexao) -> dict:
    return consultas.ultima_coleta(conexao)


@app.get("/comparacao")
def comparar_votacoes(conexao: Conexao, primeira: str, segunda: str) -> dict:
    comparacao = consultas.comparar_votacoes(conexao, primeira, segunda)
    if comparacao is None:
        raise HTTPException(status_code=404, detail="Votação não encontrada")
    comparacao["grupos"] = classificar_comparacao(comparacao.pop("deputados"))
    return comparacao
