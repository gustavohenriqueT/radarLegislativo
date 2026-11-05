import { Link, useParams } from "react-router-dom";
import { type DeputadoDetalhe, useDados, useTitulo } from "../api";
import { Legenda } from "../componentes/BarraVotos";
import { Estado } from "../componentes/Estado";
import {
	chaveDoVoto,
	data,
	identificacao,
	plural,
	TIPOS_DE_VOTO,
} from "../formato";

export function Deputado() {
	const { id } = useParams();
	const { dados, erro, carregando } = useDados<DeputadoDetalhe>(
		`/deputados/${id}`,
	);

	useTitulo(dados?.nome ?? null);

	if (!dados) {
		return <Estado carregando={carregando} erro={erro} linhas={6} />;
	}

	const partidoRecente = dados.votos[0]?.sigla_partido;
	const resumo = TIPOS_DE_VOTO.map((voto) => ({
		chave: voto.chave,
		rotulo: voto.tipo === "Artigo 17" ? "Presidindo a sessão" : voto.tipo,
		valor: dados.votos.filter((registro) => registro.tipo_voto === voto.tipo)
			.length,
	})).filter((parte) => parte.valor > 0);

	return (
		<article>
			<header className="cabecalho perfil">
				{dados.url_foto ? (
					<img src={dados.url_foto} alt={`Foto de ${dados.nome}`} />
				) : (
					<span className="foto-vazia foto-grande" aria-hidden="true" />
				)}
				<div>
					<h1 className="titulo-grande">{dados.nome}</h1>
					<p className="detalhe">
						{dados.sigla_uf}
						{partidoRecente && `, ${partidoRecente} no voto mais recente`}
					</p>
				</div>
			</header>

			<section className="secao" aria-labelledby="votos">
				<h2 id="votos">Votos no Plenário</h2>
				{dados.votos.length === 0 ? (
					<p className="vazio">
						Nenhum voto registrado nos períodos coletados.
					</p>
				) : (
					<>
						<p className="detalhe">
							{plural(
								dados.votos.length,
								"voto registrado",
								"votos registrados",
							)}{" "}
							nos períodos coletados.
						</p>
						<Legenda partes={resumo} />
						<ol className="votos">
							{dados.votos.map((voto) => (
								<li key={voto.id_votacao}>
									<span
										className={`voto-chip voto-${chaveDoVoto(voto.tipo_voto)}`}
									>
										{voto.tipo_voto === "Artigo 17"
											? "Presidindo"
											: voto.tipo_voto}
									</span>
									<span className="votos-corpo">
										<Link to={`/votacoes/${voto.id_votacao}`} viewTransition>
											{voto.descricao}
										</Link>
										<span className="detalhe">
											{data(voto.data)},{" "}
											{voto.id_proposicao
												? identificacao(voto.sigla_tipo, voto.numero, voto.ano)
												: "proposição não identificada"}
										</span>
									</span>
								</li>
							))}
						</ol>
					</>
				)}
			</section>

			{dados.autoria.length > 0 && (
				<section className="secao" aria-labelledby="autoria">
					<h2 id="autoria">Projetos que apresentou ou assinou</h2>
					<ul className="lista">
						{dados.autoria.map((projeto) => (
							<li key={projeto.id}>
								<Link
									to={`/proposicoes/${projeto.id}`}
									className="lista-link"
									viewTransition
								>
									<span className="lista-titulo">
										{identificacao(
											projeto.sigla_tipo,
											projeto.numero,
											projeto.ano,
										)}
									</span>
									<span className="lista-texto">{projeto.ementa}</span>
									<span className="lista-detalhe">
										{projeto.proponente ? "Autor" : "Coautor"}
									</span>
								</Link>
							</li>
						))}
					</ul>
				</section>
			)}
		</article>
	);
}
