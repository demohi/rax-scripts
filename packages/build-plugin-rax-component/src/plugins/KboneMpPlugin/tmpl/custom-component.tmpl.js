/* global Component */

const mp = require("miniprogram-render");

const { Event, cache, tool } = mp.$$adapter;

function checkComponentAttr({ props = [] }, name, domNode, destData, oldData) {
  if (props.length) {
    for (const name of props) {
      const newValue = domNode.getAttribute(name);
      if (!oldData || oldData[name] !== newValue) destData[name] = newValue;
    }
  }

  const newId = domNode.id;
  if (!oldData || oldData.id !== newId) destData.id = newId;
  const newClass = `wx-comp-${name} node-${
    domNode.$$nodeId
  } ${domNode.className || ""}`;
  if (!oldData || oldData.class !== newClass) destData.class = newClass;
  const newStyle = domNode.style.cssText;
  if (!oldData || oldData.style !== newStyle) destData.style = newStyle;
}

Component({
  properties: {
    name: {
      type: String,
      value: "",
    },
  },
  options: {
    addGlobalClass: true, 
  },
  attached() {
    const nodeId = this.dataset.privateNodeId;
    const pageId = this.dataset.privatePageId;
    const data = {};

    this.nodeId = nodeId;
    this.pageId = pageId;

    this.domNode = cache.getNode(pageId, nodeId);

    const config = cache.getConfig();
    this.compConfig =
      (config.runtime &&
        config.runtime.usingComponents &&
        config.runtime.usingComponents[this.domNode.behavior]) ||
      {};

    this.onSelfNodeUpdate = tool.throttle(this.onSelfNodeUpdate.bind(this));
    this.domNode.$$clearEvent("$$domNodeUpdate");
    this.domNode.addEventListener("$$domNodeUpdate", this.onSelfNodeUpdate);

    const { events = [] } = this.compConfig;
    if (events.length) {
      for (const name of events) {
        this[`on${name}`] = evt => this.callSimpleEvent(name, evt);
      }
    }

    checkComponentAttr(
      this.compConfig,
      this.domNode.behavior,
      this.domNode,
      data,
    );

    if (Object.keys(data).length) this.setData(data);
  },
  detached() {
    this.nodeId = null;
    this.pageId = null;
    this.domNode = null;
  },
  methods: {
    onSelfNodeUpdate() {
      if (!this.pageId || !this.nodeId) return;

      const newData = {};

      checkComponentAttr(
        this.compConfig,
        this.domNode.behavior,
        this.domNode,
        newData,
        this.data,
      );

      this.setData(newData);
    },

    callSimpleEvent(eventName, evt) {
      const domNode = this.domNode;
      if (!domNode) return;

      domNode.$$trigger(eventName, {
        event: new Event({
          name: eventName,
          target: domNode,
          eventPhase: Event.AT_TARGET,
          detail: evt && evt.detail,
        }),
        currentTarget: domNode,
      });
    },
  },
});
