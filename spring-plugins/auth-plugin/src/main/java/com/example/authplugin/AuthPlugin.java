package com.example.authplugin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@SpringBootApplication
@RestController
public class AuthPlugin {

    public static void main(String[] args) {
        SpringApplication.run(AuthPlugin.class, args);
    }

    @PostMapping("/authenticate")
    public Map<String, Object> authenticate(
            @RequestHeader Map<String, String> headers,
            @RequestBody Map<String, Object> body) {
    
        // Normalize the header key to handle case insensitivity
        String token = headers.getOrDefault("authorization", headers.get("Authorization"));
        boolean authenticated = "valid-token".equals(token);
    
        return Map.of(
            "authenticated", authenticated,
            "user", authenticated ? "authenticated-user" : null,
            "status", authenticated ? 200 : 401
        );
    }