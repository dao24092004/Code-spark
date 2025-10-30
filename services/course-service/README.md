# Course Service

This service is responsible for managing courses, including course materials, quizzes, and user progress. It is a Spring Boot application built with Java 21 and Maven.

## How to Run

1.  **Prerequisites:**
    *   Java 21
    *   Maven
    *   PostgreSQL database

2.  **Database Configuration:**
    *   Create a PostgreSQL database.
    *   Update the `application.properties` file in `src/main/resources` with your database connection details:
        ```properties
        spring.datasource.url=jdbc:postgresql://localhost:5432/your_database
        spring.datasource.username=your_username
        spring.datasource.password=your_password
        ```

3.  **Run the application:**
    *   You can run the application using the following Maven command:
        ```bash
        mvn spring-boot:run
        ```
    *   The service will be available at `http://localhost:8080`.

## API Endpoints

### Courses

*   `POST /api/courses`: Create a new course. (Requires `COURSE_CREATE` authority)
*   `GET /api/courses/{courseId}`: Get course details by ID. (Requires `COURSE_READ` authority)
*   `GET /api/courses`: Get a paginated list of all courses. (Requires `COURSE_READ` authority)
*   `PUT /api/courses/{courseId}`: Update a course. (Requires `COURSE_WRITE` authority)
*   `DELETE /api/courses/{courseId}`: Delete a course. (Requires `COURSE_DELETE` authority)

### Materials

*   `POST /api/courses/{courseId}/materials`: Add a new material to a course. (Requires `MATERIAL_WRITE` authority)
*   `GET /api/courses/{courseId}/materials`: Get all materials for a course. (Requires `COURSE_READ` authority)
*   `DELETE /api/materials/{materialId}`: Delete a material. (Requires `MATERIAL_DELETE` authority)

### Quizzes

*   `GET /api/quizzes/{quizId}`: Get quiz details for a student. (Requires `COURSE_READ` authority)
*   `POST /api/quizzes/{quizId}/submit`: Submit a quiz. (Requires authentication)
