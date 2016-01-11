define([
        "dojo/_base/declare",
        "dojo/dom-style"],
    function (declare, domStyle) {
        return declare([], {
            _setVisibleAttr: function (value) {
                this._set("visible", value);
                if (!value) {
                    domStyle.set(this.domNode, "display", "none");
                }
                else
                    domStyle.set(this.domNode, "display", this.visibleDisplayType || "inline-block");
            }
        });
    });
