import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
	type Mudancas,
	type ProposicaoDetalhe,
	type Trecho,
	useDados,
	useTitulo,
	type Versao,
} from "../api";
import { Estado } from "../componentes/Estado";
import { data, identificacao, plural } from "../formato";

function TrechoDoTexto({ trecho }: { trecho: Trecho }) {
	if (trecho.tipo === "incluido") {
		return (
			<p className="trecho">
				<ins>{trecho.texto}</ins>
			</p>
		);
	}
	if (trecho.tipo === "retirado") {
		return (
			<p className="trecho">
				<del>{trecho.texto}</del>
			</p>
		);
	}
	if (trecho.tipo === "alterado") {
		return (
			<p className="trecho">
				{trecho.partes.map((parte, indice) => {
					const chave = `${indice}-${parte.tipo}`;
					if (parte.tipo === "incluido") {
						return <ins key={chave}>{parte.texto} </ins>;
					}
					if (parte.tipo === "retirado") {
						return <del key={chave}>{parte.texto} </del>;
					}
					return <span key={chave}>{parte.texto} </span>;
				})}
			</p>
		);
	}
	return <p className="trecho trecho-igual">{trecho.texto}</p>;
}

function Comparacao({ caminho }: { caminho: string }) {
	const { dados, erro, carregando } = useDados<Mudancas>(caminho);
	const [soMudancas, setSoMudancas] = useState(true);

	if (!dados) {
		return <Estado carregando={carregando} erro={erro} linhas={5} />;
	}

	const mudaram = dados.trechos.filter((trecho) => trecho.tipo !== "igual");
	const iguais = dados.trechos.length - mudaram.length;
	const visiveis = soMudancas ? mudaram : dados.trechos;

	return (
		<>
			<p className="detalhe" aria-live="polite">
				{plural(mudaram.length, "trecho mudou", "trechos mudaram")} e{" "}
				{plural(iguais, "ficou igual", "ficaram iguais")}.
			</p>

			<div className="texto-controles">
				<label className="marcador">
					<input
						type="checkbox"
						checked={soMudancas}
						onChange={(evento) => setSoMudancas(evento.target.checked)}
					/>
					Mostrar só o que mudou
				</label>
				<p className="texto-legenda">
					<ins>Incluído</ins> <del>Retirado</del>
				</p>
			</div>

			{visiveis.length === 0 ? (
				<p className="vazio">O texto dos artigos é o mesmo nas duas versões.</p>
			) : (
				<div className="texto-comparado">
					{visiveis.map((trecho, indice) => (
						<TrechoDoTexto
							// biome-ignore lint/suspicious/noArrayIndexKey: os trechos não têm identificador e a ordem é fixa
							key={indice}
							trecho={trecho}
						/>
					))}
				</div>
			)}
		</>
	);
}

function rotuloDaVersao(versao: Versao) {
	return `${versao.rotulo}, ${data(versao.data)}`;
}

export function Texto() {
	const { id } = useParams();
	const [parametros, setParametros] = useSearchParams();
	const proposicao = useDados<ProposicaoDetalhe>(`/proposicoes/${id}`);
	const versoes = useDados<Versao[]>(`/proposicoes/${id}/versoes`);

	const nome = proposicao.dados
		? identificacao(
				proposicao.dados.sigla_tipo,
				proposicao.dados.numero,
				proposicao.dados.ano,
			)
		: null;

	useTitulo(nome ? `Texto de ${nome}` : null);

	if (!versoes.dados) {
		return (
			<Estado carregando={versoes.carregando} erro={versoes.erro} linhas={5} />
		);
	}

	const comTexto = versoes.dados.filter((versao) => versao.tem_texto);
	const de = Number(parametros.get("de")) || comTexto[0]?.id;
	const para = Number(parametros.get("para")) || comTexto.at(-1)?.id;

	function escolher(chave: "de" | "para", valor: string) {
		setParametros(
			(anteriores) => {
				const proximos = new URLSearchParams(anteriores);
				proximos.set(chave, valor);
				return proximos;
			},
			{ replace: true },
		);
	}

	return (
		<article>
			<header className="cabecalho">
				<Link to={`/proposicoes/${id}`} className="voltar" viewTransition>
					Voltar para {nome ?? "o projeto"}
				</Link>
				<h1 className="titulo-grande">Como o texto mudou</h1>
				<p className="introducao">
					Um projeto pode ser reescrito várias vezes antes da votação final.
					Compare duas versões para ver o que entrou e o que saiu.
				</p>
			</header>

			<section className="secao" aria-labelledby="versoes">
				<h2 id="versoes">Versões do texto</h2>
				<ol className="versoes">
					{versoes.dados.map((versao) => (
						<li key={versao.id}>
							<span>
								<strong>{versao.rotulo}</strong>{" "}
								<span className="detalhe">{data(versao.data)}</span>
							</span>
							<span className="detalhe">
								{versao.url && (
									<a href={versao.url} target="_blank" rel="noreferrer">
										Documento oficial
									</a>
								)}
								{!versao.tem_texto &&
									" (não foi possível ler os artigos deste arquivo)"}
							</span>
						</li>
					))}
				</ol>
			</section>

			<section className="secao" aria-labelledby="comparacao">
				<h2 id="comparacao">Comparação</h2>

				{comTexto.length < 2 || !de || !para ? (
					<p className="vazio">
						Ainda não há duas versões com texto legível para comparar. Consulte
						os documentos oficiais acima.
					</p>
				) : (
					<>
						<div className="texto-escolha">
							<label className="campo">
								De
								<select
									value={de}
									onChange={(evento) => escolher("de", evento.target.value)}
								>
									{comTexto.map((versao) => (
										<option key={versao.id} value={versao.id}>
											{rotuloDaVersao(versao)}
										</option>
									))}
								</select>
							</label>
							<label className="campo">
								Para
								<select
									value={para}
									onChange={(evento) => escolher("para", evento.target.value)}
								>
									{comTexto.map((versao) => (
										<option key={versao.id} value={versao.id}>
											{rotuloDaVersao(versao)}
										</option>
									))}
								</select>
							</label>
						</div>

						{de === para ? (
							<p className="vazio">
								Escolha duas versões diferentes para comparar.
							</p>
						) : (
							<Comparacao
								caminho={`/proposicoes/${id}/mudancas?de=${de}&para=${para}`}
							/>
						)}

						<p className="nota">
							A comparação é feita automaticamente a partir dos documentos
							oficiais em PDF e considera só os artigos do texto. A leitura do
							PDF pode falhar em algum trecho. Em caso de dúvida, vale o
							documento oficial.
						</p>
					</>
				)}
			</section>
		</article>
	);
}
