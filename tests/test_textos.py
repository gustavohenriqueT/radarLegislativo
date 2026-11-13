from radar.textos import comparar_textos, dividir_em_trechos, recortar_dispositivo

ORIGINAL = """PROPOSTA DE EMENDA À CONSTITUIÇÃO nº          , DE 2023
Acrescenta § 4º-A ao art. 150 da
Constituição Federal.
Art. 1º O art. 150 da Constituição Federal passa a vigorar
acrescido do seguinte parágrafo:
“...............................................................................
...........
§ 4º-A A imunidade compreende a aquisição de bens
necessários às entidades.
Art. 2º Esta Emenda entra em vigor na data de sua publicação.
JUSTIFICAÇÃO
Art. 1º da justificativa não faz parte do texto.
"""

FINAL = """REDAÇÃO FINAL
Art. 1º O art. 150 da Constituição Federal passa
a vigorar acrescido do seguinte parágrafo:
“ ............................
§ 4º-A Sem prejuízo das finalidades essenciais, a  imunidade
compreende a aquisição de bens necessários às entidades.
§ 4º-B Lei complementar definirá os limites.
Art. 2º Esta Emenda entra em vigor na data de sua publicação.
Sala das Sessões, em 28 de maio de 2026.
"""


def tipos(antes: str, depois: str) -> list[str]:
    return [trecho["tipo"] for trecho in comparar_textos(antes, depois)]


def test_recorte_comeca_no_artigo_primeiro_e_para_na_justificacao():
    texto = recortar_dispositivo(ORIGINAL)

    assert texto.startswith("Art. 1º O art. 150")
    assert "JUSTIFICAÇÃO" not in texto
    assert "justificativa" not in texto


def test_recorte_de_parecer_usa_o_texto_depois_do_titulo_do_substitutivo():
    parecer = (
        "I - RELATÓRIO\nArt. 1º citado no relatório.\n"
        "SUBSTITUTIVO À PEC 5\nArt. 1º Texto do substitutivo.\n"
        "Sala da Comissão, em 2024."
    )

    assert recortar_dispositivo(parecer) == "Art. 1º Texto do substitutivo."


def test_documento_sem_artigos_nao_tem_texto_para_comparar():
    assert recortar_dispositivo("Requerimento de retirada de pauta.") is None


def test_trechos_juntam_linhas_quebradas_e_tiram_o_pontilhado():
    trechos = dividir_em_trechos(recortar_dispositivo(ORIGINAL))

    assert len(trechos) == 3
    assert (
        trechos[1]
        == "§ 4º-A A imunidade compreende a aquisição de bens necessários às entidades."
    )
    assert "..." not in trechos[0]


def test_quebra_de_linha_diferente_nao_conta_como_mudanca():
    antes = "Art. 1º O texto fica\nassim mesmo."
    depois = "Art. 1º O  texto  fica assim\nmesmo."

    assert tipos(antes, depois) == ["igual"]


def test_palavras_grudadas_pela_extracao_nao_contam_como_mudanca():
    antes = "Art. 1º Acrescenta parágrafo ao art. 150 da Constituição Federal."
    depois = "Art. 1º Acrescenta parágrafo ao art. 150 daConstituição Federal."

    assert tipos(antes, depois) == ["igual"]


def test_compara_versoes_marcando_o_que_entrou():
    resultado = comparar_textos(
        recortar_dispositivo(ORIGINAL), recortar_dispositivo(FINAL)
    )

    assert [trecho["tipo"] for trecho in resultado] == ["igual", "alterado", "igual"]
    incluido = " ".join(
        parte["texto"]
        for parte in resultado[1]["partes"]
        if parte["tipo"] == "incluido"
    )
    assert "Sem prejuízo das finalidades essenciais" in incluido
    assert "§ 4º-B Lei complementar definirá os limites." in incluido


def test_trecho_totalmente_novo_aparece_como_incluido():
    antes = "Art. 1º Primeiro.\nArt. 2º Segundo."
    depois = "Art. 1º Primeiro.\nArt. 2º Segundo.\nArt. 3º Terceiro, que não existia."

    assert tipos(antes, depois) == ["igual", "igual", "incluido"]
