/**
 *  @file paramWidget.js contains the source code of the paramWidget
 *  @author Martin Freundl <martinfreundl@web.de>
 */

widgetList.push("paramWidget");

  /**
   *  Creates an instance of the paramWidget
   *  @extends widgetBase
   *  @constructor
   *  @param {Object} config - object with following keys:
   *   * type - the type of the widget (here paramWidget)
   *   * pos - the position of the screen where to display the widget
   *   * size - the height and width of the widget (if not set, default is 300x300)
   *   * content - the widget's contentObject that has been saved from a previous session (if not set, the widget is empty)
   */
  function paramWidgetObject(config)
  {
    widgetBase.apply(this, [config]);
    var that = this;
    
    this.title = "Parameters";
    this.description = "Get and set ROS parameters";
    
    // myDiv is inherited by widgetBase and represents the widget's view container.
    // here it is made droppable to accept elements of the param section of the menu bar.
    this.myDiv.droppable({
      accept:'#menuParam li',
      drop:handleDropParamWidget,
      hoverClass:'hovered'
    });
    
    
    
    
    
    /** this is the top dialog of every paramWidget where you can create a new parameter */ 
    var row = $('<tr></tr>')
              .appendTo($("<table style='width:100%; table-layout:fixed; background:#cccccc;'></table>")
              .appendTo($("<div class='view0'></div>").appendTo(that.contentDiv)));
    
    /** this points to the input field of the name of the parameter you create your own */          
    var paramOwnName = $("<input title='paramName' type='text' placeholder='[paramName]'></input>")
                     .change(function(){$(this).css("background", $(this).val() == "" ? "red" : "green")})
                     .click(function(){$(this).focus();})
                     .appendTo($("<td></td>").appendTo(row))
                     .tooltip();
                     
    var paramOwnValue = $("<input title='paramValue' type='text' placeholder='[paramValue]'></input>")
                 .change(function(){$(this).css("background", $(this).val() == "" ? "red" : "green")})
                 .click(function(){$(this).focus();})
                 .appendTo($("<td></td>").appendTo(row))
                 .tooltip();
    
    //here we append the create button to the top row and connect it to an event handler       
    $("<button class='fa fa-plus-circle' title='Add parameter' />")
    .click(function(){
      if(paramOwnName == "" || paramOwnValue == "")
      {
        return;
      }
      else
      {
        handleSetButtonPress({"m_parameterString":"/"+paramOwnName.val(), "m_inputField":$('<input style="width:100%;" type="text" value="">').val(paramOwnValue.val())});
        insertItems("/"+paramOwnName.val());
        refreshMenu();
        
      }
      paramOwnName.val("").css("background", "white");
      paramOwnValue.val("").css("background", "white");
    })
    .appendTo($("<td></td>").appendTo(row));
    
    /** the table which displays the dropped entries in the widget's view */
    var paramTable = $('<table class="pTable"></table>').appendTo(this.contentDiv);
    
    /**
     * a list of the currently displayed params in the widget
     * @type {parameterObject[]}
     */  
    var insertedElements = new Object();
    
    /**
     * a list of the names of the currently displayed params in the widget. this list is a property of the contentObject which is stored during a save process
     * @type {string[]}
     */  
    that.contentObject.items = new Array();
    
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
        $.each(content.items, function(key, value){
          insertItems(value);
        });
      }
    }
    
    /**
     * this is the event handler of the drop event of the widget's view.
     * it finds out the name of the dropped parameter and triggers insertItems()
     * @param {Object} event - contains infos about the event
     * @param {Object} ui - the jQueryUI object that was dropped into the widget and which is needed to find out the parameters name.
     * @method
     */
    function handleDropParamWidget( event, ui )
    {
      var draggable = ui.draggable;
        if(insertedElements[draggable.data('value')])
        {
          return;
        }
        insertItems(draggable.data('value'));
    }
    
    /**
     * insertItems() takes the name of the parameter, creates an object of parameterObject and displays its view in the widget's view table.
     * furthermore the parameterObject gets stored in the list of insertedElements and the name of the parameter gets stored into the content object.
     * the call of parameterObject.m_createMe() in the last line creates the helper object's view and appends it to the widget's view table.
     * @param {string} paraString - the name of the parameter to display
     * @method
     */    
    function insertItems(paraString)
    {
        var myParameter = new parameterObject(paraString);
        insertedElements[paraString] = myParameter;
        
        that.contentObject.items = [];
        for(prop in insertedElements)
        {
          that.contentObject.items.push(prop);
        }
        
        console.log(insertedElements);
        myParameter.m_createMe();
        
        paramTable.colResizable({'liveDrag':true});
    }
    

    
    

    /**
     * creates an instance of parameterObject - the helper object for every entry of the parameterWidget
     * @constructor
     * @classdesc this class represents the view of every parameter of the widget.
     * it stores important elements of the view like the input field that has to be accessed later on when manipulating a parameter for example.
     * @param {string} parameterString - the name of the parameter this object is created for
     */
    function parameterObject(parameterString)
    {
      /** stores the name of the parameter */
      this.m_parameterString = parameterString;
      /** stores the pointer to the input field of the view */
      this.m_inputField;
      //this.m_container = $("<tr></tr>").appendTo($('<table style="table-layout:fixed;width:100%;"></table>').appendTo(paramDiv));
      /** stores the pointer to the view of this parameterObject which is appended to the view table of the widget */
      this.m_container = $("<tr></tr>").appendTo(paramTable);
      /**
       * this method sets up the view of this parameterObject.
       * it gets the parameter's value by contacting the ROS system and connects the event handlers to the buttons.
       * @method
       */
      this.m_createMe = function()
      {
        var currentObj = this;
        
        $('<td>'+this.m_parameterString+'</td>').appendTo(this.m_container);
        
        this.m_inputField = $('<input style="width:100%;" type="text" value="">').click(function(){$(this).focus();});
        that.getParamValueByString(that.myRosHandle, this.m_parameterString, function(result){
          currentObj.m_inputField[0].value = result;
        });
        this.m_inputField.appendTo($('<td></td>').appendTo(this.m_container));
        
        var dom_btn = $("<td></td>").appendTo(this.m_container);
        
        $("<button class='fa fa-check' title='set' />").click(function() {handleSetButtonPress(currentObj);}).appendTo(dom_btn)//.css('float', 'right');
        $("<button class='fa fa-times-circle' title='delete'>").click(function() {handleDeleteButtonPress(currentObj);}).appendTo(dom_btn)//.css('float', 'right');
        $("<button class='fa fa-eye-slash'  title='hide'>").click(function() {handleRemoveButtonPress(currentObj)}).appendTo(dom_btn)//.css('float', 'right');
      }
      
    }
    

    /**
     * the event handler of the remove button.
     * it removes the parameterObject from both arrays insertedElements and contentObject.items
     * then it removes the parameterObject's view from the widget's view table.
     * @param {parameterObject} paraObj - the desired parameterObject to remove.
     * @method
     */
    function handleRemoveButtonPress(paraObj)
    {
      paraObj.m_container.remove();
      delete insertedElements[paraObj.m_parameterString];
      
        that.contentObject.items = [];
        for(prop in insertedElements)
        {
          that.contentObject.items.push(prop);
        }
      
      $.each(insertedElements, function(key, value){
        console.log(key);
      });
    }
    
    /**
     * the event handler of the set button.
     * calls a method of the shared method class to set the parameter on the ROS system to the value of the input field
     * @param {parameterObject} paraObj - the desired parameterObject to manipulate.
     * @method
     */
    function handleSetButtonPress(paraObj)
    {
      that.setParameter(that.myRosHandle, paraObj);  
    }
    
    /**
     * the event handler of the delete button.
     * calls a method of the shared method class to delete the parameter on the ROS system.
     * a callback is returned ater deleting which calls handleRemoveButtonPress() in order to remove the entry of this parameter in the widget's view table
     * @param {parameterObject} paraObj - the desired parameterObject to delete.
     * @method
     */
    function handleDeleteButtonPress(paraObj)
    {
      that.deleteParameter(that.myRosHandle, paraObj, function() {
        handleRemoveButtonPress(paraObj);
        that.mainPointer.refreshMenu(that.mainPointer.desktopHandle.data("ros"));
      });
    }
  }
