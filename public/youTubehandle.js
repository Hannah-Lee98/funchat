

    $('#sec-video').hide();
    $('#sec-chat').show();
    var player,time_update_interval = 0;

  
    var key = 'AIzaSyCCS-G9jZJsgpf6avAM1D5v4EZezklAPkA';
    var URL = 'https://www.googleapis.com/youtube/v3/search';
    // get data
    var options = {
        q: encodeURIComponent($("#search-vid").val()).replace(/%20/g, "+") , //keyword mà người dùng tìm kiếm
        part: 'snippet',
        key: key,
        maxResults: 20, 
        type: 'video'       
    }
    

    $('#search').click(function(){     
        loadVids();
        $('main').scrollTop(0);      
    })     
    // load videos
    function loadVids() {     
        options.q= $("#search-vid").val(); 
        $.getJSON(URL, options, function (data) {       
            resultsLoop(data);
        });
    }
    var checkPlayer = false;
    //video được chiếu
    function mainVid(id) {   
                    
                    var tag = document.createElement("script");
                    var firstScript = document.getElementsByTagName("script")[0];
                    tag.src = "https://www.youtube.com/iframe_api";
                    tag.id = "youtube-api";
                    firstScript.parentNode.insertBefore(tag, firstScript);  
                    // iframe
               onYouTubeIframeAPIReady = function() {
                player = new YT.Player('video-placeholder', {                                       
                    videoId: id, 
                    playerVars: { 'autoplay': 1},                   
                    events: { 
                        // trạng thái của video     
                        'onStateChange': onPlayerStateChange
                      }
                    });
                };                
                
    }
    $('iframe').css('width',$('.screen-side').css('width'));
		
    function resultsLoop(data) {
       
        $('main').html(``); //xóa trống trước khi tải video mới về
        $.each(data.items, function (i,item) {

            var thumb = item.snippet.thumbnails.medium.url;
            var title = item.snippet.title.substring(0, 20);
            var desc = item.snippet.description.substring(0, 20);
            var vid = item.id.videoId;

           
            $('main').append(`
							<article class="item" data-key="${vid}">

								<img src="${thumb}" alt="" class="thumb">
								<div class="details">
									<h6>${title}</h6>
									<p>${desc}</p>
								</div>

							</article>
						`);
        });
    }
    var vid;
    $('#video-placeholder').hide();
    mainVid('b24p4f6GiBA');
    
	//	click video để play
    $('main').on('click', 'article', function () {
        vid = $(this).attr('data-key');
        player.cueVideoById(vid)
        socket.emit('Im-watching-this',{id:vid, username: TenDangNhap});
        $('#video-placeholder').show();
    });

    socket.on('streamList',(listVideos)=>{    
        listVideos.forEach(i => {    
             if(i.username!=TenDangNhap){                
                $('[aria-label='+i.username+']').css({"border":"3px #5febff solid"})
            }
        });
    })
    socket.on('watch-this-video', (data)=>{ 
        $('[aria-label='+data.username+']').css({"border":"3px #5febff solid"});
    })      


    $('activeuser').on('click', '.user', function () {
        var data;
        data = $(this).attr('aria-label'); 
        if(data!='host'){
            player.pauseVideo();
            socket.emit('saveCurrentTimeOfMyVideo',player.getCurrentTime());
            socket.emit('join-this-room', data);
            socket.emit('askCurrentTimeFrom',data); 
        }
        else { socket.emit('getMyTime',{},(rep)=>{
            player.cueVideoById(rep.data.id, rep.data.saveTime)
        } )
              
       
        }});

    function onPlayerStateChange(playerStatus) {
          
        // if (playerStatus == -1) {//unstarted
        //     socket.emit('askCurrentTimeFrom')   
        // } else 
        if (playerStatus.data == 1) { //play
            socket.emit('currentTime',{currentTime:player.getCurrentTime(), username: TenDangNhap , id:vid} )           
        } else 
        if (playerStatus.data == 2) {   //paused         
            socket.emit('paused',{currentTime:player.getCurrentTime(), username: TenDangNhap, id:vid});
        } else if (playerStatus.data == 3) { //skip  
            socket.emit('currentTime',{currentTime:player.getCurrentTime(), username: TenDangNhap, id:vid} )
            
        } 
        else if (playerStatus.data == 5) { //cued
         player.playVideo();
        }
      }

    socket.on('askeCurrentTime',(data)=>{        
        socket.emit('traloi',{to:data, currentTime:player.getCurrentTime(), id:vid} )
    })
    socket.on('currentTimeFromHost', (data)=>{    
        player.playVideo();
        player.seekTo(data,true);     
    
    })

    socket.on('readyPlay',(data)=>{
        if(data.id!=null)
            {player.cueVideoById(data.id, data.currentTime,)
                $('#video-placeholder').show();
            }
        
    })

    socket.on('playMyVideo',(data)=>{
        player.cueVideoById(data.id, data.saveTime)
    })

    socket.on('pausedVideo', ()=>{       
        player.pauseVideo();
    })     
    socket.on('change-video',(data)=>{
        player.cueVideoById(data.id);
    })
    $('#btn-youtube').on('click', function(){
        $('#sec-video').show();
        $('#sec-chat').hide();
        loadVids();
    })
    $('#btn-chat-room').on('click', function(){
        $('#sec-video').hide();
        $('#sec-chat').show();
    })
 $('#btn-show-chat').hide();
    $('#btn-hide-chat').on('click', function(){
        $('.screen-side').show();
        $('.chat-side').hide();
        $('#btn-show-chat').show()
    })
    $('#btn-show-chat').on('click', function(){
        $('.screen-side').hide();
        $('.chat-side').show();
        $('#btn-show-chat').hide();
    })
    
//search-keyword

var suggestion=$('#listkeywords');
var suggestCallBack; // global var for autocomplete jsonp
var url="https://suggestqueries.google.com/complete/search?callback=?";

    $("#search-vid").autocomplete({
        source: function(request, response) {    
            $.getJSON(url,{
                "hl":"vn", // Language
                "ds":"yt", // Restrict lookup to youtube
                "jsonp":"suggestCallBack", // jsonp callback function name
                "q":request.term, // query term
                "client":"youtube" // force youtube style response, i.e. jsonp
              });          
            suggestCallBack = function (data) {
            
                suggestion.html(``);
                $.each(data[1], function(i, val) {                  
                  suggestion.append(`<option class="list-group-item"> ${val[0]}</option>`);
                });   
                
            };
            
        },
        
    });
    