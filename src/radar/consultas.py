import psycopg

from radar.banco import TIPOS_PROJETO

POR_PAGINA = 20


def _padrao(busca: str | None) -> str | None:
    if not busca or not busca.strip():
        return None
    return f"%{busca.strip()}%"


def listar_proposicoes(
    conexao: psycopg.Connection,
    busca: str | None,
    tipo: str | None,
    pagina: int,
) -> list[dict]:
    tipos = [tipo] if tipo in TIPOS_PROJETO else TIPOS_PROJETO
    with conexao.cursor() as cursor:
        cursor.execute(
            """
            select
                p.id, p.sigla_tipo, p.numero, p.ano, p.ementa,
                count(v.id) as total_votacoes,
                max(v.data) as ultima_votacao
            from proposicoes p
            join votacoes v on v.id_proposicao = p.id
            where p.sigla_tipo = any(%(tipos)s)
              and (
                  %(padrao)s::text is null
                  or p.ementa ilike %(padrao)s
                  or concat(p.sigla_tipo, ' ', p.numero, '/', p.ano) ilike %(padrao)s
              )
            group by p.id
            order by ultima_votacao desc, p.id desc
            limit %(limite)s offset %(deslocamento)s
            """,
            {
                "tipos": tipos,
                "padrao": _padrao(busca),
                "limite": POR_PAGINA,
                "deslocamento": (pagina - 1) * POR_PAGINA,
            },
        )
        return cursor.fetchall()


def detalhar_proposicao(conexao: psycopg.Connection, id_proposicao: int) -> dict | None:
    with conexao.cursor() as cursor:
        cursor.execute(
            """
            select
                id, sigla_tipo, numero, ano, ementa,
                data_apresentacao, url_inteiro_teor,
                situacao, orgao_situacao, data_situacao
            from proposicoes
            where id = %s
            """,
            (id_proposicao,),
        )
        proposicao = cursor.fetchone()
        if proposicao is None:
            return None

        cursor.execute(
            """
            select a.nome, a.tipo, a.id_deputado, a.proponente, d.sigla_uf
            from autores a
            left join deputados d on d.id = a.id_deputado
            where a.id_proposicao = %s
            order by a.proponente desc, a.ordem_assinatura nulls last, a.nome
            """,
            (id_proposicao,),
        )
        proposicao["autores"] = cursor.fetchall()

        cursor.execute(
            """
            select
                v.id, v.data, v.descricao, v.aprovacao,
                count(vt.id_deputado) filter (where vt.tipo_voto = 'Sim') as sim,
                count(vt.id_deputado) filter (where vt.tipo_voto = 'Não') as nao,
                count(vt.id_deputado)
                    filter (where vt.tipo_voto = 'Abstenção') as abstencao,
                count(vt.id_deputado) as total
            from votacoes v
            left join votos vt on vt.id_votacao = v.id
            where v.id_proposicao = %s
            group by v.id
            order by v.data desc, split_part(v.id, '-', 2)::int desc
            """,
            (id_proposicao,),
        )
        proposicao["votacoes"] = cursor.fetchall()

    return proposicao


def detalhar_votacao(conexao: psycopg.Connection, id_votacao: str) -> dict | None:
    with conexao.cursor() as cursor:
        cursor.execute(
            """
            select
                v.id, v.data, v.descricao, v.aprovacao,
                p.id as id_proposicao, p.sigla_tipo, p.numero, p.ano, p.ementa
            from votacoes v
            left join proposicoes p on p.id = v.id_proposicao
            where v.id = %s
            """,
            (id_votacao,),
        )
        votacao = cursor.fetchone()
        if votacao is None:
            return None

        cursor.execute(
            """
            select vt.tipo_voto, d.id, d.nome, vt.sigla_partido, d.sigla_uf
            from votos vt
            join deputados d on d.id = vt.id_deputado
            where vt.id_votacao = %s
            order by d.nome
            """,
            (id_votacao,),
        )
        votacao["votos"] = cursor.fetchall()

    return votacao


def listar_deputados(
    conexao: psycopg.Connection, busca: str | None, uf: str | None
) -> list[dict]:
    with conexao.cursor() as cursor:
        cursor.execute(
            """
            select id, nome, sigla_uf, url_foto
            from deputados
            where (%(padrao)s::text is null or nome ilike %(padrao)s)
              and (%(uf)s::text is null or sigla_uf = %(uf)s)
            order by nome
            limit 100
            """,
            {"padrao": _padrao(busca), "uf": uf.upper() if uf else None},
        )
        return cursor.fetchall()


def detalhar_deputado(conexao: psycopg.Connection, id_deputado: int) -> dict | None:
    with conexao.cursor() as cursor:
        cursor.execute(
            "select id, nome, sigla_uf, url_foto from deputados where id = %s",
            (id_deputado,),
        )
        deputado = cursor.fetchone()
        if deputado is None:
            return None

        cursor.execute(
            """
            select
                vt.tipo_voto, vt.sigla_partido,
                v.id as id_votacao, v.data, v.descricao,
                p.id as id_proposicao, p.sigla_tipo, p.numero, p.ano
            from votos vt
            join votacoes v on v.id = vt.id_votacao
            left join proposicoes p on p.id = v.id_proposicao
            where vt.id_deputado = %s
            order by v.data desc, split_part(v.id, '-', 2)::int desc
            limit 200
            """,
            (id_deputado,),
        )
        deputado["votos"] = cursor.fetchall()

        cursor.execute("select count(distinct id_votacao) as total from votos")
        deputado["votacoes_nominais"] = cursor.fetchone()["total"]

        cursor.execute(
            """
            select p.id, p.sigla_tipo, p.numero, p.ano, p.ementa, a.proponente
            from autores a
            join proposicoes p on p.id = a.id_proposicao
            where a.id_deputado = %s and p.sigla_tipo = any(%s)
            order by p.ano desc, p.numero desc
            """,
            (id_deputado, TIPOS_PROJETO),
        )
        deputado["autoria"] = cursor.fetchall()

    return deputado


def ultima_coleta(conexao: psycopg.Connection) -> dict:
    with conexao.cursor() as cursor:
        cursor.execute(
            """
            select
                (select max(executada_em) from coletas) as ultima_coleta,
                (select count(*) from votacoes) as votacoes,
                (select count(distinct id_votacao) from votos) as votacoes_nominais,
                (select count(*) from proposicoes where sigla_tipo = any(%s)) as projetos,
                (select count(distinct id_deputado) from votos) as deputados,
                (select min(data) from votacoes) as desde
            """,
            (TIPOS_PROJETO,),
        )
        return cursor.fetchone()


def listar_votacoes_recentes(conexao: psycopg.Connection, limite: int) -> list[dict]:
    with conexao.cursor() as cursor:
        cursor.execute(
            """
            select
                v.id, v.data, v.descricao, v.aprovacao,
                p.id as id_proposicao, p.sigla_tipo, p.numero, p.ano, p.ementa,
                count(*) filter (where vt.tipo_voto = 'Sim') as sim,
                count(*) filter (where vt.tipo_voto = 'Não') as nao,
                count(*) filter (where vt.tipo_voto = 'Abstenção') as abstencao,
                count(*) as total
            from votacoes v
            join votos vt on vt.id_votacao = v.id
            left join proposicoes p on p.id = v.id_proposicao
            group by v.id, p.id
            order by v.data desc, split_part(v.id, '-', 2)::int desc
            limit %s
            """,
            (limite,),
        )
        return cursor.fetchall()


def _resumir_votacao(conexao: psycopg.Connection, id_votacao: str) -> dict | None:
    with conexao.cursor() as cursor:
        cursor.execute(
            """
            select
                v.id, v.data, v.descricao, v.aprovacao,
                p.id as id_proposicao, p.sigla_tipo, p.numero, p.ano
            from votacoes v
            left join proposicoes p on p.id = v.id_proposicao
            where v.id = %s
            """,
            (id_votacao,),
        )
        return cursor.fetchone()


def comparar_votacoes(
    conexao: psycopg.Connection, id_primeira: str, id_segunda: str
) -> dict | None:
    primeira = _resumir_votacao(conexao, id_primeira)
    segunda = _resumir_votacao(conexao, id_segunda)
    if primeira is None or segunda is None:
        return None

    with conexao.cursor() as cursor:
        cursor.execute(
            """
            select
                d.id, d.nome, d.sigla_uf,
                a.tipo_voto as voto_a,
                b.tipo_voto as voto_b,
                coalesce(b.sigla_partido, a.sigla_partido) as sigla_partido
            from (select * from votos where id_votacao = %(primeira)s) a
            full join (select * from votos where id_votacao = %(segunda)s) b
                on b.id_deputado = a.id_deputado
            join deputados d on d.id = coalesce(a.id_deputado, b.id_deputado)
            order by d.nome
            """,
            {"primeira": id_primeira, "segunda": id_segunda},
        )
        linhas = cursor.fetchall()

    return {"primeira": primeira, "segunda": segunda, "deputados": linhas}


def votos_por_partido(conexao: psycopg.Connection, id_votacao: str) -> list[dict]:
    with conexao.cursor() as cursor:
        cursor.execute(
            """
            select
                coalesce(sigla_partido, 'Sem partido') as partido,
                count(*) filter (where tipo_voto = 'Sim') as sim,
                count(*) filter (where tipo_voto = 'Não') as nao,
                count(*) filter (where tipo_voto = 'Abstenção') as abstencao,
                count(*) as total
            from votos
            where id_votacao = %s
            group by 1
            order by total desc, partido
            """,
            (id_votacao,),
        )
        return cursor.fetchall()


def listar_versoes(conexao: psycopg.Connection, id_proposicao: int) -> list[dict]:
    with conexao.cursor() as cursor:
        cursor.execute(
            """
            select id, rotulo, data, url, texto is not null as tem_texto
            from versoes
            where id_proposicao = %s
            order by data, id
            """,
            (id_proposicao,),
        )
        return cursor.fetchall()


def buscar_versao(
    conexao: psycopg.Connection, id_proposicao: int, id_versao: int
) -> dict | None:
    with conexao.cursor() as cursor:
        cursor.execute(
            """
            select id, rotulo, data, url, texto
            from versoes
            where id_proposicao = %s and id = %s
            """,
            (id_proposicao, id_versao),
        )
        return cursor.fetchone()
