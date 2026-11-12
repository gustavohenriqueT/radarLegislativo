import type { Fatos, Quorum, Termo, VotosDoPartido } from "../api";
import { numero, plural } from "../formato";

export function Glossario({ termos }: { termos: Termo[] }) {
	if (termos.length === 0) {
		return null;
	}

	return (
		<details className="glossario">
			<summary>O que isso significa?</summary>
			<dl>
				{termos.map((termo) => (
					<div key={termo.termo}>
						<dt>{termo.termo}</dt>
						<dd>{termo.explicacao}</dd>
					</div>
				))}
			</dl>
		</details>
	);
}

function Regua({ fatos, quorum }: { fatos: Fatos; quorum: Quorum }) {
	const largura = (valor: number) => `${(valor / fatos.cadeiras) * 100}%`;

	return (
		<div className="regua" aria-hidden="true">
			<div className="regua-trilho">
				<span
					className="regua-preenchido voto-sim"
					style={{ width: largura(fatos.sim) }}
				/>
				<span className="regua-marca" style={{ left: largura(quorum.votos) }} />
			</div>
			<span className="regua-rotulo" style={{ left: largura(quorum.votos) }}>
				{quorum.votos} necessários
			</span>
		</div>
	);
}

type Props = {
	fatos: Fatos;
	quorum: Quorum | null;
	termos: Termo[];
};

export function Entenda({ fatos, quorum, termos }: Props) {
	const mostrarRegra = quorum !== null && fatos.total > 0;
	const termosVisiveis = termos.filter(
		(termo) => !(mostrarRegra && termo.termo === "Turno"),
	);

	if (fatos.total === 0 && termosVisiveis.length === 0) {
		return null;
	}

	return (
		<section className="entenda" aria-labelledby="entenda">
			<h2 id="entenda">Entenda esta votação</h2>

			{mostrarRegra && quorum && (
				<>
					<p>
						{quorum.regra} Houve <strong>{numero(fatos.sim)}</strong>.
					</p>
					<Regua fatos={fatos} quorum={quorum} />
				</>
			)}

			{fatos.total > 0 && (
				<p className="detalhe">
					A diferença entre Sim e Não foi de{" "}
					{plural(fatos.diferenca, "voto", "votos")}.{" "}
					{fatos.sem_registro > 0 &&
						`${plural(
							fatos.sem_registro,
							"deputado não registrou",
							"deputados não registraram",
						)} voto, de um total de ${fatos.cadeiras}.`}
				</p>
			)}

			<Glossario termos={termosVisiveis} />
		</section>
	);
}

export function VotosPorPartido({ partidos }: { partidos: VotosDoPartido[] }) {
	if (partidos.length === 0) {
		return null;
	}

	return (
		<section className="secao" aria-labelledby="partidos">
			<h2 id="partidos">Como cada partido votou</h2>
			<p className="detalhe">
				Partidos em ordem de tamanho da bancada nesta votação. O partido é o que
				constava no registro de cada voto.
			</p>
			<div className="tabela-rolagem">
				<table className="partidos">
					<thead>
						<tr>
							<th scope="col">Partido</th>
							<th scope="col" aria-label="Distribuição dos votos" />
							<th scope="col">Sim</th>
							<th scope="col">Não</th>
							<th scope="col">Abstenção</th>
							<th scope="col">Outros</th>
						</tr>
					</thead>
					<tbody>
						{partidos.map((partido) => {
							const outros =
								partido.total - partido.sim - partido.nao - partido.abstencao;
							return (
								<tr key={partido.partido}>
									<th scope="row">{partido.partido}</th>
									<td className="partidos-barra">
										<span className="barra-trilho" aria-hidden="true">
											{partido.sim > 0 && (
												<span
													className="barra-parte voto-sim"
													style={{ flexGrow: partido.sim }}
												/>
											)}
											{partido.nao > 0 && (
												<span
													className="barra-parte voto-nao"
													style={{ flexGrow: partido.nao }}
												/>
											)}
											{partido.abstencao > 0 && (
												<span
													className="barra-parte voto-abstencao"
													style={{ flexGrow: partido.abstencao }}
												/>
											)}
											{outros > 0 && (
												<span
													className="barra-parte voto-outros"
													style={{ flexGrow: outros }}
												/>
											)}
										</span>
									</td>
									<td>{partido.sim}</td>
									<td>{partido.nao}</td>
									<td>{partido.abstencao}</td>
									<td>{outros}</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</section>
	);
}