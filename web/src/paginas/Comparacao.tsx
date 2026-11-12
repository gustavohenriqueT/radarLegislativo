import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
	type Comparacao as DadosDaComparacao,
	type DeputadoComparado,
	useDados,
	useTitulo,
	type VotacaoComparada,
} from "../api";
import { Estado } from "../componentes/Estado";
import { Hemiciclo } from "../componentes/Hemiciclo";
import {
	chaveDoVoto,
	data,
	identificacao,
	plural,
	rotuloDoVoto,
	TIPOS_DE_VOTO,
} from "../formato";

const SEM_VOTO = "Sem voto registrado";

function ordemDoVoto(voto: string | null) {
	const posicao = TIPOS_DE_VOTO.findIndex((tipo) => tipo.tipo === voto);
	return posicao === -1 ? TIPOS_DE_VOTO.length : posicao;
}

function sigla(deputado: DeputadoComparado) {
	return `${deputado.sigla_partido ?? ""}-${deputado.sigla_uf ?? ""}`;
}

function Voto({ voto }: { voto: string | null }) {
	if (!voto) {
		return <span className="voto-chip voto-outros">Sem registro</span>;
	}
	return (
		<span className={`voto-chip voto-${chaveDoVoto(voto)}`}>
			{rotuloDoVoto(voto)}
		</span>
	);
}

function Resumo({
	votacao,
	ordem,
}: {
	votacao: VotacaoComparada;
	ordem: string;
}) {
	return (
		<div className="comparacao-lado">
			<p className="detalhe">
				{ordem}, {data(votacao.data)}
			</p>
			<p>
				<Link to={`/votacoes/${votacao.id}`} viewTransition>
					{votacao.descricao}
				</Link>
			</p>
		</div>
	);
}

function ListaDeDeputados({ deputados }: { deputados: DeputadoComparado[] }) {
	return (
		<ul className="colunas">
			{deputados.map((deputado) => (
				<li key={deputado.id}>
					<Link to={`/deputados/${deputado.id}`} viewTransition>
						{deputado.nome}
					</Link>{" "}
					<span className="detalhe">{sigla(deputado)}</span>
				</li>
			))}
		</ul>
	);
}

export function Comparacao() {
	const [parametros] = useSearchParams();
	const primeira = parametros.get("primeira") ?? "";
	const segunda = parametros.get("segunda") ?? "";
	const { dados, erro, carregando } = useDados<DadosDaComparacao>(
		`/comparacao?primeira=${encodeURIComponent(primeira)}&segunda=${encodeURIComponent(segunda)}`,
	);
	const [lado, setLado] = useState<"a" | "b">("a");
	const [soDiferentes, setSoDiferentes] = useState(false);
	const [apontado, setApontado] = useState<number | null>(null);

	const nome = dados
		? identificacao(
				dados.primeira.sigla_tipo,
				dados.primeira.numero,
				dados.primeira.ano,
			)
		: null;

	useTitulo(nome ? `Comparação de votações de ${nome}` : null);

	const assentos = useMemo(() => {
		if (!dados) {
			return [];
		}
		const todos = [
			...dados.grupos.diferentes,
			...dados.grupos.iguais,
			...dados.grupos.so_primeira,
			...dados.grupos.so_segunda,
		];
		return todos.sort(
			(x, y) =>
				ordemDoVoto(x.voto_a) - ordemDoVoto(y.voto_a) ||
				ordemDoVoto(x.voto_b) - ordemDoVoto(y.voto_b) ||
				x.nome.localeCompare(y.nome, "pt-BR"),
		);
	}, [dados]);

	const apagados = useMemo(() => {
		const indices = new Set<number>();
		if (soDiferentes) {
			assentos.forEach((assento, indice) => {
				const votouDiferente =
					assento.voto_a !== null &&
					assento.voto_b !== null &&
					assento.voto_a !== assento.voto_b;
				if (!votouDiferente) {
					indices.add(indice);
				}
			});
		}
		return indices;
	}, [assentos, soDiferentes]);

	if (!primeira || !segunda) {
		return (
			<header className="cabecalho">
				<h1 className="titulo-grande">Comparação de votações</h1>
				<p className="introducao">
					Abra um projeto, marque duas votações e escolha “Comparar”.
				</p>
				<p>
					<Link to="/" viewTransition>
						Ir para a lista de projetos
					</Link>
				</p>
			</header>
		);
	}

	if (!dados) {
		return <Estado carregando={carregando} erro={erro} linhas={6} />;
	}

	const { diferentes, iguais, so_primeira, so_segunda } = dados.grupos;
	const destacado = apontado === null ? null : assentos[apontado];

	return (
		<article>
			<header className="cabecalho">
				{dados.primeira.id_proposicao && (
					<Link
						to={`/proposicoes/${dados.primeira.id_proposicao}`}
						className="voltar"
						viewTransition
					>
						Voltar para {nome}
					</Link>
				)}
				<h1 className="titulo-grande">Comparação de votações</h1>
				<p className="introducao">
					{plural(diferentes.length, "deputado votou", "deputados votaram")} de
					forma diferente nas duas votações e{" "}
					{plural(iguais.length, "repetiu", "repetiram")} o voto.
				</p>
			</header>

			<div className="comparacao-lados">
				<Resumo votacao={dados.primeira} ordem="Primeira votação" />
				<Resumo votacao={dados.segunda} ordem="Segunda votação" />
			</div>

			<p className="nota">
				As duas votações podem tratar de coisas diferentes, como um requerimento
				e o texto principal. Votar de forma diferente em cada uma não indica
				mudança de posição sobre o projeto.
			</p>

			<figure className="painel">
				<fieldset className="alternador">
					<legend className="oculto">Votação exibida</legend>
					<button
						type="button"
						aria-pressed={lado === "a"}
						onClick={() => setLado("a")}
					>
						Primeira
					</button>
					<button
						type="button"
						aria-pressed={lado === "b"}
						onClick={() => setLado("b")}
					>
						Segunda
					</button>
				</fieldset>

				<Hemiciclo
					votos={assentos.map(
						(assento) => (lado === "a" ? assento.voto_a : assento.voto_b) ?? "",
					)}
					apagados={apagados}
					aoApontar={setApontado}
					rotulo={`Votos dos ${assentos.length} deputados na ${
						lado === "a" ? "primeira" : "segunda"
					} votação`}
				/>

				<figcaption>
					<p className="painel-apontado" aria-live="polite">
						{destacado ? (
							<>
								<strong>{destacado.nome}</strong> ({sigla(destacado)}):{" "}
								{rotuloDoVoto(destacado.voto_a) ?? SEM_VOTO} na primeira,{" "}
								{rotuloDoVoto(destacado.voto_b) ?? SEM_VOTO} na segunda
							</>
						) : (
							"Cada ponto é o mesmo deputado nas duas votações. Alterne para ver as cores mudarem."
						)}
					</p>
					<label className="marcador">
						<input
							type="checkbox"
							checked={soDiferentes}
							onChange={(evento) => setSoDiferentes(evento.target.checked)}
						/>
						Destacar só quem votou diferente
					</label>
				</figcaption>
			</figure>

			<section className="secao" aria-labelledby="diferentes">
				<h2 id="diferentes">
					Votaram diferente{" "}
					<span className="contagem">{diferentes.length}</span>
				</h2>
				{diferentes.length === 0 ? (
					<p className="vazio">
						Ninguém que votou nas duas registrou votos diferentes.
					</p>
				) : (
					<ul className="mudancas">
						{diferentes.map((deputado) => (
							<li key={deputado.id}>
								<span>
									<Link to={`/deputados/${deputado.id}`} viewTransition>
										{deputado.nome}
									</Link>{" "}
									<span className="detalhe">{sigla(deputado)}</span>
								</span>
								<span className="mudancas-votos">
									<Voto voto={deputado.voto_a} />
									<span className="oculto">na primeira,</span>
									<span aria-hidden="true" className="mudancas-seta" />
									<Voto voto={deputado.voto_b} />
									<span className="oculto">na segunda</span>
								</span>
							</li>
						))}
					</ul>
				)}
			</section>

			{so_primeira.length > 0 && (
				<section className="secao" aria-labelledby="so-primeira">
					<h2 id="so-primeira">
						Votaram só na primeira{" "}
						<span className="contagem">{so_primeira.length}</span>
					</h2>
					<ListaDeDeputados deputados={so_primeira} />
				</section>
			)}

			{so_segunda.length > 0 && (
				<section className="secao" aria-labelledby="so-segunda">
					<h2 id="so-segunda">
						Votaram só na segunda{" "}
						<span className="contagem">{so_segunda.length}</span>
					</h2>
					<ListaDeDeputados deputados={so_segunda} />
				</section>
			)}
		</article>
	);
}
