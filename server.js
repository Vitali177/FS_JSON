const http = require("http");
const fs = require("fs");
const WebSocket = require("ws");

const server = http.createServer();

const http_handler = (req, res) => {
  if (req.method === "GET") {
    let students;

    try {
      const rawData = fs.readFileSync("./StudentList.json");
      students = JSON.parse(rawData);
    } catch (err) {
      const objError = {"error": 1, "message": "Ошибка чтения файла StudentList.json"};
      res.end(JSON.stringify(objError));
    }

    switch(req.url) {
      case "/":         
        res.writeHead(200, {"Content-type": "application/json; charset=utf-8"});
        res.end(JSON.stringify(students));
        break;

      case "/backup":
        const list = [];  

        fs.readdir("./copies/", (err, fileNames) => {
          if (err) {
            console.log("Read dir error", err);
            res.writeHead(200, {"Content-type": "text/plain; charset=utf-8"});
            res.end("Read dir error");
          }
          else {
            fileNames.forEach(fileName => list.push(fileName));
            res.writeHead(200, {"Content-type": "application/json; charset=utf-8"});
            res.end(JSON.stringify(list));
          }        
        });
        break;

      default:
        const studentId = req.url.slice(1);
        let foundStudent = null;

        students.forEach(student => {
          if (student.id === +studentId) {
            foundStudent = student;
          }
        });

        res.writeHead(200, {"Content-type": "application/json; charset=utf-8"});
        if (foundStudent) {
          res.end(JSON.stringify(foundStudent));
        } else {
          const objError = {"error": 2, "message": `Студент с id = ${studentId} не найден`};
          res.end(JSON.stringify(objError));
        }
        break;
    }    
  }
  else if (req.method === "POST") {
    let students;

    try {
      const rawData = fs.readFileSync("./StudentList.json");
      students = JSON.parse(rawData);
    } catch (err) {
      const objError = {"error": 1, "message": "Ошибка чтения файла StudentList.json"};
      res.end(JSON.stringify(objError));
    }

    switch(req.url) {
      case "/":         
        let result = "";

        req.on("data", data => {result += data});
        req.on("end", () => {
          let newStudent = JSON.parse(result);
          let isAlreadyInFile = false;

          students.forEach(student => {
            if (student.id === newStudent.id) {
              isAlreadyInFile = true;
            }
          });

          res.writeHead(200, {"Content-type": "application/json; charset=utf-8"});
          if (isAlreadyInFile) {
            const objError = {"error": 3, "message": `Студент с id = ${newStudent.id} уже есть`};
            res.end(JSON.stringify(objError));
          } else {
            students.push(newStudent);
            const data = JSON.stringify(students, null, 2);
            fs.writeFileSync('./StudentList.json', data);            
            res.end(JSON.stringify(newStudent));
          }
        });
        break;

      case "/backup":
        const dateNow = new Date();
        const year = dateNow.getFullYear();
        const month = ((dateNow.getMonth()) + 1 < 10) ? `0${(dateNow.getMonth()) + 1}` : (dateNow.getMonth()) + 1;
        const day = (dateNow.getDate() < 10) ? `0${dateNow.getDate()}` : dateNow.getDate();
        const hours = (dateNow.getHours() < 10) ? `0${dateNow.getHours()}` : dateNow.getHours();
        const minutes = (dateNow.getMinutes() < 10) ? `0${dateNow.getMinutes()}` : dateNow.getMinutes();
        const seconds = (dateNow.getSeconds() < 10) ? `0${dateNow.getSeconds()}` : dateNow.getSeconds();

        const fileName = `${year}${month}${day}${hours}${minutes}${seconds}_StudentList.json`;

        const data = JSON.stringify(students, null, 2);
        setTimeout(() => {
          fs.writeFileSync(`./copies/${fileName}`, data);
          res.writeHead(200, {"Content-type": "text/plain; charset=utf-8"});
          res.end("File StudentList.json copied");
        }, 2000);    
        break;

      default:        
        res.writeHead(404, {"Content-type": "text/plain; charset=utf-8"});
        res.end("This request is not supported");
        break;
    } 
  }
  else if (req.method === "PUT") {
    switch(req.url) {
      case "/":         
        let students;
        let result = "";

        try {
          const rawData = fs.readFileSync("./StudentList.json");
          students = JSON.parse(rawData);
        } catch (err) {
          const objError = {"error": 1, "message": "Ошибка чтения файла StudentList.json"};
          res.end(JSON.stringify(objError));
        }

        req.on("data", data => {result += data});
        req.on("end", () => {
          let newStudent = JSON.parse(result);
          let isAlreadyInFile = false;
          let studentInFile;

          students.forEach(student => {
            if (student.id === newStudent.id) {
              isAlreadyInFile = true;
              studentInFile = student;
            }
          });

          if (isAlreadyInFile) {            
            for (let key in newStudent) {
              // If studentInFile had this property, then we rewrite them
              if (studentInFile[key]) { 
                studentInFile[key] = newStudent[key];
              }
            }
            const data = JSON.stringify(students, null, 2);
            fs.writeFileSync('./StudentList.json', data);
            
            res.writeHead(200, {"Content-type": "application/json; charset=utf-8"});
            res.end(JSON.stringify(newStudent));
          } else {
            const objError = {"error": 2, "message": `Студент с id = ${newStudent.id} не найден`};
            res.end(JSON.stringify(objError));
          }
        });
        break;

      default:        
        res.writeHead(404, {"Content-type": "text/plain; charset=utf-8"});
        res.end("This request is not supported");
        break;
    } 
  }
  else if (req.method === "DELETE") {
    let students;

    try {
      const rawData = fs.readFileSync("./StudentList.json");
      students = JSON.parse(rawData);
    } catch (err) {
      const objError = {"error": 1, "message": "Ошибка чтения файла StudentList.json"};
      res.end(JSON.stringify(objError));
    }    

    if (req.url.indexOf("/backup/") !== -1) {
      const year = +req.url.slice(8, 12);
      const month = +req.url.slice(14, 16);
      const day = +req.url.slice(12, 14);

      fs.readdir("./copies/", (err, fileNames) => {
        if (err) {console.log("Read dir error", err);}
        else {
          fileNames.forEach(fileName => {
            const fileYear = +fileName.slice(0, 4);
            const fileMonth = +fileName.slice(4, 6);
            const fileDay = +fileName.slice(6, 8);
  
            if ((fileYear < year) || (fileYear === year && fileMonth < month) ||
                (fileYear === year && fileMonth === month && fileDay < day)) {
              fs.unlink(`./copies/${fileName}`, err => {
                if (err) {
                  console.log("File deletion error ", err);
                } else {
                  console.log("File deleted");
                }
              });
            }
          });
        }        
      });
      res.writeHead(200, {"Content-type": "text/plain; charset=utf-8"});
      res.end("Request fulfilled");
    } else {
      const studentId = req.url.slice(1);
      let deletedStudent = null;

      students = students.filter(student => {
        if (student.id === +studentId) {
          deletedStudent = student;
          return false;
        }
        return true;
      });

      res.writeHead(200, {"Content-type": "application/json; charset=utf-8"});

      if (deletedStudent) {
        const data = JSON.stringify(students, null, 2);
        fs.writeFileSync('./StudentList.json', data);        
        res.end(JSON.stringify(deletedStudent));
      } else {
        const objError = {"error": 2, "message": `Студент с id = ${studentId} не найден`};
        res.end(JSON.stringify(objError));
      }
    }
  } else {
    res.writeHead(404, {"Content-type": "text/plain; charset=utf-8"});
    res.end(`You made a ${req.method} request! This request is not supported`);
  }
};

server.on("request", http_handler);
server.listen(3000);

const wsServer = new WebSocket.Server({port: 4000, host: "localhost", path: "/wsserver"});
wsServer.on("connection", ws => {
  fs.watch("./copies/", (event, f) => {
    if (f) {
      ws.send(`file: ${f}, event = ${event}`);
    }
  });
});
wsServer.on("error", err => console.log("WS server error", err));