export const NOMES_TIPOS: Record<string, string> = {
	PL: "Projeto de Lei",
	PEC: "Proposta de Emenda à Constituição",
	PLP: "Projeto de Lei Complementar",
	MPV: "Medida Provisória",
	PDL: "Projeto de Decreto Legislativo",
	PRC: "Projeto de Resolução",
};

export const TIPOS_DE_VOTO = [
	{ tipo: "Sim", chave: "sim" },
	{ tipo: "Não", chave: "nao" },
	{ tipo: "Abstenção", chave: "abstencao" },
	{ tipo: "Obstrução", chave: "obstrucao" },
	{ tipo: "Artigo 17", chave: "presidente" },
];

export function chaveDoVoto(tipo: string) {
	return TIPOS_DE_VOTO.find((voto) => voto.tipo === tipo)?.chave ?? "outros";
}

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

const numeros = new Intl.NumberFormat("pt-BR");

export function numero(valor: number) {
	return numeros.format(valor);
}

export function plural(quantidade: number, singular: string, varios: string) {
	return `${numero(quantidade)} ${quantidade === 1 ? singular : varios}`;
}

export function semAcento(texto: string) {
	return texto
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase();
}
