const socket = io.connect('http://localhost:4444',{
    transports: [ 'websocket' ] 
});
var TenDangNhap;
const internalRedirect = (path) => {
    window.location.href = `${window.origin}${path}`
};

function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    const name = cname + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

//đăng kí
$('#register').on('submit', (event) => {
    event.preventDefault();
    // read params
    socket.emit('register', {
        username: $('#uname').val(),
        password: $('#pwd').val()
    }, (res) => {
        if (res.success) {
            alert("register thanh cong");
            internalRedirect('/login');
        } else {
            alert(res.error);
        }
    });
});
//đăng nhập
$('#login').on('submit', (event) => {
    event.preventDefault();
    // read params
    socket.emit('login', {
        username: $('#uname').val(),
        password: $('#pwd').val()
    }, (res) => {
        if (res.success) {
            alert("login thanh cong");            
            setCookie('token', res.data.token);
            internalRedirect('/');
        } else {
            alert(res.error);
        }
    });
});

socket.on('server-send-message-to-the-host',(message)=>{
    
    $('#message').append(`<div class='right-chat'>
                            <p>  ${message.message} </p>
                        </div>`)    
})


socket.on('server-send-message-to-users',(message)=>{
    $('#message').append(`<div id='left-chat'>
                            <h6> ${message.name} </h6>
                            <p>  ${message.message} </p>
                        </div>`)    
})
// xử lí gửi tin nhắn
$(() => {
    $('#text-chat').keydown(function(event){
        if(event.which === 13 && event.shiftKey == false){                  
            socket.emit('Client-send-message',{
                name: TenDangNhap,
                message:$("#text-chat").val()}
                ); 
                $("#text-chat").val("");
            event.preventDefault();    
        }
        })
        
    })


socket.on('connect', () => {
    if (window.location.pathname === '/') {
        socket.emit('join', {token: getCookie('token')}, (res) => {
            if (res.success) {
                console.log('join room success');
                TenDangNhap=res.username;
                socket.emit('Room-data');
            } else {
                console.log(res.error);
                internalRedirect('/login');             
                
            }
        });
    }
});

socket.on('active-user-list',(activeUserList)=>{
    console.log(activeUserList)
    $('activeUser').html(''); //xóa số user cũ để hiển thị toàn bộ user đang đăng nhập mà không bị trùng
    activeUserList.forEach(i => {
        // user là host tại local đăng nhập
        if(i===TenDangNhap)
            $('activeUser').append(`<div class="user" id="the-host">`+TenDangNhap.substring(0, 3)+`</div>`)
        else{
            $('activeUser').append(`<div class="user" id='${i}'>`+i.substring(0, 3)+`</div>`)
        }
    });
   
    
})


$('#btn-register').click(()=>{
    window.location.assign('http://localhost:4444/register')
})
$('#btn-login').click(()=>{
    window.location.assign('http://localhost:4444/login')
})


