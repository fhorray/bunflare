FROM alpine:latest
RUN apk add --no-cache python3
WORKDIR /app
RUN echo "Hello from Cloudflare Containers + buncf!" > index.html
EXPOSE 8080
CMD ["python3", "-m", "http.server", "8080", "--bind", "0.0.0.0"]
