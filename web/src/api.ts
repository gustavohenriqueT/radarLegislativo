import { useEffect, useState } from "react";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type ProposicaoResumo = {
	id: number;
	sigla_tipo: string;
	numero: number;
	ano: number;
	ementa: string | null;
	total_votacoes: number;
	ultima_votacao: string;
};

export type Autor = {
	nome: string;
	tipo: string | null;
	id_deputado: number | null;
	proponente: boolean;
	sigla_uf: string | null;
};

export type VotacaoResumo = {
	id: string;
	data: string;
	descricao: string | null;
	aprovacao: boolean | null;
	sim: number;
	nao: number;
	abstencao: number;
	total: number;
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

async function buscar<T>(caminho: string): Promise<T> {
	const resposta = await fetch(`${BASE_URL}${caminho}`);
	if (resposta.status === 404) {
		throw new Error("Registro não encontrado.");
	}
	if (!resposta.ok) {
		throw new Error(
			"Não foi possível carregar os dados. Confira se a API está rodando.",
		);
	}
	return resposta.json() as Promise<T>;
}

type Estado<T> = {
	dados: T | null;
	erro: string | null;
	carregando: boolean;
};

export function useDados<T>(caminho: string): Estado<T> {
	const [estado, setEstado] = useState<Estado<T>>({
		dados: null,
		erro: null,
		carregando: true,
	});

	useEffect(() => {
		let ativo = true;
		setEstado({ dados: null, erro: null, carregando: true });

		buscar<T>(caminho).then(
			(dados) => {
				if (ativo) {
					setEstado({ dados, erro: null, carregando: false });
				}
			},
			(erro: Error) => {
				if (ativo) {
					setEstado({ dados: null, erro: erro.message, carregando: false });
				}
			},
		);

		return () => {
			ativo = false;
		};
	}, [caminho]);

	return estado;
}
