import { type FormEvent, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { type ProposicaoResumo, useDados } from "../api";
import { Situacao } from "../componentes/Situacao";
import { data, identificacao, NOMES_TIPOS } from "../formato";

const POR_PAGINA = 20;

export function Inicio() {
	const [parametros, setParametros] = useSearchParams();
	const busca = parametros.get("busca") ?? "";
	const tipo = parametros.get("tipo") ?? "";
	const pagina = Number(parametros.get("pagina") ?? "1");
	const [texto, setTexto] = useState(busca);

	const consulta = new URLSearchParams({ pagina: String(pagina) });
	if (busca) {
		consulta.set("busca", busca);
	}
	if (tipo) {
		consulta.set("tipo", tipo);
	}
	const { dados, erro, carregando } = useDados<ProposicaoResumo[]>(
		`/proposicoes?${consulta}`,
	);

	function atualizar(novos: Record<string, string>) {
		const proximos = new URLSearchParams(parametros);
		for (const [chave, valor] of Object.entries(novos)) {
			if (valor) {
				proximos.set(chave, valor);
			} else {
				proximos.delete(chave);
			}
		}
		setParametros(proximos);
	}

	function pesquisar(evento: FormEvent) {
		evento.preventDefault();
		atualizar({ busca: texto.trim(), pagina: "" });
	}

	return (
		<>
			<h1>Como a Câmara votou</h1>
			<p className="introducao">
				Projetos votados no Plenário da Câmara dos Deputados e o voto registrado
				de cada deputado.
			</p>

			<form className="filtros" onSubmit={pesquisar}>
				<label className="campo campo-busca">
					Buscar por número ou assunto
					<input
						type="search"
						value={texto}
						placeholder="Ex.: PEC 5/2023 ou saúde"
						onChange={(evento) => setTexto(evento.target.value)}
					/>
				</label>
				<label className="campo">
					Tipo
					<select
						value={tipo}
						onChange={(evento) =>
							atualizar({ tipo: evento.target.value, pagina: "" })
						}
					>
						<option value="">Todos os tipos</option>
						{Object.entries(NOMES_TIPOS).map(([sigla, nome]) => (
							<option key={sigla} value={sigla}>
								{nome}
							</option>
						))}
					</select>
				</label>
				<button type="submit">Buscar</button>
			</form>

			<Situacao carregando={carregando} erro={erro} />

			{dados && dados.length === 0 && (
				<p className="aviso">
					Nenhum projeto encontrado. Tente outro termo ou tipo.
				</p>
			)}

			{dados && dados.length > 0 && (
				<ul className="lista">
					{dados.map((proposicao) => (
						<li key={proposicao.id}>
							<Link
								to={`/proposicoes/${proposicao.id}`}
								className="lista-titulo"
							>
								{identificacao(
									proposicao.sigla_tipo,
									proposicao.numero,
									proposicao.ano,
								)}
							</Link>
							<p className="lista-texto">{proposicao.ementa}</p>
							<p className="lista-detalhe">
								{proposicao.total_votacoes}{" "}
								{proposicao.total_votacoes === 1 ? "votação" : "votações"}, a
								última em {data(proposicao.ultima_votacao)}
							</p>
						</li>
					))}
				</ul>
			)}

			<div className="paginacao">
				{pagina > 1 && (
					<button
						type="button"
						onClick={() => atualizar({ pagina: String(pagina - 1) })}
					>
						Página anterior
					</button>
				)}
				{dados && dados.length === POR_PAGINA && (
					<button
						type="button"
						onClick={() => atualizar({ pagina: String(pagina + 1) })}
					>
						Próxima página
					</button>
				)}
			</div>
		</>
	);
}
