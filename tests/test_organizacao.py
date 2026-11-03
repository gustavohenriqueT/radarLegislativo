from radar.organizacao import agrupar_votos


def criar_voto(nome: str, partido: str, uf: str, tipo: str) -> dict:
    return {
        "tipoVoto": tipo,
        "deputado_": {"nome": nome, "siglaPartido": partido, "siglaUf": uf},
    }


def test_agrupa_votos_por_tipo():
    votos = [
        criar_voto("Ana", "AAA", "SP", "Sim"),
        criar_voto("Bruno", "BBB", "RJ", "Não"),
        criar_voto("Carla", "AAA", "MG", "Sim"),
    ]

    grupos = agrupar_votos(votos)

    assert set(grupos) == {"Sim", "Não"}
    assert len(grupos["Sim"]) == 2
    assert "Bruno (BBB-RJ)" in grupos["Não"]


def test_lista_vazia_devolve_dicionario_vazio():
    assert agrupar_votos([]) == {}
