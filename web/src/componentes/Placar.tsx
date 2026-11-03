type Props = {
	sim: number;
	nao: number;
	abstencao: number;
	total: number;
};

export function Placar({ sim, nao, abstencao, total }: Props) {
	if (total === 0) {
		return <p className="sem-votos">Sem registro de votos individuais.</p>;
	}

	const partes = [
		{ chave: "sim", rotulo: "Sim", valor: sim },
		{ chave: "nao", rotulo: "Não", valor: nao },
		{ chave: "abstencao", rotulo: "Abstenção", valor: abstencao },
		{ chave: "outros", rotulo: "Outros", valor: total - sim - nao - abstencao },
	].filter((parte) => parte.valor > 0);

	return (
		<figure className="placar">
			<div className="placar-barra" aria-hidden="true">
				{partes.map((parte) => (
					<span
						key={parte.chave}
						className={`placar-parte placar-${parte.chave}`}
						style={{ flexGrow: parte.valor }}
					/>
				))}
			</div>
			<figcaption className="placar-legenda">
				{partes.map((parte) => (
					<span key={parte.chave}>
						<span
							className={`placar-marca placar-${parte.chave}`}
							aria-hidden="true"
						/>
						{parte.rotulo} <strong>{parte.valor}</strong>
					</span>
				))}
			</figcaption>
		</figure>
	);
}