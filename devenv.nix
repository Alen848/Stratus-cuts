{ pkgs, ... }:

{
  # Paquetes del sistema para el SaaS
  packages = with pkgs; [
    nodejs_20
    nodePackages.pnpm
    python312
    python312Packages.pip
    docker
    docker-compose
    git
		sqlite
  ];

  languages.javascript.enable = true;
  
  # Configuración de Python corregida para el backend FastAPI
  languages.python = {
    enable = true;
    venv = {
			enable = true;
			requirements = ./backend/requirements.txt;
		};
  };

  scripts = {
    # Comando para crear la estructura inicial de VilLan
    init.exec = ''
      if [ ! -d backend ]; then
        echo "🚀 Creando backend FastAPI..."
        mkdir backend && cd backend
        python -m venv .venv
        pip install fastapi uvicorn sqlmodel psycopg[binary]
        touch requirements.txt
        cd ..
      fi

      if [ ! -d frontend ]; then
        echo "🚀 Creando frontend React..."
        pnpm create vite frontend --template react-ts
        cd frontend
        pnpm install
        pnpm add @tanstack/react-query zustand axios
        cd ..
      fi
    '';

    backend-dev.exec = "cd backend && uvicorn app.main:app --reload";
    frontend-dev.exec = "cd frontend && pnpm dev";
		db-start.exec = "docker compose up -d ";
  };

  enterShell = ''
    echo "💈 SaaS Turnera - Entorno de Desarrollo Listo"
    echo "Tira 'init' para arrancar el proyecto por primera vez."
  '';
}
