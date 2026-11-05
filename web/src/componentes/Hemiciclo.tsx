import { type PointerEvent, useMemo } from "react";
import { chaveDoVoto } from "../formato";

type Assento = {
	x: number;
	y: number;
	angulo: number;
};

const RAIO_INTERNO = 0.4;

function distribuir(total: number) {
	const linhas = Math.max(3, Math.round(Math.sqrt(total / 4)));
	const raios = Array.from(
		{ length: linhas },
		(_, linha) =>
			RAIO_INTERNO + ((1 - RAIO_INTERNO) * linha) / Math.max(linhas - 1, 1),
	);
	const somaDosRaios = raios.reduce((soma, raio) => soma + raio, 0);
	const porLinha = raios.map((raio) =>
		Math.floor((total * raio) / somaDosRaios),
	);
	porLinha[linhas - 1] += total - porLinha.reduce((soma, n) => soma + n, 0);

	const assentos: Assento[] = [];
	raios.forEach((raio, linha) => {
		const quantidade = porLinha[linha];
		for (let posicao = 0; posicao < quantidade; posicao++) {
			const angulo =
				quantidade === 1
					? Math.PI / 2
					: Math.PI * (1 - posicao / (quantidade - 1));
			assentos.push({
				x: raio * Math.cos(angulo),
				y: -raio * Math.sin(angulo),
				angulo,
			});
		}
	});
	assentos.sort((a, b) => b.angulo - a.angulo);

	const distanciaEntreLinhas = (1 - RAIO_INTERNO) / Math.max(linhas - 1, 1);
	const distanciaNaLinha = Math.PI / Math.max(porLinha[linhas - 1] - 1, 1);
	const raioDoPonto = 0.44 * Math.min(distanciaEntreLinhas, distanciaNaLinha);

	return { assentos, raioDoPonto };
}

type Props = {
	votos: string[];
	apagados?: Set<number>;
	aoApontar?: (indice: number | null) => void;
	rotulo: string;
};

export function Hemiciclo({ votos, apagados, aoApontar, rotulo }: Props) {
	const { assentos, raioDoPonto } = useMemo(
		() => distribuir(votos.length),
		[votos.length],
	);

	function apontar(evento: PointerEvent<SVGSVGElement>) {
		const indice = (evento.target as SVGElement).dataset.indice;
		aoApontar?.(indice === undefined ? null : Number(indice));
	}

	return (
		<svg
			className="hemiciclo"
			viewBox="-1.04 -1.04 2.08 1.08"
			role="img"
			aria-label={rotulo}
			onPointerMove={aoApontar ? apontar : undefined}
			onPointerLeave={aoApontar ? () => aoApontar(null) : undefined}
		>
			{assentos.map((assento, indice) => (
				<circle
					// biome-ignore lint/suspicious/noArrayIndexKey: a posição do assento é a própria identidade dele
					key={indice}
					data-indice={indice}
					cx={assento.x}
					cy={assento.y}
					r={raioDoPonto}
					className={`assento voto-${chaveDoVoto(votos[indice])}${
						apagados?.has(indice) ? " assento-apagado" : ""
					}`}
					style={{ animationDelay: `${(indice / assentos.length) * 700}ms` }}
				/>
			))}
		</svg>
	);
}