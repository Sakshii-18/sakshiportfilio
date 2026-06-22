import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class EnquiryServer {
    private static final int PORT = readPort();
    private static final String DB_URL = readEnv("DB_URL", "jdbc:mysql://localhost:3306/sakshi_portfolio");
    private static final String DB_USER = readEnv("DB_USER", "root");
    private static final String DB_PASSWORD = readEnv("DB_PASSWORD", "@Root123");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^\\d{10}$");

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
        server.createContext("/enquiry", new EnquiryHandler());
        server.setExecutor(null);
        server.start();
        System.out.println("EnquiryServer started at http://localhost:" + PORT + "/enquiry");
    }

    private static class EnquiryHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 204, "");
                return;
            }

            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"success\":false,\"message\":\"Method not allowed.\"}");
                return;
            }

            try {
                String body = readBody(exchange.getRequestBody());
                Map<String, String> payload = parseFlatJson(body);
                ValidationResult validation = validate(payload);

                if (!validation.valid) {
                    sendJson(exchange, 400, "{\"success\":false,\"message\":\"" + escapeJson(validation.message) + "\"}");
                    return;
                }

                saveEnquiry(payload);
                sendJson(exchange, 201, "{\"success\":true,\"message\":\"Enquiry saved successfully.\"}");
            } catch (IllegalArgumentException exception) {
                sendJson(exchange, 400, "{\"success\":false,\"message\":\"Invalid JSON request.\"}");
            } catch (SQLException exception) {
                exception.printStackTrace();
                sendJson(exchange, 500, "{\"success\":false,\"message\":\"Database error. Please try again later.\"}");
            } catch (Exception exception) {
                exception.printStackTrace();
                sendJson(exchange, 500, "{\"success\":false,\"message\":\"Server error. Please try again later.\"}");
            }
        }
    }

    private static void saveEnquiry(Map<String, String> payload) throws SQLException {
        String sql = "INSERT INTO enquiries (name, email, phone, organization, service, project_type, budget, timeline, features, contact_method, message, reference_link, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection connection = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, payload.get("name"));
            statement.setString(2, payload.get("email"));
            statement.setString(3, payload.get("phone"));
            statement.setString(4, payload.get("organization"));
            statement.setString(5, payload.get("service"));
            statement.setString(6, payload.get("projectType"));
            statement.setString(7, payload.get("budget"));
            statement.setString(8, payload.get("timeline"));
            statement.setString(9, payload.get("features"));
            statement.setString(10, payload.get("contactMethod"));
            statement.setString(11, payload.get("message"));
            statement.setString(12, payload.get("referenceLink"));
            statement.setTimestamp(13, java.sql.Timestamp.from(Instant.now()));
            statement.executeUpdate();
        }
    }

    private static ValidationResult validate(Map<String, String> payload) {
        String name = value(payload, "name");
        String email = value(payload, "email");
        String phone = value(payload, "phone");
        String service = value(payload, "service");
        String budget = value(payload, "budget");
        String message = value(payload, "message");
        String termsAccepted = value(payload, "termsAccepted");

        if (name.length() < 3) return ValidationResult.error("Please enter your full name. Minimum 3 characters.");
        if (!EMAIL_PATTERN.matcher(email).matches()) return ValidationResult.error("Valid email is required.");
        if (!PHONE_PATTERN.matcher(phone).matches()) return ValidationResult.error("Phone must be a 10 digit number.");
        if (service.isBlank()) return ValidationResult.error("Please select a service.");
        if (budget.isBlank()) return ValidationResult.error("Please select a budget range.");
        if (message.length() < 20) return ValidationResult.error("Please describe your project. Minimum 20 characters.");
        if (!"true".equalsIgnoreCase(termsAccepted)) return ValidationResult.error("Please accept before submitting.");

        payload.put("name", name);
        payload.put("email", email);
        payload.put("phone", phone);
        payload.put("organization", value(payload, "organization"));
        payload.put("service", service);
        payload.put("projectType", value(payload, "projectType"));
        payload.put("budget", budget);
        payload.put("timeline", value(payload, "timeline"));
        payload.put("features", value(payload, "features"));
        payload.put("contactMethod", value(payload, "contactMethod"));
        payload.put("message", message);
        payload.put("referenceLink", value(payload, "referenceLink"));
        return ValidationResult.ok();
    }

    private static Map<String, String> parseFlatJson(String json) {
        if (json == null || json.trim().isEmpty()) {
            throw new IllegalArgumentException("Empty JSON");
        }

        Map<String, String> values = new HashMap<>();
        Pattern pairPattern = Pattern.compile("\"(name|email|phone|organization|service|projectType|budget|timeline|features|contactMethod|message|referenceLink)\"\\s*:\\s*\"((?:\\\\.|[^\"])*)\"");
        Matcher matcher = pairPattern.matcher(json);
        while (matcher.find()) {
            values.put(matcher.group(1), unescapeJson(matcher.group(2)));
        }
        Pattern booleanPattern = Pattern.compile("\"termsAccepted\"\\s*:\\s*(true|false)");
        Matcher booleanMatcher = booleanPattern.matcher(json);
        if (booleanMatcher.find()) {
            values.put("termsAccepted", booleanMatcher.group(1));
        }
        return values;
    }

    private static String readBody(InputStream stream) throws IOException {
        return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
    }

    private static void addCorsHeaders(HttpExchange exchange) {
        Headers headers = exchange.getResponseHeaders();
        headers.set("Access-Control-Allow-Origin", "*");
        headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
        headers.set("Access-Control-Allow-Headers", "Content-Type");
        headers.set("Content-Type", "application/json; charset=UTF-8");
    }

    private static void sendJson(HttpExchange exchange, int statusCode, String response) throws IOException {
        byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
        if (statusCode == 204) {
            exchange.sendResponseHeaders(statusCode, -1);
            exchange.close();
            return;
        }
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream output = exchange.getResponseBody()) {
            output.write(bytes);
        }
    }

    private static String value(Map<String, String> payload, String key) {
        return payload.getOrDefault(key, "").trim();
    }

    private static String readEnv(String name, String fallback) {
        String value = System.getenv(name);
        return value == null || value.isBlank() ? fallback : value;
    }

    private static int readPort() {
        String value = System.getenv("PORT");
        if (value == null || value.isBlank()) return 8080;
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException exception) {
            return 8080;
        }
    }

    private static String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private static String unescapeJson(String value) {
        return value
                .replace("\\\"", "\"")
                .replace("\\\\", "\\")
                .replace("\\n", "\n")
                .replace("\\r", "\r")
                .replace("\\t", "\t");
    }

    private static class ValidationResult {
        private final boolean valid;
        private final String message;

        private ValidationResult(boolean valid, String message) {
            this.valid = valid;
            this.message = message;
        }

        private static ValidationResult ok() {
            return new ValidationResult(true, "");
        }

        private static ValidationResult error(String message) {
            return new ValidationResult(false, message);
        }
    }
}
