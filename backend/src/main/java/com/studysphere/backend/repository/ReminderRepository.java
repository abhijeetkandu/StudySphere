package com.studysphere.backend.repository;

import com.studysphere.backend.entity.Reminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReminderRepository extends JpaRepository<Reminder, Long> {
    List<Reminder> findByUserIdOrderByReminderDateAscReminderTimeAsc(Long userId);
    List<Reminder> findByUserIdAndCompletedOrderByReminderDateAscReminderTimeAsc(Long userId, Boolean completed);
}
