ORDEM_VOTOS = ["Sim", "Não", "Abstenção", "Obstrução", "Artigo 17"]

ROTULOS_VOTO = {
    "Artigo 17": "Presidente da sessão",
}


def agrupar_votos(votos: list[dict]) -> dict[str, list[str]]:
    grupos = {}

    for voto in votos:
        tipo = voto["tipoVoto"]
        deputado = voto["deputado_"]
        nome = f"{deputado['nome']} ({deputado['siglaPartido']}-{deputado['siglaUf']})"

        if tipo not in grupos:
            grupos[tipo] = []

        grupos[tipo].append(nome)

    return grupos


def id_deputado_da_uri(uri: str | None) -> int | None:
    if not uri or "/deputados/" not in uri:
        return None
    return int(uri.rstrip("/").rsplit("/", 1)[-1])


def agrupar_por_tipo(votos: list[dict]) -> list[dict]:
    grupos: dict[str, list[dict]] = {}
    for voto in votos:
        grupos.setdefault(voto["tipo_voto"], []).append(voto)

    def posicao(tipo: str) -> int:
        if tipo in ORDEM_VOTOS:
            return ORDEM_VOTOS.index(tipo)
        return len(ORDEM_VOTOS)

    return [
        {
            "tipo": tipo,
            "rotulo": ROTULOS_VOTO.get(tipo, tipo),
            "deputados": grupos[tipo],
        }
        for tipo in sorted(grupos, key=posicao)
    ]
