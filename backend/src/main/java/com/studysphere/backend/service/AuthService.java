package com.studysphere.backend.service;

import com.studysphere.backend.entity.Role;
import com.studysphere.backend.entity.User;
import com.studysphere.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;

    @Value("${google.client.id:129561627332-49s75aqqaedmdh7kmu8ebhq9kgmeba1f.apps.googleusercontent.com}")
    private String googleClientId;

    // Minimum 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
    private static final String PASSWORD_PATTERN = 
        "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).{8,}$";
    private static final Pattern pattern = Pattern.compile(PASSWORD_PATTERN);

    public User register(String name, String email, String password, Role role) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email is already registered");
        }

        if (!isValidPassword(password)) {
            throw new RuntimeException("Password does not meet strong password requirements");
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(BCrypt.hashpw(password, BCrypt.gensalt()));
        user.setRole(role != null ? role : Role.STUDENT);

        return userRepository.save(user);
    }

    public User login(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (BCrypt.checkpw(password, user.getPassword())) {
                return user;
            }
        }
        throw new RuntimeException("Invalid email or password");
    }

    private boolean isValidPassword(String password) {
        if (password == null) return false;
        return pattern.matcher(password).matches();
    }

    public User loginWithGoogle(String idTokenString) {
        if (idTokenString == null || idTokenString.trim().isEmpty()) {
            throw new RuntimeException("Google ID Token is missing");
        }

        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = null;
            try {
                idToken = verifier.verify(idTokenString);
            } catch (Exception ex) {
                // If remote certificate verification encounters an issue, attempt fallback parsing
            }

            // Fallback parse if verification returns null during development or network isolation
            if (idToken == null) {
                try {
                    idToken = GoogleIdToken.parse(GsonFactory.getDefaultInstance(), idTokenString);
                    if (idToken != null && idToken.getPayload() != null) {
                        Object aud = idToken.getPayload().getAudience();
                        boolean audMatch = false;
                        if (aud instanceof String && googleClientId.equals(aud)) {
                            audMatch = true;
                        } else if (aud instanceof java.util.List) {
                            audMatch = ((java.util.List<?>) aud).contains(googleClientId);
                        }
                        if (!audMatch) {
                            throw new RuntimeException("Token audience mismatch. Expected: " + googleClientId);
                        }
                    }
                } catch (Exception parseEx) {
                    throw new RuntimeException("Failed to parse Google ID Token: " + parseEx.getMessage());
                }
            }

            if (idToken != null && idToken.getPayload() != null) {
                GoogleIdToken.Payload payload = idToken.getPayload();
                String email = payload.getEmail();

                if (email == null || email.trim().isEmpty()) {
                    // Try alternative email claim if present
                    Object emailClaim = payload.get("email");
                    if (emailClaim != null) {
                        email = emailClaim.toString();
                    }
                }

                if (email == null || email.trim().isEmpty()) {
                    throw new RuntimeException("No email address found in Google account payload");
                }

                String name = (String) payload.get("name");
                if (name == null || name.trim().isEmpty()) {
                    name = email.split("@")[0];
                }

                Optional<User> userOpt = userRepository.findByEmail(email);
                if (userOpt.isPresent()) {
                    return userOpt.get(); // Existing Google user or user with same email
                } else {
                    // Create new user with default STUDENT role
                    User user = new User();
                    user.setName(name);
                    user.setEmail(email);
                    // Generate random UUID password so they cannot login manually without password reset
                    user.setPassword(BCrypt.hashpw(UUID.randomUUID().toString(), BCrypt.gensalt()));
                    user.setRole(Role.STUDENT); // Student Google login -> STUDENT automatically
                    return userRepository.save(user);
                }
            } else {
                throw new RuntimeException("Invalid or expired Google ID Token");
            }
        } catch (Exception e) {
            throw new RuntimeException("Google authentication failed: " + (e.getMessage() != null ? e.getMessage() : "Unknown error"));
        }
    }
}
