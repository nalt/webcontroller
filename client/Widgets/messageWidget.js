/**
 *  @file topicWidget.js contains the source code of the topicWidget
 *  @author Martin Freundl <martinfreundl@web.de>
 */

widgetList.push("messageWidget");

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
function messageWidgetObject(config)
{
  widgetBase.apply(this, [config]);
  var that = this;

  this.title = "Messages";
  this.description = "Show ROS messages";

  this.myDiv.droppable({
      accept:'#menuTopic li',
      drop:handleDropTopicWidget,
      hoverClass:'hovered'
    })
   
  
  var listOfTopicObjects = new Object();
  that.contentObject.items = new Array();
  that.contentObject.options = new Object({"formatString":"%.2f"});
  loadMe(config.content);
  
  /**
   * cleanMeUp() is called by the main application when removing the widget.
   * it was implemented to tidy up possible instances of objects to avoid memory leaks.
   * @method
   */
  this.cleanMeUp = function()
  {
    //write code to tidy things of this widget up before deleting its div
    console.log("done");
    $.each(listOfTopicObjects, function(key, value){
      handleRemoveButtonPress(value);
    });
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
    if(!content)
    {
      return;
    }
    that.contentObject.options = content.options;
    var i = 0;
    next();
    
    function next()
    {
      if(!content.items[i])
      {
        return;
      }
      insertItems(content.items[i], function(){i = i + 1; next();});
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
    that.getTopicTypeByTopicString(that.myRosHandle, topicString, function(topicType){
      var myTopic = new aTopic(topicString, topicType);
      myTopic.m_createMe();
      window.setTimeout(function(){myTopic.m_startSubscribe(function(){cb_inserted();});}, 100);  //warten bis object aufgebaut wurde
      listOfTopicObjects[topicString] = myTopic;
      
      that.contentObject.items = [];
      for(prop in listOfTopicObjects)
      {
        that.contentObject.items.push(prop);
      }
      
    });
  }
  
  
  /**
   * this is the event handler of the drop event of the widget's view.
   * it finds out the name of the dropped topic and triggers insertItems()
   * @param {Object} event - contains infos about the event
   * @param {Object} ui - the jQueryUI object that was dropped into the widget and which is needed to find out the topic's name.
   * @method
   */
  function handleDropTopicWidget( event, ui )
  { 
    var draggable = ui.draggable;
      if(listOfTopicObjects[draggable.data('value')])
      {
        return;
      }
      insertItems(draggable.data('value'), function(){});
  }
  

  /**
   * creates an instance of aTopic object - the helper object for every entry of the topicWidget
   * @constructor
   * @classdesc this class represents the view of every topic of the widget.
   * it stores important elements of the view like the message details in order to create the tree view and get out the values of the message objects that we receive during subscription
   * @param {string} topicString - the name of the topic this object is created for
   * @param {string} topicType - the type of the topic this object is created for
   */
  function aTopic(topicString, topicType)
  {
    var currentObj = this;
    /** the name of the topic */
    this.m_topicString = topicString;
    /** the type of the topic */
    this.m_topicType = topicType;
    /** the view of this topic, appended to the widget's view */
    this.m_container = $("<div style='clear:both;'></div>").appendTo(that.contentDiv);
    /**
     * this method sets up the view of this aTopic object with the help of additional information to the specific topic obtained above
     * it connects the event handlers to the buttons.
     * @method
     */
    this.m_createMe = function()
    {
      var rootNode = $("<li></li>").appendTo($("<ul></ul>").appendTo(this.m_container));
      $("<a>"+this.m_topicString+"</a>").appendTo(rootNode).click(function(){$($(this).context.nextSibling).slideToggle()});
      $("<button class='fa fa-eye-slash' style='float: right' title='remove'/>").prependTo(rootNode).click(function(){handleRemoveButtonPress(currentObj);});
      var childList = $("<ul></ul>").appendTo(rootNode);
      createTreeView(currentObj, childList);
      console.log(currentObj);
    }
    /**
     * this method is called when the aTopic object should start subscribing to its corresponding topic on the ROS system
     * @param {callback} callback - a callback indicates that the aTopic object is subscribed now
     */
    this.m_startSubscribe = function(callback)
    {
      var currentObj = this;
      subscribeMe(this, function(){callback();});
    }
    
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
    obj.rosTopic.unsubscribe();
    delete obj.rosTopic;
    delete listOfTopicObjects[obj.m_topicString];
    
    that.contentObject.items = [];
    for(prop in listOfTopicObjects)
    {
      that.contentObject.items.push(prop);
    }
    
    obj.m_container.remove();
  }
  
  /**
   * this method finally uses ROSLIBJS to subscribe the aTopic object to its topic on the ROS System.
   * therefore a rosTopicInstance is created and appended to the aTopic object so that the subscription can be made undone when removing the aTopic object later on
   * everytime a message arrives, refreshValues() will be called to extract the values of the message and set them into the tree view of the aTopic's view.
   * @param {aTopic} topicObj - the desired aTopic object that should subscribe to its topic
   * @param {callback} callback - the subscription is signalled by a callback
   * @method
   */
  function subscribeMe(topicObj, callback)
  {
    that.getRosTopicInstance(that.myRosHandle, topicObj.m_topicString, topicObj.m_topicType, function(myTopic){
      topicObj.rosTopic = myTopic;
      callback();
      myTopic.subscribe(function(message){
        refreshValues(topicObj, message);
      });  
    });
    

  }
  
  
  
  /**
   * this recursive ethod is used to loop through the message object, we receive on every new message, in order to get out the values.
   * then those values are written into the treeView of the aTopics view.
   * this could be done very easily because all the place holders for the values in the view have been appended to the aTopic object during creation of the view.
   * so the placeholders can be addressed from the aTopic object.
   * @param {aTopic} topicObj - the aTopic object of which the treeView must be updated
   * @message {Object} message - the message object obtained whenever a new message on our topic arrives.
   * @method
   */
  function refreshValues(topicObj, message)
  {
    for(var i = 0; i < topicObj.m_messageDetails.fieldnames.length; ++i)
    {
      if(topicObj.m_messageDetails.fieldtypes[i] == "time")
      {
        topicObj[topicObj.m_messageDetails.fieldnames[i]].nsecs[0].children[0].children[0].innerHTML = message[topicObj.m_messageDetails.fieldnames[i]].nsecs;
        topicObj[topicObj.m_messageDetails.fieldnames[i]].secs[0].children[0].children[0].innerHTML = message[topicObj.m_messageDetails.fieldnames[i]].secs;
      }
      else if(that.fieldTypes[topicObj.m_messageDetails.fieldtypes[i]] === undefined)
      {
        refreshValues(topicObj[topicObj.m_messageDetails.fieldnames[i]], message[topicObj.m_messageDetails.fieldnames[i]]);
      }
      else
      {
        var value = "";
        if(topicObj.m_messageDetails.fieldarraylen[i] == 0 && message[topicObj.m_messageDetails.fieldnames[i]].length)
        {
          value += "["
          for(var prop in message[topicObj.m_messageDetails.fieldnames[i]])
          {
            value += message[topicObj.m_messageDetails.fieldnames[i]][prop] + ", ";
          }
          value = value.slice(0, value.length - 2) + "]";
        }
        else
        {
          if($.isNumeric(message[topicObj.m_messageDetails.fieldnames[i]]))
          {
            value = sprintf(that.contentObject.options.formatString ? that.contentObject.options.formatString : "%.2f", message[topicObj.m_messageDetails.fieldnames[i]]);
          }
          else
          {
            value = message[topicObj.m_messageDetails.fieldnames[i]];
          }
        } 
        topicObj[topicObj.m_messageDetails.fieldnames[i]].html(value);
      }
    }
  }
  
  
  /**
   * this recursive method creates the treeView of the aTopic object by analyzing its message details.
   * the placeholders for the values in the treeView are appended to the aTopic object, so that the values can be set later on when calling refreshValues()
   * @param {aTopic} topicObj - the aTopic object of which the treeView has to be generated
   * @param {Object} parent - the DOM element where the current branch has to be appended
   * @method
   */
  function createTreeView(topicObj, parent)
  {
    that.getMessageDetailsByTopicType(that.myRosHandle, topicObj.m_topicType, function(mesdtls){
      topicObj.m_messageDetails = mesdtls;
      for(var i = 0; i < mesdtls.fieldnames.length; ++i)
      {
        //console.log(mesdtls.fieldnames[i]+" ["+mesdtls.fieldtypes[i]+"]");
        var lst = $("<li></li>").appendTo(parent);
        var type =  "["+mesdtls.fieldtypes[i] + ( mesdtls.fieldarraylen[i] == 0 ? "[]" : "" ) + "]";
        var a = $("<a title="+type+">"+mesdtls.fieldnames[i]+": </a>").appendTo(lst).click(function(){$($(this).context.nextSibling).slideToggle()});;
        var span = $("<span style='background:#aaaaaa;'></span>").appendTo(a);
        topicObj[mesdtls.fieldnames[i]] = span;  //pointer auf span elemente werden dem topicObj hinzugefügt um bei refreshValues die spans zu manipulieren
        if(mesdtls.fieldtypes[i] == "time")
        {
          var obj = new Object();   //ausnahmebehandlung falls type time, da hier die messagedetails nicht mit den feldern der message übereinstimmen nsecs <-> nsec
          var list = $("<ul></ul>").appendTo(lst);
          obj.nsecs = $("<li><a>nsecs: <span style='background:#aaaaaa;'></span></a></li>").appendTo(list);
          obj.secs = $("<li><a>secs: <span style='background:#aaaaaa;'></span></a></li>").appendTo(list);
          topicObj[mesdtls.fieldnames[i]] = obj;
        }
        else if(that.fieldTypes[mesdtls.fieldtypes[i]] === undefined)  //fieldTypes ist undefined falls mesdtls.fieldtypes[i] nicht mit den einträgen in fieldTypes matcht
        {
          var obj = new aTopic(topicObj.m_topicString, topicObj.m_topicType);
          topicObj[mesdtls.fieldnames[i]] = obj;
          obj.m_topicType = mesdtls.fieldtypes[i]
          createTreeView(obj, $("<ul></ul>").appendTo(lst));
        }
        else
        {
        }
      }
    });
  }
}
