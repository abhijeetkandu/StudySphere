package com.studysphere.backend.controller;

import com.studysphere.backend.entity.Chapter;
import com.studysphere.backend.entity.Subject;
import com.studysphere.backend.entity.Topic;
import com.studysphere.backend.repository.ChapterRepository;
import com.studysphere.backend.repository.SubjectRepository;
import com.studysphere.backend.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/syllabus")
@RequiredArgsConstructor
public class SyllabusController {

    private final SubjectRepository subjectRepository;
    private final ChapterRepository chapterRepository;
    private final TopicRepository topicRepository;

    @GetMapping("/subjects/{subjectId}")
    public ResponseEntity<?> getSyllabusForSubject(@PathVariable Long subjectId) {
        List<Chapter> chapters = chapterRepository.findBySubjectId(subjectId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Chapter chapter : chapters) {
            Map<String, Object> chapMap = new HashMap<>();
            chapMap.put("id", chapter.getId());
            chapMap.put("title", chapter.getTitle());
            chapMap.put("chapterNumber", chapter.getChapterNumber());
            
            List<Topic> topics = topicRepository.findByChapterId(chapter.getId());
            List<Map<String, Object>> topicList = new ArrayList<>();
            for (Topic t : topics) {
                Map<String, Object> topMap = new HashMap<>();
                topMap.put("id", t.getId());
                topMap.put("title", t.getTitle());
                topMap.put("content", t.getContent());
                topicList.add(topMap);
            }
            chapMap.put("topics", topicList);
            result.add(chapMap);
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/subjects/{subjectId}/chapters")
    public ResponseEntity<?> addChapter(@PathVariable Long subjectId, @RequestBody Chapter chapter) {
        Subject subject = subjectRepository.findById(subjectId).orElseThrow(() -> new RuntimeException("Subject not found"));
        chapter.setSubject(subject);
        Chapter saved = chapterRepository.save(chapter);
        return ResponseEntity.ok(Map.of(
            "id", saved.getId(),
            "title", saved.getTitle(),
            "chapterNumber", saved.getChapterNumber()
        ));
    }

    @PutMapping("/chapters/{chapterId}")
    public ResponseEntity<?> updateChapter(@PathVariable Long chapterId, @RequestBody Chapter updated) {
        Chapter chapter = chapterRepository.findById(chapterId).orElseThrow(() -> new RuntimeException("Chapter not found"));
        chapter.setTitle(updated.getTitle());
        chapter.setChapterNumber(updated.getChapterNumber());
        Chapter saved = chapterRepository.save(chapter);
        return ResponseEntity.ok(Map.of(
            "id", saved.getId(),
            "title", saved.getTitle(),
            "chapterNumber", saved.getChapterNumber()
        ));
    }

    @DeleteMapping("/chapters/{chapterId}")
    public ResponseEntity<?> deleteChapter(@PathVariable Long chapterId) {
        chapterRepository.deleteById(chapterId);
        return ResponseEntity.ok(Map.of("message", "Chapter deleted"));
    }

    @PostMapping("/chapters/{chapterId}/topics")
    public ResponseEntity<?> addTopic(@PathVariable Long chapterId, @RequestBody Topic topic) {
        Chapter chapter = chapterRepository.findById(chapterId).orElseThrow(() -> new RuntimeException("Chapter not found"));
        topic.setChapter(chapter);
        Topic saved = topicRepository.save(topic);
        return ResponseEntity.ok(Map.of(
            "id", saved.getId(),
            "title", saved.getTitle(),
            "content", saved.getContent()
        ));
    }

    @PutMapping("/topics/{topicId}")
    public ResponseEntity<?> updateTopic(@PathVariable Long topicId, @RequestBody Topic updated) {
        Topic topic = topicRepository.findById(topicId).orElseThrow(() -> new RuntimeException("Topic not found"));
        topic.setTitle(updated.getTitle());
        topic.setContent(updated.getContent());
        Topic saved = topicRepository.save(topic);
        return ResponseEntity.ok(Map.of(
            "id", saved.getId(),
            "title", saved.getTitle(),
            "content", saved.getContent()
        ));
    }

    @DeleteMapping("/topics/{topicId}")
    public ResponseEntity<?> deleteTopic(@PathVariable Long topicId) {
        topicRepository.deleteById(topicId);
        return ResponseEntity.ok(Map.of("message", "Topic deleted"));
    }
}
