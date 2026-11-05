import psycopg
from radar import banco, camara
import httpx


def _id_proposicao(id_votacao: str) -> int:
    return int(id_votacao.split("-")[0])


def _coletar_autores(conexao: psycopg.Connection) -> None:
    pendentes = banco.listar_proposicoes_sem_autores(conexao)
    print(f"{len(pendentes)} proposições sem autores")

    for id_proposicao in pendentes:
        try:
            autores = camara.buscar_autores(id_proposicao)
        except (httpx.HTTPStatusError, httpx.TimeoutException):
            print(f"autores da proposição {id_proposicao} ficam para a próxima coleta")
            continue

        if not autores:
            continue
        banco.salvar_autores(conexao, id_proposicao, autores)
        conexao.commit()


def coletar_periodo(data_inicio: str, data_fim: str) -> None:
    votacoes = camara.buscar_votacoes(data_inicio, data_fim)
    print(f"{len(votacoes)} votações no período")

    with banco.conectar() as conexao:
        ids_proposicoes = {_id_proposicao(votacao["id"]) for votacao in votacoes}
        existentes = banco.listar_ids_proposicoes(conexao)

        for id_proposicao in ids_proposicoes - existentes:
            proposicao = camara.buscar_proposicao(id_proposicao)
            if proposicao is None:
                print(f"proposição {id_proposicao} não encontrada")
                continue
            banco.salvar_proposicao(conexao, proposicao)

        banco.salvar_votacoes(conexao, votacoes)
        conexao.commit()

        for votacao in votacoes:
            votos = camara.buscar_votos(votacao["id"])
            if not votos:
                continue
            banco.salvar_votos(conexao, votacao["id"], votos)
            conexao.commit()
            print(f"{votacao['id']}: {len(votos)} votos")

        _coletar_autores(conexao)
        banco.registrar_coleta(conexao, data_inicio, data_fim, len(votacoes))
        conexao.commit()
