import {
	NavLink,
	Outlet,
	ScrollRestoration,
	useLocation,
} from "react-router-dom";
import { UltimaAtualizacao } from "./componentes/UltimaAtualizacao";

export function Layout() {
	const { pathname } = useLocation();
	const emProjetos = /^\/(proposicoes|votacoes)\//.test(pathname);

	return (
		<>
			<a href="#conteudo" className="pular">
				Pular para o conteúdo
			</a>

			<header className="topo">
				<NavLink to="/" className="marca" viewTransition>
					<svg viewBox="0 0 24 13" aria-hidden="true" className="marca-simbolo">
						<path d="M1 12a11 11 0 0 1 22 0" />
						<path d="M6 12a6 6 0 0 1 12 0" />
					</svg>
					Radar Legislativo
				</NavLink>
				<nav aria-label="Principal" className="navegacao">
					<NavLink
						to="/"
						end
						viewTransition
						className={({ isActive }) =>
							isActive || emProjetos ? "active" : ""
						}
					>
						Projetos
					</NavLink>
					<NavLink to="/deputados" viewTransition>
						Deputados
					</NavLink>
				</nav>
			</header>

			<main id="conteudo" className="conteudo">
				<Outlet />
			</main>

			<footer className="rodape">
				<UltimaAtualizacao />
				<p>
					Dados oficiais da{" "}
					<a
						href="https://dadosabertos.camara.leg.br"
						target="_blank"
						rel="noreferrer"
					>
						API de Dados Abertos da Câmara dos Deputados
					</a>
					. O site mostra os registros sem interpretar nem recomendar votos.
				</p>
			</footer>

			<ScrollRestoration />
		</>
	);
}