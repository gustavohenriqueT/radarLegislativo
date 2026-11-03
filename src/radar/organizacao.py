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
