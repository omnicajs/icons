.DEFAULT_GOAL := help

DOCKER=@docker compose run --rm node
DOCKER_CMD=docker compose run --rm node
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
