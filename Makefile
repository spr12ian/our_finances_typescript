# ─────────────────────────────────────────────
# Variables
# ─────────────────────────────────────────────
SCRIPT_ID := $(OUR_FINANCES_SCRIPT_ID)
DEV_DEPENDENCIES = esbuild tsup typescript @types/google-apps-script

.PHONY: \
	all \
	build \
	clean \
	gas \
	push \
	setup \
	setup-clasp \
	setup-npm \
	setup-typescript

# ─────────────────────────────────────────────
# Targets
# ─────────────────────────────────────────────

all: setup

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

setup: setup-clasp setup-typescript
	@echo "✅ GAS project setup complete."

setup-clasp: setup-npm
	@command -v clasp > /dev/null || { \
		echo "🔧 Installing clasp..."; \
		npm install -g @google/clasp; \
	}
	@echo "✅ clasp installed."
	@echo "🔑 Logging in to clasp..."
	@clasp login
	@if [ ! -f .clasp.json ]; then \
		echo "📦 Cloning Apps Script project..."; \
		clasp clone $(SCRIPT_ID); \
	else \
		echo "📁 Project already cloned."; \
	fi
	@echo "✅ See .clasp.json"

setup-npm:
	@command -v node > /dev/null || { \
		echo "❌ Node.js is not installed."; exit 1; \
	}
	@if [ ! -f package.json ]; then \
		echo "🧰 Initialising npm project..."; \
		npm init -y; \
	else \
		echo "📦 package.json already exists."; \
	fi
	@echo "📚 Installing dev dependencies..."
	@npm install -D $(DEV_DEPENDENCIES)
	@echo "✅ See package.json"

setup-typescript: setup-npm
	@if [ ! -f tsconfig.json ]; then \
		echo "📐 Initialising TypeScript config..."; \
		npx tsc --init; \
	else \
		echo "📐 TypeScript already initialised."; \
	fi
	@echo "✅ See tsconfig.json"

