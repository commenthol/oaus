npm_bin := $(shell npm bin)
tests := "test/models"

test:
	TEST=mongo npm test -- $(tests)
	npm test -- $(tests)

.PHONY: test