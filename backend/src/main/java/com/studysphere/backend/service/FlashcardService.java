package com.studysphere.backend.service;

import com.studysphere.backend.entity.*;
import com.studysphere.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class FlashcardService {

    private final FlashcardSetRepository flashcardSetRepository;
    private final FlashcardRepository flashcardRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final ChapterRepository chapterRepository;
    private final TopicRepository topicRepository;
    private final GeminiService geminiService;

    public Map<String, Object> generateFlashcards(Long studentId, Map<String, Object> request) {
        String subjectName = (String) request.get("subjectName");
        String chapterTitle = (String) request.get("chapterTitle");
        String topicTitle = (String) request.get("topicTitle");
        String difficulty = (String) request.getOrDefault("difficulty", "Medium");
        String customFocus = (String) request.get("customFocus");
        
        int count = 10;
        if (request.get("count") != null) {
            try {
                count = Integer.parseInt(request.get("count").toString());
            } catch (Exception ignored) {}
        }

        // If IDs are passed instead, resolve from DB
        Long subjectId = request.get("subjectId") != null && !request.get("subjectId").toString().isBlank() ? Long.valueOf(request.get("subjectId").toString()) : null;
        Long chapterId = request.get("chapterId") != null && !request.get("chapterId").toString().isBlank() ? Long.valueOf(request.get("chapterId").toString()) : null;
        Long topicId = request.get("topicId") != null && !request.get("topicId").toString().isBlank() ? Long.valueOf(request.get("topicId").toString()) : null;

        if (subjectId != null && (subjectName == null || subjectName.isBlank())) {
            subjectRepository.findById(subjectId).ifPresent(s -> {
                request.put("resolvedSubjectName", s.getName());
            });
            subjectName = (String) request.get("resolvedSubjectName");
        }

        if (chapterId != null && (chapterTitle == null || chapterTitle.isBlank())) {
            chapterRepository.findById(chapterId).ifPresent(c -> {
                request.put("resolvedChapterTitle", c.getTitle());
            });
            chapterTitle = (String) request.get("resolvedChapterTitle");
        }

        if (topicId != null && (topicTitle == null || topicTitle.isBlank())) {
            topicRepository.findById(topicId).ifPresent(t -> {
                request.put("resolvedTopicTitle", t.getTitle());
            });
            topicTitle = (String) request.get("resolvedTopicTitle");
        }

        List<Map<String, String>> cards = geminiService.generateFlashcards(subjectName, chapterTitle, topicTitle, count, difficulty, customFocus);

        String generatedTitle = (topicTitle != null && !topicTitle.isBlank()) 
            ? topicTitle + " Flashcards" 
            : ((chapterTitle != null && !chapterTitle.isBlank()) ? chapterTitle + " Flashcards" : ((subjectName != null && !subjectName.isBlank()) ? subjectName + " Key Flashcards" : "StudySphere AI Flashcards"));

        Map<String, Object> result = new HashMap<>();
        result.put("title", generatedTitle);
        result.put("subjectId", subjectId);
        result.put("subjectName", subjectName);
        result.put("chapterId", chapterId);
        result.put("chapterTitle", chapterTitle);
        result.put("topicId", topicId);
        result.put("topicTitle", topicTitle);
        result.put("difficulty", difficulty);
        result.put("cardsCount", cards.size());
        result.put("flashcards", cards);

        return result;
    }

    @Transactional
    public Map<String, Object> saveFlashcardSet(Long studentId, Map<String, Object> payload) {
        if (studentId == null) {
            throw new IllegalArgumentException("Student ID must be provided");
        }
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with ID: " + studentId));

        FlashcardSet set = new FlashcardSet();
        set.setStudent(student);
        set.setTitle((String) payload.getOrDefault("title", "My Flashcard Set"));
        set.setCreatedAt(LocalDateTime.now());

        if (payload.get("subjectId") != null && !payload.get("subjectId").toString().isBlank()) {
            subjectRepository.findById(Long.valueOf(payload.get("subjectId").toString())).ifPresent(set::setSubject);
        }
        if (payload.get("chapterId") != null && !payload.get("chapterId").toString().isBlank()) {
            chapterRepository.findById(Long.valueOf(payload.get("chapterId").toString())).ifPresent(set::setChapter);
        }
        if (payload.get("topicId") != null && !payload.get("topicId").toString().isBlank()) {
            topicRepository.findById(Long.valueOf(payload.get("topicId").toString())).ifPresent(set::setTopic);
        }

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> cardList = (List<Map<String, Object>>) payload.get("flashcards");
        int count = cardList != null ? cardList.size() : 0;
        set.setCardsCount(count);

        FlashcardSet savedSet = flashcardSetRepository.save(set);
        List<Flashcard> savedCards = new ArrayList<>();

        if (cardList != null) {
            int order = 0;
            for (Map<String, Object> cardMap : cardList) {
                Flashcard card = new Flashcard();
                card.setFlashcardSet(savedSet);
                card.setFront((String) cardMap.get("front"));
                card.setBack((String) cardMap.get("back"));
                card.setStatus((String) cardMap.getOrDefault("status", "UNSTUDIED"));
                card.setOrderIndex(order++);
                savedCards.add(flashcardRepository.save(card));
            }
        }

        return formatSetDetails(savedSet, savedCards);
    }

    public List<Map<String, Object>> getStudentSets(Long studentId) {
        List<FlashcardSet> sets = flashcardSetRepository.findByStudentIdOrderByCreatedAtDesc(studentId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (FlashcardSet s : sets) {
            List<Flashcard> cards = flashcardRepository.findByFlashcardSetIdOrderByOrderIndexAsc(s.getId());
            int total = cards.size();
            long known = cards.stream().filter(c -> "KNOWN".equalsIgnoreCase(c.getStatus())).count();
            long practice = cards.stream().filter(c -> "PRACTICE".equalsIgnoreCase(c.getStatus())).count();
            long unstudied = cards.stream().filter(c -> c.getStatus() == null || "UNSTUDIED".equalsIgnoreCase(c.getStatus())).count();
            int masteryPercent = total > 0 ? (int) Math.round(((double) known / total) * 100) : 0;

            Map<String, Object> map = new HashMap<>();
            map.put("id", s.getId());
            map.put("title", s.getTitle());
            map.put("createdAt", s.getCreatedAt() != null ? s.getCreatedAt().toString() : "");
            map.put("cardsCount", total);
            map.put("knownCards", known);
            map.put("practiceCards", practice);
            map.put("unstudiedCards", unstudied);
            map.put("masteryPercent", masteryPercent);

            if (s.getSubject() != null) {
                map.put("subjectId", s.getSubject().getId());
                map.put("subjectName", s.getSubject().getName());
            }
            if (s.getChapter() != null) {
                map.put("chapterId", s.getChapter().getId());
                map.put("chapterTitle", s.getChapter().getTitle());
            }
            if (s.getTopic() != null) {
                map.put("topicId", s.getTopic().getId());
                map.put("topicTitle", s.getTopic().getTitle());
            }

            result.add(map);
        }

        return result;
    }

    public Map<String, Object> getSetDetails(Long setId) {
        FlashcardSet set = flashcardSetRepository.findById(setId)
                .orElseThrow(() -> new RuntimeException("Flashcard Set not found with ID: " + setId));
        List<Flashcard> cards = flashcardRepository.findByFlashcardSetIdOrderByOrderIndexAsc(setId);
        return formatSetDetails(set, cards);
    }

    @Transactional
    public Map<String, Object> updateCardStatus(Long cardId, String status) {
        Flashcard card = flashcardRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("Flashcard not found with ID: " + cardId));
        card.setStatus(status != null ? status.toUpperCase() : "UNSTUDIED");
        Flashcard saved = flashcardRepository.save(card);
        return formatCard(saved);
    }

    @Transactional
    public void deleteSet(Long setId) {
        flashcardRepository.deleteByFlashcardSetId(setId);
        flashcardSetRepository.deleteById(setId);
    }

    private Map<String, Object> formatSetDetails(FlashcardSet s, List<Flashcard> cards) {
        Map<String, Object> result = new HashMap<>();
        result.put("id", s.getId());
        result.put("title", s.getTitle());
        result.put("createdAt", s.getCreatedAt() != null ? s.getCreatedAt().toString() : "");

        int total = cards.size();
        long known = cards.stream().filter(c -> "KNOWN".equalsIgnoreCase(c.getStatus())).count();
        long practice = cards.stream().filter(c -> "PRACTICE".equalsIgnoreCase(c.getStatus())).count();
        long unstudied = cards.stream().filter(c -> c.getStatus() == null || "UNSTUDIED".equalsIgnoreCase(c.getStatus())).count();
        int masteryPercent = total > 0 ? (int) Math.round(((double) known / total) * 100) : 0;

        result.put("cardsCount", total);
        result.put("knownCards", known);
        result.put("practiceCards", practice);
        result.put("unstudiedCards", unstudied);
        result.put("masteryPercent", masteryPercent);

        if (s.getSubject() != null) {
            result.put("subjectId", s.getSubject().getId());
            result.put("subjectName", s.getSubject().getName());
        }
        if (s.getChapter() != null) {
            result.put("chapterId", s.getChapter().getId());
            result.put("chapterTitle", s.getChapter().getTitle());
        }
        if (s.getTopic() != null) {
            result.put("topicId", s.getTopic().getId());
            result.put("topicTitle", s.getTopic().getTitle());
        }

        List<Map<String, Object>> cardList = new ArrayList<>();
        for (Flashcard c : cards) {
            cardList.add(formatCard(c));
        }
        result.put("flashcards", cardList);

        return result;
    }

    public List<Map<String, Object>> getCardsForStudentAndSubject(Long studentId, Long subjectId) {
        List<FlashcardSet> sets = flashcardSetRepository.findByStudentIdAndSubjectId(studentId, subjectId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (FlashcardSet set : sets) {
            List<Flashcard> cards = flashcardRepository.findByFlashcardSetIdOrderByOrderIndexAsc(set.getId());
            for (Flashcard c : cards) {
                result.add(formatCardForDeck(c));
            }
        }
        return result;
    }

    @Transactional
    public List<Map<String, Object>> generateAndSaveAIFlashcards(Long studentId, Long subjectId, String topic, int count) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with ID: " + studentId));
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found with ID: " + subjectId));

        int targetCount = (count > 0 && count <= 30) ? count : 6;
        List<Map<String, String>> generated = geminiService.generateFlashcards(
                subject.getName(),
                null,
                topic,
                targetCount,
                "Medium",
                topic
        );

        String title = (topic != null && !topic.isBlank()) ? topic + " AI Deck" : subject.getName() + " AI Deck";
        FlashcardSet set = new FlashcardSet();
        set.setStudent(student);
        set.setSubject(subject);
        set.setTitle(title);
        set.setCardsCount(generated.size());
        set.setCreatedAt(LocalDateTime.now());
        FlashcardSet savedSet = flashcardSetRepository.save(set);

        List<Map<String, Object>> result = new ArrayList<>();
        int order = 0;
        for (Map<String, String> g : generated) {
            Flashcard card = new Flashcard();
            card.setFlashcardSet(savedSet);
            card.setFront(g.get("front"));
            card.setBack(g.get("back"));
            card.setStatus("UNSTUDIED");
            card.setOrderIndex(order++);
            Flashcard savedCard = flashcardRepository.save(card);
            result.add(formatCardForDeck(savedCard));
        }

        return result;
    }

    @Transactional
    public Map<String, Object> toggleCardKnown(Long cardId) {
        Flashcard card = flashcardRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("Flashcard not found with ID: " + cardId));
        boolean wasKnown = "KNOWN".equalsIgnoreCase(card.getStatus());
        card.setStatus(wasKnown ? "UNSTUDIED" : "KNOWN");
        Flashcard saved = flashcardRepository.save(card);
        return formatCardForDeck(saved);
    }

    @Transactional
    public Map<String, Object> createManualCard(Long studentId, Long subjectId, String frontText, String backText, String topic) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with ID: " + studentId));
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found with ID: " + subjectId));

        List<FlashcardSet> existingSets = flashcardSetRepository.findByStudentIdAndSubjectId(studentId, subjectId);
        FlashcardSet set;
        if (!existingSets.isEmpty()) {
            set = existingSets.get(0);
        } else {
            set = new FlashcardSet();
            set.setStudent(student);
            set.setSubject(subject);
            set.setTitle(subject.getName() + " Custom Cards");
            set.setCreatedAt(LocalDateTime.now());
            set.setCardsCount(0);
            set = flashcardSetRepository.save(set);
        }

        Flashcard card = new Flashcard();
        card.setFlashcardSet(set);
        card.setFront(frontText);
        card.setBack(backText);
        card.setStatus("UNSTUDIED");
        card.setOrderIndex(set.getCardsCount() != null ? set.getCardsCount() : 0);
        Flashcard saved = flashcardRepository.save(card);

        set.setCardsCount((set.getCardsCount() != null ? set.getCardsCount() : 0) + 1);
        flashcardSetRepository.save(set);

        return formatCardForDeck(saved);
    }

    @Transactional
    public void deleteCard(Long cardId) {
        flashcardRepository.deleteById(cardId);
    }

    private Map<String, Object> formatCardForDeck(Flashcard c) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", c.getId());
        map.put("frontText", c.getFront());
        map.put("backText", c.getBack());
        map.put("front", c.getFront());
        map.put("back", c.getBack());
        map.put("topic", c.getFlashcardSet() != null && c.getFlashcardSet().getTopic() != null ? c.getFlashcardSet().getTopic().getTitle() : (c.getFlashcardSet() != null ? c.getFlashcardSet().getTitle() : "General"));
        map.put("status", c.getStatus() != null ? c.getStatus() : "UNSTUDIED");
        map.put("known", "KNOWN".equalsIgnoreCase(c.getStatus()));
        map.put("orderIndex", c.getOrderIndex());
        if (c.getFlashcardSet() != null) {
            map.put("flashcardSetId", c.getFlashcardSet().getId());
        }
        return map;
    }

    private Map<String, Object> formatCard(Flashcard c) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", c.getId());
        map.put("front", c.getFront());
        map.put("back", c.getBack());
        map.put("frontText", c.getFront());
        map.put("backText", c.getBack());
        map.put("status", c.getStatus() != null ? c.getStatus() : "UNSTUDIED");
        map.put("known", "KNOWN".equalsIgnoreCase(c.getStatus()));
        map.put("orderIndex", c.getOrderIndex());
        if (c.getFlashcardSet() != null) {
            map.put("flashcardSetId", c.getFlashcardSet().getId());
        }
        return map;
    }
}
