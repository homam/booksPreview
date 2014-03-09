$(function() {
   var content = $("content");
   
   $('#content').on('click', '.answer', function(e) {
       e.stopPropagation();
       $(this).parent().hide();
   });
    
   $('#content').on('click', '.QAFlashCard', function(e) {
       if(typeof $(this).data('action') !== 'undefined') {
           $(this).hide();
       } else {
           $(this).children('p').hide();
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
    
    init: function(chapterIndex) {
        
        this.chapterIndex = chapterIndex;
        
        this.parseXML();
        this.drawHTML(this.getChapter(this.chapterIndex));
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
    
    drawHTML: function(chapterXML) {
        
        var data = {};
        data.title = chapterXML.find('title').text();
      
        chapterXML.find('QAFlashCard').each(function(i){
            data.questions = data.questions || {};
            data.questions[i] = {};
            //clean out the comment from the text
            data.questions[i].question = $(this).find('FCQuestion').text().replace(/\[{(.*)}]/, '');
            data.questions[i].answer = {};
            data.questions[i].answer.short = {};
            
            $(this).find('short').find('text').each(function(j) {
                data.questions[i].answer.short[j] = $(this).text();
            });
            
            data.questions[i].answer.long = {};
            $(this).find('long').find('text').each(function(j) {
                data.questions[i].answer.long[j] = $(this).text();
            });
            
            data.questions[i].answer.bonus = {};
            data.questions[i].answer.bonus.text = {};
            data.questions[i].answer.bonus.type = $(this).find('bonus').attr('type');
            
            $(this).find('bonus').find('text').each(function(j) {
                data.questions[i].answer.bonus.text[j] = $(this).text();
            });    
        });
        
        data.chapterIndex = this.chapterIndex;
        
        html = new EJS({url: 'templates/chapter.ejs'}).render(data);
        
        $("#content").html(html);
        
    }
};

$(function() {
    var url = purl();
    var chapterIndex;
    
    if(typeof url.param('chapterIndex') === 'undefined')
        chapterIndex = 0;
    else
        chapterIndex = url.param('chapterIndex');
    
    app.init(chapterIndex);
});
