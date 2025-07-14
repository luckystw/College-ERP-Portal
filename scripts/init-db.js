const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Course = require('../models/Course');
const Subject = require('../models/Subject');
const Session = require('../models/Session');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dpg_institute', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

const initializeDatabase = async () => {
    try {
        console.log('Starting database initialization...');

        // Clear existing data
        await User.deleteMany({});
        await Course.deleteMany({});
        await Subject.deleteMany({});
        await Session.deleteMany({});

        console.log('Cleared existing data');

        // Create default users (password will be hashed by User model pre-save hook)
        const admin = new User({
            username: 'admin',
            email: 'admin@dpg.edu',
            password: 'password123',
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin',
            phone: '1234567890',
            address: 'DPG Institute Campus'
        });

        const teacher = new User({
            username: 'teacher',
            email: 'teacher@dpg.edu',
            password: 'password123',
            firstName: 'John',
            lastName: 'Doe',
            role: 'teacher',
            phone: '1234567891',
            address: 'DPG Institute Campus'
        });

        const student = new User({
            username: 'student',
            email: 'student@dpg.edu',
            password: 'password123',
            firstName: 'Jane',
            lastName: 'Smith',
            role: 'student',
            phone: '1234567892',
            address: 'DPG Institute Campus'
        });

        await admin.save();
        await teacher.save();
        await student.save();

        console.log('Created default users');

        // Create sample courses
        const computerScience = new Course({
            name: 'Computer Science',
            code: 'CS101',
            description: 'Bachelor of Computer Science',
            duration: '4 Years',
            fee: 50000
        });

        const businessAdmin = new Course({
            name: 'Business Administration',
            code: 'BA101',
            description: 'Bachelor of Business Administration',
            duration: '3 Years',
            fee: 45000
        });

        await computerScience.save();
        await businessAdmin.save();

        console.log('Created sample courses');

        // Create sample subjects
        const programming = new Subject({
            name: 'Programming Fundamentals',
            code: 'CS101-PF',
            description: 'Introduction to programming concepts',
            credits: 4,
            teacher: teacher._id,
            course: computerScience._id
        });

        const database = new Subject({
            name: 'Database Management',
            code: 'CS101-DB',
            description: 'Database design and management',
            credits: 3,
            teacher: teacher._id,
            course: computerScience._id
        });

        const marketing = new Subject({
            name: 'Marketing Principles',
            code: 'BA101-MP',
            description: 'Basic marketing concepts',
            credits: 3,
            teacher: teacher._id,
            course: businessAdmin._id
        });

        await programming.save();
        await database.save();
        await marketing.save();

        console.log('Created sample subjects');

        // Update courses with subjects
        computerScience.subjects = [programming._id, database._id];
        businessAdmin.subjects = [marketing._id];
        await computerScience.save();
        await businessAdmin.save();

        // Create active session
        const currentSession = new Session({
            name: '2024-2025 Academic Year',
            startDate: new Date('2024-09-01'),
            endDate: new Date('2025-06-30'),
            isActive: true,
            description: 'Current academic session'
        });

        await currentSession.save();

        console.log('Created active session');

        console.log('\n=== Database Initialization Complete ===');
        console.log('\nDefault Login Credentials:');
        console.log('Admin - Username: admin, Password: password123');
        console.log('Teacher - Username: teacher, Password: password123');
        console.log('Student - Username: student, Password: password123');
        console.log('\nSample data has been created including:');
        console.log('- 3 default users (admin, teacher, student)');
        console.log('- 2 courses (Computer Science, Business Administration)');
        console.log('- 3 subjects (Programming, Database, Marketing)');
        console.log('- 1 active academic session');

        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
};

db.once('open', () => {
    console.log('Connected to MongoDB');
    initializeDatabase();
});

db.on('error', (error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
}); 