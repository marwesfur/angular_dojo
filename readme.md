Dojo integration for Angular.js
===============================

The trick is to use a generic directive, `bindDojoType`, that instantiates Dojo Widgets and sets up bindings (in HTML you simply write `bind-dojo-type` instead of `dojo-type`).
`bindDojoType` is implemented based on the code of the dojo parser and therefore supports mixins.
It evaluates the `dojoProps` attribute in the current scope. Different binding types are supported:

* Twoway: `data-bind-<propertyName>="<angular expression>"`
* Twoway with change notification: `data-bind-<propertyName>="model: <angular expression>, onChange: <angular expression>"`
* Oneway: `data-bind-oneway-<propertyName>="<angular expression>"`
* Oneway with change notification: `data-bind-oneway-<propertyName>="model: <angular expression>, onChange: <angular expression>"`
* Function bindings: `data-bind-fn-on-click="<angular expression that is evaluated whenever a click occurs>"`

Furthermore you can watch by value or by reference (add `byValue` in the attribute).


While this approach works very well for a broad range of dojo widgets, there some of them which are not "binding ready" out of the box. 
Such issues can be solved with mixins. For example, _VisibilityMixin, is an alternative to `ng-show` that works directly on a widget node.

See demo.html