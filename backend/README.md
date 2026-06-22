# Enquiry Backend

This backend is intentionally small. The portfolio pages stay frontend-driven with HTML, CSS, and JavaScript. Java is used only for enquiry handling and MySQL storage.

## Database

Run:

```sql
SOURCE backend/sql/schema.sql;
```

Database: `sakshi_portfolio`

Table: `enquiries`

The server is structured around a dedicated `/enquiry` endpoint and a single persistence method, so future admin features such as view, delete, status tracking, dashboards, and email workflows can be added without mixing backend concerns into the portfolio pages.

## Dependencies

Download the MySQL Connector/J `.jar` and place it in `backend/lib/`.

Example file:

```text
backend/lib/mysql-connector-j-9.x.x.jar
```

## Compile

From `backend`:

```powershell
javac -cp "lib/*" EnquiryServer.java
```

## Run

```powershell
java -cp ".;lib/*" EnquiryServer
```

Optional environment variables:

```powershell
$env:PORT="8080"
$env:DB_URL="jdbc:mysql://localhost:3306/sakshi_portfolio"
$env:DB_USER="root"
$env:DB_PASSWORD="your_password"
```

## Endpoint

`POST /enquiry`

Request body:

```json
{
  "name": "Sakshi",
  "email": "sakshi@example.com",
  "phone": "9876543210",
  "organization": "ABC College",
  "service": "Management System",
  "projectType": "Academic",
  "budget": "Rs.5,000 - Rs.10,000",
  "timeline": "2-4 Weeks",
  "features": "Responsive Design, Admin Panel, Database Integration",
  "contactMethod": "WhatsApp",
  "message": "I want to discuss a leave approval management project.",
  "referenceLink": "https://example.com",
  "termsAccepted": true
}
```
