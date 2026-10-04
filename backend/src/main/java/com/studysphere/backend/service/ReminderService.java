package com.studysphere.backend.service;

import com.studysphere.backend.entity.Reminder;
import com.studysphere.backend.entity.User;
import com.studysphere.backend.repository.ReminderRepository;
import com.studysphere.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ReminderService {

    private final ReminderRepository reminderRepository;
    private final UserRepository userRepository;

    @Transactional
    public Map<String, Object> createReminder(Long userId, Map<String, Object> data) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID must be provided");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        String title = (String) data.get("title");
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Title is required");
        }

        String reminderDate = (String) data.get("reminderDate");
        if (reminderDate == null || reminderDate.isBlank()) {
            reminderDate = LocalDate.now().toString();
        } else {
            String today = LocalDate.now().toString();
            if (reminderDate.trim().compareTo(today) < 0) {
                throw new IllegalArgumentException("Reminder date cannot be in the past. Please select today or a future date.");
            }
        }

        String reminderTime = (String) data.get("reminderTime");
        if (reminderTime == null || reminderTime.isBlank()) {
            reminderTime = "09:00";
        }

        String description = (String) data.get("description");

        Reminder reminder = new Reminder();
        reminder.setUser(user);
        reminder.setTitle(title.trim());
        reminder.setDescription(description != null ? description.trim() : "");
        reminder.setReminderDate(reminderDate.trim());
        reminder.setReminderTime(reminderTime.trim());
        reminder.setCompleted(false);
        reminder.setCreatedAt(LocalDateTime.now());

        Reminder saved = reminderRepository.save(reminder);
        return formatReminder(saved);
    }

    public Map<String, Object> getUserReminders(Long userId) {
        List<Reminder> allList = reminderRepository.findByUserIdOrderByReminderDateAscReminderTimeAsc(userId);

        String today = LocalDate.now().toString();
        String currentTime = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));

        List<Map<String, Object>> allFormatted = new ArrayList<>();
        List<Map<String, Object>> todayList = new ArrayList<>();
        List<Map<String, Object>> upcomingList = new ArrayList<>();
        List<Map<String, Object>> overdueList = new ArrayList<>();
        List<Map<String, Object>> completedList = new ArrayList<>();

        for (Reminder r : allList) {
            Map<String, Object> map = formatReminder(r);
            allFormatted.add(map);

            boolean isDone = Boolean.TRUE.equals(r.getCompleted());
            if (isDone) {
                completedList.add(map);
                continue;
            }

            String date = r.getReminderDate() != null ? r.getReminderDate() : today;
            String time = r.getReminderTime() != null ? r.getReminderTime() : "23:59";

            if (date.compareTo(today) < 0 || (date.equals(today) && time.compareTo(currentTime) < 0)) {
                map.put("isOverdue", true);
                overdueList.add(map);
            } else if (date.equals(today)) {
                map.put("isToday", true);
                todayList.add(map);
            } else {
                map.put("isUpcoming", true);
                upcomingList.add(map);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("all", allFormatted);
        result.put("today", todayList);
        result.put("upcoming", upcomingList);
        result.put("overdue", overdueList);
        result.put("completed", completedList);

        Map<String, Integer> counts = new HashMap<>();
        counts.put("total", allFormatted.size());
        counts.put("today", todayList.size());
        counts.put("upcoming", upcomingList.size());
        counts.put("overdue", overdueList.size());
        counts.put("completed", completedList.size());
        result.put("counts", counts);

        return result;
    }

    public Map<String, Object> getReminderById(Long id) {
        Reminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reminder not found with ID: " + id));
        return formatReminder(reminder);
    }

    @Transactional
    public Map<String, Object> updateReminder(Long id, Map<String, Object> data) {
        Reminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reminder not found with ID: " + id));

        if (data.containsKey("title") && data.get("title") != null) {
            reminder.setTitle(data.get("title").toString().trim());
        }
        if (data.containsKey("description")) {
            reminder.setDescription(data.get("description") != null ? data.get("description").toString().trim() : "");
        }
        if (data.containsKey("reminderDate") && data.get("reminderDate") != null) {
            String newDate = data.get("reminderDate").toString().trim();
            String today = LocalDate.now().toString();
            if (newDate.compareTo(today) < 0) {
                throw new IllegalArgumentException("Reminder date cannot be in the past. Please select today or a future date.");
            }
            reminder.setReminderDate(newDate);
        }
        if (data.containsKey("reminderTime") && data.get("reminderTime") != null) {
            reminder.setReminderTime(data.get("reminderTime").toString().trim());
        }
        if (data.containsKey("completed") && data.get("completed") != null) {
            reminder.setCompleted(Boolean.parseBoolean(data.get("completed").toString()));
        }

        Reminder saved = reminderRepository.save(reminder);
        return formatReminder(saved);
    }

    @Transactional
    public Map<String, Object> toggleReminderCompletion(Long id) {
        Reminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reminder not found with ID: " + id));

        boolean newStatus = !Boolean.TRUE.equals(reminder.getCompleted());
        reminder.setCompleted(newStatus);

        Reminder saved = reminderRepository.save(reminder);
        return formatReminder(saved);
    }

    @Transactional
    public void deleteReminder(Long id) {
        reminderRepository.deleteById(id);
    }

    private Map<String, Object> formatReminder(Reminder r) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", r.getId());
        map.put("title", r.getTitle());
        map.put("description", r.getDescription());
        map.put("reminderDate", r.getReminderDate());
        map.put("reminderTime", r.getReminderTime());
        map.put("completed", Boolean.TRUE.equals(r.getCompleted()));
        map.put("createdAt", r.getCreatedAt() != null ? r.getCreatedAt().toString() : "");
        if (r.getUser() != null) {
            map.put("userId", r.getUser().getId());
            map.put("userName", r.getUser().getName());
        }
        return map;
    }
}
