# Dojo integration for Angular.js

Without any doubt, dojo/dijit is an impressive collection of enterprise ready UI components. When it comes to application architecture, however, Dojo has  fallen behind more modern frameworks with AngularJS being one of the most prominent examples.

Now, if your enterprise has already invested considerably in its own custom widgets and perhaps even an elaborate theme - how can you preserve those investment and still enjoy the comfort of developing with AngularJS?

Our answer to this problem is a generic directive, that bridges between Angular bindings and arbitrary dojo widgets. 

Welcome back to the modern age, Dojo!


## Developer documentation

The trick is to use a generic directive, `bindDojoType`, that instantiates Dojo Widgets and sets up bindings (the rational behind `bindDojoType` being that in your HTML code you simply need to exchange `dojo-type` with `bind-dojo-type`).
`bindDojoType` is implemented based on the code of the dojo parser and therefore supports mixins.
It evaluates the `dojoProps` attribute in the current scope. Different binding types are supported:

* Twoway: `data-bind-<propertyName>="<angular expression>"`
* Twoway with change notification: `data-bind-<propertyName>="model: <angular expression>, onChange: <angular expression>"`
* Oneway: `data-bind-oneway-<propertyName>="<angular expression>"`
* Oneway with change notification: `data-bind-oneway-<propertyName>="model: <angular expression>, onChange: <angular expression>"`
* Function bindings: `data-bind-fn-on-click="<angular expression that is evaluated whenever a click occurs>"`

Furthermore you can watch by value or by reference (add `byValue` in the attribute).

See [demo.html](https://rawgit.com/marwesfur/angular_dojo/master/demo.html)

While this approach works very well for a broad range of dojo widgets, there some of them which are not "binding ready" out of the box. 
Such issues can be solved with mixins. As an example we provide the `_VisibilityMixin` as an alternative to `ng-show` that works directly on a widget node.


## Roadmap

- Provide more Mixins, that make different aspects of dojo/dijit binding ready (e.g. to dynamically add and remove children from containers)
- Provide user documentation and implementation notes for `bindDojoType`
- Document "binding best practices" and common scenarios.


## License

This project is licensed under the terms of the MIT license

Copyright (c) 2015 CAS Software AG

