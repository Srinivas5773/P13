.PHONY: install build start test clean docker-build

install:
	npm install

build:
	npm run build

start:
	npm start

test:
	npm test

clean:
	npm run clean

docker-build:
	docker build -t brick-breaker-deluxe .
