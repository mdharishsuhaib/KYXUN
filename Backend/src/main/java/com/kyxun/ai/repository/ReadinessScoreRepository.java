package com.kyxun.ai.repository;

import com.kyxun.ai.entity.ReadinessScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface ReadinessScoreRepository extends JpaRepository<ReadinessScore, UUID> {
}
