.PHONY: install setup_husky clean lint lint_text format format_check before_commit start test dev build crawl help

# npm run を実行するターゲット
NPM_RUN_TARGETS = clean lint lint_text format format_check test dev build

$(NPM_RUN_TARGETS):
	npm run $@

install:
	npm install

setup_husky:
	npm run husky

before_commit: lint_text lint format_check build

start:
	npm start

crawl:
	curl http://localhost:3000/api/crawl

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
	@echo "  test            Run tests"
	@echo "  help            Show this help message"
