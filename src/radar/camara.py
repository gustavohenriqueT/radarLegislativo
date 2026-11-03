import httpx
import time

BASE_URL = "https://dadosabertos.camara.leg.br/api/v2"
PLENARIO = 180
TENTATIVAS = 3
ERROS_TEMPORARIOS = {429, 502, 503, 504}


def _requisitar(url: str, params: dict | None = None) -> dict:  # type: ignore
    for tentativa in range(1, TENTATIVAS + 1):
        try:
            resposta = httpx.get(
                url,
                params=params,
                headers={"Accept": "application/json"},
                timeout=30,
            )
            resposta.raise_for_status()
            return resposta.json()
        except httpx.TimeoutException:
            if tentativa == TENTATIVAS:
                raise
        except httpx.HTTPStatusError as erro:
            temporario = erro.response.status_code in ERROS_TEMPORARIOS
            if not temporario or tentativa == TENTATIVAS:
                raise

        time.sleep(2**tentativa)


def _requisitar_opcional(url: str) -> dict | None:
    try:
        return _requisitar(url)
    except httpx.HTTPStatusError as erro:
        if erro.response.status_code == 404:
            return None
        raise


def _listar(caminho: str, params: dict) -> list[dict]:
    url = f"{BASE_URL}{caminho}"
    itens = []

    while url:
        corpo = _requisitar(url, params)
        itens.extend(corpo["dados"])

        links = corpo["links"]
        url = next((link["href"] for link in links if link["rel"] == "next"), None)
        params = None  # type: ignore

    return itens


def buscar_deputados(uf: str) -> list[dict]:
    return _listar(
        "/deputados",
        {"siglaUf": uf, "ordem": "ASC", "ordenarPor": "nome", "itens": 100},
    )


def buscar_votacoes(data_inicio: str, data_fim: str) -> list[dict]:
    return _listar(
        "/votacoes",
        {
            "idOrgao": PLENARIO,
            "dataInicio": data_inicio,
            "dataFim": data_fim,
            "itens": 100,
        },
    )


def buscar_votos(id_votacao: str) -> list[dict]:
    corpo = _requisitar_opcional(f"{BASE_URL}/votacoes/{id_votacao}/votos")
    return corpo["dados"] if corpo else []


def buscar_proposicao(id_proposicao: int) -> dict | None:
    corpo = _requisitar_opcional(f"{BASE_URL}/proposicoes/{id_proposicao}")
    return corpo["dados"] if corpo else None
