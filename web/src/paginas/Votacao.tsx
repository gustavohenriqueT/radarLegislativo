import { Link, useParams } from "react-router-dom";
import { Placar } from "../componentes/Placar";
import { Situacao } from "../componentes/Situacao";
import { data, identificacao, resultado } from "../formato";
import { ATUALIZACAO_MS, type VotacaoDetalhe, useDados } from "../api";

export function Votacao() {
	const { id } = useParams();
	const { dados, erro, carregando } = useDados<VotacaoDetalhe>(
		`/votacoes/${id}`,
		ATUALIZACAO_MS,
	);

	if (!dados) {
		return <Situacao carregando={carregando} erro={erro} />;
	}

	const contar = (tipo: string) =>
		dados.grupos.find((grupo) => grupo.tipo === tipo)?.deputados.length ?? 0;
	const total = dados.grupos.reduce(
		(soma, grupo) => soma + grupo.deputados.length,
		0,
	);

	return (
		<>
			{dados.id_proposicao && (
				<Link to={`/proposicoes/${dados.id_proposicao}`} className="voltar">
					Voltar para {identificacao(dados.sigla_tipo, dados.numero, dados.ano)}
				</Link>
			)}
			<h1>{identificacao(dados.sigla_tipo, dados.numero, dados.ano)}</h1>
			<p className="ementa">{dados.descricao}</p>
			<p className="detalhe">
				Votação de {data(dados.data)}
				{resultado(dados.aprovacao) && <>, {resultado(dados.aprovacao)}</>}
			</p>

			<Placar
				sim={contar("Sim")}
				nao={contar("Não")}
				abstencao={contar("Abstenção")}
				total={total}
			/>

			{dados.grupos.map((grupo) => (
				<section key={grupo.tipo}>
					<h2>
						{grupo.rotulo} ({grupo.deputados.length})
					</h2>
					<ul className="colunas">
						{grupo.deputados.map((deputado) => (
							<li key={deputado.id}>
								<Link to={`/deputados/${deputado.id}`}>{deputado.nome}</Link>{" "}
								<span className="sigla">
									{deputado.sigla_partido}-{deputado.sigla_uf}
								</span>
							</li>
						))}
					</ul>
				</section>
			))}
		</>
	);
}
