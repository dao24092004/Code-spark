package com.dao.courseservice.response;
import lombok.Data;
import java.util.UUID;

@Data
public class ExamDto {
    private UUID id;
    private String title;
}