import { type FormEvent, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { type DeputadoResumo, useDados } from "../api";
import { Situacao } from "../componentes/Situacao";

const UFS =
	"AC AL AM AP BA CE DF ES GO MA MG MS MT PA PB PE PI PR RJ RN RO RR RS SC SE SP TO".split(
		" ",
	);

export function Deputados() {
	const [parametros, setParametros] = useSearchParams();
	const busca = parametros.get("busca") ?? "";
	const uf = parametros.get("uf") ?? "";
	const [texto, setTexto] = useState(busca);

	const consulta = new URLSearchParams();
	if (busca) {
		consulta.set("busca", busca);
	}
	if (uf) {
		consulta.set("uf", uf);
	}
	const { dados, erro, carregando } = useDados<DeputadoResumo[]>(
		`/deputados?${consulta}`,
	);

	function atualizar(chave: string, valor: string) {
		const proximos = new URLSearchParams(parametros);
		if (valor) {
			proximos.set(chave, valor);
		} else {
			proximos.delete(chave);
		}
		setParametros(proximos);
	}

	function pesquisar(evento: FormEvent) {
		evento.preventDefault();
		atualizar("busca", texto.trim());
	}

	return (
		<>
			<h1>Deputados</h1>
			<p className="introducao">
				Deputados com votos registrados nos períodos coletados.
			</p>

			<form className="filtros" onSubmit={pesquisar}>
				<label className="campo campo-busca">
					Nome
					<input
						type="search"
						value={texto}
						onChange={(evento) => setTexto(evento.target.value)}
					/>
				</label>
				<label className="campo">
					Estado
					<select
						value={uf}
						onChange={(evento) => atualizar("uf", evento.target.value)}
					>
						<option value="">Todos</option>
						{UFS.map((sigla) => (
							<option key={sigla} value={sigla}>
								{sigla}
							</option>
						))}
					</select>
				</label>
				<button type="submit">Buscar</button>
			</form>

			<Situacao carregando={carregando} erro={erro} />

			{dados && dados.length === 0 && (
				<p className="aviso">Nenhum deputado encontrado.</p>
			)}

			{dados && dados.length > 0 && (
				<ul className="deputados">
					{dados.map((deputado) => (
						<li key={deputado.id}>
							{deputado.url_foto && (
								<img src={deputado.url_foto} alt="" loading="lazy" />
							)}
							<Link to={`/deputados/${deputado.id}`}>{deputado.nome}</Link>
							<span className="sigla">{deputado.sigla_uf}</span>
						</li>
					))}
				</ul>
			)}
		</>
	);
}