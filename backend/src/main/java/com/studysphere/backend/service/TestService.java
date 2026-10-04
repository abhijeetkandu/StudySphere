package com.studysphere.backend.service;

import com.studysphere.backend.entity.TestEntity;
import com.studysphere.backend.repository.TestRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TestService {

    private final TestRepository testRepository;

    @PostConstruct
    public void init() {
        if (testRepository.count() == 0) {
            testRepository.save(new TestEntity("Hello from StudySphere Backend!"));
        }
    }

    public String getTestMessage() {
        List<TestEntity> entities = testRepository.findAll();
        if (!entities.isEmpty()) {
            return entities.get(0).getMessage();
        }
        return "Backend is running, but no message found.";
    }
}
