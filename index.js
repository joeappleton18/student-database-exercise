const express = require('express');
const mysql = require('mysql');
const util = require('util');
const ejs = require('ejs');
const bodyParser = require('body-parser');

const PORT = 8000;
const DB_HOST = 'localhost';
const DB_USER = 'root';
const DB_PASSWORD = 'password';
const DB_NAME = 'university_web';
const DB_PORT = 3306;

var connection = mysql.createConnection({
	host: DB_HOST,
	user: DB_USER,
	password: DB_PASSWORD,
	database: DB_NAME,
	port: DB_PORT
});

connection.query = util.promisify(connection.query).bind(connection);

connection.connect((err) => {
	if (err) {
		console.error(`could not connect to database
		    ${err}
		`);
		return;
	}


	console.log('boom, you are connected');
})


const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', async (req, res) => {

	const studentCount = await connection.query('SELECT COUNT(*) as count FROM Student');
	const academicCount = await connection.query('SELECT COUNT(*) as count FROM Academic');
	const departmentCount = await connection.query('SELECT COUNT(*) as count FROM Department');
	const courseCount = await connection.query('SELECT COUNT(*) as count FROM Course');


	res.render('index', {
		studentCount: studentCount[0].count,
		academicCount: academicCount[0].count,
		departmentCount: departmentCount[0].count,
		courseCount: courseCount[0].count
	});
});

app.get('/students', async (req, res) => {

	const students = await connection.query('SELECT * from Student INNER JOIN Course on student.Stu_Course = course.Crs_Code');
	console.log(students);
	res.render('students', { students: students });
});

app.get('/students/edit/:id', async (req, res) => {

	const courses = await connection.query('SELECT Crs_Code, Crs_Title FROM Course');

	const student = await connection.query('SELECT * from Student INNER JOIN Course on student.Stu_Course = course.Crs_Code WHERE URN = ?',
		[req.params.id]);

	res.render('student_edit', { student: student[0], courses: courses, message: '' });
});

app.post('/students/edit/:id', async (req, res) => {

	const updatedStudent = req.body;


	if (isNaN(updatedStudent.Stu_Phone || updatedStudent.Stu_Phone.length != 11)) {
		const courses = await connection.query('SELECT Crs_Code, Crs_Title FROM Course');

		const student = await connection.query('SELECT * from Student INNER JOIN Course on student.Stu_Course = course.Crs_Code WHERE URN = ?',
			[req.params.id]);

		res.render('student_edit', { student: student[0], courses: courses, message: 'student not updated, invalid number' });
		return;
	}

	await connection.query('UPDATE STUDENT SET ? WHERE URN = ?', [updatedStudent, req.params.id]);
	const courses = await connection.query('SELECT Crs_Code, Crs_Title FROM Course');
	const student = await connection.query('SELECT * from Student INNER JOIN Course on student.Stu_Course = course.Crs_Code WHERE URN = ?',
		[req.params.id]);

	res.render('student_edit', { student: student[0], courses: courses, message: 'student updated' });



})

app.get('/students/view/:id', async (req, res) => {

	const student = await connection.query('SELECT * from Student INNER JOIN Course on student.Stu_Course = course.Crs_Code WHERE URN = ?',
		[req.params.id]);

	res.render('student_view', { student: student[0] });
})



app.listen(PORT, () => {
	console.log(`
    application listening on http://localhost:${PORT}
 `);
});