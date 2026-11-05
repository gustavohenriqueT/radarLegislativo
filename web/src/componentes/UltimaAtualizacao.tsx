import { ATUALIZACAO_MS, type Status, useDados } from "../api";

export function UltimaAtualizacao() {
	const { dados } = useDados<Status>("/status", ATUALIZACAO_MS);

	if (!dados?.ultima_coleta) {
		return null;
	}

	const momento = new Date(dados.ultima_coleta).toLocaleString("pt-BR", {
		timeZone: "America/Sao_Paulo",
		dateStyle: "short",
		timeStyle: "short",
	});

	return <p>Dados atualizados em {momento}.</p>;
}