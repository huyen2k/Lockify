package com.example.Lockify.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.web.filter.CorsFilter;
import org.springframework.web.cors.*;

import java.time.Duration;
import java.util.List;

@Configuration
public class GlobalCorsFilterConfig {

    @Bean
    public FilterRegistrationBean<CorsFilter> corsFilterRegistration() {
        CorsConfiguration config = new CorsConfiguration();

        // Dùng allowedOriginPatterns để hỗ trợ https và subdomains
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:5173",
                "https://lockify-iqnz.onrender.com"
        ));

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        // Cho phép mọi header client sẽ gửi
        config.setAllowedHeaders(List.of("*"));
        // Nếu bạn cần client nhận header nào từ server (ví dụ file download headers)
        config.setExposedHeaders(List.of("Content-Disposition", "X-Total-Count", "Content-Type"));
        // Nếu frontend dùng credentials (cookies / authorization with credentials), bật true và không dùng "*"
        config.setAllowCredentials(true);
        // cache preflight (in seconds)
        config.setMaxAge(Duration.ofHours(1).getSeconds());

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Áp dụng cho tất cả endpoint -> dùng "/**" để chắc chắn SPA + API đều được xử lý
        source.registerCorsConfiguration("/**", config);

        FilterRegistrationBean<CorsFilter> bean = new FilterRegistrationBean<>(new CorsFilter(source));
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE); // chạy trước các filter khác
        return bean;
    }
}
