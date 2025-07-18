# ─────────────────────────────────────────────
# Variables
# ─────────────────────────────────────────────
SCRIPT_ID := $(OUR_FINANCES_SCRIPT_ID)

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

setup:
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
