import type { CSSProperties } from "react";
import type { Caminho as DadosDoCaminho } from "../api";

type Props = {
	caminho: DadosDoCaminho | null;
	situacao: string | null;
};

export function Caminho({ caminho, situacao }: Props) {
	if (!caminho) {
		return null;
	}

	const arquivado = caminho.posicao < 0;
	const concluido = caminho.posicao >= caminho.etapas.length;
	const progresso = arquivado
		? 0
		: Math.min(caminho.posicao / (caminho.etapas.length - 1), 1);

	return (
		<figure className="caminho">
			<ol
				className="caminho-etapas"
				style={{ "--progresso": progresso } as CSSProperties}
			>
				{caminho.etapas.map((etapa, indice) => {
					const estado = arquivado
						? "pendente"
						: indice < caminho.posicao || concluido
							? "feita"
							: indice === caminho.posicao
								? "atual"
								: "pendente";
					return (
						<li key={etapa.chave} data-estado={estado}>
							<span className="caminho-ponto" aria-hidden="true" />
							<span className="caminho-nome">
								{estado === "atual" && (
									<span className="oculto">Etapa atual: </span>
								)}
								{etapa.nome}
							</span>
						</li>
					);
				})}
			</ol>
			<figcaption className="detalhe">
				{arquivado && "Este projeto foi arquivado ou rejeitado. "}
				{concluido && "Este projeto concluiu todas as etapas. "}
				{situacao && `Situação registrada pela Câmara: ${situacao}.`}
			</figcaption>
		</figure>
	);
}