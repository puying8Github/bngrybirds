/**
 * Created by Administrator on 2017/3/24 0024.
 */
//requestAnimationFrame 功能函数
(function(){
    // requestAnimationFrame 专门处理动画
    var lastTime = 0;
    var vendors = [ 'mx', 'moz', 'webkit', 'o' ];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] ||  window[vendors[x] + 'CancelRequestAnimationFrame'];
    }
    if (!window.requestAnimationFrame){
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function(){
                callback(currTime + timeToCall)
            },timeToCall);
            lastTime = currTime + timeToCall;
            return id
        }
    }
    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id)
        }
    }
})()
//game 对象
var game = {
    showLevelScreen: function () {
        $('.game_layer').hide();
        $("#level_select_screen").show('slow');
    },
    //游戏阶段
    mode: "intro",
    // 弹弓的x和y坐标
    slingshotX: 140,
    slingshotY: 280,
    start: function () {
        $('.game_layer').hide();
        //显示游戏画布和得分
        $('#game_canvas').show();
        $('#score_screen').show();
        game.mode = "intro";
        game.offsetLeft = 0;
        game.ended = false;
        game.animationFrame = window.requestAnimationFrame(game.animate,game.canvas);
    },
    // 画面最大平移速度，单位为像素每帧
    maxSpeed: 3,
    // 画面最大和最小平移范围
    minOffset: 0,
    maxOffset: 300,
    // 画面当前平移位置
    offsetLeft: 0,
    // 游戏得分
    score: 0,
    // 画面中心移动到newCenter
    panTo: function(newCenter){
        if (Math.abs(newCenter - game.offsetLeft - game.canvas.width/4) > 0
        && game.offsetLeft <= game.maxOffset && game.offsetLeft >= game.minOffset) {
            var deltaX = Math.round((newCenter - game.offsetLeft - game.canvas.width/4)/2);
            if (deltaX && Math.abs(deltaX) > game.maxSpeed) {
                deltaX = game.maxSpeed * Math.abs(deltaX)/(deltaX);
            }
            game.offsetLeft += deltaX;
        } else {
            return true;
        }
        if (game.offsetLeft < game.minOffset) {
            game.offsetLeft = game.minOffset;
            return true;
        } else if (game.offsetLeft > game.maxOffset) {
            //...
            game.offsetLeft = game.minOffset;
            return true;
        }
        return false
    },
    handlePanning: function () {
        // game.offsetLeft++;//临时函数---使画面向右平移
        if (game.mode=="intro"){
            if(game.panTo(700)){
                game.mode = "load-next-hero";
            }
        }
        if(game.mode == "wait-for-firing") {
            if (mouse.dragging){
                game.panTo(mouse.x + game.offsetLeft)
            } else {
                game.panTo(game.slingshotX);
            }
        }
        if (game.mode == "load-next-hero") {
            /**
             * 待完成
             * 检查是否有坏蛋活着，如果没有，结束关卡（通过）
             * 检查是否还有可装填英雄，如果没有，结束关卡（失败）
             * 装填英雄，设置状态到wait-for-firing
             */
            game.mode = "wait-for-firing"
        }
        if (game.mode == "firing") {
            game.panTo(game.slingshotX);
        }
        if (game.mode == "fired") {
            //待完成
            //视野移动到英雄的当前位置
        }
    },
    animate: function () {
        //移动背景
        game.handlePanning();

        // 使角色运动

        // 使用视差滚动绘制背景
        game.context.drawImage(game.currentLevel.backgroundImage,game.offsetLeft/4,0,640,480,0,0,640,480);
        game.context.drawImage(game.currentLevel.foregroundImage,game.offsetLeft,0,640,480,0,0,640,480);

        //绘制弹弓
        game.context.drawImage(game.slingshotImage,game.slingshotX-game.offsetLeft,game.slingshotY);
        game.context.drawImage(game.slingshotFrontImage,game.slingshotX-game.offsetLeft,game.slingshotY);

        if(!game.ended) {
            game.animationFrame = window.requestAnimationFrame(game.animate,game.canvas);
        }
    },
    // 开始初始化对象， 预加载资源，并显示开始界面
    init: function () {
        // 初始化对象
        levels.init();
        loader.init();
        mouse.init();
        //隐藏所有图层
        $('.game_layer').hide();
        $('#game_start_screen').show();

        //获取游戏画布及其绘图环境的引用
        game.canvas = $('#game_canvas')[0];
        game.context = game.canvas.getContext('2d');

    }
};
// 简单的关卡对象
var levels = {
    //关卡数据
    data: [
        {//第一关
            foreground: 'desert-foreground',
            background: 'clouds-background',
            entities: []
        }, {//第二关
            foreground: 'desert-foreground',
            background: 'clouds-background',
            entities: []
        }
    ],
    // 初始化关卡选择画面
    init: function () {
        var html = "";
        var _this = this;
        for (var i = 0; i < _this.data.length; i++) {
            var level = levels.data[i];
            html += '<input type="button" value="' + ( i + 1) + '"/>';
        }
        $('#level_select_screen').html(html);

        //单击按钮时加载关卡
        $('#level_select_screen input').click(function(){
            levels.load(this.value - 1);
            $("#level_select_screen").hide();
        })
    },
    // 为某一关加载所有的数据和图像
    load: function (number) {
        //声明一个新的当前关卡对象
        game.currentLevel = {number:number,hero:[]};
        game.score = 0;
        $('#score').html('Score:'+ game.score);
        var level = levels.data[number];

        //加载背景，前景和弹弓图像
        game.currentLevel.backgroundImage = loader.loadImage("images/backgrounds/" + level.background + ".png");
        game.currentLevel.foregroundImage = loader.loadImage("images/backgrounds/" + level.foreground + ".png");
        game.slingshotImage = loader.loadImage("images/slingshot.png");
        game.slingshotFrontImage = loader.loadImage("images/slingshot-front.png");
        //一旦所有的图像加载完成，就调用game.start()函数
        if(loader.loaded) {
            game.start()
        } else {
            loader.onload = game.start;
        }
    }
};
// 图像/声音资源加载器
var loader = {
    loaded: true,
    loadedCount: 0,//已加载的资源数
    totalCount: 0,//需要加载的资源总数

    init: function () {
        //检测浏览器支持的声音格式
        var mp3Support,oggSupport;
        var audio = document.createElement('audio');
        if (audio.canPlayType) {
            // 当前canPlayType()方法返回""、"maybe"或"probably"
            mp3Support = "" != audio.canPlayType('audio/mpeg');
            oggSupport = "" != audio.canPlayType('audio/ogg; codecs = "vorbis"');
        } else {
            //audio标签不被支持
            mp3Support = false;
            oggSupport = false;
        }
        //检测ogg,mp3,如果都不支持，就将soundFileExtn设置为undefined
        loader.soundFileExtn = oggSupport? ".ogg" : mp3Support?".mp3": undefined;
    },
    loadImage: function(url){
        loader.totalCount++;
        loader.loaded = false;
        $('#loading_screen').show();
        var image = new Image();
        image.src = url;
        image.onload = loader.itemLoaded;
        return image;
    },
    soundFileExtn: ",ogg",
    loadSound: function (url) {
        loader.totalCount++;
        loader.loaded = false;
        $("#loading_screen").show();
        var audio = new Audio();
        audio.src = url + loader.soundFileExtn;
        audio.addEventListener("canplaythrough",loader.itemLoaded,false);
        return audio;
    },
    itemLoaded: function() {
        loader.loadedCount++;
        $('#loading_message').html('Loaded' + loader.loadedCount + ' of ' + loader.totalCount);
        if(loader.loadedCount === loader.totalCount) {
            //loader完成资源加载
            loader.loader = true;
            //Hide the loading screen;
            $('#loading_screen').hide();
            // 如果loader.onload事件有响应函数，调用
            if(loader.onload) {
                loader.onload();
                loader.onload = undefined;
            }
        }
    }
};
//处理鼠标事件
var mouse = {
    x: 0,
    y: 0,
    down: false,
    init: function(){
        $('#game_canvas').mousemove(mouse.mousemoveHandler);
        $('#game_canvas').mousedown(mouse.mousedownhandler);
        $('#game_canvas').mouseup(mouse.mouseuphandler);
        $('#game_canvas').mouseout(mouse.mouseuphandler);
    },
    mousemovehandler: function(ev){
        var offset = $('#game_canvas').offset();
        mouse.x = ev.pageX - offset.left;
        mouse.y = ev.pageY - offset.top;
        if (mouse.down) {
            mouse.dragging = true;
        }
    },
    mousedownhandler: function(ev){
        mouse.down = true;
        mouse.downX = mouse.x;
        mouse.downY = mouse.y;
        ev.originalEvent.preventDefault();
    },
    mouseuphandler: function(ev) {
        mouse.down = false;
        mouse.dragging = false;
    }
}
$(window).load(function(){
    game.init();
});