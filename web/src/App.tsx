import { NavLink, Route, Routes } from "react-router-dom";
import { Deputado } from "./paginas/Deputado";
import { Deputados } from "./paginas/Deputados";
import { Inicio } from "./paginas/Inicio";
import { Proposicao } from "./paginas/Proposicao";
import { Votacao } from "./paginas/Votacao";

export function App() {
	return (
		<>
			<header className="topo">
				<div className="topo-conteudo">
					<NavLink to="/" className="marca">
						Radar Legislativo
					</NavLink>
					<nav className="navegacao">
						<NavLink to="/" end>
							Projetos
						</NavLink>
						<NavLink to="/deputados">Deputados</NavLink>
					</nav>
				</div>
			</header>

			<main className="conteudo">
				<Routes>
					<Route path="/" element={<Inicio />} />
					<Route path="/proposicoes/:id" element={<Proposicao />} />
					<Route path="/votacoes/:id" element={<Votacao />} />
					<Route path="/deputados" element={<Deputados />} />
					<Route path="/deputados/:id" element={<Deputado />} />
					<Route path="*" element={<p>Página não encontrada.</p>} />
				</Routes>
			</main>

			<footer className="rodape">
				<p>
					Dados da{" "}
					<a
						href="https://dadosabertos.camara.leg.br"
						target="_blank"
						rel="noreferrer"
					>
						API de Dados Abertos da Câmara dos Deputados
					</a>
					. O site mostra os registros oficiais sem interpretar ou recomendar
					votos.
				</p>
			</footer>
		</>
	);
}