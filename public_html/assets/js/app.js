$(function() {
   var content = $("content");
   
//   $('#content').on('click', '.answer', function(e) {
//       e.stopPropagation();
//       $(this).parent().hide();
//       history.pushState(null, null, '&questionIndex=5');
//   });
    
   $('#content').on('click', '.QAFlashCard', function(e) {
       if(typeof $(this).data('action') !== 'undefined') {
           $(this).hide();
       } else {
           $(this).children('.question').hide();
           $(this).children('div.answer').show();
       }
   });
   
});

var app = {
    /*Path to hte XML file*/
    XMLdataPath: 'XMLdata/',
    
    /*XML file name*/
    XMLFile: 'HTWFIP2BookSummary-en.xml',
    
    XMLContent: '',
    
    chapterIndex: 0,
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
            app.answerClickAction($(this), e);
        });
    },
      
    answerClickAction: function(_this, e) {
        e.stopPropagation();
        _this.parent().removeClass('selected');
        _this.parent().next().addClass('selected');
        this.increaseQuestionIndex();
        history.pushState(null, null, '?chapterIndex=' + (this.chapterIndex + 1) + '&questionIndex=' + (this.questionIndex + 1));
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
        return (chapter.length) ? chapter.length : null;
    },
    
    increaseQuestionIndex: function() {
        this.questionIndex += 1;
    },
    
    render: function(chapterXML) {
        
        var data = {};
        data.title = chapterXML.find('title').text();
      
        chapterXML.find('QAFlashCard').each(function(i){
            data.questions = data.questions || {};
            data.questions[i] = {};
            //clean out the comment from the text
            data.questions[i].question = $(this).find('FCQuestion').text().replace(/\[{(.*)}]/, '');

            if (app.questionIndex === i)
                data.questions[i].selected = 'selected';

            data.questions[i].answer = {};
            data.questions[i].answer.short = {};
            
            $(this).find('short').find('text').each(function(j) {
                data.questions[i].answer.short[j] = $(this).text();
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
            data.nextChapter.title = chapterXML.find('title').text();
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
