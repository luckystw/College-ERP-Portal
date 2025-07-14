import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';
import { BookOpen, User, Clock, Calendar } from 'lucide-react';

const StudentSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/student/subjects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects || []);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Enrolled Subjects</h3>
              <p className="text-gray-600">You are currently enrolled in {subjects.length} subjects</p>
            </div>
            <BookOpen className="h-8 w-8 text-primary-600" />
          </div>
        </CardContent>
      </Card>

      {/* Subjects Grid */}
      {subjects.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No subjects found.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {subject.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {subject.code}
                    </p>
                    <p className="text-sm text-gray-700 mb-4">
                      {subject.description || 'No description available'}
                    </p>
                  </div>
                  <div className="ml-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    <span>Teacher: {subject.teacher?.name || 'Not assigned'}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Duration: {subject.duration || 'N/A'} hours</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Credits: {subject.credits || 'N/A'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Course:</span>
                    <span className="font-medium text-gray-900">
                      {subject.course?.name || 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Subject Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Academic Guidelines</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Regular attendance is mandatory for all subjects</li>
                <li>• Minimum 75% attendance required to appear for exams</li>
                <li>• Submit assignments on time to avoid penalties</li>
                <li>• Contact your teachers for any subject-related queries</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Important Dates</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Mid-term examinations: Check with your teachers</li>
                <li>• Final examinations: End of semester</li>
                <li>• Assignment deadlines: As per subject schedule</li>
                <li>• Result declaration: Within 2 weeks of exams</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentSubjects; 