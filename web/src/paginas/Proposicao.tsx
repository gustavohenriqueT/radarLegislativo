import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { type Autor, type ProposicaoDetalhe, useDados } from "../api";
import { Placar } from "../componentes/Placar";
import { Situacao } from "../componentes/Situacao";
import { data, identificacao, NOMES_TIPOS, resultado } from "../formato";

function NomeDoAutor({ autor }: { autor: Autor }) {
	const uf = autor.sigla_uf ? ` (${autor.sigla_uf})` : "";
	if (autor.id_deputado) {
		return (
			<Link to={`/deputados/${autor.id_deputado}`}>
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
	);
	const [mostrarCoautores, setMostrarCoautores] = useState(false);

	if (!dados) {
		return <Situacao carregando={carregando} erro={erro} />;
	}

	const proponentes = dados.autores.filter((autor) => autor.proponente);
	const coautores = dados.autores.filter((autor) => !autor.proponente);

	return (
		<>
			<p className="tipo">
				{NOMES_TIPOS[dados.sigla_tipo] ?? dados.sigla_tipo}
			</p>
			<h1>{identificacao(dados.sigla_tipo, dados.numero, dados.ano)}</h1>
			<p className="ementa">{dados.ementa}</p>
			<p className="detalhe">
				{dados.data_apresentacao && (
					<>Apresentada em {data(dados.data_apresentacao)}. </>
				)}
				{dados.url_inteiro_teor && (
					<a href={dados.url_inteiro_teor} target="_blank" rel="noreferrer">
						Ler o texto oficial
					</a>
				)}
			</p>

			<section>
				<h2>Autoria</h2>
				{proponentes.length === 0 ? (
					<p className="aviso">Autoria ainda não coletada.</p>
				) : (
					<ul className="autores">
						{proponentes.map((autor) => (
							<li key={autor.nome}>
								<NomeDoAutor autor={autor} />
								{autor.tipo && (
									<span className="autor-tipo"> {autor.tipo}</span>
								)}
							</li>
						))}
					</ul>
				)}
				{coautores.length > 0 && (
					<>
						<button
							type="button"
							className="botao-texto"
							aria-expanded={mostrarCoautores}
							onClick={() => setMostrarCoautores(!mostrarCoautores)}
						>
							{mostrarCoautores ? "Esconder" : "Ver"}{" "}
							{coautores.length === 1
								? "o coautor"
								: `os ${coautores.length} coautores`}
						</button>
						{mostrarCoautores && (
							<ul className="colunas">
								{coautores.map((autor) => (
									<li key={autor.nome}>
										<NomeDoAutor autor={autor} />
									</li>
								))}
							</ul>
						)}
					</>
				)}
			</section>

			<section>
				<h2>Votações no Plenário</h2>
				<ul className="votacoes">
					{dados.votacoes.map((votacao) => (
						<li key={votacao.id}>
							<p className="detalhe">
								{data(votacao.data)}
								{resultado(votacao.aprovacao) && (
									<>, {resultado(votacao.aprovacao)}</>
								)}
							</p>
							<p>{votacao.descricao}</p>
							<Placar
								sim={votacao.sim}
								nao={votacao.nao}
								abstencao={votacao.abstencao}
								total={votacao.total}
							/>
							{votacao.total > 0 && (
								<Link to={`/votacoes/${votacao.id}`}>
									Ver como cada deputado votou
								</Link>
							)}
						</li>
					))}
				</ul>
			</section>
		</>
	);
}
