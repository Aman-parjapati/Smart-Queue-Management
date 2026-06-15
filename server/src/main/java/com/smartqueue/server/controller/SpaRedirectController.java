package com.smartqueue.server.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaRedirectController {

    /**
     * Forwards all non-API and non-file requests to index.html for client-side routing.
     */
    @GetMapping(value = {
            "/{path:[^\\.]*}",
            "/**/{path:[^\\.]*}"
    })
    public String redirect(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri.startsWith("/api")) {
            return "forward:/error";
        }
        return "forward:/index.html";
    }
}

