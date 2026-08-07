package com.kyxun.ai.repository;

import com.kyxun.ai.entity.PyqPaper;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface PyqPaperRepository extends JpaRepository<PyqPaper, UUID> {
}
