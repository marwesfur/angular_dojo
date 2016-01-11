angular
    .module("angularDojo", [])
    .directive('bindDojoType', ['$parse', '$rootScope', function ($parse, $rootScope) {

        /**
         * matches "model: modelExpr, onChange: onChangeExpr, byValue" or "model: modelExpr, byValue" or "model: modelExpr, onChange: onChangeExpr"
         */
        var ngModelPattern = /^(?:\s*model:\s*(.+),\s*onChange:\s*(.+),\s*(byValue))|(?:\s*model:\s*(.+),\s*(byValue))|(?:\s*model:\s*(.+),\s*onChange:\s*(.+))$/;

        var utils = {
            equalReferences: function (a, b) {
                return a === b;
            },
            noop: function () {

            },
            id: function (param) {
                return param;
            },
            hasPrefix: function (prefix) {
                return function (name) {
                    name = name || '';
                    return name.indexOf(prefix) === 0 && name.length > prefix.length;
                }
            },
            withoutPrefix: function (prefix) {
                var startIndex = prefix.length;
                return function (name) {
                    return name.charAt(startIndex).toLowerCase() + name.substring(startIndex + 1);
                }
            },
            parseAttrVal: function (attrVal) {
                if (ngModelPattern.test(attrVal)) {
                    var regRes = ngModelPattern.exec(attrVal);
                    regRes.shift(); // consume complete match
                    while (!regRes[0]) regRes.shift(); // consume unmatched cases

                    return {
                        expr: regRes[0],
                        getValue: $parse(regRes[0]),
                        onChange: regRes[1] && regRes[1] != 'byValue' ? $parse(regRes[1]) : null,
                        watchByValue: regRes[1] == 'byValue' || regRes[2] == 'byValue'
                    };
                }
                else {
                    return {
                        expr: attrVal,
                        getValue: $parse(attrVal),
                        onChange: null,
                        watchByValue: false
                    }
                }
            }
        };

        // Map from widget name or list of widget names(ex: "dijit/form/Button,acme/MyMixin") to a constructor.
        var ctorMap = {};

        function getWidgetCtor(attrs) {
            function reportMissingCtor(types) {
                throw new Error("could not find bound " + types.join() + ".\nPlease make sure that respective dojo modules are loaded");
            }

            function getCtor(types) {
                var ts = types.join(),
                    mixins = [],
                    ctor,
                    i, l, t;

                if (!ctorMap[ts]) {
                    for (i = 0, l = types.length; i < l; i++) {
                        t = types[i];

                        mixins[mixins.length] = (ctorMap[t] = ctorMap[t] || (dojo.getObject(t) || require(t)));
                    }
                    ctor = mixins.shift();
                    ctorMap[ts] = mixins.length ? (ctor.createSubclass ? ctor.createSubclass(mixins)
                        : ctor.extend.apply(ctor, mixins))
                        : ctor;
                }

                return ctorMap[ts];
            }

            var type = attrs['bindDojoType'],
                mixinsValue = attrs['dojoMixins'],
                types = mixinsValue ? [type].concat(mixinsValue.split(/\s*,\s*/)) : [type];

            try {
                return getCtor(types) || reportMissingCtor(types);
            }
            catch (e) {
                reportMissingCtor(types);
            }
        }

        /**
         * can be bind-property="expr" or
         * bind-property="model: expr, onChange: expr"
         */
        var bindAttr = {
            matches: utils.hasPrefix("bind"),
            realName: utils.withoutPrefix("bind"),
            apply: function (name, attrVal, scope) {
                var res = utils.parseAttrVal(attrVal),
                    setValue = res.getValue.assign;

                function bind(widget) {
                    scope.$watch(res.expr, function (newValue) {
                        if (widget.get(name) !== newValue)
                            widget.set(name, newValue);
                    }, res.watchByValue);
                    widget.watch(name, function () {
                        var equals = res.watchByValue ? angular.equals : utils.equalReferences;
                        var widgetValue = widget.get(name);
                        if (!equals(res.getValue(scope), widgetValue)) {
                            setValue(scope, widgetValue);
                            res.onChange && res.onChange(scope);
                            if (!$rootScope.$$phase) {
                                scope.$apply();
                            }
                        }
                    });
                }

                return {
                    initialValue: res.getValue(scope),
                    bind: bind
                };
            }
        };

        var bindOnewayAttr = {
            matches: utils.hasPrefix("bindOneway"),
            realName: utils.withoutPrefix("bindOneway"),
            apply: function (name, attrVal, scope) {
                var res = utils.parseAttrVal(attrVal);

                function bind(widget) {
                    scope.$watch(res.expr, function (newValue) {
                        if (widget.get(name) !== newValue)
                            widget.set(name, newValue);
                    }, res.watchByValue);
                    if (res.onChange)
                        widget.watch(name, function () {
                            var equals = res.watchByValue ? angular.equals : utils.equalReferences;
                            var widgetValue = widget.get(name);
                            if (!equals(res.getValue(scope), widgetValue)) {
                                res.onChange(scope, {$newValue: widgetValue});
                                if (!$rootScope.$$phase) {
                                    scope.$apply();
                                }
                            }
                        });
                }

                return {
                    initialValue: res.getValue(scope),
                    bind: bind
                };
            }
        };

        var bindStoreAttr = {
            matches: utils.hasPrefix("bindStore"),
            realName: utils.withoutPrefix("bindStore"),
            apply: function (name, expr, scope) {
                var getValue = $parse(expr);

                function asStore(arrayValue) {
                    return new Memory({data: arrayValue});
                }

                function bind(widget) {
                    scope.$watch(expr, function (newValue, oldValue) {
                        if (newValue !== oldValue)  // ignore initial run
                            widget.set(name, asStore(newValue));
                    });
                  }

                return {
                    initialValue: asStore(getValue(scope)),
                    bind: bind
                };
            }
        };

        var bindFnAttr = {
            matches: utils.hasPrefix("bindFn"),
            realName: utils.withoutPrefix("bindFn"),
            apply: function (name, expr, scope) {
                var getValue = $parse(expr);

                function execute() {
                    var result = getValue(scope, {$args: arguments});
                    if (!$rootScope.$$phase) {
                        scope.$apply();
                    }
                    return result;
                }

                return {
                    initialValue: execute,
                    bind: utils.noop
                }
            }
        };

        // Special parameter handling needed for IE
        var classAttr = {
            matches: function (name) {
                return name === 'class'
            },
            realName: utils.id,
            apply: function (name, expr, scope, Widget, element) {
                var node = element[0];
                return {
                    initialValue: node.className,
                    bind: utils.noop
                };
            }
        };

        // Special parameter handling needed for IE
        var styleAttr = {
            matches: function (name) {
                return name === 'style'
            },
            realName: utils.id,
            apply: function (name, expr, scope, Widget, element) {
                var node = element[0];
                return {
                    initialValue: node.style && node.style.cssText,
                    bind: utils.noop
                };
            }
        };

        var stdAttr = {
            matches: utils.id,
            realName: utils.id,
            apply: function (name, expr, scope, Widget) {

                function getValue() {
                    var proto = Widget && Widget.prototype;

                    if (name in proto) {
                        switch (typeof proto[name]) {
                            case "string":
                                return expr;
                            case "number":
                                return (typeof expr == "number") ? expr : (expr.length ? Number(value) : NaN);
                            case "boolean":
                                return (typeof expr == "string") ? expr.toLowerCase() != "false" : expr;
                            case "function":
                                // we deliberately won't deal with this
                                throw "property " + name + " of Widget " + proto + "should be set using function binding";
                            default:
                                var pVal = proto[name];
                                return (pVal && "length" in pVal) ? (expr ? expr.split(/\s*,\s*/) : []) :  // array
                                    (pVal instanceof Date) ?
                                        (expr == "" ? new Date("") :   // the NaN of dates
                                            expr == "now" ? new Date() :   // current date
                                                dates.fromISOString(expr)) :
                                        eval(expr);
                        }
                    }
                }

                return {
                    initialValue: getValue(),
                    bind: utils.noop
                };
            }
        };

        var attrHandlers = [bindFnAttr, bindStoreAttr, bindOnewayAttr, bindAttr, classAttr, styleAttr, stdAttr];

        function ignoreAttribute(name) {
            return name[0] === '$' || name === 'bindDojoType' || name === "dojoProps";
        }

        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var Widget = getWidgetCtor(attrs, element),
                    widget = null,
                    dojoProps = null,
                    props = {}, binders = [];

                var attr, i, attrHandler;

                // go through all attributes, get initialValues and callbacks to establish bindings.
                for (attr in attrs) {
                    if (ignoreAttribute(attr))
                        continue;

                    for (i = 0; i < attrHandlers.length; i++) {
                        attrHandler = attrHandlers[i];

                        if (attrHandler.matches(attr)) {
                            var realName = attrHandler.realName(attr),
                                value = attrHandler.apply(realName, attrs[attr], scope, Widget, element);

                            props[realName] = value.initialValue;
                            binders.push(value.bind);

                            break;
                        }
                    }
                }

                // dojoProps may overwrite initialValues
                if (attrs['dojoProps']) {
                    dojoProps = $parse('{' + attrs['dojoProps'] + '}')(scope) || {};
                    angular.extend(props, dojoProps);
                }

                // create widget and eventually start
                widget = new Widget(props, element[0]);
                if (typeof widget.startup === "function" && !widget._started) {
                    widget.startup();
                }

                // establish bindings
                for (i = 0; i < binders.length; i++) {
                    binders[i](widget);
                }

                // destroy widget when scope is destroyed
                scope.$on('$destroy', function () {
                    widget.destroy(true); // leave DOM structure untouched
                });
            }
        }
    }]);

