package com.kyxun.examination.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ExamTopicPredictionResponse {

    private String subjectName;
    private String examType;
    private List<String> highPriorityTopics;
    private List<String> mediumPriorityTopics;
    private List<String> studyTips;
    private String aiSummary;
}
