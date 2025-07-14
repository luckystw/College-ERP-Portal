import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';
import Button from '../common/Button';
import { Calendar, Users, CheckCircle, XCircle, Clock } from 'lucide-react';

const AttendanceManagement = () => {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  useEffect(() => {
    if (selectedSubject && selectedSession) {
      fetchStudentsForSubject();
    }
  }, [selectedSubject, selectedSession]);

  const fetchTeacherData = async () => {
    try {
      const [subjectsRes, sessionsRes] = await Promise.all([
        fetch('/api/teacher/subjects', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/teacher/sessions', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (subjectsRes.ok) {
        const subjectsData = await subjectsRes.json();
        setSubjects(subjectsData.subjects || []);
      }

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setSessions(sessionsData.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error);
    }
  };

  const fetchStudentsForSubject = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/teacher/students?subject=${selectedSubject}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
        
        // Initialize attendance state
        const initialAttendance = {};
        data.students.forEach(student => {
          initialAttendance[student._id] = 'present';
        });
        setAttendance(initialAttendance);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSubmitAttendance = async () => {
    if (!selectedSubject || !selectedSession || !selectedDate) {
      alert('Please select subject, session, and date');
      return;
    }

    setSubmitting(true);
    try {
      const attendanceData = {
        subject: selectedSubject,
        session: selectedSession,
        date: selectedDate,
        attendance: Object.entries(attendance).map(([studentId, status]) => ({
          student: studentId,
          status
        }))
      };

      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(attendanceData)
      });

      if (response.ok) {
        alert('Attendance marked successfully!');
        setAttendance({});
        setSelectedSubject('');
        setSelectedSession('');
      } else {
        alert('Error marking attendance');
      }
    } catch (error) {
      console.error('Error submitting attendance:', error);
      alert('Error marking attendance');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select Subject</option>
                {subjects.map(subject => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session
              </label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select Session</option>
                {sessions.map(session => (
                  <option key={session._id} value={session._id}>
                    {session.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      {loading ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          </CardContent>
        </Card>
      ) : students.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Student Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {students.map(student => (
                <div key={student._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-semibold">
                        {student.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-600">{student.rollNumber}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAttendanceChange(student._id, 'present')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        attendance[student._id] === 'present'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600 hover:bg-green-50'
                      }`}
                    >
                      <CheckCircle className="h-4 w-4 inline mr-1" />
                      Present
                    </button>
                    <button
                      onClick={() => handleAttendanceChange(student._id, 'absent')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        attendance[student._id] === 'absent'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-600 hover:bg-red-50'
                      }`}
                    >
                      <XCircle className="h-4 w-4 inline mr-1" />
                      Absent
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleSubmitAttendance}
                disabled={submitting}
                className="bg-primary-600 hover:bg-primary-700"
              >
                {submitting ? 'Submitting...' : 'Submit Attendance'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : selectedSubject && selectedSession ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No students found for the selected subject and session.</p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default AttendanceManagement; 