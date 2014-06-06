/**
 *  @file topicWidget.js contains the source code of the plotWidget
 *  @author Martin Freundl <martinfreundl@web.de>
 */

widgetList.push("plotWidget");

  /**
   *  Creates an instance of the plotWidget
   *  @extends widgetBase
   *  @constructor
   *  @param {Object} config - object with following keys:
   *   * type - the type of the widget
   *   * pos - the position of the screen where to display the widget
   *   * size - the height and width of the widget (if not set, default is 300x300)
   *   * content - the widget's contentObject that has been saved from a previous session (if not set, the widget is empty)
   */
function plotWidgetObject(config)
{
  widgetBase.apply(this, [config]);
  var that = this;

  this.title = "Topics";
  this.description = "Plot ROS Topics";


  that.myDiv.droppable({
      accept:'#menuTopic li',
      drop:handleDropPlotWidget,
      hoverClass:'hovered'
    });
  
  /** the container for the plotting library flot */
  var flotDiv = $('<div style="width:100%;height:85%;"></div>').appendTo(that.contentDiv);
  /** the container for the check boxes to activate or deactivate certain fields of a topic) */
  var choicesDiv = $('<div style="width:100%;"></div>').appendTo(that.contentDiv);
  /** the pointer for the rosTopicInstance */
  var rostopicObject;
  /** the pointer to the instance of flot - the plotting library */
  var plot = $.plot(flotDiv, [[[0,0]]]);
  
  //a reference of the plots option object is given to the widget's contentObject in order to be able to save the options
  that.contentObject.options = plot.getOptions();
  //hiding the plot's legend by default
  that.contentObject.options.legend.show = false;
  
  //loading the save of a previous session if there exists one
  loadMe(config.content);  
  
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
    if(content.options)
    {
      //the properties have to be copied one by one because copying the reference of the content.options object will overwrite the reference of the option object
      //of the plot which was set in the constructor.
      //so changing the values later on using the set button in the widget's top right corner which in turn uses that.contentObject.options would not have any effect on the plot
      //because the reference would no longer be correct.
      for(prop in content.options)
      {
        that.contentObject.options[prop] = content.options[prop];
      }
    }
    if(content.topicString)
    {
      insertItem(content);
    }
  }

  /**
   * cleanMeUp() is called by the main application when removing the widget.
   * it was implemented to tidy up possible instances of objects used by this widget to avoid memory leaks.
   * @method
   */
  this.cleanMeUp = function()
  {

    if(rostopicObject)
    {
      rostopicObject.unsubscribe();
      //write code to tidy things of this widget up before deleting its div
      console.log("done");
    }
    that.myRosHandle.close();
  }
  
  /**
   * this is the event handler of the drop event of the widget's view.
   * it finds out the name of the dropped topic and triggers insertItem()
   * @param {Object} event - contains infos about the event
   * @param {Object} ui - the jQueryUI object that was dropped into the widget and which is needed to find out the topic's name.
   * @method
   */
  function handleDropPlotWidget( event, ui )
  {
    if(that.contentObject.topicString != ui.draggable.data('value'))
    {
      insertItem({"topicString" : ui.draggable.data('value')});
    }
    
  }
  
  /**
   * this method is the core of the plotWidget.
   * it subscribes to the topic, buffers the values in arrays with the corresponding passed time since start and creates the view where you can activate or deactivate certain fields
   * of the topic in the plot
   * the arrays get shifted so that there are max 200 entrys of time value pairs stored per field - this results in a dynamic plot.
   * @param {string} topic - the name of the topic
   * @method
   */
  function insertItem(topic)
  {
    //flotDiv.empty();
    choicesDiv.empty();
    //that.contentObject = {};
    if(rostopicObject)
    {
      rostopicObject.unsubscribe();
    }
    
    //plot = $.plot(flotDiv, [[[0,0]]]);
  
    var start = new Date().getTime();
    var dataSetsArray = new Array();
    var data = new Array();
  
    /**
     * this method cares about the displaying of the available fields of the topic in the plot
     * when a field is unchecked, its array will not be passed to flot - the plotting library.
     * furthermore the contentObject will be updated as soon as a check box is changed so that the change will be stored during the next save process
     * @method
     */
    function handleCheckBoxClick()
    {
      data = [];
      $.each(that.contentObject.checked, function(key, value){
        that.contentObject.checked[key] = false;
      });
      $.each($(that.myDiv).find("input:checked"), function() {
        var key = $(this).attr("name");
        if(key && dataSetsArray[key])
        {
          data.push(dataSetsArray[key]);
          that.contentObject.checked[key] = true;
        }
      });
      console.log(that.contentObject.checked);
    }
    
    //getting additional information about the topic by contancting ROSLIBJS
    // TODO Recursive!
    that.getTopicTypeByTopicString(that.myRosHandle, topic.topicString, function(topicType){
      that.getMessageDetailsByTopicType(that.myRosHandle, topicType, function(messageDetails){
        
        //updating the contentObject so that the current topic name will get stored during the next save process
        that.contentObject.topicString = topic.topicString;
        that.contentObject.checked = new Array();
        
        //setting up the arrays for the fields, hierarchical field structures are not supported yet
        for(var i = 0; i < messageDetails.fieldtypes.length; ++i)
        {
            console.debug("type:"+ messageDetails.fieldtypes[i]);
          if(messageDetails.fieldtypes[i] == "int16" || messageDetails.fieldtypes[i] == "int32" || messageDetails.fieldtypes[i] == "int64" || messageDetails.fieldtypes[i] == "uint16" || messageDetails.fieldtypes[i] == "uint32" || messageDetails.fieldtypes[i] == "uint64" || messageDetails.fieldtypes[i] == "float32" || messageDetails.fieldtypes[i] == "float64" || messageDetails.fieldtypes[i] == "int8" || messageDetails.fieldtypes[i] == "uint8")
          //if(typeof messageDetails.fieldtypes[i] == "number")
          {
            dataSetsArray.push({"label" : messageDetails.fieldnames[i],
                                "data" : []
                                });
            that.contentObject.checked.push(false);
          }
        }
      
        //set up the check boxes
        var color = 0;
        $.each(dataSetsArray, function(key, vals) {
          vals.color = color;
          ++color;
          var box = $("<input type='checkbox' name='"+key+"' id='id"+key+"'>"+vals.label+"</input>").appendTo(choicesDiv);
          if(topic.checked)
          {
            if(topic.checked[key])
            {
              box.attr("checked", "checked");
            }
          }
          else
          {
            box.attr("checked", "checked");
          }
        });
    

        //connect the checkboxes with their event handler
        choicesDiv.find("input").click(handleCheckBoxClick);
      
	      
      
        //plot.getOptions().legend.show = false;
      
        //obtain an RosTopicInstance from ROSLIBJS in order to subscribe to the topic on the ROS system
        that.getRosTopicInstance(that.myRosHandle, topic.topicString, topicType, function(rostopicInstance){
          rostopicObject = rostopicInstance;
          //do subscribe

          rostopicObject.subscribe(function(message){

            //whenever a message arrives, the values are stored into the arrays next to the passed time when the values arrived
            var time = new Date().getTime() - start;
            
            var test = 0;
            for(var i = 0; i < messageDetails.fieldnames.length; ++i)
            {
              if(messageDetails.fieldtypes[i] == "int16" || messageDetails.fieldtypes[i] == "int32" || messageDetails.fieldtypes[i] == "int64" || messageDetails.fieldtypes[i] == "uint16" || messageDetails.fieldtypes[i] == "uint32" || messageDetails.fieldtypes[i] == "uint64" || messageDetails.fieldtypes[i] == "float32" || messageDetails.fieldtypes[i] == "float64" || messageDetails.fieldtypes[i] == "int8" || messageDetails.fieldtypes[i] == "uint8")
              {
                dataSetsArray[test].data.push([time, message[messageDetails.fieldnames[i]]]);
                test = test + 1;
              }
            }
            
            //console.log(dataSetsArray);
            //console.log(dataSetsArray[2].data);
            
            //keep the arrays max 200 entrys long
            for(var a = 0; a < dataSetsArray.length; ++a)
            {
              if(dataSetsArray[a].data.length > 200)
              {
                dataSetsArray[a].data.shift();
              }
            }
            
            //update the plot
            //data contains the arrays that are not deactivated by the checkboxes
            if(1)
            {
              plot.setData(data);
              plot.setupGrid();
              plot.draw();
            }

          });
        });


        //execute the checkboxes' eventhandler from start in order to set up the data object which is passed to the plot
        handleCheckBoxClick();
        
        console.log(messageDetails);
        console.log("-----------------------");
        for(var i = 0; i < messageDetails.fieldnames.length; ++i)
        {
          console.log(messageDetails.fieldnames[i]+" ["+messageDetails.fieldtypes[i]+"]");
        }
        console.log("-----------------------");
      });
    });
  }
}
