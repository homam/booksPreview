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
        
        this.bindUIActions();
    },
    
    bindUIActions: function() {
        $('#content').on('click', '.answer', function(e) {
            app.changeQuestionAction($(this), e);
        });
        
        $('#content').on('click', '.QAFlashCard', function(e) {
            app.showAnswerAction($(this));
        });
        
        window.addEventListener('popstate', function(event) {
            app.historyWalkAction();
        });
    },
    
    showAnswerAction: function(_this) {
        if(typeof _this.data('action') !== 'undefined') {
            _this.hide();
        } else {
            _this.children('.question').hide();
            _this.children('div.answer').show();
        }
    },

    changeQuestionAction: function(_this, e) {
        e.stopPropagation();
        _this.parent().removeClass('selected');
        _this.parent().next().addClass('selected');
        this.increaseQuestionIndex();
        
        history.pushState(null, null, '?chapterIndex=' + (this.chapterIndex + 1) + '&questionIndex=' + (this.questionIndex + 1));
    },
    
    historyWalkAction: function() {
        var url = purl(document.location.href);

        var chapterIndex = parseInt(url.param('chapterIndex'));
        var questionIndex = parseInt(url.param('questionIndex'));

        app.updateContent(chapterIndex - 1, questionIndex - 1);
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
                data.questions[i].selected = 'selected';

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
