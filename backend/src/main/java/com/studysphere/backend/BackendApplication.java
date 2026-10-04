package com.studysphere.backend;

import com.studysphere.backend.entity.Role;
import com.studysphere.backend.entity.User;
import com.studysphere.backend.repository.UserRepository;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class BackendApplication {

	static {
		loadEnv();
	}

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

	private static void loadEnv() {
		String[] candidatePaths = {".env", "backend/.env", "../backend/.env"};
		for (String path : candidatePaths) {
			java.io.File file = new java.io.File(path);
			if (file.exists() && file.isFile()) {
				try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.FileReader(file))) {
					String line;
					while ((line = reader.readLine()) != null) {
						line = line.trim();
						if (line.isEmpty() || line.startsWith("#")) continue;
						int eqIdx = line.indexOf('=');
						if (eqIdx > 0) {
							String key = line.substring(0, eqIdx).trim();
							String val = line.substring(eqIdx + 1).trim();
							if ((val.startsWith("\"") && val.endsWith("\"")) ||
								(val.startsWith("'") && val.endsWith("'"))) {
								val = val.substring(1, val.length() - 1);
							}
							if (System.getProperty(key) == null && System.getenv(key) == null) {
								System.setProperty(key, val);
							}
						}
					}
				} catch (Exception ignored) {
				}
			}
		}
	}

	@Bean
	public CommandLineRunner seedAdminUser(UserRepository userRepository) {
		return args -> {
			if (userRepository.findByEmail("admin@studysphere.edu").isEmpty()) {
				User admin = new User();
				admin.setName("System Administrator");
				admin.setEmail("admin@studysphere.edu");
				admin.setPassword(BCrypt.hashpw("Admin@123", BCrypt.gensalt()));
				admin.setRole(Role.ADMIN);
				userRepository.save(admin);
				System.out.println("Default Admin seeded: admin@studysphere.edu / Admin@123");
			}
		};
	}

}
