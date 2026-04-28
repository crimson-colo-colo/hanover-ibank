package main

import (
	"encoding/json"
	"net/http"
	"os"
	"strconv"

	"github.com/go-chi/chi/v5"
	"gopkg.in/gomail.v2"
)

type SendEmailRequest struct {
	To       string `json:"to"`
	Subject  string `json:"subject"`
	HtmlBody string `json:"htmlBody"`
	TextBody string `json:"textBody"`
}

type SendEmailResponse struct {
	Ok    bool   `json:"ok"`
	Error string `json:"error,omitempty"`
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort, err := strconv.Atoi(os.Getenv("SMTP_PORT"))
	if err != nil {
		panic("Invalid SMTP_PORT environment variable")
	}
	smtpUser := os.Getenv("SMTP_USER")
	smtpPassword := os.Getenv("SMTP_PASSWORD")
	smtpFrom := os.Getenv("SMTP_FROM")

	if smtpHost == "" || smtpUser == "" || smtpPassword == "" || smtpFrom == "" {
		panic("SMTP configuration environment variables are not set")
	}

	r := chi.NewRouter()

	r.Post("/status", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	r.Post("/send", func(w http.ResponseWriter, r *http.Request) {
		var req SendEmailRequest
		err := json.NewDecoder(r.Body).Decode(&req)
		if err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		m := gomail.NewMessage()
		m.SetHeader("From", smtpFrom)
		m.SetHeader("To", req.To)
		m.SetHeader("Subject", req.Subject)
		m.SetBody("text/plain", req.TextBody)
		m.AddAlternative("text/html", req.HtmlBody)

		d := gomail.NewDialer(smtpHost, smtpPort, smtpUser, smtpPassword)
		d.SSL = true

		err = d.DialAndSend(m)

		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(SendEmailResponse{
				Ok:    false,
				Error: err.Error(),
			})
			return
		}

		json.NewEncoder(w).Encode(SendEmailResponse{
			Ok: true,
		})
	})

	http.ListenAndServe(":"+port, r)
}
