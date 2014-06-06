# Webcontroller


Webcontroller is an HTML5-based browser application which allows to build versatile user interfaces for visualization, control and debugging of ROS systems.
It uses and shows ROS messages, services and parameters, much like the [rqt-tools](http://wiki.ros.org/rqt).
GUIs are created right in the browser by drag&drop and can be saved.
A menu bar displays the available ROS resources and widgets (see below).

The system is based on [rosbridge](http://wiki.ros.org/rosbridge_suite) and [roslibjs](http://wiki.ros.org/roslibjs) for communication between ROS and the browser.
ROS is not required on the client side - a standard HTML5 browser is sufficient to run Webcontroller, which makes it suitable for many different platforms, such as any modern tablet.



## Running

A launch file *all.launch* is provided, which starts the following:

* [rosbridge_server](http://wiki.ros.org/rosbridge_server): Interface to ROS based on Websocket/JSON; default port 9090.
* [mjpeg_server](http://wiki.ros.org/mjpeg_server): Streams image data via HTTP; port 8889.
* webserver.sh: Starts a Python-based webserver for the HTML/JS files in ./client/ on port 8888. Note that these files could also be stored on the client itself. The server also provides a storage features in cgi-bin/save.py and load.py.
* open-browser.sh: Opens the default browser to show Webcontroller. If you want to run Webcontroller on a different machine, point its browser to e.g. http://robot:8888.



## Desktop

An empty "desktop" area is shown in the browser when you open Webcontroller. The menu bar on top allows to connect to ROS and create your GUI. The following functionality is provided:


* All available ROS nodes, topics, services and parameters are shown in the respective menus. These resources can be dragged onto an existing widget.
* "Widget" menu: Shows all available and loaded widgets. Create a new widget by dragging it from the menu to the free area below the menu.
* Connect button: Click to (re-)connect to the rosbridge server. A menu appears to enter its address, e.g. robot:9090. The current connection state is indicated as follows: green - connected; red - not connected; spinnning - connecting.
* Desktop name: Enter a name to identify desktops. Each desktop has its own set of widgets and may connect to a different server.
* Save button: Saves the current widget configuration as a JSON string both to the server and to the local storage.
* Load button: Open a saved desktop configuration, including widgets, their parameters, positions and the associated ROS resources. A demo file for the server storage is in the repository.
* Forward/backward buttons: Switch between multiple desktops. 
* Delete button: Deletes widgets, entries from the storage (by dragging them onto the button) or the current desktop.



## Widgets
Widgets visualize ROS resources such as messages and are created by dragging from the "Widgets" menu.
They can be moved and resized like a window.
After creating a widget, drag the ROS resource (e.g. topic, parameter) you like to show onto the widget.
The title bar shows buttons for configuration of the widget and its view mode (not supported for all widgets).
The following widgets are currently available:

### Message widget
*Accepts: Any topic (images or large data not recommended)*

Displays a ROS topic as text, much like `rostopic echo`.

### Publisher widget
*Accepts: Any topic*

Publish to a ROS topic.
The publishing frequency and toggle mode are configurable.
Use the "view mode" button to switch to a more compact design, which is suitable for simple robot controllers.
You can show any HTML code in the button, including images and Unicode signs.

### Parameter widget
*Accepts: Any parameter*

Read, create, modify or clear parameters.

### Service widget
*Accepts: Any service*

Call a ROS service.

### Image widget
*Accepts: Topic of type sensor_msgs/Image*

Displays images/videos using mjpeg_server. The server port must be set in the widget's configuration and defaults to the site's port +1.

### Plot widget
*Accepts: Any topic*

Displays a plot using the [flot](http://www.flotcharts.org/) library. Individual components of the message can be selected. Use the widget parameters to customize the plot.



## More information

Detailed documentation can be created using JSDoc.
A demo video will be made available shortly.
If you plan to develop your own widget, or add more features, do not hesitate to contact us.

Authors: Martin Freundl, Nicolas Alt
