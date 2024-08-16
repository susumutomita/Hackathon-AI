.PHONY: install
install:
	npm install

.PHONY: install_all
install_all:
	npm run install-all

.PHONY: setup_husky
setup_husky:
	npm run husky

.PHONY: clean
clean:
	npm run clean

.PHONY: lint
lint:
	npm run lint

.PHONY: format
format:
	npm run format

.PHONY: format_check
format_check:
	npm run format:check

.PHONY: before_commit
before_commit: lint

.PHONY: start_frontend
start_frontend:
	cd frontend && npm run dev

.PHONY: start
start:
	npx concurrently "make start_frontend"

.PHONY: help
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  install         Install npm packages"
	@echo "  install_all     Run npm install-all"
	@echo "  export_pdf			Export pitch deck to PDF"
	@echo "  setup_husky     Setup Husky"
	@echo "  clean           Clean the project"
	@echo "  lint            Run linter"
	@echo "  before_commit   Run checks before commit"
	@echo "  start_frontend  Start frontend"
	@echo "  start           Start frontend"
	@echo "  build_backend   Build backend contracts with Forge"
	@echo "  help            Show this help message"
