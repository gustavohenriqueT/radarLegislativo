import { Link } from "react-router-dom";
import { useTitulo } from "../api";

export function NaoEncontrada() {
	useTitulo("Página não encontrada");

	return (
		<header className="cabecalho">
			<h1 className="titulo-grande">Página não encontrada</h1>
			<p className="introducao">
				O endereço pode ter sido digitado errado ou a página mudou de lugar.
			</p>
			<p>
				<Link to="/" viewTransition>
					Ir para a lista de projetos
				</Link>
			</p>
		</header>
	);
}