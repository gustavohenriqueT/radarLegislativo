import type { ProposicaoDetalhe } from "../api";
import { data, plural } from "../formato";

export function Ficha({ projeto }: { projeto: ProposicaoDetalhe }) {
	const proponentes = projeto.autores.filter((autor) => autor.proponente);
	const nominais = projeto.votacoes.filter((votacao) => votacao.total > 0);
	const ultima = projeto.votacoes[0];

	return (
		<dl className="ficha">
			{projeto.tipo && (
				<div className="ficha-item ficha-item-largo">
					<dt>
						O que é {projeto.tipo.nome.startsWith("Proposta") ? "uma" : "um"}{" "}
						{projeto.sigla_tipo}?
					</dt>
					<dd>{projeto.tipo.explicacao}</dd>
				</div>
			)}
			{projeto.tipo && (
				<div className="ficha-item ficha-item-largo">
					<dt>O que precisa para ser aprovado</dt>
					<dd>{projeto.tipo.aprovacao}</dd>
				</div>
			)}
			<div className="ficha-item">
				<dt>Apresentado por</dt>
				<dd>
					{proponentes.length === 0
						? "Ainda não coletado"
						: proponentes.length === 1
							? proponentes[0].nome
							: plural(proponentes.length, "autor", "autores")}
				</dd>
			</div>
			<div className="ficha-item">
				<dt>Apresentado em</dt>
				<dd>
					{projeto.data_apresentacao
						? data(projeto.data_apresentacao)
						: "Sem registro"}
				</dd>
			</div>
			<div className="ficha-item">
				<dt>Votações no Plenário</dt>
				<dd>
					{projeto.votacoes.length}
					<span className="detalhe">
						{" "}
						({plural(nominais.length, "com voto nominal", "com voto nominal")})
					</span>
				</dd>
			</div>
			<div className="ficha-item">
				<dt>Última votação</dt>
				<dd>{ultima ? data(ultima.data) : "Nenhuma"}</dd>
			</div>
		</dl>
	);
}