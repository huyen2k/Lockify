package com.example.Lockify.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    /**
     * Cấu hình CORS global cho phép React dev server (localhost:3000) gọi API.
     * Nếu bạn deploy frontend ở origin khác, sửa giá trị allowedOrigins.
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/rsa")
                .allowedOrigins("http://localhost:5173")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS");
    }

}
