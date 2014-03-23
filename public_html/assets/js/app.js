var app = {
    // Path to hte XML file
    XMLdataPath: 'http://textbookce.mobileacademy.com/Course/GetXML/',
    
    // Course Id
    courseId: 0,
    
    // XML content language
    lang: '',
    
    // Content of the XML file
    XMLContent: '',
    
    // Index of the current chapter
    chapterIndex: 0,
    
    // Index of the current question
    questionIndex: 0,
    
    init: function(chapterIndex, questionIndex) {
        var url = purl();
        
        this.chapterIndex  = parseInt(chapterIndex);
        this.questionIndex = parseInt(questionIndex);

        this.courseId = url.param('courseId');
        this.lang     = url.param('lang');

        this.parseXML();
        this.render(this.getChapter(this.chapterIndex, this.questionIndex));
        this.applyTransition();
        
        this.bindUIActions();
    },
    
    bindUIActions: function() {
        $('#content').on('click', '.answer', function(e) {
            app.changeQuestionAction($(this), e);
        });
        
        // $('#content').on("click", ".end-chapter .content, .end-chapter .title", function(e) {
        //     app.changeChapterAction($(this), e);
        // })
        
        window.addEventListener('popstate', function(event) {
            app.historyWalkAction();
        });
        
        $("body").keydown(function(e) {
            if(e.keyCode == 37) { // left
                app.leftKeypressAction();
            }
            else if(e.keyCode == 39) { // right
                app.rightKeypressAction();
            }
        });
    },
    
    changeQuestionAction: function(_this, e) {
        this.increaseQuestionIndex();
        history.pushState(null, null, this.requestBuilder(this.chapterIndex + 1, this.questionIndex + 1));
    },
    
    changeChapterAction: function(_this, e) {
        var nextChapter = this.getNextChapter();
        
        if (nextChapter) {
            this.updateContent(this.chapterIndex + 1, 1);
            this.applyTransition();
        }
    },
    
    historyWalkAction: function() {
        var url = purl(document.location.href);
        var chapterIndex = 1;
        var questionIndex = 1;

        if(typeof url.param('chapterIndex') !== 'undefined')
            chapterIndex = parseInt(url.param('chapterIndex'));

        if(typeof url.param('questionIndex') !== 'undefined')
            questionIndex = parseInt(url.param('questionIndex'));
    
        app.updateContent(chapterIndex - 1, questionIndex - 1);
        this.applyTransition();
    },
    
    leftKeypressAction: function() {
        if (!(this.questionIndex == 0)) {
            this.questionIndex = this.questionIndex - 1;
            history.pushState(null, null, this.requestBuilder(this.chapterIndex + 1, this.questionIndex + 1));
            this.historyWalkAction();    
        } else if (this.chapterIndex != 0) {
            var nextChapter = this.getNextChapter(this.chapterIndex - 2);
            history.pushState(null, null, this.requestBuilder(this.chapterIndex, nextChapter.find('QAFlashCard').length + 1));
            this.historyWalkAction();    
        }
    },
    
    rightKeypressAction: function() {
        var count  = $("#content > div").length;
        if ((parseInt(count/2) + 1) > this.questionIndex + 1) {
            this.questionIndex = this.questionIndex + 1;
            history.pushState(null, null, this.requestBuilder(this.chapterIndex + 1, this.questionIndex + 1));
            this.historyWalkAction();
        } else {
            var nextChapter = this.getNextChapter(this.chapterIndex);
            if (nextChapter) {
                history.pushState(null, null, this.requestBuilder(this.chapterIndex + 2, 1));
                this.historyWalkAction();
            }
        }
    },
    
    applyTransition: function() {
        var count  = $("#content > div").length;
        
        $("#content > div").each(function(i, e){
            if (!$(this).hasClass('end-chapter')) {
                $(this).unbind("click").bind("click", function(){
                    $(this).css("opacity", 0).bind("webkitTransitionEnd transitionend", function(){
                            $(this).next().css("opacity", 1);
                            $(this).hide();
                    });
                }).removeAttr("style").css("opacity", 0).css("z-index", count - i);
            }
            
            if (i < app.questionIndex * 2) {
                $(this).hide();
            }
            
            (app.questionIndex * 2 === i) ? $(this).css("opacity", 1).css("z-index", count - i) : $(this).css("opacity", 0).css("z-index", count - i);
        });
    },
    
    /*Parses XML and returns it's content*/
    parseXML: function(chapterIndex) {        
        $.ajax({
            type: "GET",
            url: this.XMLdataPath,
            data: {
                courseId: this.courseId,
                lang: this.lang
            },
            dataType: "xml",
            async: false,
            success: function(xmlDoc) {
                app.XMLContent = $(xmlDoc);
            }
        });
    },
    
    getChapter: function(chapterIndex) {
        var chapter = $(app.XMLContent).find('chapter').eq(chapterIndex);
        return chapter;
    },
    
    getNextChapter: function(chapterIndex) {
        var chapterIndex = chapterIndex || this.chapterIndex;
        var chapter = $(app.XMLContent).find('chapter').eq(chapterIndex + 1);
        return (chapter.length) ? chapter : null;
    },
    
    increaseQuestionIndex: function() {
        this.questionIndex += 1;
    },
    
    updateContent: function(chapterIndex, questionIndex) {
        this.chapterIndex = chapterIndex;
        this.questionIndex = questionIndex;
        
        this.render(this.getChapter(this.chapterIndex), this.questionIndex);
    },
    
    requestBuilder: function(chapterIndex, questionIndex) {
        return '?courseId=' + this.courseId + '&lang=' + this.lang + 
                '&chapterIndex=' + chapterIndex + '&questionIndex=' + questionIndex;
    },
    
    render: function(chapterXML, currentQuestionIndex) {
        
        var data = {};
        data.title = chapterXML.children('title').text();
      
        chapterXML.find('QAFlashCard').each(function(i){
            data.questions = data.questions || {};
            var q = {}
            data.questions[i] = q;

            //clean out the comment from the text
            q.question = $(this).find('FCQuestion').text().replace(/\[{(.*)}]/, '');

            if (currentQuestionIndex === i)
                q.selected = "z-index:" + (i + 1) + "; opacity:1";
            else
                q.selected = "z-index:'" + (i + 1) + "'; opacity:0";

            q.answer = {};
            q.answer.short = {};
            q.answer.short.text = {};

            q.answer.short.type = $(this).find('short').attr('type');
            
            $(this).find('short').find('text').each(function(j) {
                q.answer.short.text[j] = $(this).text();
            });
            
            q.answer.long = {};
            q.answer.long.text = {};
            $(this).find('long').find('text').each(function(j) {
                q.answer.long.text[j] = $(this).text();
            });
            $(this).find('long').find('SimpleList').find('item').each(function(j) {
                q.answer.long.type = 'simpleList';
                q.answer.long.text[j] = $(this).text();
            });            
            $(this).find('long').find('SimpleOList').find('item').each(function(j) {
                q.answer.long.type = 'simpleOList';
                q.answer.long.text[j] = $(this).text();
            });
            
            q.answer.bonus = {};
            q.answer.bonus.text = {};
            q.answer.bonus.type = $(this).find('bonus').attr('type');
            
            $(this).find('bonus').find('text').each(function(j) {
                q.answer.bonus.text[j] = $(this).text();
            });
        });
        
        data.chapterRequest = this.requestBuilder(this.chapterIndex + 1, 1);
        
        var nextChapter = this.getNextChapter();
        data.nextChapter = {};
        if(nextChapter !== null) {
            data.nextChapter.exists = true;
            data.nextChapter.request = this.requestBuilder(this.chapterIndex + 2, 1);
            data.nextChapter.title = nextChapter.children('title').text();
        } else {
            data.nextChapter.exists = false;
        }
        
        console.log(data);
        html = new EJS({url: 'templates/chapter.ejs'}).render(data);
        
        $("#content").html(html);
        
    }
};

$(function() {
    var url = purl();
    var chapterIndex = 1;
    var questionIndex = 1;
    
    if(typeof url.param('chapterIndex') !== 'undefined')
        chapterIndex = parseInt(url.param('chapterIndex'));
    
    if(typeof url.param('questionIndex') !== 'undefined')
        questionIndex = parseInt(url.param('questionIndex'));
    
    app.init(chapterIndex - 1, questionIndex - 1);
});