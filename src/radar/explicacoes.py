import re
import unicodedata

CADEIRAS = 513
MAIORIA_ABSOLUTA = 257
TRES_QUINTOS = 308
MAXIMO_DE_TERMOS = 3

GLOSSARIO = [
    (
        r"turno",
        "Turno",
        (
            "Uma PEC precisa ser aprovada duas vezes no Plenário, em dois turnos, "
            "com pelo menos 308 votos Sim em cada um."
        ),
    ),
    (
        r"intersticio",
        "Interstício",
        (
            "Intervalo mínimo que o regimento exige entre duas etapas, como os dois "
            "turnos de uma PEC. A quebra ou dispensa permite votar sem esperar esse prazo."
        ),
    ),
    (
        r"urgencia",
        "Requerimento de urgência",
        (
            "Pedido para que o projeto seja votado mais rápido, direto no Plenário, "
            "sem esperar todas as etapas nas comissões."
        ),
    ),
    (
        r"mantido o texto|suprimido o texto|destaque",
        "Destaque",
        (
            "Pedido para votar um trecho separadamente do resto do projeto. Quando o "
            "resultado é “mantido o texto”, o trecho destacado continua no projeto."
        ),
    ),
    (
        r"redacao final",
        "Redação final",
        (
            "Versão final do texto aprovado, já com as alterações incorporadas. Essa "
            "votação confirma a redação, sem rediscutir o conteúdo."
        ),
    ),
    (
        r"emenda aglutinativa",
        "Emenda aglutinativa",
        (
            "Emenda que junta o conteúdo de outras emendas, ou delas com o texto, "
            "numa única proposta."
        ),
    ),
    (
        r"subemenda substitutiva",
        "Subemenda substitutiva",
        (
            "Novo texto apresentado pelo relator, que substitui a versão anterior "
            "depois de analisar as emendas."
        ),
    ),
    (
        r"substitutivo",
        "Substitutivo",
        (
            "Texto novo, apresentado por um relator, que substitui o projeto original "
            "por inteiro."
        ),
    ),
    (
        r"emendas? do senado",
        "Emenda do Senado",
        (
            "Alteração feita pelo Senado num projeto que a Câmara já tinha aprovado. "
            "A Câmara vota se aceita a mudança."
        ),
    ),
    (
        r"emendas? de plenario|emendas? ao substitutivo",
        "Emenda",
        "Proposta de alteração no texto, apresentada durante a discussão do projeto.",
    ),
    (
        r"preferencia",
        "Preferência",
        "Pedido para que um texto ou item seja votado antes dos outros.",
    ),
    (
        r"retirada de pauta",
        "Retirada de pauta",
        "Pedido para tirar o projeto da lista de votações da sessão.",
    ),
    (
        r"adiamento",
        "Adiamento",
        "Pedido para deixar a discussão ou a votação para outra sessão.",
    ),
    (
        r"regime de tramitacao",
        "Regime de tramitação",
        (
            "Ritmo de andamento do projeto, como ordinário ou urgente. A mudança de "
            "regime é um registro administrativo, sem voto individual."
        ),
    ),
]

REQUERIMENTO = (
    "Requerimento",
    (
        "Pedido formal de um ou mais deputados sobre o andamento da sessão ou do "
        "projeto. É votado antes do conteúdo em si."
    ),
)


def _normalizar(texto: str | None) -> str:
    sem_acento = unicodedata.normalize("NFD", texto or "")
    return "".join(
        letra for letra in sem_acento if unicodedata.category(letra) != "Mn"
    ).lower()


def termos_da_descricao(descricao: str | None) -> list[dict]:
    texto = _normalizar(descricao)
    termos = [
        {"termo": termo, "explicacao": explicacao}
        for padrao, termo, explicacao in GLOSSARIO
        if re.search(padrao, texto)
    ]

    if not termos and "requerimento" in texto:
        termo, explicacao = REQUERIMENTO
        termos.append({"termo": termo, "explicacao": explicacao})

    return termos[:MAXIMO_DE_TERMOS]


def quorum_exigido(sigla_tipo: str | None, descricao: str | None) -> dict | None:
    texto = _normalizar(descricao)

    if sigla_tipo == "PEC" and "turno" in texto and "proposta de emenda" in texto:
        return {
            "votos": TRES_QUINTOS,
            "regra": "Uma PEC só é aprovada com o voto Sim de três quintos dos "
            f"deputados, o que dá {TRES_QUINTOS} dos {CADEIRAS}, em cada um dos "
            "dois turnos.",
        }

    texto_principal = re.match(
        r"(aprovad|rejeitad)[oa] [oa] "
        r"(projeto de lei complementar|substitutivo|subemenda substitutiva)",
        texto,
    )
    if sigla_tipo == "PLP" and texto_principal:
        return {
            "votos": MAIORIA_ABSOLUTA,
            "regra": "Um projeto de lei complementar precisa do voto Sim da maioria "
            f"absoluta, ou seja, {MAIORIA_ABSOLUTA} dos {CADEIRAS} deputados.",
        }

    if "urgencia" in texto and "155" in texto:
        return {
            "votos": MAIORIA_ABSOLUTA,
            "regra": "Esse tipo de urgência precisa do voto Sim da maioria absoluta, "
            f"ou seja, {MAIORIA_ABSOLUTA} dos {CADEIRAS} deputados.",
        }

    return None


def fatos_da_votacao(grupos: list[dict]) -> dict:
    contagem = {grupo["tipo"]: len(grupo["deputados"]) for grupo in grupos}
    sim = contagem.get("Sim", 0)
    nao = contagem.get("Não", 0)
    total = sum(contagem.values())

    return {
        "sim": sim,
        "nao": nao,
        "total": total,
        "diferenca": abs(sim - nao),
        "sem_registro": max(CADEIRAS - total, 0),
        "cadeiras": CADEIRAS,
    }


TIPOS_DE_PROJETO = {
    "PL": {
        "nome": "Projeto de Lei",
        "explicacao": "Cria, altera ou revoga uma lei comum. Passa pela Câmara e pelo "
        "Senado e, se aprovado nos dois, vai à sanção da Presidência.",
        "aprovacao": "Maioria simples dos presentes, com pelo menos 257 deputados em "
        "Plenário.",
        "etapas": ["apresentacao", "comissoes", "plenario", "senado", "sancao"],
    },
    "PLP": {
        "nome": "Projeto de Lei Complementar",
        "explicacao": "Regula temas que a Constituição reservou para lei complementar. "
        "Segue o mesmo caminho de um projeto de lei, com exigência maior de votos.",
        "aprovacao": "Maioria absoluta, ou seja, 257 dos 513 deputados.",
        "etapas": ["apresentacao", "comissoes", "plenario", "senado", "sancao"],
    },
    "PEC": {
        "nome": "Proposta de Emenda à Constituição",
        "explicacao": "Altera o texto da Constituição. Precisa de dois turnos de votação "
        "em cada Casa e não passa pela sanção da Presidência.",
        "aprovacao": "Três quintos dos deputados, 308 dos 513, em cada um dos dois "
        "turnos.",
        "etapas": ["apresentacao", "comissoes", "plenario", "senado", "promulgacao"],
    },
    "MPV": {
        "nome": "Medida Provisória",
        "explicacao": "Editada pela Presidência da República com força de lei imediata. "
        "O Congresso tem até 120 dias para aprovar, senão ela perde a validade.",
        "aprovacao": "Maioria simples dos presentes na Câmara e no Senado.",
        "etapas": ["apresentacao", "comissoes", "plenario", "senado", "promulgacao"],
    },
    "PDL": {
        "nome": "Projeto de Decreto Legislativo",
        "explicacao": "Trata de assuntos da competência exclusiva do Congresso, como "
        "aprovar tratados internacionais. Não passa pela sanção.",
        "aprovacao": "Maioria simples dos presentes.",
        "etapas": ["apresentacao", "comissoes", "plenario", "senado", "promulgacao"],
    },
    "PRC": {
        "nome": "Projeto de Resolução",
        "explicacao": "Trata do funcionamento interno da própria Câmara. É decidido só "
        "pela Câmara.",
        "aprovacao": "Maioria simples dos presentes.",
        "etapas": ["apresentacao", "comissoes", "plenario", "promulgacao"],
    },
}

NOMES_DAS_ETAPAS = {
    "apresentacao": "Apresentação",
    "comissoes": "Comissões",
    "plenario": "Plenário da Câmara",
    "senado": "Senado",
    "sancao": "Sanção",
    "promulgacao": "Promulgação",
    "arquivado": "Arquivado",
}

SITUACOES = [
    (r"transformad[oa] em norma|promulgad|sancionad", "concluido"),
    (r"arquivad|retirad[oa] pelo autor|prejudicad|rejeitad", "arquivado"),
    (r"sancao|san[cç][aã]o|veto", "sancao"),
    (r"senado|remetid|enviad", "senado"),
    (r"plenario|pauta|redacao final", "plenario"),
    (r"relator|comiss|parecer|tramitando|prazo", "comissoes"),
]


def etapa_do_projeto(
    sigla_tipo: str | None, situacao: str | None, orgao: str | None
) -> dict | None:
    tipo = TIPOS_DE_PROJETO.get(sigla_tipo or "")
    if tipo is None:
        return None

    texto = _normalizar(situacao)
    etapa = None
    for padrao, candidata in SITUACOES:
        if re.search(padrao, texto):
            etapa = candidata
            break

    if etapa is None and orgao:
        if orgao == "PLEN":
            etapa = "plenario"
        elif orgao in ("SF", "SENADO"):
            etapa = "senado"
        elif orgao not in ("MESA", "CD"):
            etapa = "comissoes"

    if etapa is None:
        return None

    etapas = tipo["etapas"]
    if etapa == "concluido":
        posicao = len(etapas)
    elif etapa == "arquivado":
        posicao = -1
    elif etapa in etapas:
        posicao = etapas.index(etapa)
    else:
        return None

    return {
        "etapas": [
            {"chave": chave, "nome": NOMES_DAS_ETAPAS[chave]} for chave in etapas
        ],
        "atual": etapa,
        "posicao": posicao,
    }


NATUREZAS = [
    (
        (
            r"redacao final|turno|texto principal|substitutivo|subemenda|projeto de lei|"
            r"proposta de emenda|medida provisoria|decreto legislativo|resolucao"
        ),
        "texto",
        "Texto do projeto",
    ),
    (r"destaque|emenda|mantido o texto|suprimido", "trecho", "Trecho do texto"),
    (
        (
            r"requerimento|urgencia|preferencia|adiamento|retirada|intersticio|"
            r"regime de tramitacao|inversao"
        ),
        "procedimento",
        "Procedimento",
    ),
]


def natureza_da_votacao(descricao: str | None) -> dict:
    texto = _normalizar(descricao)
    for padrao, chave, rotulo in NATUREZAS:
        if re.search(padrao, texto):
            return {"chave": chave, "rotulo": rotulo}
    return {"chave": "outra", "rotulo": "Votação"}
