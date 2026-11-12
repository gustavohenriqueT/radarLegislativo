from radar.explicacoes import fatos_da_votacao, quorum_exigido, termos_da_descricao


def nomes(descricao: str) -> list[str]:
    return [termo["termo"] for termo in termos_da_descricao(descricao)]


def test_pec_em_turno_exige_308_votos():
    descricao = "Aprovada, em segundo turno, a Proposta de Emenda à Constituição n° 5"

    assert quorum_exigido("PEC", descricao)["votos"] == 308


def test_destaque_de_pec_nao_recebe_quorum():
    assert quorum_exigido("PEC", "Mantido o texto. Sim: 335; Não: 117") is None


def test_texto_principal_de_lei_complementar_exige_257_votos():
    descricao = "Aprovado o Substitutivo ao Projeto de Lei Complementar nº 10"

    assert quorum_exigido("PLP", descricao)["votos"] == 257


def test_redacao_final_de_lei_complementar_nao_recebe_quorum():
    assert quorum_exigido("PLP", "Aprovada a Redação Final") is None


def test_urgencia_do_artigo_155_exige_257_votos():
    descricao = "Aprovado o Requerimento de Urgência (Art. 155 do RICD)."

    assert quorum_exigido("REQ", descricao)["votos"] == 257


def test_projeto_de_lei_comum_nao_recebe_quorum():
    assert quorum_exigido("PL", "Aprovado o Projeto de Lei nº 780, de 2023.") is None


def test_glossario_ignora_acentos_e_maiusculas():
    assert nomes("Aprovada a REDAÇÃO FINAL assinada pelo relator") == ["Redação final"]


def test_urgencia_nao_repete_o_termo_generico_de_requerimento():
    assert nomes("Aprovado o Requerimento de Urgência (Art. 155 do RICD).") == [
        "Requerimento de urgência"
    ]


def test_requerimento_sem_detalhe_recebe_o_termo_generico():
    assert nomes("Rejeitado o Requerimento.") == ["Requerimento"]


def test_descricao_sem_termo_conhecido_devolve_lista_vazia():
    assert termos_da_descricao("Aprovado o Projeto de Lei nº 780, de 2023.") == []
    assert termos_da_descricao(None) == []


def test_fatos_contam_diferenca_e_quem_nao_registrou_voto():
    grupos = [
        {"tipo": "Sim", "deputados": [{}] * 300},
        {"tipo": "Não", "deputados": [{}] * 100},
        {"tipo": "Abstenção", "deputados": [{}] * 13},
    ]

    fatos = fatos_da_votacao(grupos)

    assert fatos["diferenca"] == 200
    assert fatos["sem_registro"] == 100
