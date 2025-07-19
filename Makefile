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

appsscript: build ## Copy appsscript.json into $(BUILD_DIR)
	npm run appsscript

build: clean ## Bundle TypeScript files with Rollup
	mkdir $(BUILD_DIR)
	npm run build

clean: ## Remove build output directories
	npm run clean

dev: ## Run rollup watch and GAS auto-deploy concurrently
	npm run dev

install: ## Ensure clasp and dependencies are ready
	@echo "📦 Installing dev dependencies..."
	npm install
	@echo "🔑 Logging in to clasp..."
	npx clasp login
	@if [ ! -f .clasp.json ]; then \
		echo "📦 Cloning Apps Script project..."; \
		npx clasp clone $(SCRIPT_ID); \
	else \
		echo "📁 Project already cloned."; \
	fi
	@echo "✅ See .clasp.json"

lint: ## Run ESLint on .ts files
	npm run lint

push: appsscript ## Push to Google Apps Script using clasp
	npm run push

typecheck: ## Run TypeScript without emitting output
	npm run typecheck

watch: ## Watch for file changes and auto-push to GAS
	npm run watch
