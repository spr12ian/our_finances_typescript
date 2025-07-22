.DEFAULT_GOAL := push
# ─────────────────────────────────────────────
# Variables
# ─────────────────────────────────────────────
BUILD_DIR := build
SCRIPT_ID := $(OUR_FINANCES_SCRIPT_ID)

.PHONY: \
	build \
	clean \
	dev \
	install \
	lint \
	prepare-gas \
	push \
	rename \
	typecheck \
	watch

# ─────────────────────────────────────────────
# Targets
# ─────────────────────────────────────────────

build: extract-gas-functions ## Bundle TypeScript files with Rollup and generate shim
	mkdir $(BUILD_DIR)
	npm run build

clean: ## Remove build output directories
	npm run clean

copy-appsscript: build ## Copy appsscript.json into $(BUILD_DIR)
	npm run copy-appsscript

dev: ## Run rollup watch and GAS auto-deploy concurrently
	npm run dev

extract-gas-functions: clean ## Extract GAS_ functions from src
	npm run extract-gas-functions

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

push: copy-appsscript ## Push to Google Apps Script using clasp
	npm run push

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
