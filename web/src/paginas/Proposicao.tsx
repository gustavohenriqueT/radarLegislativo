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
import { Caminho } from "../componentes/Caminho";
import { Glossario } from "../componentes/Entenda";
import { Estado } from "../componentes/Estado";
import { Ficha } from "../componentes/Ficha";
import { Natureza } from "../componentes/Natureza";
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
	const [marcadas, setMarcadas] = useState<string[]>([]);
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
	const podeComparar = nominais.length >= 2;
	const [maisRecente, maisAntiga] = dados.votacoes
		.filter((votacao) => marcadas.includes(votacao.id))
		.map((votacao) => votacao.id);

	function marcar(idVotacao: string) {
		setMarcadas((atuais) => {
			if (atuais.includes(idVotacao)) {
				return atuais.filter((id) => id !== idVotacao);
			}
			return [...atuais, idVotacao].slice(-2);
		});
	}

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
				{dados.versoes_com_texto >= 2 && (
					<p>
						<Link to={`/proposicoes/${dados.id}/texto`} viewTransition>
							Ver como o texto mudou entre as versões
						</Link>
					</p>
				)}
			</header>

			<section className="secao" aria-labelledby="ficha">
				<h2 id="ficha">Ficha do projeto</h2>
				<Ficha projeto={dados} />
			</section>

			{dados.caminho && (
				<section className="secao" aria-labelledby="caminho">
					<h2 id="caminho">Onde o projeto está</h2>
					<p className="detalhe">
						Caminho que este tipo de projeto percorre até virar norma.
					</p>
					<Caminho caminho={dados.caminho} situacao={dados.situacao} />
				</section>
			)}

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
					deputado. Cada votação está marcada pelo que decidia: o texto do
					projeto, um trecho dele ou uma questão de procedimento.
				</p>

				<ol className="linha-do-tempo">
					{dados.votacoes.map((votacao) => (
						<li key={votacao.id}>
							<p className="linha-do-tempo-data">
								<Natureza natureza={votacao.natureza} />
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
							<Glossario termos={votacao.glossario} />
							<BarraVotos contagem={votacao} />
							{votacao.total > 0 && (
								<div className="acoes">
									<Link to={`/votacoes/${votacao.id}`} viewTransition>
										Ver o voto de cada deputado
									</Link>
									{podeComparar && (
										<label className="marcador">
											<input
												type="checkbox"
												checked={marcadas.includes(votacao.id)}
												onChange={() => marcar(votacao.id)}
											/>
											Comparar
										</label>
									)}
								</div>
							)}
						</li>
					))}
				</ol>

				{marcadas.length > 0 && (
					<div className="barra-comparar" role="status">
						{maisAntiga ? (
							<>
								<span>2 votações marcadas</span>
								<Link
									to={`/comparar?primeira=${maisAntiga}&segunda=${maisRecente}`}
									className="botao-principal"
									viewTransition
								>
									Comparar
								</Link>
							</>
						) : (
							<span>Marque mais uma votação para comparar</span>
						)}
						<button
							type="button"
							className="botao-texto"
							onClick={() => setMarcadas([])}
						>
							Limpar
						</button>
					</div>
				)}
			</section>
		</article>
	);
}
