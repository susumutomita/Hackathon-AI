.PHONY: install
install:
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

.PHONY: lint_text
lint_text:
	npm run lint:text

.PHONY: format
format:
	npm run format

.PHONY: format_check
format_check:
	npm run format:check

.PHONY: before_commit
before_commit: lint_text lint	format_check

.PHONY: start
start:
	npm start

.PHONY: dev
dev:
	npm run dev

.PHONY: build
build:
	npm run build

.PHONY: help
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  install         Install npm packages"
	@echo "  clean           Clean the project"
	@echo "  setup_husky     Setup Husky"
	@echo "  lint            Run linter"
	@echo "  lint_text       Run textlint"
	@echo "  format          Format code"
	@echo "  format_check    Check code formatting"
	@echo "  before_commit   Run checks before commit"
	@echo "  dev             Start development server"
	@echo "  build           Build the project"
	@echo "  start           Start app"
	@echo "  help            Show this help message"
