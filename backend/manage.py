"""Comandos de administracao, rodados no terminal (dentro de backend/).

Criar usuario do dashboard (a senha e pedida sem aparecer na tela):
    uv run python manage.py create-user --email ana@exemplo.com --name "Ana" --role coordination

Perfis: coordination (Coordenacao, pode tudo) ou support (Apoio).
"""

import argparse
import getpass
import sys

from models.store import store
from services.auth import hash_password, validate_new_user


def create_user(args: argparse.Namespace) -> int:
    password = getpass.getpass("Senha: ")
    if getpass.getpass("Repita a senha: ") != password:
        print("As senhas não conferem.")
        return 1
    problems = validate_new_user(args.email, args.name, password, args.role)
    if problems:
        print("\n".join(problems))
        return 1
    try:
        user = store.create_user(args.email, args.name, hash_password(password), args.role)
    except ValueError as error:
        print(error)
        return 1
    print(f"Usuário criado: {user.name} <{user.email}> ({user.role})")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Comandos do Experience Manager")
    commands = parser.add_subparsers(dest="command", required=True)
    create = commands.add_parser("create-user", help="cria um usuário do dashboard")
    create.add_argument("--email", required=True)
    create.add_argument("--name", required=True)
    create.add_argument("--role", required=True, choices=["coordination", "support"])
    create.set_defaults(handler=create_user)
    args = parser.parse_args()
    return args.handler(args)


if __name__ == "__main__":
    sys.exit(main())