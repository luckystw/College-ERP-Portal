import React from 'react';
import {
  Users,
  BookOpen,
  Calendar,
  TrendingUp,
  UserCheck,
  GraduationCap,
  Clock,
  BarChart3
} from 'lucide-react';

const AdminOverview = ({ dashboardData }) => {
  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const { summary, recentStudents, recentTeachers } = dashboardData;

  const stats = [
    {
      name: 'Total Students',
      value: summary.totalStudents,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive'
    },
    {
      name: 'Total Teachers',
      value: summary.totalTeachers,
      icon: GraduationCap,
      color: 'bg-green-500',
      change: '+5%',
      changeType: 'positive'
    },
    {
      name: 'Total Courses',
      value: summary.totalCourses,
      icon: BookOpen,
      color: 'bg-purple-500',
      change: '+8%',
      changeType: 'positive'
    },
    {
      name: 'Active Sessions',
      value: summary.activeSessions,
      icon: Calendar,
      color: 'bg-orange-500',
      change: '1',
      changeType: 'neutral'
    },
    {
      name: 'Today\'s Attendance',
      value: summary.todayAttendance,
      icon: UserCheck,
      color: 'bg-indigo-500',
      change: `${summary.attendancePercentage}%`,
      changeType: 'positive'
    },
    {
      name: 'Total Subjects',
      value: summary.totalSubjects,
      icon: BookOpen,
      color: 'bg-pink-500',
      change: '+15%',
      changeType: 'positive'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's what's happening at DPG Institute today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center">
                <span className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' : 
                  stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-1">from last month</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Chart */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Attendance</h3>
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600">
                {summary.attendancePercentage}%
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {summary.presentToday} present out of {summary.todayAttendance} total
              </p>
              <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${summary.attendancePercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-600 mr-3" />
                <span className="text-sm font-medium text-blue-900">Add New Student</span>
              </div>
              <span className="text-blue-600">→</span>
            </button>
            <button className="w-full flex items-center justify-between p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <div className="flex items-center">
                <GraduationCap className="h-5 w-5 text-green-600 mr-3" />
                <span className="text-sm font-medium text-green-900">Add New Teacher</span>
              </div>
              <span className="text-green-600">→</span>
            </button>
            <button className="w-full flex items-center justify-between p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 text-purple-600 mr-3" />
                <span className="text-sm font-medium text-purple-900">Create New Course</span>
              </div>
              <span className="text-purple-600">→</span>
            </button>
            <button className="w-full flex items-center justify-between p-3 text-left bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-orange-600 mr-3" />
                <span className="text-sm font-medium text-orange-900">Manage Sessions</span>
              </div>
              <span className="text-orange-600">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Students */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Students</h3>
          <div className="space-y-3">
            {recentStudents?.map((student, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{student.email}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(student.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Teachers */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Teachers</h3>
          <div className="space-y-3">
            {recentTeachers?.map((teacher, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-green-600">
                      {teacher.firstName?.charAt(0)}{teacher.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {teacher.firstName} {teacher.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{teacher.email}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(teacher.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview; 