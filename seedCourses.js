import mongoose from 'mongoose';
import Course from './src/models/Course.js';
import dotenv from 'dotenv';

dotenv.config({ path: './Backend/.env' });

const coursesData = [
  {
    department: 'B.Sc',
    courseName: 'Bachelor of Science',
    duration: 3,
    totalSemesters: 6,
    semesters: [
      {
        semesterNumber: 1,
        subjects: [
          { name: 'Mathematics I', code: 'MATH101', credits: 4, type: 'core' },
          { name: 'Physics I', code: 'PHYS101', credits: 4, type: 'core' },
          { name: 'Chemistry I', code: 'CHEM101', credits: 4, type: 'core' },
          { name: 'English Communication', code: 'ENG101', credits: 2, type: 'core' },
          { name: 'Computer Fundamentals', code: 'COMP101', credits: 3, type: 'core' }
        ]
      },
      {
        semesterNumber: 2,
        subjects: [
          { name: 'Mathematics II', code: 'MATH102', credits: 4, type: 'core' },
          { name: 'Physics II', code: 'PHYS102', credits: 4, type: 'core' },
          { name: 'Chemistry II', code: 'CHEM102', credits: 4, type: 'core' },
          { name: 'Environmental Science', code: 'ENV102', credits: 2, type: 'core' },
          { name: 'Programming in C', code: 'COMP102', credits: 3, type: 'core' }
        ]
      },
      {
        semesterNumber: 3,
        subjects: [
          { name: 'Mathematics III', code: 'MATH201', credits: 4, type: 'core' },
          { name: 'Mechanics', code: 'PHYS201', credits: 4, type: 'core' },
          { name: 'Organic Chemistry', code: 'CHEM201', credits: 4, type: 'core' },
          { name: 'Data Structures', code: 'COMP201', credits: 3, type: 'core' },
          { name: 'Elective I', code: 'ELEC201', credits: 3, type: 'elective' }
        ]
      },
      {
        semesterNumber: 4,
        subjects: [
          { name: 'Statistics', code: 'MATH202', credits: 4, type: 'core' },
          { name: 'Electricity and Magnetism', code: 'PHYS202', credits: 4, type: 'core' },
          { name: 'Inorganic Chemistry', code: 'CHEM202', credits: 4, type: 'core' },
          { name: 'Database Management', code: 'COMP202', credits: 3, type: 'core' },
          { name: 'Elective II', code: 'ELEC202', credits: 3, type: 'elective' }
        ]
      },
      {
        semesterNumber: 5,
        subjects: [
          { name: 'Numerical Methods', code: 'MATH301', credits: 4, type: 'core' },
          { name: 'Quantum Mechanics', code: 'PHYS301', credits: 4, type: 'core' },
          { name: 'Physical Chemistry', code: 'CHEM301', credits: 4, type: 'core' },
          { name: 'Web Technologies', code: 'COMP301', credits: 3, type: 'core' },
          { name: 'Project Work', code: 'PROJ301', credits: 4, type: 'practical' }
        ]
      },
      {
        semesterNumber: 6,
        subjects: [
          { name: 'Operations Research', code: 'MATH302', credits: 4, type: 'core' },
          { name: 'Nuclear Physics', code: 'PHYS302', credits: 4, type: 'core' },
          { name: 'Analytical Chemistry', code: 'CHEM302', credits: 4, type: 'core' },
          { name: 'Software Engineering', code: 'COMP302', credits: 3, type: 'core' },
          { name: 'Major Project', code: 'PROJ302', credits: 6, type: 'practical' }
        ]
      }
    ]
  },
  {
    department: 'B.A',
    courseName: 'Bachelor of Arts',
    duration: 3,
    totalSemesters: 6,
    semesters: [
      {
        semesterNumber: 1,
        subjects: [
          { name: 'English Literature I', code: 'ENG101', credits: 4, type: 'core' },
          { name: 'History I', code: 'HIST101', credits: 4, type: 'core' },
          { name: 'Political Science I', code: 'POL101', credits: 4, type: 'core' },
          { name: 'Sociology I', code: 'SOC101', credits: 3, type: 'core' },
          { name: 'Hindi Language', code: 'HIN101', credits: 2, type: 'core' }
        ]
      },
      {
        semesterNumber: 2,
        subjects: [
          { name: 'English Literature II', code: 'ENG102', credits: 4, type: 'core' },
          { name: 'History II', code: 'HIST102', credits: 4, type: 'core' },
          { name: 'Political Science II', code: 'POL102', credits: 4, type: 'core' },
          { name: 'Sociology II', code: 'SOC102', credits: 3, type: 'core' },
          { name: 'Environmental Studies', code: 'ENV102', credits: 2, type: 'core' }
        ]
      },
      {
        semesterNumber: 3,
        subjects: [
          { name: 'Modern Poetry', code: 'ENG201', credits: 4, type: 'core' },
          { name: 'Ancient History', code: 'HIST201', credits: 4, type: 'core' },
          { name: 'International Relations', code: 'POL201', credits: 4, type: 'core' },
          { name: 'Social Psychology', code: 'SOC201', credits: 3, type: 'core' },
          { name: 'Elective I', code: 'ELEC201', credits: 3, type: 'elective' }
        ]
      },
      {
        semesterNumber: 4,
        subjects: [
          { name: 'American Literature', code: 'ENG202', credits: 4, type: 'core' },
          { name: 'Medieval History', code: 'HIST202', credits: 4, type: 'core' },
          { name: 'Public Administration', code: 'POL202', credits: 4, type: 'core' },
          { name: 'Criminology', code: 'SOC202', credits: 3, type: 'core' },
          { name: 'Elective II', code: 'ELEC202', credits: 3, type: 'elective' }
        ]
      },
      {
        semesterNumber: 5,
        subjects: [
          { name: 'Indian Writing in English', code: 'ENG301', credits: 4, type: 'core' },
          { name: 'Modern Indian History', code: 'HIST301', credits: 4, type: 'core' },
          { name: 'Political Theory', code: 'POL301', credits: 4, type: 'core' },
          { name: 'Rural Sociology', code: 'SOC301', credits: 3, type: 'core' },
          { name: 'Research Methodology', code: 'RES301', credits: 3, type: 'core' }
        ]
      },
      {
        semesterNumber: 6,
        subjects: [
          { name: 'Literary Criticism', code: 'ENG302', credits: 4, type: 'core' },
          { name: 'Contemporary History', code: 'HIST302', credits: 4, type: 'core' },
          { name: 'Comparative Politics', code: 'POL302', credits: 4, type: 'core' },
          { name: 'Urban Sociology', code: 'SOC302', credits: 3, type: 'core' },
          { name: 'Dissertation', code: 'DISS302', credits: 4, type: 'practical' }
        ]
      }
    ]
  },
  {
    department: 'B.Ed',
    courseName: 'Bachelor of Education',
    duration: 2,
    totalSemesters: 4,
    semesters: [
      {
        semesterNumber: 1,
        subjects: [
          { name: 'Childhood and Growing Up', code: 'EDU101', credits: 4, type: 'core' },
          { name: 'Contemporary India and Education', code: 'EDU102', credits: 4, type: 'core' },
          { name: 'Learning and Teaching', code: 'EDU103', credits: 4, type: 'core' },
          { name: 'Language across the Curriculum', code: 'EDU104', credits: 3, type: 'core' },
          { name: 'Understanding Disciplines and Subjects', code: 'EDU105', credits: 3, type: 'core' }
        ]
      },
      {
        semesterNumber: 2,
        subjects: [
          { name: 'Pedagogy of a School Subject I', code: 'EDU201', credits: 4, type: 'core' },
          { name: 'Knowledge and Curriculum', code: 'EDU202', credits: 4, type: 'core' },
          { name: 'Assessment for Learning', code: 'EDU203', credits: 4, type: 'core' },
          { name: 'Creating an Inclusive School', code: 'EDU204', credits: 3, type: 'core' },
          { name: 'Environmental Education', code: 'EDU205', credits: 2, type: 'core' }
        ]
      },
      {
        semesterNumber: 3,
        subjects: [
          { name: 'Pedagogy of a School Subject II', code: 'EDU301', credits: 4, type: 'core' },
          { name: 'Gender, School and Society', code: 'EDU302', credits: 3, type: 'core' },
          { name: 'Optional Course', code: 'EDU303', credits: 3, type: 'elective' },
          { name: 'School Internship', code: 'EDU304', credits: 4, type: 'practical' },
          { name: 'Reading and Reflecting on Texts', code: 'EDU305', credits: 3, type: 'core' }
        ]
      },
      {
        semesterNumber: 4,
        subjects: [
          { name: 'Pedagogy of a School Subject III', code: 'EDU401', credits: 4, type: 'core' },
          { name: 'Drama and Art in Education', code: 'EDU402', credits: 3, type: 'core' },
          { name: 'Critical Understanding of ICT', code: 'EDU403', credits: 3, type: 'core' },
          { name: 'Understanding the Self', code: 'EDU404', credits: 3, type: 'core' },
          { name: 'School Internship II', code: 'EDU405', credits: 4, type: 'practical' }
        ]
      }
    ]
  }
];

const seedCourses = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
    await Course.deleteMany({});
    await Course.insertMany(coursesData);
    console.log('Courses seeded successfully');
    process.exit();
  } catch (error) {
    console.error('Error seeding courses:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
  }
};

seedCourses();
