import psycopg

TIPOS_PROJETO = ["PL", "PEC", "PLP", "MPV", "PDL", "PRC"]
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
                data_apresentacao, url_inteiro_teor
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
        cursor.execute("select max(executada_em) as ultima_coleta from coletas")
        return cursor.fetchone()
