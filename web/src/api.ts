import { useEffect, useState } from "react";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const ATUALIZACAO_MS = 60_000;

export type Contagem = {
	sim: number;
	nao: number;
	abstencao: number;
	total: number;
};

export type ProposicaoResumo = {
	id: number;
	sigla_tipo: string;
	numero: number;
	ano: number;
	ementa: string | null;
	total_votacoes: number;
	ultima_votacao: string;
};

export type VotacaoRecente = Contagem & {
	id: string;
	data: string;
	descricao: string | null;
	aprovacao: boolean | null;
	id_proposicao: number | null;
	sigla_tipo: string | null;
	numero: number | null;
	ano: number | null;
	ementa: string | null;
};

export type Autor = {
	nome: string;
	tipo: string | null;
	id_deputado: number | null;
	proponente: boolean;
	sigla_uf: string | null;
};

export type VotacaoResumo = Contagem & {
	id: string;
	data: string;
	descricao: string | null;
	aprovacao: boolean | null;
};

export type ProposicaoDetalhe = {
	id: number;
	sigla_tipo: string;
	numero: number;
	ano: number;
	ementa: string | null;
	data_apresentacao: string | null;
	url_inteiro_teor: string | null;
	autores: Autor[];
	votacoes: VotacaoResumo[];
};

export type DeputadoNoVoto = {
	id: number;
	nome: string;
	sigla_partido: string | null;
	sigla_uf: string | null;
};

export type GrupoDeVotos = {
	tipo: string;
	rotulo: string;
	deputados: DeputadoNoVoto[];
};

export type VotacaoDetalhe = {
	id: string;
	data: string;
	descricao: string | null;
	aprovacao: boolean | null;
	id_proposicao: number | null;
	sigla_tipo: string | null;
	numero: number | null;
	ano: number | null;
	ementa: string | null;
	grupos: GrupoDeVotos[];
};

export type DeputadoResumo = {
	id: number;
	nome: string;
	sigla_uf: string | null;
	url_foto: string | null;
};

export type VotoDoDeputado = {
	tipo_voto: string;
	sigla_partido: string | null;
	id_votacao: string;
	data: string;
	descricao: string | null;
	id_proposicao: number | null;
	sigla_tipo: string | null;
	numero: number | null;
	ano: number | null;
};

export type ProjetoDeAutoria = {
	id: number;
	sigla_tipo: string;
	numero: number;
	ano: number;
	ementa: string | null;
	proponente: boolean;
};

export type DeputadoDetalhe = DeputadoResumo & {
	votos: VotoDoDeputado[];
	autoria: ProjetoDeAutoria[];
};

export type Status = {
	ultima_coleta: string | null;
};

async function buscar<T>(caminho: string): Promise<T> {
	let resposta: Response;
	try {
		resposta = await fetch(`${BASE_URL}${caminho}`);
	} catch {
		throw new Error(
			"Não foi possível conectar ao servidor. Confira sua internet e tente de novo.",
		);
	}
	if (resposta.status === 404) {
		throw new Error("Esse registro não existe ou ainda não foi coletado.");
	}
	if (!resposta.ok) {
		throw new Error(
			"O servidor não conseguiu responder agora. Tente de novo em alguns instantes.",
		);
	}
	try {
		return (await resposta.json()) as T;
	} catch {
		throw new Error(
			"O servidor respondeu num formato inesperado. Tente de novo em alguns instantes.",
		);
	}
}

type Estado<T> = {
	dados: T | null;
	erro: string | null;
	carregando: boolean;
};

export function useDados<T>(caminho: string, intervaloMs?: number): Estado<T> {
	const [estado, setEstado] = useState<Estado<T>>({
		dados: null,
		erro: null,
		carregando: true,
	});

	useEffect(() => {
		let ativo = true;
		setEstado((anterior) => ({ ...anterior, erro: null, carregando: true }));

		function carregar(emSegundoPlano: boolean) {
			buscar<T>(caminho).then(
				(dados) => {
					if (ativo) {
						setEstado({ dados, erro: null, carregando: false });
					}
				},
				(erro: Error) => {
					if (ativo && !emSegundoPlano) {
						setEstado({ dados: null, erro: erro.message, carregando: false });
					}
				},
			);
		}

		carregar(false);

		const relogio = intervaloMs
			? setInterval(() => {
					if (document.visibilityState === "visible") {
						carregar(true);
					}
				}, intervaloMs)
			: undefined;

		return () => {
			ativo = false;
			clearInterval(relogio);
		};
	}, [caminho, intervaloMs]);

	return estado;
}

export function useAtrasado<T>(valor: T, atrasoMs = 300): T {
	const [atrasado, setAtrasado] = useState(valor);

	useEffect(() => {
		const espera = setTimeout(() => setAtrasado(valor), atrasoMs);
		return () => clearTimeout(espera);
	}, [valor, atrasoMs]);

	return atrasado;
}

export function useTitulo(titulo: string | null) {
	useEffect(() => {
		document.title = titulo
			? `${titulo} | Radar Legislativo`
			: "Radar Legislativo";
	}, [titulo]);
}