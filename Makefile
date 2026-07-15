.PHONY: deploy

# Deploys to naboo (reachable via the `spells` SSH alias). naboo's system
# flake pulls this repo via the `spells` flake input (github:zachpmanson/spells),
# not a local path, so this only deploys what's already pushed to GitHub.
deploy:
	@branch=$$(git rev-parse --abbrev-ref HEAD); \
	if [ -n "$$(git status --porcelain)" ]; then \
		echo "error: uncommitted changes present. Commit or stash before deploying."; \
		exit 1; \
	fi; \
	if ! git rev-parse --verify "origin/$$branch" >/dev/null 2>&1; then \
		echo "error: origin/$$branch does not exist. Push $$branch to GitHub before deploying."; \
		exit 1; \
	fi; \
	if [ -n "$$(git rev-list "origin/$$branch"..HEAD)" ]; then \
		echo "error: $$branch is ahead of origin/$$branch. Push before deploying."; \
		exit 1; \
	fi
	ssh spells 'cd ~/nixos-config && nix flake lock --update-input spells && rebuild'
