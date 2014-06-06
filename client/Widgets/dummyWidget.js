widgetList.push("dummyWidget");

function dummyWidgetObject(config)
{
  var that = this;
  widgetBase.apply(this, [config]);
  
  //this.cleanMeUp = function()
  //{
    //that.myRosHandle.close();
  //}
  console.log(this);
}
