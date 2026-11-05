import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
	ATUALIZACAO_MS,
	type ProposicaoResumo,
	useAtrasado,
	useDados,
	useTitulo,
	type VotacaoRecente,
} from "../api";
import { Legenda, partesDaContagem } from "../componentes/BarraVotos";
import { Estado } from "../componentes/Estado";
import { Hemiciclo } from "../componentes/Hemiciclo";
import { data, identificacao, NOMES_TIPOS, plural } from "../formato";

const POR_PAGINA = 20;

function UltimaVotacao() {
	const { dados } = useDados<VotacaoRecente[]>(
		"/votacoes?limite=1",
		ATUALIZACAO_MS,
	);
	const votacao = dados?.[0];

	if (!votacao) {
		return <div className="destaque destaque-vazio" aria-hidden="true" />;
	}

	const partes = partesDaContagem(votacao);
	const votos = partes.flatMap((parte) =>
		Array<string>(parte.valor).fill(
			parte.rotulo === "Outros" ? "" : parte.rotulo,
		),
	);
	const nome = identificacao(votacao.sigla_tipo, votacao.numero, votacao.ano);

	return (
		<section className="destaque" aria-labelledby="ultima-votacao">
			<h2 id="ultima-votacao" className="destaque-titulo">
				Última votação nominal
			</h2>
			<Hemiciclo
				votos={votos}
				rotulo={`Resultado da votação de ${nome}: ${partes
					.map((parte) => `${parte.valor} ${parte.rotulo}`)
					.join(", ")}`}
			/>
			<Legenda partes={partes} />
			<p className="destaque-texto">
				<Link to={`/votacoes/${votacao.id}`} viewTransition>
					{nome}
				</Link>
				, {data(votacao.data)}. {votacao.descricao}
			</p>
		</section>
	);
}

export function Inicio() {
	const [parametros, setParametros] = useSearchParams();
	const busca = parametros.get("busca") ?? "";
	const tipo = parametros.get("tipo") ?? "";
	const pagina = Number(parametros.get("pagina") ?? "1");
	const [texto, setTexto] = useState(busca);
	const textoAtrasado = useAtrasado(texto.trim());

	useTitulo(null);

	useEffect(() => {
		if (textoAtrasado === busca) {
			return;
		}
		setParametros(
			(anteriores) => {
				const proximos = new URLSearchParams(anteriores);
				if (textoAtrasado) {
					proximos.set("busca", textoAtrasado);
				} else {
					proximos.delete("busca");
				}
				proximos.delete("pagina");
				return proximos;
			},
			{ replace: true },
		);
	}, [textoAtrasado, busca, setParametros]);

	const consulta = new URLSearchParams({ pagina: String(pagina) });
	if (busca) {
		consulta.set("busca", busca);
	}
	if (tipo) {
		consulta.set("tipo", tipo);
	}
	const { dados, erro, carregando } = useDados<ProposicaoResumo[]>(
		`/proposicoes?${consulta}`,
		ATUALIZACAO_MS,
	);

	function mudar(chave: string, valor: string) {
		setParametros((anteriores) => {
			const proximos = new URLSearchParams(anteriores);
			if (valor) {
				proximos.set(chave, valor);
			} else {
				proximos.delete(chave);
			}
			if (chave !== "pagina") {
				proximos.delete("pagina");
			}
			return proximos;
		});
	}

	return (
		<>
			<div className="abertura">
				<div className="abertura-texto">
					<h1 className="titulo-grande">Como a Câmara votou</h1>
					<p className="introducao">
						Encontre um projeto e veja o voto registrado de cada deputado no
						Plenário.
					</p>

					<search className="busca">
						<label htmlFor="busca" className="busca-rotulo">
							Buscar por número ou assunto
						</label>
						<div className="busca-campos">
							<input
								id="busca"
								type="search"
								value={texto}
								placeholder="PEC 5/2023, saúde, educação…"
								autoComplete="off"
								onChange={(evento) => setTexto(evento.target.value)}
							/>
							<select
								aria-label="Tipo de proposição"
								value={tipo}
								onChange={(evento) => mudar("tipo", evento.target.value)}
							>
								<option value="">Todos os tipos</option>
								{Object.entries(NOMES_TIPOS).map(([sigla, nome]) => (
									<option key={sigla} value={sigla}>
										{nome}
									</option>
								))}
							</select>
						</div>
					</search>
				</div>

				<UltimaVotacao />
			</div>

			<section aria-labelledby="titulo-lista" className="secao">
				<h2 id="titulo-lista">
					{busca ? `Resultados para “${busca}”` : "Projetos votados"}
				</h2>

				{!dados && <Estado carregando={carregando} erro={erro} linhas={4} />}

				{dados && dados.length === 0 && (
					<p className="vazio">
						Nenhum projeto votado com esse termo. Tente o número (como “PL
						1822”) ou uma palavra mais curta.
					</p>
				)}

				{dados && dados.length > 0 && (
					<ul className="lista" aria-busy={carregando}>
						{dados.map((proposicao) => (
							<li key={proposicao.id}>
								<Link
									to={`/proposicoes/${proposicao.id}`}
									className="lista-link"
									viewTransition
								>
									<span
										className="lista-titulo"
										style={{
											viewTransitionName: `proposicao-${proposicao.id}`,
										}}
									>
										{identificacao(
											proposicao.sigla_tipo,
											proposicao.numero,
											proposicao.ano,
										)}
									</span>
									<span className="lista-texto">{proposicao.ementa}</span>
									<span className="lista-detalhe">
										{plural(proposicao.total_votacoes, "votação", "votações")},
										a última em {data(proposicao.ultima_votacao)}
									</span>
								</Link>
							</li>
						))}
					</ul>
				)}

				{dados && (pagina > 1 || dados.length === POR_PAGINA) && (
					<nav className="paginacao" aria-label="Páginas">
						<button
							type="button"
							disabled={pagina <= 1}
							onClick={() => mudar("pagina", String(pagina - 1))}
						>
							Anteriores
						</button>
						<span>Página {pagina}</span>
						<button
							type="button"
							disabled={dados.length < POR_PAGINA}
							onClick={() => mudar("pagina", String(pagina + 1))}
						>
							Próximos
						</button>
					</nav>
				)}
			</section>
		</>
	);
}
