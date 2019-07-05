const socket = io.connect('http://localhost:4444',{
    transports: [ 'websocket' ] 
});
var TenDangNhap;
const internalRedirect = (path) => {
    window.location.href = `${window.origin}${path}`
};
// follow https://www.w3schools.com/js/js_cookies.asp

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
    var arrLink=['http://','https://','shorturl.at/']
    let posHead=-1;
    for(i=0;i< arrLink.length;i++){
        let j=message.message.search(arrLink[i])
        if( j>=0)
        {   posHead=j; 
            break;  
             }
    }
    if(posHead>=0){ 
           
        let length = message.message.length;
        let posTail =length ;
        let link='';
        for(var i=posHead; i<length ;i++ ){
            if(message.message[i]!==' ')
                link+=message.message[i];
            else
            {
                posTail=i;
                break;
            } 
        }

        $('#spaceForMesssages').append(`<div class='right-chat'>
                            <p>`+message.message.substring(0,posHead)+`<a href="${message.message}" target="_blank"> ${link} </a>`+message.message.substring(posTail,length) + `</p>
                        </div>`) } 
    else 
        $('#spaceForMesssages').append(`<div class='right-chat'><p> ${message.message}</p> </div>`)

    $('#message').scrollTop($('#spaceForMesssages').height());
})


socket.on('server-send-message-to-users',(message)=>{
    var arrLink=['http://','https://','shorturl.at/']
    let posHead=-1;
    for(i=0;i< arrLink.length;i++){
        let j=message.message.search(arrLink[i])
        if( j>=0)
        {   posHead=j; 
            break;  
             }
    }
    if(posHead>=0){
           
        let length = message.message.length;
        let posTail =length ;
        let link='';
        for(var i=posHead; i<length ;i++ ){
            if(message.message[i]!==' ')
                link+=message.message[i];
            else
            {
                posTail=i;
                break;
            } 
        }

        $('#spaceForMesssages').append(`<div class='left-chat'>
                            <h6> ${message.name} </h6>
                            <p>`+message.message.substring(0,posHead)+`<a href="${message.message}" target="_blank"> ${link} </a>`+message.message.substring(posTail,length) + `</p>
                        </div>`) } 
    else 
    $('#spaceForMesssages').append(`<div class='left-chat'>
                            <h6> ${message.name} </h6>
                            <p>  ${message.message} </p>
                        </div>`)  
    $('#message').scrollTop($('#spaceForMesssages').height());
    
})

// xử lí gửi tin nhắn
$(() => {
    $('#text-chat').keydown(function(event){
        if(event.which === 13 && event.shiftKey == false){ 
            if($("#text-chat").val()!="")                 
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
                // console.log('join room success');
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
    
    $('activeUser').html(''); 
    activeUserList.forEach(i => {
        // user là host tại local đăng nhập
        if(i===TenDangNhap)
            $('activeUser').append(`<div class="user" aria-label="host" id="the-host"  >`+TenDangNhap.substring(0,3)+`</div>`)
        else
            $('activeUser').append(`<div class="user" aria-label= ${i} >`+i.substring(0,3)+  ` </div>`)
        
    });
   
    
})

socket.on('new-user',(data)=>{
    if(data!==null)
    $('#spaceForMesssages').append(`<div class='userInOut'>${data} have just joined the room</div>`)
})
socket.on('user-left',(data)=>{
    if(data!==null)
    $('#spaceForMesssages').append(`<div class='userInOut'>${data} just left the room</div>`)
})

$('activeuser') .on('mouseenter', '.user', function () {
    var i= $(this).attr('aria-label');
    if(i!='host')
    $( this ).append( $( "<div class='pop-up-name'>"+i+" </div>" ) );
})
$('activeuser') .on('mouseleave','.user', function () {
    $( '.pop-up-name').remove();
})


$('#btn-register').click(()=>{
    window.location.assign('https://funchatapp2019.herokuapp.com/register')
});
$('#btn-login').click(()=>{
    window.location.assign('https://funchatapp2019.herokuapp.com/login')
});

$('#logout').click(()=>{
    let confirmLogout = confirm('bạn có chắc chắn muốn thoát?')
    if(confirmLogout===true)  
        {   setCookie('token',null);
            internalRedirect('/login');            
        }
})