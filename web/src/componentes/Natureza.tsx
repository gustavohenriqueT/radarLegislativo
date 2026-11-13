import type { Natureza as DadosDaNatureza } from "../api";

export function Natureza({ natureza }: { natureza: DadosDaNatureza }) {
	return (
		<span className={`natureza natureza-${natureza.chave}`}>
			<span className="natureza-icone" aria-hidden="true" />
			{natureza.rotulo}
		</span>
	);
}