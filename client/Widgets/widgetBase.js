/**
 *  @file widgetBase.js contains the source code of widgetBase - the parent class of all the widgets
 *  @author Martin Freundl <martinfreundl@web.de>
 */


/**
 * creates an instance of widgetBase - called within the constructor of every widget
 * @extends sharedMethods
 * @constructor
 * @classdesc widgetBase provides some general methods and members for all the widgets that
 * are needed for the widgets to get handled by the main application.
 * so almost all the necessary stuff to display, load and store a widget on the working desk is covered by widgetBase
 * @param {Object} config - object with following keys:
 *   * type - the type of the widget
 *   * pos - the position of the screen where to display the widget
 *   * size - the height and width of the widget (if not set, default is 300x300)
 *   * content - the widget's contentObject that has been saved from a previous session (not needed here, the junior widgets do process it themselfes)
 */

/** List of available widgets; appended when the widget source is inlcuded */
widgetList = [];

function widgetBase(config)
{
  var that = this;
  /** Pointer to MainClass */
  this.mainPointer = config.mainPointer;
  /** Title of Widget */
  this.title = "widgetBase";
  /** Short description/help text for widget */
  this.description = "Widget classes should overwrite title/description";
  /** Current view mode, see handleViewButtonPress() */
  this.viewmode = (config.viewmode)? config.viewmode : 0;
  
  /** the contentObject has been implemented to let the widgets append information to it which should be stored during the save process */
  this.contentObject = new Object();
  
  if(config.type)
  {
    this.type = config.type;
  }
  
  /** myDiv points to the view of the widget which is appended to the working desk (#mainContainer) and made resizeable as well as draggable */
  this.myDiv = $('<div class="widget ' + this.type + ' view_top'+ this.viewmode + '" style=""></div>')
              .appendTo(that.mainPointer.desktopHandle)
              .draggable()
              .resizable();
              
  // in the following the content object is processed
  if(config.pos)
  {
    this.myDiv.css("top", config.pos.top).css("left", config.pos.left);
  }
  if(config.size)
  {
    this.myDiv.css("width", config.size.width).css("height", config.size.height);
  }
  if(config.content)  //make the stored information available to the widgets' content object
  {
    this.content = config.content;
  }
  
  
  /** every widget has an headingDiv which displays the widget's type/name as well
  as the set button which reflects the properties of the widget's content object in an editable dialog */            
  var headingDiv = $('<div id="title"></div>').appendTo(this.myDiv);          
  var btnDiv = $('<div id="buttons"></div>').appendTo(headingDiv);
  
  $("<button class='fa fa-gear' title='settings' />")
                  .click(handleSetButtonPress)
                  .appendTo(btnDiv);        
  $("<button class='fa fa-eye' title='Toggle view modes' />")
                  .click(handleViewButtonPress)
                  .appendTo(btnDiv);
  $("<h2>"+this.type+"</h2>")
                  .appendTo(headingDiv);

  /* Div for the content */
  this.contentDiv = $('<div id="content" style=""/>').appendTo(this.myDiv);


  /** every widget has its own handle to the ROS system. the handle is activated here. */
  this.myRosHandle = this.getMyRosHandle(localStorage.lastIP);

  /**
   * if not overriden in the junior widgets, the main application will call this basic method of cleanMeUp on removing
   * which only results in closing the ROS handle.
   * if there is more to do on removing considering the junior widget, the method should be overriden in its class with the additional instructions.
   * do not forget to close the handle because when overriding the method, only the method of the junior class is executed.
   * @method
   */
  this.cleanMeUp = function()
  {
    console.log("cleanupBase");
    this.myRosHandle.close();
    //tidy up any objects that have been created
  }
  
  /**
   * saveMe() is called by the main application during the save process.
   * it packs the widget's geometry info, type and contentObject into a single storage object
   * that is returned to the main application.
   * @method
   */
  this.saveMe = function()
  {
    var widgetStorageObject = new Object();
    widgetStorageObject.content = this.contentObject;
    widgetStorageObject.pos = {"top":this.myDiv.css("top"),"left":this.myDiv.css("left")};
    widgetStorageObject.size = {"width":this.myDiv.css("width"),"height":this.myDiv.css("height")};
    widgetStorageObject.viewmode = this.viewmode;
    widgetStorageObject.type = this.type;
    return widgetStorageObject;
  }

  /**
   * the event handler of the set button in the top right of every widget.
   * it calls a shared method that will reflect all the properties of the widget's content object in an editable dialog.
   * @method
   */
  function handleSetButtonPress()
  {
    that.reflectMyPropertiesInDialogBox(that.contentObject, that.myDiv);
  }
  
  /** Toggle between viewmodes by adding class view_main1,... to myDiv. Child elements with class view<N> are only shown in view N by CSS rules. */
  function handleViewButtonPress()
  {
      that.viewmode += 1;
      if (that.viewmode > 2)
          that.viewmode = 0;
      that.myDiv.removeClass('view_top0').removeClass('view_top1').removeClass('view_top2');
      that.myDiv.addClass('view_top'+that.viewmode);
      console.debug("Viewmode: "+that.viewmode);
  }
}

//deriving from sharedMethods in order to make the methods available to every widget.
widgetBase.prototype = new sharedMethods();
widgetBase.prototype.constructor = widgetBase;
