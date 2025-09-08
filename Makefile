.PHONY: help install setup_husky clean lint lint_text format format_check before_commit before-commit start test test_coverage dev build crawl security security_check security_fix deps_check deps_update

# デフォルトターゲットはhelp
default: help

# pnpm run を実行するターゲット
NPM_RUN_TARGETS = clean lint lint_text format format_check typecheck test dev build security deps_check

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

security_check:
	pnpm run security:check

security_fix:
	pnpm run security:fix

deps_update:
	pnpm run deps:update

# Security check as part of before_commit
before_commit: lint_text lint typecheck format_check build test security_check

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
	@echo "  security        Run security audit"
	@echo "  security_check  Check for high severity vulnerabilities"
	@echo "  security_fix    Fix security vulnerabilities automatically"
	@echo "  deps_check      Check for outdated dependencies"
	@echo "  deps_update     Update dependencies to latest versions"
	@echo "  help            Show this help message"
