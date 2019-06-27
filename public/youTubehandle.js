// YOU WILL NEED TO ADD YOUR OWN API KEY IN QUOTES ON LINE 5, EVEN FOR THE PREVIEW TO WORK.
// 
// GET YOUR API HERE https://console.developers.google.com/apis/api


// https://developers.google.com/youtube/v3/docs/playlistItems/list

// https://console.developers.google.com/apis/api/youtube.googleapis.com/overview?project=webtut-195115&duration=PT1H

// <iframe width="560" height="315" src="https://www.youtube.com/embed/qxWrnhZEuRU" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

// https://i.ytimg.com/vi/qxWrnhZEuRU/mqdefault.jpg



    $('#sec-video').hide();
    $('#sec-chat').show();
    var player,time_update_interval = 0;

  
    var key = 'AIzaSyDkH-zFq6_tczPDlrNENywuO6ppYo7fN78';
    var URL = 'https://www.googleapis.com/youtube/v3/search';
    // get datas
    var options = {
        q: encodeURIComponent($("#search-vid").val()).replace(/%20/g, "+") , //keyword mà người dùng tìm kiếm
        part: 'snippet',
        key: key,
        maxResults: 15, 
        type: 'video'       
    }
    
    $('#search').click(function(){     
        loadVids();        
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
            console.log(listVideos) ;    
            if(i.username!=TenDangNhap){                
                $('#'+i.username).css({"border":"3px green solid"});
            }
        });
    })
    socket.on('watch-this-video', (data)=>{  
        $('#'+data.username).css({"border":"3px green solid"})
    })    


    $('activeuser').on('click', '.user', function () {
        var data;
        data = $(this)[0].id; 
        console.log(data);
        if(data!='the-host'){
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
         console.log(playerStatus.data)      
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
        console.log(data);
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
    