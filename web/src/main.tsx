import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Layout } from "./Layout";
import { Deputado } from "./paginas/Deputado";
import { Deputados } from "./paginas/Deputados";
import { Inicio } from "./paginas/Inicio";
import { NaoEncontrada } from "./paginas/NaoEncontrada";
import { Proposicao } from "./paginas/Proposicao";
import { Votacao } from "./paginas/Votacao";
import "./estilo.css";
import { Comparacao } from "./paginas/Comparacao";

const rotas = createBrowserRouter([
	{
		element: <Layout />,
		children: [
			{ path: "/", element: <Inicio /> },
			{ path: "/proposicoes/:id", element: <Proposicao /> },
			{ path: "/votacoes/:id", element: <Votacao /> },
			{ path: "/deputados", element: <Deputados /> },
			{ path: "/deputados/:id", element: <Deputado /> },
			{ path: "*", element: <NaoEncontrada /> },
			{ path: "/comparar", element: <Comparacao /> },
		],
	},
]);

const raiz = document.getElementById("root");

if (raiz) {
	createRoot(raiz).render(
		<StrictMode>
			<RouterProvider router={rotas} />
		</StrictMode>,
	);
}
