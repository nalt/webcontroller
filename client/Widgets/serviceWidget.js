/**
 *  @file serviceWidget.js contains the source code of the serviceWidget
 *  @author Martin Freundl <martinfreundl@web.de>
 */

widgetList.push("serviceWidget");

  /**
   *  Creates an instance of the serviceWidget
   *  @extends widgetBase
   *  @constructor
   *  @param {Object} config - object with following keys:
   *   * type - the type of the widget
   *   * pos - the position of the screen where to display the widget
   *   * size - the height and width of the widget (if not set, default is 300x300)
   *   * content - the widget's contentObject that has been saved from a previous session (if not set, the widget is empty)
   */
function serviceWidgetObject(config)
{
  widgetBase.apply(this, [config]);
  var that = this;

  this.title = "Services";
  this.description = "Call ROS Services";

  this.myDiv.droppable({
    accept:'#menuService li',
    drop:handleDropServiceWidget,
    hoverClass:'hovered'
  }); 
   
  var listOfServiceObjects = new Object();
  that.contentObject.items = new Array();
  
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
      window.setTimeout(function(){$.each(that.myDiv.find(".toggleRow"), function(key, val){$(val).toggle();});}, 1000);
    }
  }
  
    /**
     * insertItems() takes the name of the service, creates an object of aService and displays its view in the widget's view.
     * furthermore the aService object gets stored in the listOfServiceObjects and the name of the service gets stored into the content object.
     * the call of aService.m_createMe() creates the helper object's view and appends it to the widget's view.
     * in the first lines, three shared methods are callend to get more information about the service.
     * this additional information is required to create the aServie object which in turn creates the view of that service with those information.
     * @param {string} serviceString - the name of the service to display
     * @method
     */  
  function insertItems(serviceString)
  {
    that.getServiceTypeByServiceString(that.myRosHandle, serviceString, function(serviceType){
      that.getServiceRequestDetailsByServiceType(that.myRosHandle, serviceType, function(serviceRequestDetails){
      	that.getServiceResponseDetailsByServiceType(that.myRosHandle, serviceType, function(serviceResponseDetails){
      
     	    console.log(serviceType);
          //console.log(serviceRequestDetails);
          console.log(serviceResponseDetails);
          
          //var serviceObj = new aService(serviceString, serviceType, serviceRequestDetails, serviceResponseDetails);
          var serviceObj = new aService(serviceString, serviceType, serviceRequestDetails);
          console.log(serviceObj);
          
          listOfServiceObjects[serviceString] = serviceObj;
          console.log(listOfServiceObjects);
          //myParameter.m_container.appendTo(paramDiv);
          serviceObj.m_createMe();
          
          that.contentObject.items = [];
          for(prop in listOfServiceObjects)
          {
            that.contentObject.items.push(prop);
          }
          
        });
      });
    });
  }
  
  /**
   * this is the event handler of the drop event of the widget's view.
   * it finds out the name of the dropped service and triggers insertItems()
   * @param {Object} event - contains infos about the event
   * @param {Object} ui - the jQueryUI object that was dropped into the widget and which is needed to find out the service's name.
   * @method
   */
  function handleDropServiceWidget( event, ui )
  {
    var draggable = ui.draggable;
    if(listOfServiceObjects[draggable.data('value')])
    {
      return;
    }
    insertItems(draggable.data('value'));
  }
  
  

  
  /**
   * creates an instance of aService object - the helper object for every entry of the serviceWidget
   * @constructor
   * @classdesc this class represents the view of every service of the widget.
   * it stores important elements of the view like the input fields that have to be accessed when calling the service, the response field or details about that service
   * @param {string} serviceString - the name of the service this object is created for
   * @param {string} serviceType - the type of the service this object is created for
   * @param {Object} serviceRequestDetails - the requst details of the service, i.e. which fields and datatypes have to be sent in the service call
   * @param {Object} serviceResponseDetails - the response details of the service, i.e. how the response has to be decoded
   */
  function aService(serviceString, serviceType, serviceRequestDetails)
  {
    var currentObj = this;
    /** the name of the service */
    this.m_serviceString = serviceString;
    /** the type of the service */
    this.m_serviceType = serviceType;
    /** the request details of the service */
    this.m_serviceRequestDetails = serviceRequestDetails;
    /** the response details of the service */
    //this.m_serviceResponseDetails = serviceResponseDetails;
    /** the collection of the input fields of the service */
    this.m_requestInputFields = new Array();
    /** the object which is sent to the ROS system during a service call - it is filled with the values of the input fields */
    this.m_request = new Object();

    /**
     * this method sets up the view of this aService object with the help of additional information to the specific service obtained above
     * it connects the event handlers to the buttons.
     * it has an inner method which checks the entered datatypes of the input fields for correctness
     * @method
     */
    this.m_createMe = function(){
    
      /** the view of this aService object, appended to the view of the widget */
      //this.m_container = $("<table style='width:100%;table-layout:fixed;'></table>").appendTo(that.contentDiv);
      this.m_container = $("<table class='sTable'></table>").appendTo(that.contentDiv);
      
      //var table = $("<table></table>").appendTo(this.m_container);
      var buttonRow = $("<tr class='headRow'></tr>").appendTo(this.m_container);
      //var tableRowRequestNames = $("<tr></tr>");
      //var tableRowRequestInputFields = $("<tr></tr>");
      var childList = $("<ul></ul>");
      
      $("<td>"+this.m_serviceString+"</td>").appendTo(buttonRow).click(function(){
                                                                    $.each(currentObj.m_container.find(".toggleRow"), function(key, val){
                                                                      $(val).toggle();
                                                                    });
                                                                 });
      //$("<td>"+this.m_serviceType+"</td>").appendTo(tableRow);
      $("<td>"+this.m_serviceType+"</td>").appendTo(buttonRow);
      var dom_btn = $("<td></td>").appendTo(buttonRow);
      $("<button title='call' class='fa fa-play'></button>").click(function() {handleCallButtonPress(currentObj);}).appendTo(dom_btn);
      $("<button title='clear response' class='fa fa-eraser'></button>").click(function() {handleClearButtonPress(currentObj);}).appendTo(dom_btn);
      $("<button title='remove' class='fa fa-eye-slash'></button>").click(function() {handleRemoveButtonPress(currentObj);}).appendTo(dom_btn);
      childList.appendTo($("<td colspan='3'></td>").appendTo($("<tr class='toggleRow'></tr>").appendTo(this.m_container)));
      /** the text field where the service response gets posted */
      this.m_ResponseField = $("<textarea readonly style='font:10px arial;width:100%;height:50px;'></textarea>").appendTo($("<td colspan='3'></td>").appendTo($("<tr class='toggleRow'></tr>").appendTo(this.m_container))).hide();
      
      
      //for(var i = 0; i < serviceRequestDetails.fieldnames.length; ++i)
      //{
        //$("<td>"+serviceRequestDetails.fieldnames[i]+"</td>").appendTo(tableRowRequestNames);
        
        //var inputField = $("<input title='"+serviceRequestDetails.fieldtypes[i]+"' style='width:100%;' type='text' value="+serviceRequestDetails.fieldtypes[i]+">").data("id", i).change(function(){checkForCorrectType(this)}).tooltip().click(function(){$(this).focus();});
        //this.m_requestInputFields.push(inputField);
        //inputField.appendTo($("<td></td>").appendTo(tableRowRequestInputFields));
      //}
      
      
      createTreeView(currentObj, childList, this.m_serviceType, this.m_serviceRequestDetails);
      
      /**
       * this method checks an inputField for its correct datatype
       * @param {Object} inputField - the jQueryUI object of the inputField which is gonna be tested
       * @method
       */
      /**function checkForCorrectType(inputField)
      {
        var input = $(inputField);
        if($.isNumeric(input.val()) && currentObj.m_serviceRequestDetails.fieldtypes[input.data('id')] != "string")
        {
          input.css("background", "green");
        }
        else if(!$.isNumeric(input.val()) && currentObj.m_serviceRequestDetails.fieldtypes[input.data('id')] == "string")
        {
          input.css("background", "green");
        }
        else
        {
          input.css("background", "red");
        }
        
      }**/
      
      //tableRow.appendTo(this.m_container);
      //tableRowRequestNames.appendTo(this.m_container);
      //tableRowRequestInputFields.appendTo(this.m_container);
      
    }
  }
  
  function createTreeView(serviceObj, parent, serviceType, requDtls)
  {
    if(requDtls !== undefined)
    {
      that.getServiceRequestDetailsByServiceType(that.myRosHandle, serviceType, function(serviceRequestDetails){
      //that.getMessageDetailsByTopicType(that.myRosHandle, topicObj.m_topicType, function(mesdtls){
        serviceObj.m_serviceRequestDetails = serviceRequestDetails;
        for(var i = 0; i < serviceRequestDetails.fieldnames.length; ++i)
        {
          var lst = $("<li></li>").appendTo(parent);
          var inputField = $("<input title='"+serviceRequestDetails.fieldtypes[i]+"' style='width:100%;font:10px arial;' type='text' placeholder="+serviceRequestDetails.fieldnames[i]+">").click(function(){$(this).focus();}).appendTo($("<div class='sInputDiv'></div>").appendTo(lst))
          //.change(function(){checkForCorrectType(this)}).tooltip().click(function(){$(this).focus();});
          //this.m_requestInputFields.push(inputField);
          //inputField.appendTo($("<td></td>").appendTo(tableRowRequestInputFields));
        
          //console.log(mesdtls.fieldnames[i]+" ["+mesdtls.fieldtypes[i]+"]");
          
          //var type =  "["+serviceRequestDetails.fieldtypes[i] + ( serviceRequestDetails.fieldarraylen[i] == 0 ? "[]" : "" ) + "]";
          //var a = $("<a title="+type+">"+serviceRequestDetails.fieldnames[i]+": </a>").appendTo(lst).click(function(){$($(this).context.nextSibling).slideToggle()});;
          //var span = $("<span style='background:gray;'></span>").appendTo(a);
          serviceObj[serviceRequestDetails.fieldnames[i]] = inputField;  //pointer auf span elemente werden dem topicObj hinzugefügt um bei refreshValues die spans zu manipulieren
          //console.log(serviceRequestDetails.fieldnames[i])
          if(serviceRequestDetails.fieldtypes[i] == "time")
          {
            var obj = new Object();   //ausnahmebehandlung falls type time, da hier die messagedetails nicht mit den feldern der message übereinstimmen nsecs <-> nsec
            var list = $("<ul></ul>").appendTo(lst);
            obj.nsecs = $("<li><a>nsecs: <span style='background:gray;'></span></a></li>").appendTo(list);
            obj.secs = $("<li><a>secs: <span style='background:gray;'></span></a></li>").appendTo(list);
            serviceObj[serviceRequestDetails.fieldnames[i]] = obj;
          }
          else if(that.fieldTypes[serviceRequestDetails.fieldtypes[i]] === undefined)  //fieldTypes ist undefined falls mesdtls.fieldtypes[i] nicht mit den einträgen in fieldTypes matcht
          {
            inputField.remove()
              var a = $("<a></a>").appendTo(lst).click(function(){
                                                            for(var sibling = $($(this).context.nextSibling); ; sibling = $(sibling.context.nextSibling))
                                                            {
                                                              sibling.slideToggle();
                                                              if(!sibling.context.nextSibling)
                                                              {
                                                                break;
                                                              }
                                                             }
                                                           });
            a.attr("title", serviceRequestDetails.fieldtypes[i]);
            a.html(serviceRequestDetails.fieldnames[i]);
            var obj = {}
            serviceObj[serviceRequestDetails.fieldnames[i]] = obj;
            //obj.m_serviceType = serviceRequestDetails.fieldtypes[i]
            createTreeView(obj, $("<ul></ul>").appendTo(lst), serviceRequestDetails.fieldtypes[i]);
          }
          else
          {
          }
        }
      });
    }
    else
    {
      that.getMessageDetailsByTopicType(that.myRosHandle, serviceType, function(serviceRequestDetails){
      //that.getMessageDetailsByTopicType(that.myRosHandle, topicObj.m_topicType, function(mesdtls){
        serviceObj.m_serviceRequestDetails = serviceRequestDetails;
        for(var i = 0; i < serviceRequestDetails.fieldnames.length; ++i)
        {
          var lst = $("<li></li>").appendTo(parent);
          var inputField = $("<input title='"+serviceRequestDetails.fieldtypes[i]+"' style='width:100%;font:10px arial;' type='text' placeholder="+serviceRequestDetails.fieldnames[i]+" "+(serviceRequestDetails.fieldarraylen[i] == 0 ? "[]" : "")+">").click(function(){$(this).focus();}).appendTo($("<div class='sInputDiv'></div>").appendTo(lst))
          //.change(function(){checkForCorrectType(this)}).tooltip().click(function(){$(this).focus();});
          //this.m_requestInputFields.push(inputField);
          //inputField.appendTo($("<td></td>").appendTo(tableRowRequestInputFields));
        
          //console.log(mesdtls.fieldnames[i]+" ["+mesdtls.fieldtypes[i]+"]");
          
          //var type =  "["+serviceRequestDetails.fieldtypes[i] + ( serviceRequestDetails.fieldarraylen[i] == 0 ? "[]" : "" ) + "]";
          //var a = $("<a title="+type+">"+serviceRequestDetails.fieldnames[i]+": </a>").appendTo(lst).click(function(){$($(this).context.nextSibling).slideToggle()});;
          //var span = $("<span style='background:gray;'></span>").appendTo(a);
          serviceObj[serviceRequestDetails.fieldnames[i]] = inputField;  //pointer auf span elemente werden dem topicObj hinzugefügt um bei refreshValues die spans zu manipulieren
          if(serviceRequestDetails.fieldtypes[i] == "time")
          {
            var obj = new Object();   //ausnahmebehandlung falls type time, da hier die messagedetails nicht mit den feldern der message übereinstimmen nsecs <-> nsec
            var list = $("<ul></ul>").appendTo(lst);
            obj.nsecs = $("<li><input style='width:100%;font:10px arial;' placeholder='nsecs'></li>").appendTo(list);
            obj.secs = $("<li><input style='width:100%;font:10px arial;' placeholder='secs'</li>").appendTo(list);
            serviceObj[serviceRequestDetails.fieldnames[i]] = obj;
          }
          else if(that.fieldTypes[serviceRequestDetails.fieldtypes[i]] === undefined)  //fieldTypes ist undefined falls mesdtls.fieldtypes[i] nicht mit den einträgen in fieldTypes matcht
          {
            if(serviceRequestDetails.fieldarraylen[i] == 0)
            {
              var a = $("<a></a>").appendTo(lst).click(function(){
                                                            for(var sibling = $($(this).context.nextSibling); ; sibling = $(sibling.context.nextSibling))
                                                            {
                                                              sibling.slideToggle();
                                                              if(!sibling.context.nextSibling)
                                                              {
                                                                break;
                                                              }
                                                             }
                                                           });
              a.html(serviceRequestDetails.fieldnames[i])
              a.attr("title", serviceRequestDetails.fieldtypes[i]);
              inputField.remove();
              var arr = new Array();
              var obj = {};
              arr.push(obj);
              serviceObj[serviceRequestDetails.fieldnames[i]] = arr;
              $("<span class='fa fa-plus-circle' style='font-size:10px;clear:both;float:right;'></span>").prependTo(lst)
              .data("details", serviceRequestDetails.fieldtypes[i])
              .data("array", arr)
              .data("lst", lst)
              .click(function(){
                var obj1 = {};
                var arr1 = $(this).data("array");
                arr1.push(obj1);
                if($($(this).data("lst")[0].children[$(this).data("lst")[0].childElementCount - 1]).css("display") == "block")
                {
                  createTreeView(obj1, $("<ul></ul>").appendTo($(this).data("lst")), $(this).data("details"));
                }
                else
                {
                  createTreeView(obj1, $("<ul></ul>").hide().appendTo($(this).data("lst")), $(this).data("details"));
                }
                
              });
              //obj.m_serviceType = serviceRequestDetails.fieldtypes[i]
              createTreeView(arr[0], $("<ul></ul>").appendTo(lst).slideToggle(), serviceRequestDetails.fieldtypes[i]);
            }
            else
            {
              var a = $("<a></a>").appendTo(lst).click(function(){
                                                            for(var sibling = $($(this).context.nextSibling); ; sibling = $(sibling.context.nextSibling))
                                                            {
                                                              sibling.slideToggle();
                                                              if(!sibling.context.nextSibling)
                                                              {
                                                                break;
                                                              }
                                                             }
                                                           });
              a.html(serviceRequestDetails.fieldnames[i])
              a.attr("title", serviceRequestDetails.fieldtypes[i]);
              inputField.remove();
              var obj = {};
              serviceObj[serviceRequestDetails.fieldnames[i]] = obj;
              //obj.m_serviceType = serviceRequestDetails.fieldtypes[i]
              createTreeView(obj, $("<ul></ul>").appendTo(lst).slideToggle(), serviceRequestDetails.fieldtypes[i]);
            }
          }
          else
          {
          }
        }
      });
    }
  }
  
  function getValues(serviceObj)
  {
    serviceObj.valueObj = new Object();
    //serviceObj.m_valuesToSave.valueObj = serviceObj.valueObj;
    recursion2(serviceObj, serviceObj.valueObj);
    console.log(serviceObj.valueObj);
  }
  
  function recursion2(topObj, valueObj)
  {
    for(var i = 0; i < topObj.m_serviceRequestDetails.fieldnames.length; ++i)
    {
      console.log(topObj.m_serviceRequestDetails.fieldnames[i])
      if(that.fieldTypes[topObj.m_serviceRequestDetails.fieldtypes[i]] !== undefined && topObj[topObj.m_serviceRequestDetails.fieldnames[i]].val() == "")
      {
        valueObj[topObj.m_serviceRequestDetails.fieldnames[i]] = undefined;
      }
      else
      {
        if(that.fieldTypes[topObj.m_serviceRequestDetails.fieldtypes[i]])
        {
          if(topObj.m_serviceRequestDetails.fieldarraylen[i] == 0)
          {
            var arr = new Array();
            var string = topObj[topObj.m_serviceRequestDetails.fieldnames[i]].val();
            string = string.slice(1, string.length);
            string = string.slice(0, string.length -1);
            arr = string.split(',');
              for(var prop in arr)
              {
                arr[prop] = $.isNumeric(arr[prop]) ? parseFloat(arr[prop]) : arr[prop];
              }
            valueObj[topObj.m_serviceRequestDetails.fieldnames[i]] = arr;
          }
          else
          {
            valueObj[topObj.m_serviceRequestDetails.fieldnames[i]] = $.isNumeric(topObj[topObj.m_serviceRequestDetails.fieldnames[i]].val()) ? parseFloat(topObj[topObj.m_serviceRequestDetails.fieldnames[i]].val()) : topObj[topObj.m_serviceRequestDetails.fieldnames[i]].val();
          }
        }
        else if(topObj.m_serviceRequestDetails.fieldtypes[i] == "time")
        {
          valueObj[topObj.m_serviceRequestDetails.fieldnames[i]] = {"nsecs":0,"secs": parseInt(new Date().getTime()/1000)}
          //valueObj[topObj.m_messageDetails.fieldnames[i]] = {"nsecs":parseFloat(topObj[topObj.m_messageDetails.fieldnames[i]].nsecs[0].children[0].children[0].value), "secs":parseFloat(topObj[topObj.m_messageDetails.fieldnames[i]].secs[0].children[0].children[0].value)};
        }
        else if(that.fieldTypes[topObj.m_serviceRequestDetails.fieldtypes[i]] === undefined)
        {
          if(topObj.m_serviceRequestDetails.fieldarraylen[i] == 0)
          {
            valueObj[topObj.m_serviceRequestDetails.fieldnames[i]] = new Array();
            for(var number in topObj[topObj.m_serviceRequestDetails.fieldnames[i]])
            {
              //console.log(topObj[topObj.m_serviceRequestDetails.fieldnames[i]][number]);
              var newObj = {};
              valueObj[topObj.m_serviceRequestDetails.fieldnames[i]].push(newObj);
              recursion2(topObj[topObj.m_serviceRequestDetails.fieldnames[i]][number], newObj);
            }
          }
          else
          {
            valueObj[topObj.m_serviceRequestDetails.fieldnames[i]] = new Object();
            recursion2(topObj[topObj.m_serviceRequestDetails.fieldnames[i]], valueObj[topObj.m_serviceRequestDetails.fieldnames[i]]);
          }
        }
      }
    }
  }
  
  /**
   * the event handler of the remove button of the aService's view.
   * it removes the aService object from both arrays listOfServiceObjects and contentObject.items
   * then it removes the aService's view from the widget's view.
   * @param {aService} obj - the desired sService object to remove.
   * @method
   */
  function handleRemoveButtonPress(obj)
  {
    obj.m_container.remove();
    delete listOfServiceObjects[obj.m_serviceString];
    
    that.contentObject.items = [];
    for(prop in listOfServiceObjects)
    {
      that.contentObject.items.push(prop);
    }
  }
  
  
  /**
   * the event handler of the call button of the aService's view.
   * it fills the aService.m_request object with the values of the input fields
   * and executes the service call by sending this object to the ROS system
   * then it receives the response object from the ROS system and displays its values in the response field
   * @param {aService} serviceObj - the aServiceObject of the service to call.
   * @method
   */
  function handleCallButtonPress(serviceObj)
  {

      console.log(serviceObj)
      getValues(serviceObj);
    //var request = new ROSLIB.ServiceRequest();
    /**for(var i = 0; i < serviceObj.m_serviceRequestDetails.fieldnames.length; ++i)
    { 
      serviceObj.m_request[serviceObj.m_serviceRequestDetails.fieldnames[i]] = ($.isNumeric(serviceObj.m_requestInputFields[i].val()) && serviceObj.m_serviceRequestDetails.fieldtypes[i] != "string" ? parseFloat(serviceObj.m_requestInputFields[i].val()) : serviceObj.m_requestInputFields[i].val());
    }*/
    serviceObj.m_request = serviceObj.valueObj;
    that.callService(that.myRosHandle, serviceObj, function(result){
      console.log(result);
      //responseString = "";
      if(Object.keys(result).length > 0)
      {
        serviceObj.m_ResponseField.show();
      }
      showServiceResponse(result, serviceObj.m_ResponseField);
    });
  }
  
  /**
   * the event handler of the clear button of the aService's view.
   * it clears the aService.m_ResponseField object with the values of the ServiceResponse.
   * @param {aService} serviceObj - the current aServiceObject of which to clear the ResponseField.
   * @method
   */
  function handleClearButtonPress(serviceObj)
  {
    try
    {
      serviceObj.m_ResponseField.empty();
      serviceObj.m_ResponseField.hide();
    }
    catch(exception)
    {
      console.log(exception);
    }
  }
 
  /**
   * this recursive method is used to take the response object of the service call and display its content
   * in the service response field
   * @param {Object} obj - the service response object
   * @param {Object} field - the service response field of the view. all the output gets posted there.
   * @param {string} spare - the name of the current property of the object (to write the name and its value in the same line (in the next recursive call))
   * @method
   */ 
  function showServiceResponse(obj, field, spare)  //man könnte hier auch auf object reflection verzichten und mit serviceResponse bzw getMessageDetails weiterarbeiten siehe tpcWgt
  {
    //console.log(typeof obj);
    if(typeof obj == 'object')
    {
      if(spare !== undefined)
      {
        field.html(field.html()+spare+":\n");
      }
      for(var prop in obj)
      {
        
        //console.log(prop);
        
        showServiceResponse(obj[prop], field, prop);
        //return prop+": "+recursion(obj[prop]);
      }
    }
    else
    {
      //return obj;
      field.html(field.html()+spare+": "+obj+"\n");
      //console.log(obj);
    }
  }
}
