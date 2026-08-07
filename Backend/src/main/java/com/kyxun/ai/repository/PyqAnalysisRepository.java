package com.kyxun.ai.repository;

import com.kyxun.ai.entity.PyqAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface PyqAnalysisRepository extends JpaRepository<PyqAnalysis, UUID> {
}
