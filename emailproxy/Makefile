emailproxy: emailproxy.go go.mod go.sum
	go build -o $@ emailproxy.go

SERVICE_DIR := /srv/services/$(SERVICE_NAME)

deploy: emailproxy
	ssh $(DEPLOY_HOST) systemctl stop $(SERVICE_NAME)
	scp emailproxy $(DEPLOY_HOST):$(SERVICE_DIR)
	ssh $(DEPLOY_HOST) "chown runner:runner $(SERVICE_DIR)/emailproxy && chmod +x $(SERVICE_DIR)/emailproxy && systemctl start $(SERVICE_NAME)"

.PHONY: deploy
