export const NOMES_TIPOS: Record<string, string> = {
	PL: "Projeto de Lei",
	PEC: "Proposta de Emenda à Constituição",
	PLP: "Projeto de Lei Complementar",
	MPV: "Medida Provisória",
	PDL: "Projeto de Decreto Legislativo",
	PRC: "Projeto de Resolução",
};

export function identificacao(
	sigla: string | null,
	numero: number | null,
	ano: number | null,
) {
	if (!sigla) {
		return "Proposição não identificada";
	}
	return `${sigla} ${numero}/${ano}`;
}

export function data(valor: string | null) {
	if (!valor) {
		return "";
	}
	const [ano, mes, dia] = valor.slice(0, 10).split("-");
	return `${dia}/${mes}/${ano}`;
}

export function resultado(aprovacao: boolean | null) {
	if (aprovacao === true) {
		return "Aprovada";
	}
	if (aprovacao === false) {
		return "Rejeitada";
	}
	return null;
}
