import type { Contagem } from "../api";
import { numero } from "../formato";

export function partesDaContagem({ sim, nao, abstencao, total }: Contagem) {
	return [
		{ chave: "sim", rotulo: "Sim", valor: sim },
		{ chave: "nao", rotulo: "Não", valor: nao },
		{ chave: "abstencao", rotulo: "Abstenção", valor: abstencao },
		{ chave: "outros", rotulo: "Outros", valor: total - sim - nao - abstencao },
	].filter((parte) => parte.valor > 0);
}

type ParteDaLegenda = {
	chave: string;
	rotulo: string;
	valor: number;
};

export function Legenda({ partes }: { partes: ParteDaLegenda[] }) {
	return (
		<ul className="legenda">
			{partes.map((parte) => (
				<li key={parte.chave}>
					<span className={`legenda-marca voto-${parte.chave}`} />
					{parte.rotulo} <strong>{numero(parte.valor)}</strong>
				</li>
			))}
		</ul>
	);
}

export function BarraVotos({ contagem }: { contagem: Contagem }) {
	if (contagem.total === 0) {
		return (
			<p className="sem-votos">
				Sem registro de voto por deputado nesta votação.
			</p>
		);
	}

	const partes = partesDaContagem(contagem);

	return (
		<div className="barra">
			<div className="barra-trilho" aria-hidden="true">
				{partes.map((parte) => (
					<span
						key={parte.chave}
						className={`barra-parte voto-${parte.chave}`}
						style={{ flexGrow: parte.valor }}
					/>
				))}
			</div>
			<Legenda partes={partes} />
		</div>
	);
}