# API Gateway with Dynamic Plugin System

A scalable API gateway with dynamic plugin architecture supporting Node.js and Spring Boot plugins.

## Features

- Dynamic plugin loading at runtime
- Multiple registry backends (DB, Consul, GitHub)
- Spring Boot plugin support
- Docker-compose ready deployment

## Setup

1. Clone the repository
2. Run `docker-compose up --build`
3. Access gateway at `http://localhost:8080`

## Plugin Development

See `spring-plugins/` for examples of Spring Boot plugins.