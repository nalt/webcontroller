/**
 *  @file topicWidget.js contains the source code of the topicWidget
 *  @author Nicolas Alt
 */

widgetList.push("imageWidget");

  /**
   *  Creates an instance of the topicWidget
   *  @extends widgetBase
   *  @constructor
   *  @param {Object} config - object with following keys:
   *   * type - the type of the widget
   *   * pos - the position of the screen where to display the widget
   *   * size - the height and width of the widget (if not set, default is 300x300)
   *   * content - the widget's contentObject that has been saved from a previous session (if not set, the widget is empty)
   */
function imageWidgetObject(config)
{
  widgetBase.apply(this, [config]);
  var that = this;

  this.title = "Images";
  this.description = "Display image streams";


  this.myDiv.droppable({
      accept:'#menuTopic li',
      drop:handleDropTopic,
      hoverClass:'hovered'
    })
  
  //that.imgDiv = $('<div style="height:100%; overflow: auto; width:100%;"></div>').appendTo(that.myDiv);
  
  that.contentObject.topic = "";
  var port = (window.location.port)? (parseInt(window.location.port) + 1) : 8889;
  that.contentObject.mjpeg_server = "http://" + window.location.hostname + ":" + port;
  that.contentObject.options = new Object({"width":"", "height":"", "quality": ""});
  loadMe(config.content);
  
  this.timeoutId = 0;
  this.myDiv.on("resize", function(event, ui) { if (this.timeoutId>0) clearTimeout(this.timeoutId); this.timeoutId = setTimeout(createStream, 500); } );
  
  /**
   * cleanMeUp() is called by the main application when removing the widget.
   * it was implemented to tidy up possible instances of objects to avoid memory leaks.
   * @method
   */
  this.cleanMeUp = function()
  {
    //write code to tidy things of this widget up before deleting its div
    console.log("done");
    that.myRosHandle.close();
  }
  
  /**
   * loadMe() is called by the widget's constructor
   * if there is handed over a valid content object, the widget will restore its information.
   * otherwise the method does nothing.
   * @param {Object} content - the widget's contentObject that has been saved from a previous session (if not set, the method does nothing and the widget stays empty)
   * @method
   */  
  function loadMe(content)
  {
    if (!content)
      return;
    if(content.options)
      for(prop in content.options)
        that.contentObject.options[prop] = content.options[prop];
    
    if (content.mjpeg_server)
        that.contentObject.mjpeg_server = content.mjpeg_server;
      
    if (content.topic) {
        that.contentObject.topic = content.topic;
        createStream();
    }
  }
  
  /**
   * insertItems() takes the name of the topic, creates an object of aTopic and displays its view in the widget's view.
   * furthermore the aTopic object gets stored in the listOfTopicObjects and the name of the topic gets stored into the content object.
   * the call of aTopic.m_createMe() creates the helper object's view and appends it to the widget's view.
   * in the first line, a shared methods is called to get more information about the topic.
   * this additional information is required to create the aTopic object which in turn creates the view of that topic with those information.
   * @param {string} topicString - the name of the topic to display
   * @param {topicWidgetObject~cb_inserted} cb_inserted - a callback signalling that the topic has been inserted
   * @method
   */  
  function insertItems(topicString, cb_inserted)
  {
    that.getTopicTypeByTopicString(that.myRosHandle, topicString, function(topicType) {
        if (topicType != "sensor_msgs/Image")
            alert("This widget needs an image topic!");
        else {
            that.contentObject.topic = topicString;
            createStream();
        }
        console.log("Got " + topicType);
    });
  }
  
  /** Create the streaming tag (img) based on the current parameters */
  function createStream() 
  {   
    var h = (that.contentObject.options.height > 0)? that.contentObject.options.height :
        that.contentDiv.height();
    var w = (that.contentObject.options.width > 0)? that.contentObject.options.width :
        that.contentDiv.width();
        
    var url = that.contentObject.mjpeg_server + "/stream";
    url += "?topic=" + that.contentObject.topic;
    url += "?width=" + w + "?height=" + h;
    if (that.contentObject.options.quality > 0)
        url += "?quality=" + that.contentObject.options.quality;
    console.log(url);
    
    that.contentDiv.empty();
    $("<img src=\"" + url + "\"/>").appendTo(that.contentDiv);
    
    that.myDiv.find('#title h1').text("Image: " + that.contentObject.topic);
  }
  
  
  /**
   * this is the event handler of the drop event of the widget's view.
   * it finds out the name of the dropped topic and triggers insertItems()
   * @param {Object} event - contains infos about the event
   * @param {Object} ui - the jQueryUI object that was dropped into the widget and which is needed to find out the topic's name.
   * @method
   */
  function handleDropTopic( event, ui )
  { 
    var draggable = ui.draggable;
    insertItems(draggable.data('value'), function(){});
  }
    
  /**
   * the event handler of the remove button of the aService's view.
   * it removes the aTopic object from both arrays listOfTopicObjects and contentObject.items
   * it also stops the subscription of the aTopic object before deleting
   * then it removes the aTopics's view from the widget's view.
   * @param {aTopic} obj - the desired aTopic object to remove.
   * @method
   */
  function handleRemoveButtonPress(obj)
  {   
    obj.m_container.remove();
  }
}
