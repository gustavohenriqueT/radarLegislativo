import { Link, useParams } from "react-router-dom";
import { type DeputadoDetalhe, useDados } from "../api";
import { Situacao } from "../componentes/Situacao";
import { data, identificacao } from "../formato";

export function Deputado() {
	const { id } = useParams();
	const { dados, erro, carregando } = useDados<DeputadoDetalhe>(
		`/deputados/${id}`,
	);

	if (!dados) {
		return <Situacao carregando={carregando} erro={erro} />;
	}

	const partidoRecente = dados.votos[0]?.sigla_partido;

	return (
		<>
			<div className="perfil">
				{dados.url_foto && (
					<img src={dados.url_foto} alt={`Foto de ${dados.nome}`} />
				)}
				<div>
					<h1>{dados.nome}</h1>
					<p className="detalhe">
						{dados.sigla_uf}
						{partidoRecente && <>, {partidoRecente} no voto mais recente</>}
					</p>
				</div>
			</div>

			<section>
				<h2>Votos no Plenário ({dados.votos.length})</h2>
				{dados.votos.length === 0 ? (
					<p className="aviso">
						Nenhum voto registrado nos períodos coletados.
					</p>
				) : (
					<div className="tabela-rolagem">
						<table className="tabela">
							<thead>
								<tr>
									<th scope="col">Data</th>
									<th scope="col">Proposição</th>
									<th scope="col">O que foi votado</th>
									<th scope="col">Voto</th>
								</tr>
							</thead>
							<tbody>
								{dados.votos.map((voto) => (
									<tr key={voto.id_votacao}>
										<td>{data(voto.data)}</td>
										<td>
											{voto.id_proposicao ? (
												<Link to={`/proposicoes/${voto.id_proposicao}`}>
													{identificacao(
														voto.sigla_tipo,
														voto.numero,
														voto.ano,
													)}
												</Link>
											) : (
												"Não identificada"
											)}
										</td>
										<td>
											<Link to={`/votacoes/${voto.id_votacao}`}>
												{voto.descricao}
											</Link>
										</td>
										<td className="voto">{voto.tipo_voto}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>

			{dados.autoria.length > 0 && (
				<section>
					<h2>Projetos que apresentou ou assinou</h2>
					<ul className="lista">
						{dados.autoria.map((projeto) => (
							<li key={projeto.id}>
								<Link
									to={`/proposicoes/${projeto.id}`}
									className="lista-titulo"
								>
									{identificacao(
										projeto.sigla_tipo,
										projeto.numero,
										projeto.ano,
									)}
								</Link>
								<p className="lista-texto">{projeto.ementa}</p>
								<p className="lista-detalhe">
									{projeto.proponente ? "Autor" : "Coautor"}
								</p>
							</li>
						))}
					</ul>
				</section>
			)}
		</>
	);
}