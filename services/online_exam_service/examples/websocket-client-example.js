// examples/websocket-client-example.js
// Example code để demo cách sử dụng WebSocket trong frontend

/**
 * FRONTEND JAVASCRIPT EXAMPLE
 * Cách kết nối và sử dụng WebSocket cho Online Exam Service
 */

// 1. Import Socket.IO client (trong React/Vue project)
// import { io } from 'socket.io-client';

// 2. Kết nối WebSocket với authentication
function connectToExamWebSocket(token, examId, userRole = 'student') {
  const socket = io('http://localhost:9003', { // Port của Online Exam Service
    auth: {
      token: token // JWT token từ authentication
    },
    transports: ['websocket', 'polling']
  });

  // === CONNECTION EVENTS ===
  
  socket.on('connect', () => {
    console.log('✅ Connected to Exam WebSocket:', socket.id);
    
    // Join exam room ngay sau khi connect
    socket.emit('join_exam', {
      examId: examId,
      role: userRole // 'student', 'instructor', 'admin'
    });
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Disconnected from Exam WebSocket:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('🔥 WebSocket connection error:', error.message);
  });

  // === EXAM ROOM EVENTS ===
  
  socket.on('exam_joined', (data) => {
    console.log('🎯 Successfully joined exam:', data);
    // Update UI to show exam room status
    updateExamRoomUI(data);
  });

  socket.on('user_joined_exam', (data) => {
    console.log('👤 User joined exam:', data);
    // Show notification: "User X joined the exam"
    showNotification(`${data.userId} joined the exam as ${data.role}`);
  });

  socket.on('user_left_exam', (data) => {
    console.log('👋 User left exam:', data);
    // Show notification: "User X left the exam"
    showNotification(`${data.userId} left the exam`);
  });

  // === EXAM CONTROL EVENTS ===
  
  socket.on('exam_started', (data) => {
    console.log('🚀 Exam started:', data);
    // Redirect to exam taking page or enable exam UI
    if (userRole === 'student') {
      startExamTimer(data.duration);
      enableExamInterface();
    }
    showNotification(`Exam started by ${data.startedBy}`, 'success');
  });

  socket.on('exam_ended', (data) => {
    console.log('🏁 Exam ended:', data);
    // Disable exam interface and show results
    if (userRole === 'student') {
      disableExamInterface();
      showExamEndedDialog(data.reason);
    }
    showNotification(`Exam ended: ${data.reason}`, 'info');
  });

  socket.on('exam_terminated', (data) => {
    console.log('⛔ Exam terminated:', data);
    // Force end exam and show termination reason
    forceEndExam(data.reason);
    showNotification(`Exam terminated: ${data.reason}`, 'error');
  });

  // === REAL-TIME NOTIFICATIONS ===
  
  socket.on('warning_received', (data) => {
    console.log('⚠️ Warning received:', data);
    // Show warning modal to student
    showWarningModal(data.message, data.severity);
  });

  socket.on('time_warning', (data) => {
    console.log('⏰ Time warning:', data);
    // Show time warning notification
    showTimeWarning(data.timeRemaining, data.message);
  });

  socket.on('violation_detected', (data) => {
    console.log('🚨 Violation detected:', data);
    // For instructors: show violation alert
    if (userRole === 'instructor' || userRole === 'admin') {
      showViolationAlert(data);
    }
  });

  socket.on('system_notification', (data) => {
    console.log('📢 System notification:', data);
    // Show system-wide notifications
    showSystemNotification(data.message, data.type);
  });

  // === STUDENT-SPECIFIC EVENTS ===
  
  if (userRole === 'student') {
    // Submit answer
    function submitAnswer(questionId, answer, timeRemaining) {
      socket.emit('submit_answer', {
        examId: examId,
        questionId: questionId,
        answer: answer,
        timeRemaining: timeRemaining
      });
    }

    // Update status
    function updateStudentStatus(status, metadata = {}) {
      socket.emit('update_status', {
        examId: examId,
        status: status, // 'active', 'inactive', 'away', 'suspicious'
        metadata: metadata
      });
    }

    // Listen for answer confirmation
    socket.on('answer_submitted', (data) => {
      console.log('✅ Answer submitted:', data);
      // Show confirmation UI
      showAnswerConfirmation(data.questionId);
    });

    // Expose functions for student interface
    window.examWebSocket = {
      submitAnswer,
      updateStudentStatus,
      socket
    };
  }

  // === INSTRUCTOR-SPECIFIC EVENTS ===
  
  if (userRole === 'instructor' || userRole === 'admin') {
    // Start exam
    function startExam(duration) {
      socket.emit('start_exam', {
        examId: examId,
        startTime: new Date().toISOString(),
        duration: duration
      });
    }

    // End exam
    function endExam(reason = 'Exam completed') {
      socket.emit('end_exam', {
        examId: examId,
        reason: reason
      });
    }

    // Send warning to student
    function sendWarningToStudent(targetStudentId, message, severity = 'medium') {
      socket.emit('send_warning', {
        targetStudentId: targetStudentId,
        examId: examId,
        message: message,
        severity: severity
      });
    }

    // Listen for student activities
    socket.on('student_answer_submitted', (data) => {
      console.log('📝 Student submitted answer:', data);
      // Update instructor dashboard
      updateStudentProgress(data.studentId, data.questionId);
    });

    socket.on('student_status_updated', (data) => {
      console.log('📊 Student status updated:', data);
      // Update student status in instructor dashboard
      updateStudentStatusUI(data.studentId, data.status);
    });

    socket.on('warning_sent', (data) => {
      console.log('✅ Warning sent successfully:', data);
      // Show confirmation that warning was sent
      showNotification(`Warning sent to student ${data.targetStudentId}`, 'success');
    });

    // Expose functions for instructor interface
    window.examWebSocket = {
      startExam,
      endExam,
      sendWarningToStudent,
      socket
    };
  }

  // === ERROR HANDLING ===
  
  socket.on('error', (error) => {
    console.error('WebSocket error:', error);
    showNotification(error.message || 'WebSocket error occurred', 'error');
  });

  return socket;
}

// === HELPER FUNCTIONS (implement these in your frontend) ===

function updateExamRoomUI(data) {
  // Update UI to show exam room information
  console.log('Update exam room UI:', data);
}

function showNotification(message, type = 'info') {
  // Show toast notification
  console.log(`[${type.toUpperCase()}] ${message}`);
}

function startExamTimer(duration) {
  // Start countdown timer for exam
  console.log('Starting exam timer:', duration);
}

function enableExamInterface() {
  // Enable exam questions and controls
  console.log('Enabling exam interface');
}

function disableExamInterface() {
  // Disable exam interface when exam ends
  console.log('Disabling exam interface');
}

function showExamEndedDialog(reason) {
  // Show modal with exam end reason
  console.log('Exam ended dialog:', reason);
}

function forceEndExam(reason) {
  // Force end exam and redirect
  console.log('Force ending exam:', reason);
}

function showWarningModal(message, severity) {
  // Show warning modal to student
  console.log(`Warning [${severity}]: ${message}`);
}

function showTimeWarning(timeRemaining, message) {
  // Show time warning notification
  console.log(`Time warning: ${message} (${timeRemaining}s remaining)`);
}

function showViolationAlert(data) {
  // Show violation alert for instructors
  console.log('Violation alert:', data);
}

function showSystemNotification(message, type) {
  // Show system notification
  console.log(`System [${type}]: ${message}`);
}

function showAnswerConfirmation(questionId) {
  // Show answer submission confirmation
  console.log('Answer confirmed for question:', questionId);
}

function updateStudentProgress(studentId, questionId) {
  // Update student progress in instructor dashboard
  console.log(`Student ${studentId} answered question ${questionId}`);
}

function updateStudentStatusUI(studentId, status) {
  // Update student status in UI
  console.log(`Student ${studentId} status: ${status}`);
}

// === USAGE EXAMPLES ===

// Example 1: Student connecting to exam
/*
const studentSocket = connectToExamWebSocket(
  'student_jwt_token_here',
  'exam_123',
  'student'
);

// Submit an answer
window.examWebSocket.submitAnswer('question_1', 'A', 1800); // 30 minutes remaining

// Update status when student becomes inactive
window.examWebSocket.updateStudentStatus('inactive', { reason: 'tab_switch' });
*/

// Example 2: Instructor connecting to exam
/*
const instructorSocket = connectToExamWebSocket(
  'instructor_jwt_token_here',
  'exam_123',
  'instructor'
);

// Start the exam
window.examWebSocket.startExam(3600); // 1 hour duration

// Send warning to a student
window.examWebSocket.sendWarningToStudent('student_456', 'Please focus on your exam', 'medium');

// End the exam
window.examWebSocket.endExam('Time completed');
*/

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { connectToExamWebSocket };
}
