.DEFAULT_GOAL := push

SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c
# ─────────────────────────────────────────────
# Variables
# ─────────────────────────────────────────────
BUILD_DIR := build
SCRIPT_ID := $(OUR_FINANCES_SCRIPT_ID)
TREE_EXCLUDES := '.git|.hatch|.mypy_cache|.pytest_cache|.ruff_cache|.venv|node_modules'
.PHONY: \
	build \
	clean \
	dev \
	extract-gas-functions \
	generate-gas-account-functions \
	install \
	lint \
	prepare-gas \
	push \
	_run-with-log \
	rename \
	tree \
	typecheck \
	watch

# ─────────────────────────────────────────────
# Targets
# ─────────────────────────────────────────────

build: build-dir extract-gas-functions ## Bundle TypeScript files with Rollup and generate shim
	npm run build

build-dir:
	@install -d $(BUILD_DIR)
	touch $(BUILD_DIR)/.keep

clean: ## Remove build output directories
	npm run clean

copy-appsscript: build ## Copy appsscript.json into $(BUILD_DIR)
	npm run copy-appsscript

dev: ## Run rollup watch and GAS auto-deploy concurrently
	npm run dev

extract-gas-functions: generate-gas-account-functions ## Extract GAS_ functions from src
	npm run extract-gas-functions

generate-gas-account-functions: clean ## Extract GAS_ functions from src
	npm run generate-gas-account-functions

install: ## Ensure clasp and dependencies are ready
	@echo "📦 Installing dev dependencies..."
	npm install
	@echo "🔑 Logging in to clasp..."
	npx clasp login
	@if [ ! -f clasp.json ]; then \
		echo "📦 Cloning Apps Script project..."; \
		npx clasp clone $(SCRIPT_ID); \
	else \
		echo "📁 Project already cloned."; \
	fi
	@echo "✅ See .clasp.json"

lint: ## Run ESLint on .ts files
	npm run lint

output:
	@install -d output

push: copy-appsscript ## Push to Google Apps Script using clasp
	npm run push

_run-with-log: output
	@timestamp="$$(date '+%F_%H:%M')"; \
	log_file="output/$${timestamp}_$(ACTION).txt"; \
	stdout_file="output/$${timestamp}_$(ACTION).stdout"; \
	stderr_file="output/$${timestamp}_$(ACTION).stderr"; \
	echo "$$COMMAND"; \
	color_log() { printf "\033[1;34m🔧 Starting %s...\033[0m\n" "$(ACTION)"; }; \
	color_log_end() { printf "\033[1;32m✅ %s finished.\033[0m\n" "$(ACTION)"; }; \
	color_log | tee "$$log_file"; \
	{ \
	  { eval "$(COMMAND)"; } 2> >(tee "$$stderr_file" >&2); \
	} | tee "$$stdout_file" -a "$$log_file"; \
	cat "$$stderr_file" >> "$$log_file"; \
	color_log_end | tee -a "$$log_file"; \
	for f in "$$log_file" "$$stdout_file" "$$stderr_file"; do \
	  [ -s "$$f" ] || rm -f "$$f"; \
	done

tree: output ## Current project tree
	@$(MAKE) _run-with-log ACTION=tree COMMAND="tree -a -F -I $(TREE_EXCLUDES)"

typecheck: ## Run TypeScript without emitting output
	npm run typecheck

verify-env: ## Check for WSL + Linux-native toolchain
	@echo "🔍 Verifying environment..."
	@if ! grep -qiE 'microsoft|wsl' /proc/version; then \
		echo "❌ Not running inside WSL."; \
		exit 1; \
	fi
	@echo "✅ Running inside WSL."

	@echo "🔍 Checking tools are WSL-native..."

	@which node | grep -vE '^/mnt/' > /dev/null || { \
		echo "❌ node is from Windows: $$(which node)"; exit 1; }

	@which npm | grep -vE '^/mnt/' > /dev/null || { \
		echo "❌ npm is from Windows: $$(which npm)"; exit 1; }

	@which make | grep -vE '^/mnt/' > /dev/null || { \
		echo "❌ make is from Windows: $$(which make)"; exit 1; }

	@echo "✅ All required tools are Linux-native (WSL)"

watch: ## Watch for file changes and auto-push to GAS
	npm run watch
