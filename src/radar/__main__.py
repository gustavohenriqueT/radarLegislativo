import argparse
from datetime import date, timedelta

from radar.coleta import coletar_periodo

DIAS_RECENTES = 3

parser = argparse.ArgumentParser(description="Coleta votações do Plenário da Câmara")
parser.add_argument("inicio", nargs="?", help="data inicial no formato AAAA-MM-DD")
parser.add_argument("fim", nargs="?", help="data final no formato AAAA-MM-DD")
parser.add_argument(
    "--recentes",
    action="store_true",
    help=f"coleta os últimos {DIAS_RECENTES} dias até hoje",
)
args = parser.parse_args()

if args.recentes:
    hoje = date.today()
    inicio = hoje - timedelta(days=DIAS_RECENTES)
    coletar_periodo(inicio.isoformat(), hoje.isoformat())
elif args.inicio and args.fim:
    coletar_periodo(args.inicio, args.fim)
else:
    parser.error("informe as datas de início e fim, ou use --recentes")
