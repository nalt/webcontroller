/**
 *  @file sharedMethods.js contains the source code of sharedMethods - gathers methods used by multiple widgets and methods using ROSLIBJS to contact the ROS system
 *  @author Martin Freundl <martinfreundl@web.de>
 */

  /**
   *  Creates an instance of sharedMethods
   *  @constructor
   *  @classdesc the sharedMethods class is a collection of dictionaries and methods that are used in more than one widget.
   *  every widget derives from sharedMethods which is the parent of widgetBase.
   */

function sharedMethods()
{
  console.log("sharedMethods");
  /** this dictionary is used to find out if the field type returned by the ROS system is a primitive type ( == 1) or not ( == undefined) */
  this.fieldTypes = new Object({"bool":1,"uint8":1,"int8":1,"uint16":1,"int16":1,"uint32":1,"int32":1,"uint64":1,"int64":1,"float32":1,"float64":1,"duration":1,"char":1,"byte":1,"string":1});
  //this.fieldTypes["time"] = 1;

  /**
   * this method makes use of ROSLIBJS and rosapi node to find out the type of a topic
   * @param {ROSLIB.Ros} rosHandle - the handle to the ROS system
   * @param {string} topicString - the name of the topic
   * @param {sharedMethods~cb_topicType} cb_topicType - a callback is triggered with the result string as argument
   * @method
   */  
  this.getTopicTypeByTopicString = function(rosHandle, topicString, cb_topicType)
  {
    var srvNodes  = new ROSLIB.Service({
      ros : rosHandle,
      name : '/rosapi/topic_type',
      serviceType : '/rosapi/TopicType'
    });
    
    var request = new ROSLIB.ServiceRequest({
      topic : topicString
    });
    srvNodes.callService(request, function(result) {
      cb_topicType(result.type);
    });
  }
  
  
  /**
   * the callback of getTopicTypeByTopicString()
   * @callback sharedMethods~cb_topicType
   * @param {string} type - the topic type
   */ 
  
  /**
   * this method makes use of ROSLIBJS and rosapi node to get the message details of a topic
   * @param {ROSLIB.Ros} rosHandle - the handle to the ROS system
   * @param {string} topicType - the type of the topic
   * @param {sharedMethods~cb_messageDetails} cb_messageDetails - a callback is triggered with the message details object as argument
   * @method
   */
  this.getMessageDetailsByTopicType = function(rosHandle, topicType, cb_messageDetails)
  {
    var srvNodes  = new ROSLIB.Service({
      ros : rosHandle,
      name : '/rosapi/message_details',
      serviceType : '/rosapi/MessageDetails'
    });
    
    var request = new ROSLIB.ServiceRequest({
      type : topicType
    });
    srvNodes.callService(request, function(result) {
      //console.log(result.typedefs[0]);  // !!0!!
      cb_messageDetails(result.typedefs[0]);
    });
  }
  
  /**
   * the callback of getMessageDetailsByTopicType()
   * @callback sharedMethods~cb_messageDetails
   * @param {Object} messageDetails - the message details object
   */ 
  
  
  /**
   * this method makes use of ROSLIBJS to get an ROSLIB.Topic instance in order to subscribe or publish a topic
   * @param {ROSLIB.Ros} rosHandle - the handle to the ROS system
   * @param {string} topicName - the name of the topic
   * @param {string} topicType - the type of the topic
   * @param {sharedMethods~cb_rosTopicInstance} callback - a callback is triggered with the ROSLIB.Topic instance as an argument
   * @method
   */
  this.getRosTopicInstance = function(rosHandle, topicName, topicType, cb_rosTopicInstance)
  {
    var myTopic = new ROSLIB.Topic({
      ros : rosHandle,
      name : topicName,
      messageType : topicType
    });
    
    cb_rosTopicInstance(myTopic);

  }
  
  /**
   * the callback of getRosTopicInstance()
   * @callback sharedMethods~cb_rosTopicInstance
   * @param {ROSLIB.Topic} rosTopicInstance - the requested instance of ROSLIB.Topic
   */ 
  
  
  /**
   * this method makes use of ROSLIBJS in order to get the value of a certain parameter
   * @param {ROSLIB.Ros} rosHandle - the handle to the ROS system
   * @param {string} paramString - the name of the parameter
   * @param {sharedMethods~cb_paramValue} cb_paramValue - a callback is triggered with the parameter's value as an argument
   * @method
   */
  this.getParamValueByString = function(rosHandle, paramString, cb_paramValue)
  {
    var myParam = new ROSLIB.Param({
      ros : rosHandle,
      name : paramString
    });
    
    myParam.get(function(value){
      cb_paramValue(value);
    });
  }
  
  /**
   * the callback of getParamValueByString()
   * @callback sharedMethods~cb_paramValue
   * @param {string} paramValue - the value of the parameter
   */ 
  
  /**
   * this method makes use of ROSLIBJS in order to set the value of a certain parameter
   * @param {ROSLIB.Ros} rosHandle - the handle to the ROS system
   * @param {parameterObject} paraObj - the desired parameterObject of the paramWidget
   * @method
   */
  this.setParameter = function(rosHandle, paraObj)
  {
    var myParam = new ROSLIB.Param({
      ros : rosHandle,
      name : paraObj.m_parameterString
    });   
    myParam.set($.isNumeric(paraObj.m_inputField.val()) ? parseFloat(paraObj.m_inputField.val()) : paraObj.m_inputField.val());   
  }
  
  
  
  /**
   * this method makes use of ROSLIBJS and the rosapi node in order to delete a certain parameter from the ROS system
   * @param {ROSLIB.Ros} rosHandle - the handle to the ROS system
   * @param {parameterObject} paraObj - the desired parameterObject of the paramWidget
   * @param {callback} callback - a callback is triggered after deleting
   * @method
   */
  this.deleteParameter = function(rosHandle, paraObj, callback)
  {
     var myService  = new ROSLIB.Service({
      ros : rosHandle,
      name : '/rosapi/delete_param',
      serviceType : '/rosapi/DeleteParam'
    });

    var request = new ROSLIB.ServiceRequest({
      name : paraObj.m_parameterString
    });

    myService.callService(request, function(result){
      callback();
    });
  }
  
  /**
   * this method makes use of ROSLIBJS and rosapi node to find out the type of a service
   * @param {ROSLIB.Ros} rosHandle - the handle to the ROS system
   * @param {string} serviceString - the name of the service
   * @param {cb_serviceType} cb_serviceType - a callback is triggered with the result string as argument
   * @method
   */  
  this.getServiceTypeByServiceString = function(rosHandle, serviceString, cb_serviceType)
  {
    var myService  = new ROSLIB.Service({
      ros : rosHandle,
      name : '/rosapi/service_type',
      serviceType : '/rosapi/ServiceType'
    });
    
    var request = new ROSLIB.ServiceRequest({
      service : serviceString
    });
    
    myService.callService(request, function(result) {
      cb_serviceType(result.type);
    });
  }
  
  /**
   * the callback of getServiceTypeByServiceString()
   * @callback sharedMethods~cb_serviceType
   * @param {string} type - the type of service
   */ 
  
  
  
  /**
   * this method makes use of ROSLIBJS and rosapi node to find out the request details of a certain service
   * @param {ROSLIB.Ros} rosHandle - the handle to the ROS system
   * @param {string} serviceType - the type of the service
   * @param {sharedMethods~cb_serviceRequest} cb_serviceRequest - a callback is triggered with the request details as argument
   * @method
   */  
  this.getServiceRequestDetailsByServiceType = function(rosHandle, serviceType, cb_serviceRequest)
  {
    var myService  = new ROSLIB.Service({
      ros : rosHandle,
      name : '/rosapi/service_request_details',
      serviceType : '/rosapi/ServiceRequestDetails'
    });
    
    var request = new ROSLIB.ServiceRequest({
      type : serviceType
    });
    myService.callService(request, function(result) {
      //console.log(result.typedefs[0]);  // !!0!!
      cb_serviceRequest(result.typedefs[0]);
    });
  }
  
  /**
   * the callback of getServiceRequestDetailsByServiceType()
   * @callback sharedMethods~cb_serviceRequest
   * @param {Object} requestDetails - the object of the service request details
   */ 
  
  /**
   * this method makes use of ROSLIBJS and rosapi node to find out the response details of a certain service
   * @param {ROSLIB.Ros} rosHandle - the handle to the ROS system
   * @param {string} serviceType - the type of the service
   * @param {sharedMethods~cb_serviceResponse} cb_serviceResponse - a callback is triggered with the response details as argument
   * @method
   */  
  this.getServiceResponseDetailsByServiceType = function(rosHandle, serviceType, cb_serviceResponse)
  {
    var myService  = new ROSLIB.Service({
      ros : rosHandle,
      name : '/rosapi/service_response_details',
      serviceType : '/rosapi/ServiceResponseDetails'
    });
    
    var request = new ROSLIB.ServiceRequest({
      type : serviceType
    });
    myService.callService(request, function(result) {
      //console.log(result.typedefs[0]);  // !!0!!
      cb_serviceResponse(result.typedefs[0]);
    });
  }
  
  /**
   * the callback of getServiceResponseDetailsByServiceString()
   * @callback sharedMethods~cb_serviceResponse
   * @param {object} responseDetails - the object of the service response details
   */ 
  
  /**
   * this method makes use of ROSLIBJ to do a service call on the ROS system
   * @param {ROSLIB.Ros} rosHandle - the handle to the ROS system
   * @param {aService} serviceObj - the desired aService object of the serviceWidget
   * @param {sharedMethods~cb_serviceCall} cb_serviceCall - a callback is triggered with a service response object as argument
   * @method
   */  
  this.callService = function(rosHandle, serviceObj, cb_serviceCall)
  {
    var myService  = new ROSLIB.Service({
      ros : rosHandle,
      name : serviceObj.m_serviceString,
      serviceType : serviceObj.m_serviceType
    });
      
    myService.callService(serviceObj.m_request, function(result)
    {
      cb_serviceCall(result);
    });
  }
  
  /**
   * the callback of callService()
   * @callback sharedMethods~cb_serviceCall
   * @param {Object} serviceResponse - the response object of the service call
   */ 
  
  /**
   * this method creates the dialog where the properties of the desired widgets are displayed in an editable way
   * @param {Object} storageObject - the contentObject of any widget that should be reflected in the dialog
   * @param {Object} widgetsDiv - the myDiv member of the desired widget so that the method knows where to place the dialog
   * @method
   */  
  this.reflectMyPropertiesInDialogBox = function(storageObject, widgetsDiv)
  {
  console.log(storageObject);
  var root = $("<div title='Properties'></div>").appendTo("body");
  recursion(storageObject, root);
  window.setTimeout(function(){$.each(root.find("li .properties"), function(key, val){$(val).toggle();}); root.dialog({ position: { my: "center", at: "right top", of: widgetsDiv } });}, 1000);
  
  /**
   * recursive method that displays the properties of an object in an editable list view
   * @param {Object} obj - the object to operate on
   * @param {Object} parentList - the list where to append current properties
   * @param {Object} parentObject - the parentObject of the current property
   * @param {string} prop - the name of the current property 
   * @method
   */  
  function recursion(obj, parentList, parentObj, prop)
  {
    if(typeof obj == 'object' && obj != null)
    {
      
      if(parentList !== undefined)
      {
        var ul = $("<ul class='properties'></ul>").appendTo(parentList);
      }
      for(var prop in obj)
      {
        var list = $("<li></li>");
        var a = $("<a class='field'>"+prop+": </a>").appendTo(list.appendTo(ul));
        if (!recursion(obj[prop], list, obj, prop))
          a.click(function(){$($(this).context.nextSibling).slideToggle()});
      }
      return false;
    }
    else
    {
      //we do not change the obj itself (as this is a primitive datatype now) but its parentObj[prop] which is the same. the advantage is that javascript does not copy whole objects but give their reference.
      //so when we change reference[property], the values are directly changed in the object we reflected.
      $("<input type='text' value='"+obj+"'></input>").appendTo($("<div class='val'></div>").appendTo(parentList))
      .change(function(){parentObj[prop] = $(this).val(); $(this).css("background", "green");});
      return true;
    }
  }
  }
  
  /**
   * this method returns a handle to the ROS system
   * @param {string} ip - the ip address of the ROS system
   * @type {ROSLIB.Ros}
   * @method 
   */ 
  this.getMyRosHandle = function(ip)
  {
    rosHandle = new ROSLIB.Ros();
    //rosHandle.onAny(function(event)
      //{
        //console.log(event);
        //if(event.result == false)
        //{
          //console.log("ERROR:");
        //}
      //});// if(event.type == "error"){console.log(event)}else if(event.type == "open"){console.log(event)}});
    rosHandle.connect("ws://"+ip);
    console.log("ws://"+ip);
    return rosHandle;
  }
}
