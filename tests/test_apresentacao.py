from radar.organizacao import agrupar_por_tipo, id_deputado_da_uri


def test_grupos_seguem_ordem_fixa():
    votos = [
        {"tipo_voto": "Artigo 17", "nome": "Carla"},
        {"tipo_voto": "Não", "nome": "Bruno"},
        {"tipo_voto": "Sim", "nome": "Ana"},
    ]

    grupos = agrupar_por_tipo(votos)

    assert [grupo["tipo"] for grupo in grupos] == ["Sim", "Não", "Artigo 17"]


def test_artigo_17_ganha_rotulo_legivel():
    grupos = agrupar_por_tipo([{"tipo_voto": "Artigo 17", "nome": "Carla"}])

    assert grupos[0]["rotulo"] == "Presidente da sessão"


def test_tipo_desconhecido_vai_para_o_final():
    votos = [
        {"tipo_voto": "Novo tipo", "nome": "Davi"},
        {"tipo_voto": "Sim", "nome": "Ana"},
    ]

    grupos = agrupar_por_tipo(votos)

    assert [grupo["tipo"] for grupo in grupos] == ["Sim", "Novo tipo"]


def test_extrai_id_de_uri_de_deputado():
    uri = "https://dadosabertos.camara.leg.br/api/v2/deputados/204554"

    assert id_deputado_da_uri(uri) == 204554


def test_uri_que_nao_e_de_deputado_devolve_none():
    uri_orgao = "https://dadosabertos.camara.leg.br/api/v2/orgaos/1"

    assert id_deputado_da_uri(uri_orgao) is None
    assert id_deputado_da_uri("") is None
    assert id_deputado_da_uri(None) is None
