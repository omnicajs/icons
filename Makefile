.DEFAULT_GOAL := help

HOST_UID ?= $(shell id -u)
HOST_GID ?= $(shell id -g)

DOCKER=@docker compose run --rm node
DOCKER_PLAYWRIGHT=@HOST_UID=$(HOST_UID) HOST_GID=$(HOST_GID) docker compose run --rm playwright
DOCKER_CMD=docker compose run --rm node
DOCKER_PLAYWRIGHT_CMD=HOST_UID=$(HOST_UID) HOST_GID=$(HOST_GID) docker compose run --rm playwright
TARGET_HEADER=@printf '===== \033[34m%s\033[0m\n' $@
LOCAL_MODE := $(filter local,$(MAKECMDGOALS))

.PHONY: local
local: ## Runs selected targets on the host instead of Docker (example: make local install)
	@:

.PHONY: install
install: ## Installs dependencies
	$(TARGET_HEADER)
ifdef LOCAL_MODE
	corepack yarn install
else
	$(DOCKER) yarn install
endif

.PHONY: ci.install
ci.install: ## Installs dependencies with immutable lockfile for CI
	$(TARGET_HEADER)
	corepack yarn install --immutable

.PHONY: check
check: ## Runs project checks
	$(TARGET_HEADER)
ifdef LOCAL_MODE
	corepack yarn check
else
	$(DOCKER) yarn check
endif
	$(DOCKER_PLAYWRIGHT) yarn test:browser

.PHONY: icons.normalize
icons.normalize: ## Normalizes explicitly selected SVG files or groups (example: make local icons.normalize paths='assets/icons/ai')
	$(TARGET_HEADER)
ifdef LOCAL_MODE
	corepack yarn icons:normalize$(if $(preserve_colors), --preserve-colors) $(paths)
else
	$(DOCKER) yarn icons:normalize$(if $(preserve_colors), --preserve-colors) $(paths)
endif

.PHONY: icons.keywords
icons.keywords: ## Regenerates icon search keywords from the migration maps
	$(TARGET_HEADER)
ifdef LOCAL_MODE
	corepack yarn icons:keywords
else
	$(DOCKER) yarn icons:keywords
endif

.PHONY: lint
lint: ## Runs ESLint
	$(TARGET_HEADER)
ifdef LOCAL_MODE
	corepack yarn lint
else
	$(DOCKER) yarn lint
endif

.PHONY: lint.fix
lint.fix: ## Runs ESLint and applies safe fixes
	$(TARGET_HEADER)
ifdef LOCAL_MODE
	corepack yarn lint:fix
else
	$(DOCKER) yarn lint:fix
endif

.PHONY: test
test: ## Runs package and consumer-fixture tests
	$(TARGET_HEADER)
ifdef LOCAL_MODE
	corepack yarn test
else
	$(DOCKER) yarn test
endif
	$(DOCKER_PLAYWRIGHT) yarn test:browser

.PHONY: test.browser
test.browser: ## Runs SVG rendering tests in Chromium, Firefox, and WebKit
	$(TARGET_HEADER)
	$(DOCKER) yarn build
	$(DOCKER) yarn test:fixtures
	$(DOCKER) yarn showcase:build
	$(DOCKER_PLAYWRIGHT) yarn test:browser

.PHONY: showcase.build
showcase.build: ## Builds the VitePress showcase
	$(TARGET_HEADER)
ifdef LOCAL_MODE
	corepack yarn build
	corepack yarn showcase:build
else
	$(DOCKER) yarn build
	$(DOCKER) yarn showcase:build
endif

.PHONY: release
release: ## Bumps the version, updates the changelog, and creates a release tag
	$(TARGET_HEADER)
ifdef LOCAL_MODE
	corepack yarn release$(if $(as),:$(as),)
else
	$(DOCKER) yarn release$(if $(as),:$(as),)
endif

.PHONY: showcase
showcase: ## Runs the VitePress showcase
	$(TARGET_HEADER)
ifdef LOCAL_MODE
	corepack yarn showcase
else
	docker compose up showcase
endif

.PHONY: shell
shell: ## Opens a shell
	$(TARGET_HEADER)
ifdef LOCAL_MODE
	bash
else
	$(DOCKER) bash
endif

.PHONY: help
help: ## Shows available make targets
	@awk 'BEGIN {FS = ":.*## "; printf "Usage: make [local] <target>\n\nTargets:\n"} /^[a-zA-Z0-9_.-]+:.*## / {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
