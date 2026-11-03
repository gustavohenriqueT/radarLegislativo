type Props = {
	carregando: boolean;
	erro: string | null;
};

export function Situacao({ carregando, erro }: Props) {
	if (carregando) {
		return <p className="aviso">Carregando…</p>;
	}
	if (erro) {
		return <p className="aviso aviso-erro">{erro}</p>;
	}
	return null;
}