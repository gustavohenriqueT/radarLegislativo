import os
from collections.abc import Iterator
from typing import Annotated
import psycopg
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from psycopg.rows import dict_row
from radar import consultas
from radar.banco import DATABASE_URL
from radar.organizacao import agrupar_por_tipo

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
    return proposicao


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
