package com.kyxun.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Registers a shared {@link ChatClient} bean built from Spring AI's auto-configured
 * {@link ChatClient.Builder}. All services that need AI capabilities should inject
 * this bean rather than building their own instance.
 */
@Configuration
public class AiClientConfig {

    @Bean
    public ChatClient chatClient(ChatClient.Builder chatClientBuilder) {
        return chatClientBuilder.build();
    }
}
