.PHONY: help install setup_husky clean lint lint_text format format_check before_commit before-commit start test test_coverage dev build crawl

# デフォルトターゲットはhelp
default: help

# pnpm run を実行するターゲット
NPM_RUN_TARGETS = clean lint lint_text format format_check typecheck test dev build

$(NPM_RUN_TARGETS):
	pnpm run $@

install:
	pnpm install

install_ci:
	pnpm run install:ci

setup_husky:
	pnpm run husky

before_commit: lint_text lint typecheck format_check build test

# ハイフン付きのエイリアス（打ち間違え対策）
before-commit: before_commit

start:
	pnpm start

test_coverage:
	pnpm run test:coverage

crawl:
	curl http://localhost:3000/api/crawl

help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  install         Install pnpm packages"
	@echo "  clean           Clean the project"
	@echo "  setup_husky     Setup Husky"
	@echo "  lint            Run linter"
	@echo "  lint_text       Run textlint"
	@echo "  typecheck       Run TypeScript type checking"
	@echo "  format          Format code"
	@echo "  format_check    Check code formatting"
	@echo "  before_commit   Run checks before commit"
	@echo "  dev             Start development server"
	@echo "  build           Build the project"
	@echo "  start           Start app"
	@echo "  test            Run tests"
	@echo "  test_coverage   Run tests with coverage report"
	@echo "  help            Show this help message"
