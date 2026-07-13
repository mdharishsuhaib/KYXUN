package com.kyxun;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class KyxunBackendApplicationTests {

    @Test
    void contextLoads() {
        // Test passes if the Spring application context loads successfully
        // and Flyway migrations execute without errors against the H2 database.
    }

}
