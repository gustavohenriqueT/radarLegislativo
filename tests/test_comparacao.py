from radar.organizacao import classificar_comparacao


def criar_linha(nome: str, voto_a: str | None, voto_b: str | None) -> dict:
    return {"nome": nome, "voto_a": voto_a, "voto_b": voto_b}


def test_separa_quem_votou_diferente_de_quem_votou_igual():
    linhas = [
        criar_linha("Ana", "Sim", "Não"),
        criar_linha("Bruno", "Sim", "Sim"),
    ]

    grupos = classificar_comparacao(linhas)

    assert [linha["nome"] for linha in grupos["diferentes"]] == ["Ana"]
    assert [linha["nome"] for linha in grupos["iguais"]] == ["Bruno"]


def test_quem_votou_em_uma_so_nao_conta_como_voto_diferente():
    linhas = [
        criar_linha("Carla", "Sim", None),
        criar_linha("Davi", None, "Não"),
    ]

    grupos = classificar_comparacao(linhas)

    assert grupos["diferentes"] == []
    assert [linha["nome"] for linha in grupos["so_primeira"]] == ["Carla"]
    assert [linha["nome"] for linha in grupos["so_segunda"]] == ["Davi"]
