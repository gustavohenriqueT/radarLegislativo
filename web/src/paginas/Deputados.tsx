import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { type DeputadoResumo, useAtrasado, useDados, useTitulo } from "../api";
import { Estado } from "../componentes/Estado";

const UFS =
	"AC AL AM AP BA CE DF ES GO MA MG MS MT PA PB PE PI PR RJ RN RO RR RS SC SE SP TO".split(
		" ",
	);

export function Deputados() {
	const [parametros, setParametros] = useSearchParams();
	const busca = parametros.get("busca") ?? "";
	const uf = parametros.get("uf") ?? "";
	const [texto, setTexto] = useState(busca);
	const textoAtrasado = useAtrasado(texto.trim());

	useTitulo("Deputados");

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
				return proximos;
			},
			{ replace: true },
		);
	}, [textoAtrasado, busca, setParametros]);

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

	function mudarUf(valor: string) {
		setParametros((anteriores) => {
			const proximos = new URLSearchParams(anteriores);
			if (valor) {
				proximos.set("uf", valor);
			} else {
				proximos.delete("uf");
			}
			return proximos;
		});
	}

	return (
		<>
			<header className="cabecalho">
				<h1 className="titulo-grande">Deputados</h1>
				<p className="introducao">
					Veja como cada deputado votou nas votações nominais coletadas.
				</p>
			</header>

			<search className="busca">
				<label htmlFor="busca-deputado" className="busca-rotulo">
					Buscar por nome
				</label>
				<div className="busca-campos">
					<input
						id="busca-deputado"
						type="search"
						value={texto}
						autoComplete="off"
						onChange={(evento) => setTexto(evento.target.value)}
					/>
					<select
						aria-label="Estado"
						value={uf}
						onChange={(evento) => mudarUf(evento.target.value)}
					>
						<option value="">Todos os estados</option>
						{UFS.map((sigla) => (
							<option key={sigla} value={sigla}>
								{sigla}
							</option>
						))}
					</select>
				</div>
			</search>

			<section className="secao" aria-label="Lista de deputados">
				{!dados && <Estado carregando={carregando} erro={erro} linhas={6} />}

				{dados && dados.length === 0 && (
					<p className="vazio">
						Nenhum deputado com esse nome nos dados coletados. Confira a grafia
						ou tente só o sobrenome.
					</p>
				)}

				{dados && dados.length > 0 && (
					<ul className="deputados" aria-busy={carregando}>
						{dados.map((deputado) => (
							<li key={deputado.id}>
								<Link to={`/deputados/${deputado.id}`} viewTransition>
									{deputado.url_foto ? (
										<img src={deputado.url_foto} alt="" loading="lazy" />
									) : (
										<span className="foto-vazia" aria-hidden="true" />
									)}
									<span>
										<span className="deputado-nome">{deputado.nome}</span>
										<span className="detalhe">{deputado.sigla_uf}</span>
									</span>
								</Link>
							</li>
						))}
					</ul>
				)}
			</section>
		</>
	);
}