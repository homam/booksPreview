var app = {
    // Path to hte XML file
    XMLdataPath: 'XMLdata/',
    
    // XML file name
    XMLFile: 'HTWFIP2BookSummary-en.xml',
    
    // Content of the XML file
    XMLContent: '',
    
    // Index of the current chapter
    chapterIndex: 0,
    
    // Index of the current question
    questionIndex: 0,
    
    init: function(chapterIndex, questionIndex) {
        
        this.chapterIndex  = parseInt(chapterIndex);
        this.questionIndex = parseInt(questionIndex);

        this.parseXML();
        this.render(this.getChapter(this.chapterIndex));
        this.applyTransition();
        
        this.bindUIActions();
    },
    
    bindUIActions: function() {
        $('#content').on('click', '.answer', function(e) {
            app.changeQuestionAction($(this), e);
        });
        
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
        history.pushState(null, null, '?chapterIndex=' + (this.chapterIndex + 1) + '&questionIndex=' + (this.questionIndex + 1));
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
        this.questionIndex = Math.max(0, this.questionIndex - 1);
        history.pushState(null, null, '?chapterIndex=' + (this.chapterIndex + 1) + '&questionIndex=' + (this.questionIndex + 1));
        this.historyWalkAction();
    },
    
    rightKeypressAction: function() {
        var count  = $("#content > div").length;
        if ((parseInt(count/2) + 1) > this.questionIndex + 1) {
            this.questionIndex = this.questionIndex + 1;
            history.pushState(null, null, '?chapterIndex=' + (this.chapterIndex + 1) + '&questionIndex=' + (this.questionIndex + 1));
            this.historyWalkAction();
        }
    },
    
    applyTransition: function() {
        var count  = $("#content > div").length;
        
        $("#content > div").each(function(i, e){
            if (!$(this).hasClass('end-chapter')) {
                $(this).unbind("click").bind("click", function(){
                    $(this).css("opacity", 0).bind("webkitTransitionEnd transitionend", function(){
                            $(this).next().show();
                            $(this).hide();
                    });
                }).removeAttr("style").css("opacity", 1).css("z-index", count - i);
            }
            (app.questionIndex * 2 === i) ? $(this).show() : $(this).hide();
        });
    },
    
    /*Parses XML and returns it's content*/
    parseXML: function(chapterIndex) {
        $.ajax({
            type: "GET",
            url: this.XMLdataPath + this.XMLFile,
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
    
    getNextChapter: function() {
        var chapter = $(app.XMLContent).find('chapter').eq(this.chapterIndex + 1);
        return (chapter.length) ? chapter : null;
    },
    
    increaseQuestionIndex: function() {
        this.questionIndex += 1;
    },
    
    updateContent: function(chapterIndex, questionIndex) {
        this.chapterIndex = chapterIndex;
        this.questionIndex = questionIndex;
        
        this.render(this.getChapter(this.chapterIndex));
    },
    
    render: function(chapterXML) {
        
        var data = {};
        data.title = chapterXML.children('title').text();
      
        chapterXML.find('QAFlashCard').each(function(i){
            data.questions = data.questions || {};
            data.questions[i] = {};
            //clean out the comment from the text
            data.questions[i].question = $(this).find('FCQuestion').text().replace(/\[{(.*)}]/, '');

            if (app.questionIndex === i)
                data.questions[i].selected = "z-index:" + (i + 1) + "; opacity:1";
            else
                data.questions[i].selected = "z-index:'" + (i + 1) + "'; opacity:0";

            data.questions[i].answer = {};
            data.questions[i].answer.short = {};
            data.questions[i].answer.short.text = {};

            data.questions[i].answer.short.type = $(this).find('short').attr('type');
            
            $(this).find('short').find('text').each(function(j) {
                data.questions[i].answer.short.text[j] = $(this).text();
            });
            
            data.questions[i].answer.long = {};
            data.questions[i].answer.long.text = {};
            $(this).find('long').find('text').each(function(j) {
                data.questions[i].answer.long.text[j] = $(this).text();
            });
            $(this).find('long').find('SimpleList').find('item').each(function(j) {
                data.questions[i].answer.long.type = 'simpleList';
                data.questions[i].answer.long.text[j] = $(this).text();
            });            
            $(this).find('long').find('SimpleOList').find('item').each(function(j) {
                data.questions[i].answer.long.type = 'simpleOList';
                data.questions[i].answer.long.text[j] = $(this).text();
            });
            
            data.questions[i].answer.bonus = {};
            data.questions[i].answer.bonus.text = {};
            data.questions[i].answer.bonus.type = $(this).find('bonus').attr('type');
            
            $(this).find('bonus').find('text').each(function(j) {
                data.questions[i].answer.bonus.text[j] = $(this).text();
            });
        });
        
        data.chapterIndex = this.chapterIndex + 1;
        
        var nextChapter = this.getNextChapter();
        data.nextChapter = {};
        if(nextChapter !== null) {
            data.nextChapter.exists = true;
            data.nextChapter.index = this.chapterIndex + 2;
            data.nextChapter.title = nextChapter.children('title').text();
        } else {
            data.nextChapter.exists = false;
        }
        
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