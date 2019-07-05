const http = require('http');
const express = require('express');
const bodyParser = require('body-parser'); //dịch data từ form
const cookieParser = require('cookie-parser') 
const socketIO = require('socket.io'); // websocket  -- realtime
const jwt = require('jsonwebtoken'); // xác minh 
const config = require('./config');
const mongoose = require('mongoose');
const app = express();
const server = http.Server(app);
const io = socketIO(server);
const crypto = require('crypto')  // mã hóa dữ liệu

//define models
const User = mongoose.model('Users',{
    username:String, 
    password: String
  })


var dbUrl ='mongodb://username:<password>@cluster0-shard-00-00-ucmmd.mongodb.net:27017,cluster0-shard-00-01-ucmmd.mongodb.net:27017,cluster0-shard-00-02-ucmmd.mongodb.net:27017/User?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority'

mongoose.connect(dbUrl, { useNewUrlParser: true } , (err) => { 
    console.log('mongodb connected',err);
  })

  //active-users-list
  var activeUserList=[]; 
  var connectedUsers = {};
  var listVideos = [];

io.on('connection', (socket) => {
   
    var currentRoom=[];
    socket.on('disconnect', () => { 
        
        var activeUserIndex =activeUserList.indexOf(socket.username);
        if(activeUserIndex!==-1){
            activeUserList.splice(activeUserIndex,1);
            socket.broadcast.emit('user-left',socket.username); 
            socket.broadcast.emit('active-user-list',activeUserList);
            socket.broadcast.emit('streamList',listVideos);
        }
        delete connectedUsers[socket.username];              
        var index = listVideos.findIndex(obj=>obj.username==socket.username)
        if(index!==-1)
            listVideos.splice(index,1)  
                    
    });

    socket.on('register', async (data, callback) => {
        var newUser = new User(data); 
        if( await User.findOne({username:newUser.username})!=null){
            callback({
                success: false,
                error: 'tên đăng nhập đã trùng'
            })
            return;
          }      
          newUser.password= crypto.createHash("sha256").update(newUser.password).digest("hex");
          newUser.save();         
          callback({
            success: true,
            error: null
        })                        
        
    });

    socket.on('login', async (data, callback) => {
        var thisUser = new User(data);
            thisUser.password= crypto.createHash("sha256").update(thisUser.password).digest("hex");            
        var findpwd =  await User.findOne({username:thisUser.username});
          if( findpwd!=null &&findpwd.password==thisUser.password){    
            callback({
                success: true,
                data: {
                    token: jwt.sign(data, config.jwtKey, {expiresIn: '7d'})
                },
                error: null
            })     
            activeUserList.push(socket.username); 
                           
            return;
        }
        callback({
            success: false,
            error: 'Tên đăng nhập hoặc mật khẩu không đúng hoặc không tồn tại'
        })
    });

    //thong báo số người online
    socket.on('Room-data',()=>{        
        io.emit('active-user-list',activeUserList)
        socket.emit('streamList',listVideos);
    })
    socket.on('join',async (data, callback) => {        
        const {token} = data; 
        try {            
            socket.user = await jwt.verify(token, config.jwtKey);                
                         
            socket.username= socket.user.username;
            connectedUsers[socket.username] = []; //quản lí room
            connectedUsers[socket.username].socket=socket;
            socket.broadcast.emit('new-user',socket.username);
            if(activeUserList.indexOf(socket.username)<0)  //quản lí danh sách người dùng
                activeUserList.push(socket.username);           
            callback({
                success: true,
                error: null,
                username: socket.user.username
            })            
        } catch (e) {
            console.log(e);
            callback({
                success: false,
                error: 'Ban chua login'
            })
        }
    });

    socket.on('Client-send-message',(data)=>{
        socket.emit('server-send-message-to-the-host',data);
        socket.broadcast.emit('server-send-message-to-users',data);
      });
    //chia sẻ video

    socket.on('Im-watching-this',(data)=>{        
        if(currentRoom!=null)
            socket.leave(currentRoom);
        currentRoom = socket.username;
        // create a room 
        socket.join(currentRoom);    
        var searchVar = listVideos.findIndex(obj=>obj.username==data.username);   
        if(searchVar>=0){
            listVideos[searchVar].id = data.id;      // update value      
        }
        else  listVideos.push({id:data.id, username: data.username,saveTime:0}) // add item
        socket.broadcast.emit('watch-this-video',data);
        socket.to(currentRoom).emit('change-video',data);
        
    })   
    

    socket.on('join-this-room', (data)=>{      
        if(currentRoom!=socket.username)
            socket.leave(currentRoom);
        socket.join(data)
        currentRoom=data; 
    })
    socket.on('saveCurrentTimeOfMyVideo',(data)=>{
        var searchVar = listVideos.findIndex(obj=>obj.username==socket.username);   
        if(searchVar>=0){
            listVideos[searchVar].saveTime = data;      // update value      
        }
    })
    socket.on('getMyTime',async (data,callback)=>{
        var searchVar = listVideos.findIndex(obj=>obj.username==socket.username); 
        if(searchVar>=0){
            if(currentRoom!=null)
            socket.leave(currentRoom);
            currentRoom = socket.username;
            callback({data:listVideos[searchVar]});           
        }
        // console.log(socket.adapter.rooms);
    })
    socket.on('askCurrentTimeFrom',(data)=>{
        connectedUsers[data].socket.emit('askeCurrentTime',socket.username);      // update value     
    })
    socket.on('traloi',(data)=>{
        connectedUsers[data.to].socket.emit('readyPlay',data);
    })

    socket.on('currentTime',(data)=>{ 

        if(socket.username==currentRoom)
            socket.to(currentRoom).emit('currentTimeFromHost',data.currentTime)    
        
    })   
    socket.on('paused',()=>{
        if(socket.username==currentRoom)
            socket.to(currentRoom).emit('pausedVideo');    
        
    })

});

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.set('view engine', 'ejs');
app.set('/views', 'views');
app.use(express.static(__dirname + '/public'));


// rendertrang
app.get('/', (req, res) => res.render('index.ejs', {page: 'home'}));
app.get('/login', (req, res) => res.render('index.ejs', {page: 'login'}));
app.get('/register', (req, res) => res.render('index.ejs', {page: 'register'}));

server.listen(config.webPort, () => console.log(`server is running at http://localhost:${config.webPort}`));