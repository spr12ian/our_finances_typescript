# ─────────────────────────────────────────────
# Variables
# ─────────────────────────────────────────────
SCRIPT_ID := $(OUR_FINANCES_SCRIPT_ID)
DEV_DEPENDENCIES = esbuild tsup typescript @types/google-apps-script

.PHONY: \
	build \
	clean \
	gas \
	push \
	setup

# ─────────────────────────────────────────────
# Targets
# ─────────────────────────────────────────────
build: clean
	npm run build

clean:
	npm run clean

gas: prepare-gas
	npm run gas

push:
	npm run push

prepare-gas: build
	npm run prepare-gas

setup:
	@if ! command -v node > /dev/null; then \
		echo "❌ Node.js is not installed."; exit 1; \
	fi
	@if ! command -v clasp > /dev/null; then \
		echo "🔧 Installing clasp..."; \
		npm install -g @google/clasp; \
	else \
		echo "✅ clasp already installed."; \
	fi
	@echo "🔑 Logging in to clasp..."
	clasp login
	@if [ ! -f .clasp.json ]; then \
		@echo "📦 Cloning Apps Script project..."
		clasp clone $(SCRIPT_ID); \
	else \
		echo "📁 Project already cloned."; \
	fi
	@echo "🧰 Initialising npm project..."
	npm init -y
	@echo "📚 Installing dev dependencies..."
	npm install -D $(DEV_DEPENDENCIES)
	@echo "Initialising TypeScript..."
	npx tsc --init
	@echo "✅ GAS project setup complete."
