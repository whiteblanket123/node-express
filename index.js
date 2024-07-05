const express = require('express');
const app = express();
var cors = require('cors')
var mysql      = require('mysql');
const cookieParser = require('cookie-parser');
const path = require('path');

app.use(cors())
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '1234',
  database : 'test'
});

connection.connect((err) => {
  if (err) {
    console.error('MySQL 연결 실패: ', err);
    return;
  }
  console.log('MySQL 연결 성공');
})

app.post('/submit', (req, res) => {
  const { name, number, vote } = req.body;

  // 기존 데이터 조회 쿼리
  const checkQuery = 'SELECT * FROM users WHERE name = ? AND number = ?';
  const checkValues = [name, number];

  // 기존 데이터 조회
  connection.query(checkQuery, checkValues, (err, result) => {
    if (err) throw err;

    if (result.length > 0) {
      // 기존 데이터가 있는 경우, 데이터 업데이트
      const updateQuery = 'UPDATE users SET vote = ? WHERE name = ? AND number = ?';
      const updateValues = [vote, name, number];

      connection.query(updateQuery, updateValues, (err, result) => {
        if (err) throw err;

        console.log(`${result.affectedRows} row(s) updated`);
        res.status(200).json('성공적으로 보내졌습니다.');
      });
    }
  });
});


app.get('/result', (req, res) => {
  const query = `
  SELECT
    SUM(CASE WHEN vote = 1 THEN 1 ELSE 0 END) AS vote_1_count,
    SUM(CASE WHEN vote = 2 THEN 1 ELSE 0 END) AS vote_2_count,
    CASE
      WHEN SUM(CASE WHEN vote = 1 THEN 1 ELSE 0 END) > SUM(CASE WHEN vote = 2 THEN 1 ELSE 0 END) THEN 'vote 1 is more'
      WHEN SUM(CASE WHEN vote = 1 THEN 1 ELSE 0 END) < SUM(CASE WHEN vote = 2 THEN 1 ELSE 0 END) THEN 'vote 2 is more'
      ELSE 'They are equal'
    END AS more_votes
  FROM
    users;
`;
  connection.query(query, (err, results) => {
  if (err) throw err;

  // 결과 반환
  res.json(results[0]);
});

});

app.get('/reset',(req, res) => {
  connection.query('UPDATE users SET vote = NULL;', (error, results, fields) => {
    if (error) throw error;
  })
  res.json('초기화 성공')
  console.log('초기화 성공')
})

app.get('/downlods', (req, res) => {
  connection.query('SELECT * FROM users', (error, results, fields) => {
    if (error) throw error;
    
})
});

app.get('/loginpage', (req, res)=>{
  return res.sendFile(path.join(__dirname, '..', '..', '축제 프로젝트', 'html', 'login.html'));
})

app.post('/login', (req, res) => {
  const { name, number } = req.body;

  // MySQL에서 사용자 정보 확인
  connection.query('SELECT * FROM users WHERE name = ?', [name], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Internal Server Error');
    }
    // 사용자 정보가 없거나 비밀번호가 일치하지 않는 경우
    if (results.length ==0) {
      return res.status(401).send('정보 없음');
    }
    if(results[0].number == number){
      res.cookie('userId', results[0].id, { maxAge: 24 * 60 * 60 * 1000 });
      res.cookie('name', results[0].name, { maxAge: 24 * 60 * 60 * 1000 });
      res.cookie('number', results[0].number, { maxAge: 24 * 60 * 60 * 1000 });
      return res.sendFile(path.join(__dirname, '..', '..', '축제 프로젝트', 'html', 'main.html'));
    }
    if (results[0].number != number){
      return res.status(401).send('맞지 않음');
    }
  });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
