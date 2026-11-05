import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
	ATUALIZACAO_MS,
	type DeputadoNoVoto,
	useDados,
	useTitulo,
	type VotacaoDetalhe,
} from "../api";
import { Legenda } from "../componentes/BarraVotos";
import { Estado } from "../componentes/Estado";
import { Hemiciclo } from "../componentes/Hemiciclo";
import {
	chaveDoVoto,
	data,
	identificacao,
	plural,
	resultado,
	semAcento,
} from "../formato";

type Assento = DeputadoNoVoto & { tipo: string; rotulo: string };

function sigla(deputado: DeputadoNoVoto) {
	return `${deputado.sigla_partido ?? ""}-${deputado.sigla_uf ?? ""}`;
}

export function Votacao() {
	const { id } = useParams();
	const { dados, erro, carregando } = useDados<VotacaoDetalhe>(
		`/votacoes/${id}`,
		ATUALIZACAO_MS,
	);
	const [filtro, setFiltro] = useState("");
	const [apontado, setApontado] = useState<number | null>(null);
	const nome = dados
		? identificacao(dados.sigla_tipo, dados.numero, dados.ano)
		: null;

	useTitulo(nome ? `Votação de ${nome}` : null);

	const assentos = useMemo<Assento[]>(
		() =>
			dados?.grupos.flatMap((grupo) =>
				grupo.deputados.map((deputado) => ({
					...deputado,
					tipo: grupo.tipo,
					rotulo: grupo.rotulo,
				})),
			) ?? [],
		[dados],
	);

	const termo = semAcento(filtro.trim());
	const corresponde = (assento: Assento) =>
		!termo || semAcento(`${assento.nome} ${sigla(assento)}`).includes(termo);

	const apagados = useMemo(() => {
		const indices = new Set<number>();
		if (termo) {
			assentos.forEach((assento, indice) => {
				if (!semAcento(`${assento.nome} ${sigla(assento)}`).includes(termo)) {
					indices.add(indice);
				}
			});
		}
		return indices;
	}, [assentos, termo]);

	if (!dados) {
		return <Estado carregando={carregando} erro={erro} linhas={6} />;
	}

	const destacado = apontado === null ? null : assentos[apontado];

	return (
		<article>
			<header className="cabecalho">
				{dados.id_proposicao && (
					<Link
						to={`/proposicoes/${dados.id_proposicao}`}
						className="voltar"
						viewTransition
					>
						Voltar para {nome}
					</Link>
				)}
				<h1 className="titulo-grande">{nome}</h1>
				<p className="ementa">{dados.descricao}</p>
				<p className="detalhe">
					Votação de {data(dados.data)}
					{resultado(dados.aprovacao) &&
						`, ${resultado(dados.aprovacao)?.toLowerCase()}`}
					.
				</p>
			</header>

			<div className="filtro">
				<label htmlFor="filtro">Encontrar um deputado nesta votação</label>
				<input
					id="filtro"
					type="search"
					value={filtro}
					placeholder="Nome, partido ou estado"
					autoComplete="off"
					onChange={(evento) => setFiltro(evento.target.value)}
				/>
				{termo && (
					<p className="detalhe" aria-live="polite">
						{plural(
							assentos.length - apagados.size,
							"deputado encontrado",
							"deputados encontrados",
						)}
					</p>
				)}
			</div>

			<figure className="painel">
				<Hemiciclo
					votos={assentos.map((assento) => assento.tipo)}
					apagados={apagados}
					aoApontar={setApontado}
					rotulo={`Distribuição dos ${assentos.length} votos registrados`}
				/>
				<figcaption>
					<p className="painel-apontado" aria-live="polite">
						{destacado ? (
							<>
								<strong>{destacado.nome}</strong> ({sigla(destacado)}):{" "}
								{destacado.rotulo}
							</>
						) : (
							"Passe o cursor ou toque num ponto para ver o voto."
						)}
					</p>
					<Legenda
						partes={dados.grupos.map((grupo) => ({
							chave: chaveDoVoto(grupo.tipo),
							rotulo: grupo.rotulo,
							valor: grupo.deputados.length,
						}))}
					/>
				</figcaption>
			</figure>

			{dados.grupos.map((grupo) => {
				const visiveis = grupo.deputados.filter((deputado) =>
					corresponde({ ...deputado, tipo: grupo.tipo, rotulo: grupo.rotulo }),
				);
				if (visiveis.length === 0) {
					return null;
				}
				return (
					<section key={grupo.tipo} className="secao grupo">
						<h2>
							<span
								className={`legenda-marca voto-${chaveDoVoto(grupo.tipo)}`}
								aria-hidden="true"
							/>
							{grupo.rotulo}{" "}
							<span className="contagem">{grupo.deputados.length}</span>
						</h2>
						<ul className="colunas">
							{visiveis.map((deputado) => (
								<li key={deputado.id}>
									<Link to={`/deputados/${deputado.id}`} viewTransition>
										{deputado.nome}
									</Link>{" "}
									<span className="detalhe">{sigla(deputado)}</span>
								</li>
							))}
						</ul>
					</section>
				);
			})}
		</article>
	);
}
