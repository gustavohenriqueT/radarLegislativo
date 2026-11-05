type Props = {
	carregando: boolean;
	erro: string | null;
	linhas?: number;
};

export function Estado({ carregando, erro, linhas = 3 }: Props) {
	if (erro) {
		return (
			<div className="erro" role="alert">
				<p>{erro}</p>
				<button type="button" onClick={() => window.location.reload()}>
					Tentar de novo
				</button>
			</div>
		);
	}
	if (carregando) {
		return (
			<div className="esqueleto" role="status">
				<span className="oculto">Carregando</span>
				{Array.from({ length: linhas }, (_, linha) => (
					<span
						aria-hidden="true"
						// biome-ignore lint/suspicious/noArrayIndexKey: linhas fixas de carregamento
						key={linha}
						style={{ width: `${90 - linha * 17}%` }}
					/>
				))}
			</div>
		);
	}
	return null;
}