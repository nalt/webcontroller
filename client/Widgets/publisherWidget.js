/**
 *  @file publisherWidget.js contains the source code of the publisherWidget
 *  @author Martin Freundl <martinfreundl@web.de>
 */

widgetList.push("publisherWidget");


  /**
   *  Creates an instance of the publisherWidget
   *  @extends widgetBase
   *  @constructor
   *  @param {Object} config - object with following keys:
   *   * type - the type of the widget
   *   * pos - the position of the screen where to display the widget
   *   * size - the height and width of the widget (if not set, default is 300x300)
   *   * content - the widget's contentObject that has been saved from a previous session (if not set, the widget is empty)
   */
function publisherWidgetObject(config)
{
  widgetBase.apply(this, [config]);
  var that = this;

  this.title = "Topics";
  this.description = "Publish ROS Topics";


  that.myDiv.droppable({
      accept:'#menuTopic li',
      drop:handleDropPublisherWidget,
      hoverClass:'hovered'
    });
  
  /**
   * a list of the currently displayed topics in the widget
   * @type {topicObject[]}
   */  
  var listOfTopicObjects = new Object();
  that.contentObject.items = new Array();
  that.contentObject.options = {};
  that.contentObject.options.toggle_publish = 0;
  

  /** this is the top dialog of every publisherWidget where you can create your own topic to publish */ 
  var row = $('<tr></tr>')
            .appendTo($("<table style='width:100%; table-layout:fixed; background:#cccccc;'></table>").appendTo($("<div class='view0'></div>").appendTo(that.contentDiv)));
  
  /** this points to the input field of the name of the topic you create your own */          
  var pubOwnName = $("<input title='topicName' type='text' placeholder='[topicName]'></input>")
                   .change(function(){$(this).css("background", $(this).val() == "" ? "red" : "green")})
                   .click(function(){$(this).focus();})
                   .appendTo($("<td></td>").appendTo(row))
                   .tooltip();
                   
  /** this points to the input field of the type of the topic you create your own */                 
  var pubOwnType = $("<input title='topicType' type='text' placeholder='[topicType]'></input>")
                   .change(function(){checkForCorrectTopicType(this);})
                   .click(function(){$(this).focus();})
                   .appendTo($("<td></td>").appendTo(row))
                   .tooltip();
            
            //here we append the create button to the top row and connect it to an event handler       
            $("<button class='fa fa-plus-circle' title='Add publisher' />")
            .click(createOwnTopic)
            .appendTo($("<td></td>").appendTo(row));
  
  //$('input').bind('click', function(){
    //$(this).focus();
  //});
  
  //loading the widget's content of a previous session if there was one
  loadMe(config.content);
  
  /**
   * cleanMeUp() is called by the main application when removing the widget.
   * it was implemented to tidy up possible instances of objects to avoid memory leaks.
   * @method
   */
  this.cleanMeUp = function()
  {
    //write code to tidy things of this widget up before deleting its div
    $.each(listOfTopicObjects, function(key, value){
      handleRemoveButtonPress(value);
    });
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
    if(content)
    {
      that.contentObject.options = content.options;
      $.each(content.items, function(key, value){
        insertItem(value);
      });
      window.setTimeout(function(){$.each(that.myDiv.find(".publishToggle"), function(key, val){$(val).toggle();});}, 1000);
    }
  }
  
  /**
   * this is the event handler of the create button in the create own widget section
   * if there is entered a name and a valid topic type, insertItem() will be called with the given arguments
   * @method 
   */  
  function createOwnTopic()
  {
    if(pubOwnType.data('flag') == false || pubOwnName.val() == "")
    {
      return;
    }
    var name = pubOwnName.val();
    var type = pubOwnType.val();
    
    pubOwnName.val("").css("background", "white");
    pubOwnType.val("").css("background", "white");
    
    that.getMessageDetailsByTopicType(that.myRosHandle, type, function(details) {  //callback wird aufgerufen falls topicType existiert
      insertItem({"string":name, "type":type});
    });
  }
  
  /**
   * this is the event handler of the type input field in the creatw own topic section of the widget.
   * it checks if the type is valid and appends a corresponding flag to the field's object.
   * now the event handler of the check button can find out if he should process the event or not because of a wrong type
   * @param {Object} inputField - the jQueryUI object of the input field to check for correct type (== pubOwnType)
   * @method
   */
  function checkForCorrectTopicType(inputField)
  {
    var input = $(inputField);
    input.css("background", "red");
    input.data("flag", false);
    that.getMessageDetailsByTopicType(that.myRosHandle, input.val(), function(details) {
      input.css("background", "green");
      input.data("flag", true);
    });
  }
  
  /**
   * this is the event handler of the drop event of the widget's view.
   * it finds out the name of the dropped topic and triggers insertItem()
   * @param {Object} event - contains infos about the event
   * @param {Object} ui - the jQueryUI object that was dropped into the widget and which is needed to find out the topic's name.
   * @method
   */
  function handleDropPublisherWidget( event, ui )
  { 
    that.getTopicTypeByTopicString(that.myRosHandle, ui.draggable.data('value'), function(topicType){
      insertItem({"string":ui.draggable.data('value'), "type":topicType});
    });
  }
  
  
  
  /**
   * creates an instance of topicObject - the helper object for every entry of the publisherWidget
   * @constructor
   * @classdesc this class represents the view of every topic of the widget.
   * it stores important elements of the view like the message details in order to create the tree view and information about the settings in the view like publish rate, values and so on.
   * @param {string} topicString - the name of the topic this object is created for
   * @param {string} topicType - the type of the topic this object is created for
   */
  function topicObject(content)
  {
    var currentObj = this;
    this.m_active = 0;
    /** the pointer to the topicObject's view */
    this.m_container = $("<div></div>");
    /** this object contains important information of the view that has to be saved in order to restore everything later on.
    this is also the place where the topicObject stores that information for the methods that deal with topicObjects and need to access some information */
    this.m_valuesToSave = new Object({"string":content.string,
                                    "type":content.type,
                                    "rate":(content.rate ? content.rate : 0),
                                    "checked":(content.checked ? content.checked : false),
                                    "alias":(content.alias ? content.alias : ""),
                                    "valueObj":(content.valueObj ? content.valueObj : new Object())});
  /**
   * this method sets up the view of this topicObject with the help of additional information to the specific topic obtained above
   * it connects the event handlers to the actuators.
   * @method
   */
    this.m_createMe = function()
    {
      //create the table that contains two rows for controlling and the topic
      var table = $("<table style='width:100%; background:#aaaaaa; table-layout:fixed; border: 1px solid black;'></table>").appendTo(currentObj.m_container);
      var topRow = $("<tr></tr>").appendTo(table);
      var botRow = $("<tr class='publishToggle'></tr>").appendTo(table);
      
      currentObj.m_aliasField = $("<input style='width:100%;font:10px arial;' type='text' placeholder='[alias]'></input>")
                                .change(function()
                                  {
                                    currentObj.m_valuesToSave.alias = $(this).val();
                                    $(currentObj.m_pubbutton[1]).html(currentObj.m_valuesToSave.alias);
                                  })
                                .val(currentObj.m_valuesToSave.alias).click(function(){$(this).focus();})

                                .appendTo($("<td class='view0'></td>").appendTo(topRow));
      
      currentObj.m_pubRateField = $("<span></span>")
                                  .html(currentObj.m_valuesToSave.rate)
                                  .appendTo($("<td class='view0'><span>f[Hz]: </span></td>").appendTo(topRow));
      
                                  $("<td class='view0'>"+content.string+"</td>")
                                  .appendTo(topRow)
                                  .click(function(){botRow.toggle();});
      
      var btn = $("<td></td>").appendTo(topRow);        
      currentObj.m_pubbutton   = $("<button class='fa fa-play view0' title='send' />"+
                                   "<button id='alias' class='view1' title='Publish to "+ currentObj.m_valuesToSave.string + "'>"+currentObj.m_valuesToSave.alias+"</button>")
                                  .mouseup(function(){handlePubClick(0, currentObj, this);})
                                  .mousedown(function(){handlePubClick(1, currentObj, this);})
                                  .appendTo(btn);
      
                               $("<button class='fa fa-times-circle view0' title='remove' />")
                                  .click(function(){handleRemoveButtonPress(currentObj);})
                                  .appendTo(btn);
    
      currentObj.m_content = $("<td class='view0' colspan='4'></td>").appendTo(botRow);

      currentObj.m_slider = $("<div></div>")
                            .slider({value: currentObj.m_valuesToSave.rate})
                            .slider({step: 0.1})
                            .slider("option", "max", 20)
                            .slider("option", "min", 0)
                            .slider({slide: function( event, ui ){currentObj.m_pubRateField.html(ui.value); currentObj.m_valuesToSave.rate = ui.value;}})
                            .appendTo(currentObj.m_content);
      
      var rootNode = $("<li></li>").appendTo($("<ul></ul>").appendTo(currentObj.m_content));
      
                     $("<a>"+content.string+"</a>").appendTo(rootNode)
                     .click(function(){$($(this).context.nextSibling).slideToggle()});
      
      var childList = $("<ul></ul>").appendTo(rootNode);
      
      createTreeView(currentObj, childList, (content ? content.valueObj : undefined));
      
    
    }
  }
  
  

  /**
   * insertItem() takes the name and type of the topic and maybe some additional information especially if insertItem() has been called by the loadMe() method.
   * all the information is stored in an object (content). The method creates a topicObject and displays its view in the widget's view.
   * furthermore the topicObject gets stored in the listOfTopicObjects and the m_valuesToSave object of the topicObject gets stored into the content object.
   * the call of topicObject.m_createMe() creates the helper object's view and appends it to the widget's view.
   * an RosTopicInstance is obtained and appended to the topicObject in order to be able to publish the topic.
   * @param {Object} content - object with the following keys:
   *                    *string (required) - name of the topic
   *                    *type (required) - type of the topic
   *                    *rate (maybe from previous save) - the publishing rate
   *                    *checked (maybe from previous save) - if the entry was checked (publishing was activated) when stored
   *                    *alias (maybe from previous save) - the nickname of the topic entry in the widget
   *                    *valueObj (maybe from previous save) - the values of the topic entry's input fields
   * @method
   */  
  function insertItem(content)
  {
      var myTopic = new topicObject(content);
      
      that.getRosTopicInstance(that.myRosHandle, content.string, content.type, function(rosTopicInstance){
        myTopic.m_rosTopic = rosTopicInstance;
        myTopic.m_createMe();
        myTopic.m_container.appendTo(that.contentDiv);
        listOfTopicObjects[content.string] = myTopic;
        that.contentObject.items.push(myTopic.m_valuesToSave)
      });
  }
  
  /**
   * the event handler of the remove button of the topicObjects view.
   * it removes the topicObject from both arrays listOfTopicObjects and its valuesToSave from contentObject.items
   * it also stops the subscription of the aTopic object before deleting
   * then it removes the topicObject's view from the widget's view.
   * if publishing was active, it will be stopped.
   * the RosTopicInstance is also going to be deleted.
   * @param {topicObject} obj - the desired topicObject object to remove.
   * @method
   */
  function handleRemoveButtonPress(obj)
  {
    /*if(obj.m_checkbox.prop('checked'))   stopPublish(obj); */
    if(obj.m_rosTopic)
    {
        stopPublish(obj); // TODO: check if publishing
        delete obj.m_rosTopic;
    }
    
    delete listOfTopicObjects[obj.m_valuesToSave.string];
    obj.m_container.remove();
    
    that.contentObject.items = [];
    for(prop in listOfTopicObjects)
    {
      that.contentObject.items.push(listOfTopicObjects[prop].m_valuesToSave);	
    }
  }
  
  /**
   * this is the event handler when changing a check box.
   * if unchecked, publishing will be stopped.
   * if checked, publishing will be started.
   * if checked and slider points to a rate of 0, publishOnce() will be triggered.
   * @param {topicObject} myTopic - the topicObject of which the check box was changed.
   * @method 
   */
  function handlePubClick(active, myTopic, button)
  {
    var tog = parseInt(that.contentObject.options.toggle_publish);
    if(active) {
      getValues(myTopic);
      if (myTopic.m_pubRateField.html() == 0) {
        publishOnce(myTopic);
        //myTopic.m_checkbox.click();
      } else if (!myTopic.m_rosTopic.m_active) {
        startPublish(myTopic);
        if (tog) $(button).addClass("active");
      } else if (myTopic.m_rosTopic.m_active) {
        stopPublish(myTopic);
        if (tog) $(button).removeClass("active");
      }
    }
    else if (!tog) // Button released
    {
      stopPublish(myTopic);
    }
  }
  
  /**
   * this method does the required steps to publish the topic only once.
   * @param {topicObject} obj - the topicObject which to publish
   * @method 
   */
  function publishOnce(obj)
  {
    obj.m_rosTopic.advertise();
    obj.m_rosTopic.publish(obj.valueObj);
    obj.m_rosTopic.unadvertise();
    obj.m_rosTopic.m_active = false;
  }
  
  /**
   * this method does the required steps to stop publishing of a topic.
   * therefore it clears the timer of the topicObject which has been set in startPublish() and unadvertises the RosTopicInstance.
   * @param {topicObject} obj - the topicObject which to stop publishing.
   * @method 
   */
  function stopPublish(obj)
  {
    clearInterval(obj.timer);
    obj.m_rosTopic.unadvertise();
    obj.m_rosTopic.m_active = false;
  }
  
  /**
   * this method does the required steps to start publishing of a topic.
   * it advertises the RosTopicInstance of the topicObject and sets a timer depending on the rate of the slider.
   * @param {topicObject} obj - the topicObject which to stop publishing.
   * @method 
   */
  function startPublish(obj)
  {
    obj.m_rosTopic.advertise();
    obj.m_rosTopic.publish(obj.valueObj);
    obj.timer = window.setInterval(function() {obj.m_rosTopic.publish(obj.valueObj);}, 1000/obj.m_pubRateField.html());
    obj.m_rosTopic.m_active = true;
  }
  
  /**
   * this method calls a recursive method in order to get the values of the topicObject's input fields and appends these values to the topicObject.
   * the values of this appended object will be published later on. so it is necessary to call getValues first before start publishing.
   * @param {topicObject} topObj - the topicObject where to update the values of the input fields in order to be able to publish them.
   * @method
   */
  function getValues(topObj)
  {
    topObj.valueObj = new Object();
    topObj.m_valuesToSave.valueObj = topObj.valueObj;
    recursion(topObj, topObj.valueObj);
    console.log(topObj.valueObj);
  }
  
  /**
   * this recursive method loops through all the possible input fields of the topicObject's view and stores their values to an object (valueObj)
   * @param {topicObject} topObj - the desired topicObject
   * @param {Object} valueObj - the object where to store the values of the input fields.
   * @method
   */
  function recursion(topObj, valueObj)
  {
    for(var i = 0; i < topObj.m_messageDetails.fieldnames.length; ++i)
    {
      if(that.fieldTypes[topObj.m_messageDetails.fieldtypes[i]] !== undefined && topObj[topObj.m_messageDetails.fieldnames[i]].val() == "")
      {
        valueObj[topObj.m_messageDetails.fieldnames[i]] = undefined;
      }
      else
      {
        if(that.fieldTypes[topObj.m_messageDetails.fieldtypes[i]])
        {
          if(topObj.m_messageDetails.fieldarraylen[i] == 0)
          {
            var arr = new Array();
            var string = topObj[topObj.m_messageDetails.fieldnames[i]].val();
            string = string.slice(1, string.length);
            string = string.slice(0, string.length -1);
            arr = string.split(',');
              for(var prop in arr)
              {
                arr[prop] = $.isNumeric(arr[prop]) ? parseFloat(arr[prop]) : arr[prop];
              }
            valueObj[topObj.m_messageDetails.fieldnames[i]] = arr;
          }
          else
          {
            valueObj[topObj.m_messageDetails.fieldnames[i]] = $.isNumeric(topObj[topObj.m_messageDetails.fieldnames[i]].val()) ? parseFloat(topObj[topObj.m_messageDetails.fieldnames[i]].val()) : topObj[topObj.m_messageDetails.fieldnames[i]].val();
          }
        }
        else if(topObj.m_messageDetails.fieldtypes[i] == "time")
        {
          valueObj[topObj.m_messageDetails.fieldnames[i]] = {"nsecs":0,"secs": parseInt(new Date().getTime()/1000)}
          //valueObj[topObj.m_messageDetails.fieldnames[i]] = {"nsecs":parseFloat(topObj[topObj.m_messageDetails.fieldnames[i]].nsecs[0].children[0].children[0].value), "secs":parseFloat(topObj[topObj.m_messageDetails.fieldnames[i]].secs[0].children[0].children[0].value)};
        }
        else if(that.fieldTypes[topObj.m_messageDetails.fieldtypes[i]] === undefined)
        {
          valueObj[topObj.m_messageDetails.fieldnames[i]] = new Object();
          recursion(topObj[topObj.m_messageDetails.fieldnames[i]], valueObj[topObj.m_messageDetails.fieldnames[i]]);
        }
      }
    }
  }
  
  /**
   * this method checks the given inputField if the entered data type is correct.
   * if correct, background gets green.
   * if not correct, background gets red.
   * @param {Object} inputField - the jQueryUI object of the inputField to check.
   * @method
   */
  function checkForCorrectType(inputField)
  {
    var input = $(inputField);
    var rightType = input.data('type');
    if(rightType.charAt(rightType.length - 1) == ']')
    {
      rightType = rightType.slice(0, rightType.length - 2);
      var arr = new Array();
      var string = input.val();
      string = string.slice(1, string.length);
      string = string.slice(0, string.length - 1);
      arr = string.split(',');
      for(var i = 0; i < arr.length; ++i)
      {
        if($.isNumeric(arr[i]) && rightType != "string")
        {
          input.css("background", "green");
        }
        else if(!$.isNumeric(arr[i]) && rightType == "string")
        {
          input.css("background", "green");
        }
        else
        {
          input.css("background", "red");
          break;
        }
      }
    }
    else
    {
      if($.isNumeric(input.val()) && rightType != "string")
      {
        input.css("background", "green");
      }
      else if(!$.isNumeric(input.val()) && rightType == "string")
      {
        input.css("background", "green");
      }
      else
      {
        input.css("background", "red");
      }
    }
  }
  
  /**
   * this recursive method creates the treeView of the topicObject by analyzing its message details.
   * the pointers to the input fields in the treeView are appended to the  topicObject, so that the values can be read later on from the fields when calling getValues()
   * @param {topicObject} topicObj - the  topicObject of which the treeView has to be generated
   * @param {Object} parent - the DOM element where the current branch has to be appended
   * @param {Object} savedValues - (optional) the object from a previous store that contains the saved values
   * @method
   */
  function createTreeView(topicObj, parent, savedValues)
  {
    that.getMessageDetailsByTopicType(that.myRosHandle, topicObj.m_valuesToSave.type, function(mesdtls){
      
      topicObj.m_messageDetails = mesdtls;
      
      for(var i = 0; i < mesdtls.fieldnames.length; ++i)
      {
        var lst = $("<li></li>").appendTo(parent);
        
        var a = $("<a>"+mesdtls.fieldnames[i]+" ["+mesdtls.fieldtypes[i]+(mesdtls.fieldarraylen[i] == 0 ? '[]' : '')+"]: </a>")
                .click(function(){$($(this).context.nextSibling).slideToggle()})
                .appendTo(lst);
                
        var currentType = mesdtls.fieldarraylen[i] == 0 ? mesdtls.fieldtypes[i]+"[]" : mesdtls.fieldtypes[i];
        
        var input = $("<input type='text' style='width:100%;background:gray; font:10px arial;'></input>")
                  .attr('title', mesdtls.fieldtypes[i]+(mesdtls.fieldarraylen[i] == 0 ? '[]' : ''))
                  .val(mesdtls.fieldarraylen[i] == 0 ?  (savedValues ? "["+savedValues[mesdtls.fieldnames[i]] : "[")+"]" : (savedValues ? savedValues[mesdtls.fieldnames[i]] : ""))
                  .appendTo(a)
                  .click(function(){$(this).focus();})
                  .change(function(){checkForCorrectType(this);})
                  .tooltip().data('type', currentType);
                  
        topicObj[mesdtls.fieldnames[i]] = input;  //pointer auf input elemente werden dem topicObj hinzugefügt um bei refreshValues die inputs zu manipulieren
        
        if(mesdtls.fieldtypes[i] == "time")
        {
          input.remove();
          var obj = new Object(); //ausnahmebehandlung falls type time, da hier die messagedetails nicht mit den feldern der message übereinstimmen nsecs <-> nsec
          var list = $("<ul></ul>").appendTo(lst);
          obj.nsecs = $("<li><a>nsecs: <input type='text' value='"+(savedValues ? savedValues[mesdtls.fieldnames[i]].nsecs : '')+"' style='width:100%;background:gray; font:10px arial;'></a></li>").appendTo(list);
          obj.secs = $("<li><a>secs: <input type='text' value='"+(savedValues ? savedValues[mesdtls.fieldnames[i]].secs : '')+"' style='width:100%;background:gray; font:10px arial;'></span></a></li>").appendTo(list);
          topicObj[mesdtls.fieldnames[i]] = obj;
        }
        else if(that.fieldTypes[mesdtls.fieldtypes[i]] === undefined)  //fieldTypes ist undefined falls mesdtls.fieldtypes[i] nicht mit den einträgen in fieldTypes matcht
        {
          input.remove();
          var obj = new Object({"m_valuesToSave":{"type":mesdtls.fieldtypes[i]}});  //creating an helper object for recursion
          topicObj[mesdtls.fieldnames[i]] = obj;
          createTreeView(obj, $("<ul></ul>").appendTo(lst), (savedValues ? savedValues[mesdtls.fieldnames[i]] : undefined ));
        }
        else
        {
        }
      }
    });
  }   
}
