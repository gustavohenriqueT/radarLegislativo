import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
	ATUALIZACAO_MS,
	type Autor,
	type ProposicaoDetalhe,
	useDados,
	useTitulo,
} from "../api";
import { BarraVotos } from "../componentes/BarraVotos";
import { Estado } from "../componentes/Estado";
import {
	data,
	identificacao,
	NOMES_TIPOS,
	plural,
	resultado,
} from "../formato";

function NomeDoAutor({ autor }: { autor: Autor }) {
	const uf = autor.sigla_uf ? ` (${autor.sigla_uf})` : "";
	if (autor.id_deputado) {
		return (
			<Link to={`/deputados/${autor.id_deputado}`} viewTransition>
				{autor.nome}
				{uf}
			</Link>
		);
	}
	return <>{autor.nome}</>;
}

export function Proposicao() {
	const { id } = useParams();
	const { dados, erro, carregando } = useDados<ProposicaoDetalhe>(
		`/proposicoes/${id}`,
		ATUALIZACAO_MS,
	);
	const [mostrarCoautores, setMostrarCoautores] = useState(false);
	const nome = dados
		? identificacao(dados.sigla_tipo, dados.numero, dados.ano)
		: null;

	useTitulo(nome);

	if (!dados) {
		return <Estado carregando={carregando} erro={erro} linhas={5} />;
	}

	const proponentes = dados.autores.filter((autor) => autor.proponente);
	const coautores = dados.autores.filter((autor) => !autor.proponente);
	const nominais = dados.votacoes.filter((votacao) => votacao.total > 0);

	return (
		<article>
			<header className="cabecalho">
				<p className="tipo">
					{NOMES_TIPOS[dados.sigla_tipo] ?? dados.sigla_tipo}
				</p>
				<h1
					className="titulo-grande"
					style={{ viewTransitionName: `proposicao-${dados.id}` }}
				>
					{nome}
				</h1>
				<p className="ementa">{dados.ementa}</p>
				<p className="detalhe">
					{dados.data_apresentacao &&
						`Apresentada em ${data(dados.data_apresentacao)}. `}
					{dados.url_inteiro_teor && (
						<a href={dados.url_inteiro_teor} target="_blank" rel="noreferrer">
							Ler o texto oficial
						</a>
					)}
				</p>
			</header>

			<section className="secao" aria-labelledby="autoria">
				<h2 id="autoria">Autoria</h2>
				{proponentes.length === 0 ? (
					<p className="vazio">
						A autoria deste projeto ainda não foi coletada. Ela aparece aqui
						depois da próxima atualização.
					</p>
				) : (
					<ul className="autores">
						{proponentes.map((autor) => (
							<li key={autor.nome}>
								<NomeDoAutor autor={autor} />
								{autor.tipo && <span className="detalhe"> {autor.tipo}</span>}
							</li>
						))}
					</ul>
				)}

				{coautores.length > 0 && (
					<div className="expansivel" data-aberto={mostrarCoautores}>
						<button
							type="button"
							className="botao-texto"
							aria-expanded={mostrarCoautores}
							aria-controls="coautores"
							onClick={() => setMostrarCoautores(!mostrarCoautores)}
						>
							{mostrarCoautores ? "Esconder" : "Ver"}{" "}
							{coautores.length === 1
								? "o coautor"
								: `os ${coautores.length} coautores`}
						</button>
						<div className="expansivel-corpo" id="coautores">
							<ul className="colunas" inert={!mostrarCoautores}>
								{coautores.map((autor) => (
									<li key={autor.nome}>
										<NomeDoAutor autor={autor} />
									</li>
								))}
							</ul>
						</div>
					</div>
				)}
			</section>

			<section className="secao" aria-labelledby="votacoes">
				<h2 id="votacoes">Votações no Plenário</h2>
				<p className="detalhe">
					{plural(dados.votacoes.length, "votação", "votações")}, das quais{" "}
					{plural(nominais.length, "teve", "tiveram")} voto registrado por
					deputado. Requerimentos e destaques também são votados e aparecem
					aqui.
				</p>

				<ol className="linha-do-tempo">
					{dados.votacoes.map((votacao) => (
						<li key={votacao.id}>
							<p className="linha-do-tempo-data">
								{data(votacao.data)}
								{resultado(votacao.aprovacao) && (
									<span
										className={`selo selo-${votacao.aprovacao ? "aprovada" : "rejeitada"}`}
									>
										{resultado(votacao.aprovacao)}
									</span>
								)}
							</p>
							<p>{votacao.descricao}</p>
							<BarraVotos contagem={votacao} />
							{votacao.total > 0 && (
								<Link to={`/votacoes/${votacao.id}`} viewTransition>
									Ver o voto de cada deputado
								</Link>
							)}
						</li>
					))}
				</ol>
			</section>
		</article>
	);
}
