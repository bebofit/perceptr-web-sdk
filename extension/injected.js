"use strict";
(() => {
  var __require = /* @__PURE__ */ ((x2) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x2, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x2)(function(x2) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x2 + '" is not supported');
  });

  // ../node_modules/rrweb/es/rrweb/packages/rrweb-snapshot/es/rrweb-snapshot.js
  var NodeType;
  (function(NodeType2) {
    NodeType2[NodeType2["Document"] = 0] = "Document";
    NodeType2[NodeType2["DocumentType"] = 1] = "DocumentType";
    NodeType2[NodeType2["Element"] = 2] = "Element";
    NodeType2[NodeType2["Text"] = 3] = "Text";
    NodeType2[NodeType2["CDATA"] = 4] = "CDATA";
    NodeType2[NodeType2["Comment"] = 5] = "Comment";
  })(NodeType || (NodeType = {}));
  function isElement(n2) {
    return n2.nodeType === n2.ELEMENT_NODE;
  }
  function isShadowRoot(n2) {
    var host2 = n2 === null || n2 === void 0 ? void 0 : n2.host;
    return Boolean((host2 === null || host2 === void 0 ? void 0 : host2.shadowRoot) === n2);
  }
  function isNativeShadowDom(shadowRoot2) {
    return Object.prototype.toString.call(shadowRoot2) === "[object ShadowRoot]";
  }
  function fixBrowserCompatibilityIssuesInCSS(cssText) {
    if (cssText.includes(" background-clip: text;") && !cssText.includes(" -webkit-background-clip: text;")) {
      cssText = cssText.replace(" background-clip: text;", " -webkit-background-clip: text; background-clip: text;");
    }
    return cssText;
  }
  function getCssRulesString(s) {
    try {
      var rules = s.rules || s.cssRules;
      return rules ? fixBrowserCompatibilityIssuesInCSS(Array.from(rules).map(getCssRuleString).join("")) : null;
    } catch (error) {
      return null;
    }
  }
  function getCssRuleString(rule2) {
    var cssStringified = rule2.cssText;
    if (isCSSImportRule(rule2)) {
      try {
        cssStringified = getCssRulesString(rule2.styleSheet) || cssStringified;
      } catch (_a2) {
      }
    }
    return cssStringified;
  }
  function isCSSImportRule(rule2) {
    return "styleSheet" in rule2;
  }
  var Mirror = function() {
    function Mirror3() {
      this.idNodeMap = /* @__PURE__ */ new Map();
      this.nodeMetaMap = /* @__PURE__ */ new WeakMap();
    }
    Mirror3.prototype.getId = function(n2) {
      var _a2;
      if (!n2)
        return -1;
      var id = (_a2 = this.getMeta(n2)) === null || _a2 === void 0 ? void 0 : _a2.id;
      return id !== null && id !== void 0 ? id : -1;
    };
    Mirror3.prototype.getNode = function(id) {
      return this.idNodeMap.get(id) || null;
    };
    Mirror3.prototype.getIds = function() {
      return Array.from(this.idNodeMap.keys());
    };
    Mirror3.prototype.getMeta = function(n2) {
      return this.nodeMetaMap.get(n2) || null;
    };
    Mirror3.prototype.removeNodeFromMap = function(n2) {
      var _this = this;
      var id = this.getId(n2);
      this.idNodeMap["delete"](id);
      if (n2.childNodes) {
        n2.childNodes.forEach(function(childNode) {
          return _this.removeNodeFromMap(childNode);
        });
      }
    };
    Mirror3.prototype.has = function(id) {
      return this.idNodeMap.has(id);
    };
    Mirror3.prototype.hasNode = function(node2) {
      return this.nodeMetaMap.has(node2);
    };
    Mirror3.prototype.add = function(n2, meta) {
      var id = meta.id;
      this.idNodeMap.set(id, n2);
      this.nodeMetaMap.set(n2, meta);
    };
    Mirror3.prototype.replace = function(id, n2) {
      var oldNode = this.getNode(id);
      if (oldNode) {
        var meta = this.nodeMetaMap.get(oldNode);
        if (meta)
          this.nodeMetaMap.set(n2, meta);
      }
      this.idNodeMap.set(id, n2);
    };
    Mirror3.prototype.reset = function() {
      this.idNodeMap = /* @__PURE__ */ new Map();
      this.nodeMetaMap = /* @__PURE__ */ new WeakMap();
    };
    return Mirror3;
  }();
  function createMirror() {
    return new Mirror();
  }
  function maskInputValue(_a2) {
    var maskInputOptions = _a2.maskInputOptions, tagName = _a2.tagName, type = _a2.type, value = _a2.value, maskInputFn = _a2.maskInputFn;
    var text = value || "";
    if (maskInputOptions[tagName.toLowerCase()] || maskInputOptions[type]) {
      if (maskInputFn) {
        text = maskInputFn(text);
      } else {
        text = "*".repeat(text.length);
      }
    }
    return text;
  }
  var ORIGINAL_ATTRIBUTE_NAME = "__rrweb_original__";
  function is2DCanvasBlank(canvas) {
    var ctx = canvas.getContext("2d");
    if (!ctx)
      return true;
    var chunkSize = 50;
    for (var x2 = 0; x2 < canvas.width; x2 += chunkSize) {
      for (var y = 0; y < canvas.height; y += chunkSize) {
        var getImageData = ctx.getImageData;
        var originalGetImageData = ORIGINAL_ATTRIBUTE_NAME in getImageData ? getImageData[ORIGINAL_ATTRIBUTE_NAME] : getImageData;
        var pixelBuffer = new Uint32Array(originalGetImageData.call(ctx, x2, y, Math.min(chunkSize, canvas.width - x2), Math.min(chunkSize, canvas.height - y)).data.buffer);
        if (pixelBuffer.some(function(pixel) {
          return pixel !== 0;
        }))
          return false;
      }
    }
    return true;
  }
  var _id = 1;
  var tagNameRegex = new RegExp("[^a-z0-9-_:]");
  var IGNORED_NODE = -2;
  function genId() {
    return _id++;
  }
  function getValidTagName(element) {
    if (element instanceof HTMLFormElement) {
      return "form";
    }
    var processedTagName = element.tagName.toLowerCase().trim();
    if (tagNameRegex.test(processedTagName)) {
      return "div";
    }
    return processedTagName;
  }
  function stringifyStyleSheet(sheet) {
    return sheet.cssRules ? Array.from(sheet.cssRules).map(function(rule2) {
      return rule2.cssText || "";
    }).join("") : "";
  }
  function extractOrigin(url) {
    var origin = "";
    if (url.indexOf("//") > -1) {
      origin = url.split("/").slice(0, 3).join("/");
    } else {
      origin = url.split("/")[0];
    }
    origin = origin.split("?")[0];
    return origin;
  }
  var canvasService;
  var canvasCtx;
  var URL_IN_CSS_REF = /url\((?:(')([^']*)'|(")(.*?)"|([^)]*))\)/gm;
  var RELATIVE_PATH = /^(?!www\.|(?:http|ftp)s?:\/\/|[A-Za-z]:\\|\/\/|#).*/;
  var DATA_URI = /^(data:)([^,]*),(.*)/i;
  function absoluteToStylesheet(cssText, href) {
    return (cssText || "").replace(URL_IN_CSS_REF, function(origin, quote1, path1, quote2, path2, path3) {
      var filePath = path1 || path2 || path3;
      var maybeQuote = quote1 || quote2 || "";
      if (!filePath) {
        return origin;
      }
      if (!RELATIVE_PATH.test(filePath)) {
        return "url(".concat(maybeQuote).concat(filePath).concat(maybeQuote, ")");
      }
      if (DATA_URI.test(filePath)) {
        return "url(".concat(maybeQuote).concat(filePath).concat(maybeQuote, ")");
      }
      if (filePath[0] === "/") {
        return "url(".concat(maybeQuote).concat(extractOrigin(href) + filePath).concat(maybeQuote, ")");
      }
      var stack = href.split("/");
      var parts = filePath.split("/");
      stack.pop();
      for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
        var part = parts_1[_i];
        if (part === ".") {
          continue;
        } else if (part === "..") {
          stack.pop();
        } else {
          stack.push(part);
        }
      }
      return "url(".concat(maybeQuote).concat(stack.join("/")).concat(maybeQuote, ")");
    });
  }
  var SRCSET_NOT_SPACES = /^[^ \t\n\r\u000c]+/;
  var SRCSET_COMMAS_OR_SPACES = /^[, \t\n\r\u000c]+/;
  function getAbsoluteSrcsetString(doc, attributeValue) {
    if (attributeValue.trim() === "") {
      return attributeValue;
    }
    var pos = 0;
    function collectCharacters(regEx) {
      var chars3;
      var match = regEx.exec(attributeValue.substring(pos));
      if (match) {
        chars3 = match[0];
        pos += chars3.length;
        return chars3;
      }
      return "";
    }
    var output = [];
    while (true) {
      collectCharacters(SRCSET_COMMAS_OR_SPACES);
      if (pos >= attributeValue.length) {
        break;
      }
      var url = collectCharacters(SRCSET_NOT_SPACES);
      if (url.slice(-1) === ",") {
        url = absoluteToDoc(doc, url.substring(0, url.length - 1));
        output.push(url);
      } else {
        var descriptorsStr = "";
        url = absoluteToDoc(doc, url);
        var inParens = false;
        while (true) {
          var c = attributeValue.charAt(pos);
          if (c === "") {
            output.push((url + descriptorsStr).trim());
            break;
          } else if (!inParens) {
            if (c === ",") {
              pos += 1;
              output.push((url + descriptorsStr).trim());
              break;
            } else if (c === "(") {
              inParens = true;
            }
          } else {
            if (c === ")") {
              inParens = false;
            }
          }
          descriptorsStr += c;
          pos += 1;
        }
      }
    }
    return output.join(", ");
  }
  function absoluteToDoc(doc, attributeValue) {
    if (!attributeValue || attributeValue.trim() === "") {
      return attributeValue;
    }
    var a = doc.createElement("a");
    a.href = attributeValue;
    return a.href;
  }
  function isSVGElement(el) {
    return Boolean(el.tagName === "svg" || el.ownerSVGElement);
  }
  function getHref() {
    var a = document.createElement("a");
    a.href = "";
    return a.href;
  }
  function transformAttribute(doc, tagName, name, value) {
    if (name === "src" || name === "href" && value && !(tagName === "use" && value[0] === "#")) {
      return absoluteToDoc(doc, value);
    } else if (name === "xlink:href" && value && value[0] !== "#") {
      return absoluteToDoc(doc, value);
    } else if (name === "background" && value && (tagName === "table" || tagName === "td" || tagName === "th")) {
      return absoluteToDoc(doc, value);
    } else if (name === "srcset" && value) {
      return getAbsoluteSrcsetString(doc, value);
    } else if (name === "style" && value) {
      return absoluteToStylesheet(value, getHref());
    } else if (tagName === "object" && name === "data" && value) {
      return absoluteToDoc(doc, value);
    } else {
      return value;
    }
  }
  function _isBlockedElement(element, blockClass, blockSelector) {
    if (typeof blockClass === "string") {
      if (element.classList.contains(blockClass)) {
        return true;
      }
    } else {
      for (var eIndex = element.classList.length; eIndex--; ) {
        var className = element.classList[eIndex];
        if (blockClass.test(className)) {
          return true;
        }
      }
    }
    if (blockSelector) {
      return element.matches(blockSelector);
    }
    return false;
  }
  function classMatchesRegex(node2, regex, checkAncestors) {
    if (!node2)
      return false;
    if (node2.nodeType !== node2.ELEMENT_NODE) {
      if (!checkAncestors)
        return false;
      return classMatchesRegex(node2.parentNode, regex, checkAncestors);
    }
    for (var eIndex = node2.classList.length; eIndex--; ) {
      var className = node2.classList[eIndex];
      if (regex.test(className)) {
        return true;
      }
    }
    if (!checkAncestors)
      return false;
    return classMatchesRegex(node2.parentNode, regex, checkAncestors);
  }
  function needMaskingText(node2, maskTextClass, maskTextSelector) {
    var el = node2.nodeType === node2.ELEMENT_NODE ? node2 : node2.parentElement;
    if (el === null)
      return false;
    if (typeof maskTextClass === "string") {
      if (el.classList.contains(maskTextClass))
        return true;
      if (el.closest(".".concat(maskTextClass)))
        return true;
    } else {
      if (classMatchesRegex(el, maskTextClass, true))
        return true;
    }
    if (maskTextSelector) {
      if (el.matches(maskTextSelector))
        return true;
      if (el.closest(maskTextSelector))
        return true;
    }
    return false;
  }
  function onceIframeLoaded(iframeEl, listener, iframeLoadTimeout) {
    var win = iframeEl.contentWindow;
    if (!win) {
      return;
    }
    var fired = false;
    var readyState;
    try {
      readyState = win.document.readyState;
    } catch (error) {
      return;
    }
    if (readyState !== "complete") {
      var timer_1 = setTimeout(function() {
        if (!fired) {
          listener();
          fired = true;
        }
      }, iframeLoadTimeout);
      iframeEl.addEventListener("load", function() {
        clearTimeout(timer_1);
        fired = true;
        listener();
      });
      return;
    }
    var blankUrl = "about:blank";
    if (win.location.href !== blankUrl || iframeEl.src === blankUrl || iframeEl.src === "") {
      setTimeout(listener, 0);
      return iframeEl.addEventListener("load", listener);
    }
    iframeEl.addEventListener("load", listener);
  }
  function onceStylesheetLoaded(link, listener, styleSheetLoadTimeout) {
    var fired = false;
    var styleSheetLoaded;
    try {
      styleSheetLoaded = link.sheet;
    } catch (error) {
      return;
    }
    if (styleSheetLoaded)
      return;
    var timer = setTimeout(function() {
      if (!fired) {
        listener();
        fired = true;
      }
    }, styleSheetLoadTimeout);
    link.addEventListener("load", function() {
      clearTimeout(timer);
      fired = true;
      listener();
    });
  }
  function serializeNode(n2, options) {
    var doc = options.doc, mirror2 = options.mirror, blockClass = options.blockClass, blockSelector = options.blockSelector, maskTextClass = options.maskTextClass, maskTextSelector = options.maskTextSelector, inlineStylesheet = options.inlineStylesheet, _a2 = options.maskInputOptions, maskInputOptions = _a2 === void 0 ? {} : _a2, maskTextFn = options.maskTextFn, maskInputFn = options.maskInputFn, _b = options.dataURLOptions, dataURLOptions = _b === void 0 ? {} : _b, inlineImages = options.inlineImages, recordCanvas = options.recordCanvas, keepIframeSrcFn = options.keepIframeSrcFn, _c = options.newlyAddedElement, newlyAddedElement = _c === void 0 ? false : _c;
    var rootId = getRootId(doc, mirror2);
    switch (n2.nodeType) {
      case n2.DOCUMENT_NODE:
        if (n2.compatMode !== "CSS1Compat") {
          return {
            type: NodeType.Document,
            childNodes: [],
            compatMode: n2.compatMode
          };
        } else {
          return {
            type: NodeType.Document,
            childNodes: []
          };
        }
      case n2.DOCUMENT_TYPE_NODE:
        return {
          type: NodeType.DocumentType,
          name: n2.name,
          publicId: n2.publicId,
          systemId: n2.systemId,
          rootId
        };
      case n2.ELEMENT_NODE:
        return serializeElementNode(n2, {
          doc,
          blockClass,
          blockSelector,
          inlineStylesheet,
          maskInputOptions,
          maskInputFn,
          dataURLOptions,
          inlineImages,
          recordCanvas,
          keepIframeSrcFn,
          newlyAddedElement,
          rootId
        });
      case n2.TEXT_NODE:
        return serializeTextNode(n2, {
          maskTextClass,
          maskTextSelector,
          maskTextFn,
          rootId
        });
      case n2.CDATA_SECTION_NODE:
        return {
          type: NodeType.CDATA,
          textContent: "",
          rootId
        };
      case n2.COMMENT_NODE:
        return {
          type: NodeType.Comment,
          textContent: n2.textContent || "",
          rootId
        };
      default:
        return false;
    }
  }
  function getRootId(doc, mirror2) {
    if (!mirror2.hasNode(doc))
      return void 0;
    var docId = mirror2.getId(doc);
    return docId === 1 ? void 0 : docId;
  }
  function serializeTextNode(n2, options) {
    var _a2;
    var maskTextClass = options.maskTextClass, maskTextSelector = options.maskTextSelector, maskTextFn = options.maskTextFn, rootId = options.rootId;
    var parentTagName = n2.parentNode && n2.parentNode.tagName;
    var textContent2 = n2.textContent;
    var isStyle = parentTagName === "STYLE" ? true : void 0;
    var isScript = parentTagName === "SCRIPT" ? true : void 0;
    if (isStyle && textContent2) {
      try {
        if (n2.nextSibling || n2.previousSibling) {
        } else if ((_a2 = n2.parentNode.sheet) === null || _a2 === void 0 ? void 0 : _a2.cssRules) {
          textContent2 = stringifyStyleSheet(n2.parentNode.sheet);
        }
      } catch (err) {
        console.warn("Cannot get CSS styles from text's parentNode. Error: ".concat(err), n2);
      }
      textContent2 = absoluteToStylesheet(textContent2, getHref());
    }
    if (isScript) {
      textContent2 = "SCRIPT_PLACEHOLDER";
    }
    if (!isStyle && !isScript && textContent2 && needMaskingText(n2, maskTextClass, maskTextSelector)) {
      textContent2 = maskTextFn ? maskTextFn(textContent2) : textContent2.replace(/[\S]/g, "*");
    }
    return {
      type: NodeType.Text,
      textContent: textContent2 || "",
      isStyle,
      rootId
    };
  }
  function serializeElementNode(n2, options) {
    var doc = options.doc, blockClass = options.blockClass, blockSelector = options.blockSelector, inlineStylesheet = options.inlineStylesheet, _a2 = options.maskInputOptions, maskInputOptions = _a2 === void 0 ? {} : _a2, maskInputFn = options.maskInputFn, _b = options.dataURLOptions, dataURLOptions = _b === void 0 ? {} : _b, inlineImages = options.inlineImages, recordCanvas = options.recordCanvas, keepIframeSrcFn = options.keepIframeSrcFn, _c = options.newlyAddedElement, newlyAddedElement = _c === void 0 ? false : _c, rootId = options.rootId;
    var needBlock = _isBlockedElement(n2, blockClass, blockSelector);
    var tagName = getValidTagName(n2);
    var attributes = {};
    var len = n2.attributes.length;
    for (var i = 0; i < len; i++) {
      var attr = n2.attributes[i];
      attributes[attr.name] = transformAttribute(doc, tagName, attr.name, attr.value);
    }
    if (tagName === "link" && inlineStylesheet) {
      var stylesheet = Array.from(doc.styleSheets).find(function(s) {
        return s.href === n2.href;
      });
      var cssText = null;
      if (stylesheet) {
        cssText = getCssRulesString(stylesheet);
      }
      if (cssText) {
        delete attributes.rel;
        delete attributes.href;
        attributes._cssText = absoluteToStylesheet(cssText, stylesheet.href);
      }
    }
    if (tagName === "style" && n2.sheet && !(n2.innerText || n2.textContent || "").trim().length) {
      var cssText = getCssRulesString(n2.sheet);
      if (cssText) {
        attributes._cssText = absoluteToStylesheet(cssText, getHref());
      }
    }
    if (tagName === "input" || tagName === "textarea" || tagName === "select") {
      var value = n2.value;
      var checked = n2.checked;
      if (attributes.type !== "radio" && attributes.type !== "checkbox" && attributes.type !== "submit" && attributes.type !== "button" && value) {
        attributes.value = maskInputValue({
          type: attributes.type,
          tagName,
          value,
          maskInputOptions,
          maskInputFn
        });
      } else if (checked) {
        attributes.checked = checked;
      }
    }
    if (tagName === "option") {
      if (n2.selected && !maskInputOptions["select"]) {
        attributes.selected = true;
      } else {
        delete attributes.selected;
      }
    }
    if (tagName === "canvas" && recordCanvas) {
      if (n2.__context === "2d") {
        if (!is2DCanvasBlank(n2)) {
          attributes.rr_dataURL = n2.toDataURL(dataURLOptions.type, dataURLOptions.quality);
        }
      } else if (!("__context" in n2)) {
        var canvasDataURL = n2.toDataURL(dataURLOptions.type, dataURLOptions.quality);
        var blankCanvas = document.createElement("canvas");
        blankCanvas.width = n2.width;
        blankCanvas.height = n2.height;
        var blankCanvasDataURL = blankCanvas.toDataURL(dataURLOptions.type, dataURLOptions.quality);
        if (canvasDataURL !== blankCanvasDataURL) {
          attributes.rr_dataURL = canvasDataURL;
        }
      }
    }
    if (tagName === "img" && inlineImages) {
      if (!canvasService) {
        canvasService = doc.createElement("canvas");
        canvasCtx = canvasService.getContext("2d");
      }
      var image_1 = n2;
      var oldValue_1 = image_1.crossOrigin;
      image_1.crossOrigin = "anonymous";
      var recordInlineImage = function() {
        try {
          canvasService.width = image_1.naturalWidth;
          canvasService.height = image_1.naturalHeight;
          canvasCtx.drawImage(image_1, 0, 0);
          attributes.rr_dataURL = canvasService.toDataURL(dataURLOptions.type, dataURLOptions.quality);
        } catch (err) {
          console.warn("Cannot inline img src=".concat(image_1.currentSrc, "! Error: ").concat(err));
        }
        oldValue_1 ? attributes.crossOrigin = oldValue_1 : image_1.removeAttribute("crossorigin");
      };
      if (image_1.complete && image_1.naturalWidth !== 0)
        recordInlineImage();
      else
        image_1.onload = recordInlineImage;
    }
    if (tagName === "audio" || tagName === "video") {
      attributes.rr_mediaState = n2.paused ? "paused" : "played";
      attributes.rr_mediaCurrentTime = n2.currentTime;
    }
    if (!newlyAddedElement) {
      if (n2.scrollLeft) {
        attributes.rr_scrollLeft = n2.scrollLeft;
      }
      if (n2.scrollTop) {
        attributes.rr_scrollTop = n2.scrollTop;
      }
    }
    if (needBlock) {
      var _d = n2.getBoundingClientRect(), width = _d.width, height = _d.height;
      attributes = {
        "class": attributes["class"],
        rr_width: "".concat(width, "px"),
        rr_height: "".concat(height, "px")
      };
    }
    if (tagName === "iframe" && !keepIframeSrcFn(attributes.src)) {
      if (!n2.contentDocument) {
        attributes.rr_src = attributes.src;
      }
      delete attributes.src;
    }
    return {
      type: NodeType.Element,
      tagName,
      attributes,
      childNodes: [],
      isSVG: isSVGElement(n2) || void 0,
      needBlock,
      rootId
    };
  }
  function lowerIfExists(maybeAttr) {
    if (maybeAttr === void 0) {
      return "";
    } else {
      return maybeAttr.toLowerCase();
    }
  }
  function slimDOMExcluded(sn, slimDOMOptions) {
    if (slimDOMOptions.comment && sn.type === NodeType.Comment) {
      return true;
    } else if (sn.type === NodeType.Element) {
      if (slimDOMOptions.script && (sn.tagName === "script" || sn.tagName === "link" && sn.attributes.rel === "preload" && sn.attributes.as === "script" || sn.tagName === "link" && sn.attributes.rel === "prefetch" && typeof sn.attributes.href === "string" && sn.attributes.href.endsWith(".js"))) {
        return true;
      } else if (slimDOMOptions.headFavicon && (sn.tagName === "link" && sn.attributes.rel === "shortcut icon" || sn.tagName === "meta" && (lowerIfExists(sn.attributes.name).match(/^msapplication-tile(image|color)$/) || lowerIfExists(sn.attributes.name) === "application-name" || lowerIfExists(sn.attributes.rel) === "icon" || lowerIfExists(sn.attributes.rel) === "apple-touch-icon" || lowerIfExists(sn.attributes.rel) === "shortcut icon"))) {
        return true;
      } else if (sn.tagName === "meta") {
        if (slimDOMOptions.headMetaDescKeywords && lowerIfExists(sn.attributes.name).match(/^description|keywords$/)) {
          return true;
        } else if (slimDOMOptions.headMetaSocial && (lowerIfExists(sn.attributes.property).match(/^(og|twitter|fb):/) || lowerIfExists(sn.attributes.name).match(/^(og|twitter):/) || lowerIfExists(sn.attributes.name) === "pinterest")) {
          return true;
        } else if (slimDOMOptions.headMetaRobots && (lowerIfExists(sn.attributes.name) === "robots" || lowerIfExists(sn.attributes.name) === "googlebot" || lowerIfExists(sn.attributes.name) === "bingbot")) {
          return true;
        } else if (slimDOMOptions.headMetaHttpEquiv && sn.attributes["http-equiv"] !== void 0) {
          return true;
        } else if (slimDOMOptions.headMetaAuthorship && (lowerIfExists(sn.attributes.name) === "author" || lowerIfExists(sn.attributes.name) === "generator" || lowerIfExists(sn.attributes.name) === "framework" || lowerIfExists(sn.attributes.name) === "publisher" || lowerIfExists(sn.attributes.name) === "progid" || lowerIfExists(sn.attributes.property).match(/^article:/) || lowerIfExists(sn.attributes.property).match(/^product:/))) {
          return true;
        } else if (slimDOMOptions.headMetaVerification && (lowerIfExists(sn.attributes.name) === "google-site-verification" || lowerIfExists(sn.attributes.name) === "yandex-verification" || lowerIfExists(sn.attributes.name) === "csrf-token" || lowerIfExists(sn.attributes.name) === "p:domain_verify" || lowerIfExists(sn.attributes.name) === "verify-v1" || lowerIfExists(sn.attributes.name) === "verification" || lowerIfExists(sn.attributes.name) === "shopify-checkout-api-token")) {
          return true;
        }
      }
    }
    return false;
  }
  function serializeNodeWithId(n2, options) {
    var doc = options.doc, mirror2 = options.mirror, blockClass = options.blockClass, blockSelector = options.blockSelector, maskTextClass = options.maskTextClass, maskTextSelector = options.maskTextSelector, _a2 = options.skipChild, skipChild = _a2 === void 0 ? false : _a2, _b = options.inlineStylesheet, inlineStylesheet = _b === void 0 ? true : _b, _c = options.maskInputOptions, maskInputOptions = _c === void 0 ? {} : _c, maskTextFn = options.maskTextFn, maskInputFn = options.maskInputFn, slimDOMOptions = options.slimDOMOptions, _d = options.dataURLOptions, dataURLOptions = _d === void 0 ? {} : _d, _e = options.inlineImages, inlineImages = _e === void 0 ? false : _e, _f = options.recordCanvas, recordCanvas = _f === void 0 ? false : _f, onSerialize = options.onSerialize, onIframeLoad = options.onIframeLoad, _g = options.iframeLoadTimeout, iframeLoadTimeout = _g === void 0 ? 5e3 : _g, onStylesheetLoad = options.onStylesheetLoad, _h = options.stylesheetLoadTimeout, stylesheetLoadTimeout = _h === void 0 ? 5e3 : _h, _j = options.keepIframeSrcFn, keepIframeSrcFn = _j === void 0 ? function() {
      return false;
    } : _j, _k = options.newlyAddedElement, newlyAddedElement = _k === void 0 ? false : _k;
    var _l = options.preserveWhiteSpace, preserveWhiteSpace = _l === void 0 ? true : _l;
    var _serializedNode = serializeNode(n2, {
      doc,
      mirror: mirror2,
      blockClass,
      blockSelector,
      maskTextClass,
      maskTextSelector,
      inlineStylesheet,
      maskInputOptions,
      maskTextFn,
      maskInputFn,
      dataURLOptions,
      inlineImages,
      recordCanvas,
      keepIframeSrcFn,
      newlyAddedElement
    });
    if (!_serializedNode) {
      console.warn(n2, "not serialized");
      return null;
    }
    var id;
    if (mirror2.hasNode(n2)) {
      id = mirror2.getId(n2);
    } else if (slimDOMExcluded(_serializedNode, slimDOMOptions) || !preserveWhiteSpace && _serializedNode.type === NodeType.Text && !_serializedNode.isStyle && !_serializedNode.textContent.replace(/^\s+|\s+$/gm, "").length) {
      id = IGNORED_NODE;
    } else {
      id = genId();
    }
    var serializedNode = Object.assign(_serializedNode, { id });
    mirror2.add(n2, serializedNode);
    if (id === IGNORED_NODE) {
      return null;
    }
    if (onSerialize) {
      onSerialize(n2);
    }
    var recordChild = !skipChild;
    if (serializedNode.type === NodeType.Element) {
      recordChild = recordChild && !serializedNode.needBlock;
      delete serializedNode.needBlock;
      var shadowRoot2 = n2.shadowRoot;
      if (shadowRoot2 && isNativeShadowDom(shadowRoot2))
        serializedNode.isShadowHost = true;
    }
    if ((serializedNode.type === NodeType.Document || serializedNode.type === NodeType.Element) && recordChild) {
      if (slimDOMOptions.headWhitespace && serializedNode.type === NodeType.Element && serializedNode.tagName === "head") {
        preserveWhiteSpace = false;
      }
      var bypassOptions = {
        doc,
        mirror: mirror2,
        blockClass,
        blockSelector,
        maskTextClass,
        maskTextSelector,
        skipChild,
        inlineStylesheet,
        maskInputOptions,
        maskTextFn,
        maskInputFn,
        slimDOMOptions,
        dataURLOptions,
        inlineImages,
        recordCanvas,
        preserveWhiteSpace,
        onSerialize,
        onIframeLoad,
        iframeLoadTimeout,
        onStylesheetLoad,
        stylesheetLoadTimeout,
        keepIframeSrcFn
      };
      for (var _i = 0, _m = Array.from(n2.childNodes); _i < _m.length; _i++) {
        var childN = _m[_i];
        var serializedChildNode = serializeNodeWithId(childN, bypassOptions);
        if (serializedChildNode) {
          serializedNode.childNodes.push(serializedChildNode);
        }
      }
      if (isElement(n2) && n2.shadowRoot) {
        for (var _o = 0, _p = Array.from(n2.shadowRoot.childNodes); _o < _p.length; _o++) {
          var childN = _p[_o];
          var serializedChildNode = serializeNodeWithId(childN, bypassOptions);
          if (serializedChildNode) {
            isNativeShadowDom(n2.shadowRoot) && (serializedChildNode.isShadow = true);
            serializedNode.childNodes.push(serializedChildNode);
          }
        }
      }
    }
    if (n2.parentNode && isShadowRoot(n2.parentNode) && isNativeShadowDom(n2.parentNode)) {
      serializedNode.isShadow = true;
    }
    if (serializedNode.type === NodeType.Element && serializedNode.tagName === "iframe") {
      onceIframeLoaded(n2, function() {
        var iframeDoc = n2.contentDocument;
        if (iframeDoc && onIframeLoad) {
          var serializedIframeNode = serializeNodeWithId(iframeDoc, {
            doc: iframeDoc,
            mirror: mirror2,
            blockClass,
            blockSelector,
            maskTextClass,
            maskTextSelector,
            skipChild: false,
            inlineStylesheet,
            maskInputOptions,
            maskTextFn,
            maskInputFn,
            slimDOMOptions,
            dataURLOptions,
            inlineImages,
            recordCanvas,
            preserveWhiteSpace,
            onSerialize,
            onIframeLoad,
            iframeLoadTimeout,
            onStylesheetLoad,
            stylesheetLoadTimeout,
            keepIframeSrcFn
          });
          if (serializedIframeNode) {
            onIframeLoad(n2, serializedIframeNode);
          }
        }
      }, iframeLoadTimeout);
    }
    if (serializedNode.type === NodeType.Element && serializedNode.tagName === "link" && serializedNode.attributes.rel === "stylesheet") {
      onceStylesheetLoaded(n2, function() {
        if (onStylesheetLoad) {
          var serializedLinkNode = serializeNodeWithId(n2, {
            doc,
            mirror: mirror2,
            blockClass,
            blockSelector,
            maskTextClass,
            maskTextSelector,
            skipChild: false,
            inlineStylesheet,
            maskInputOptions,
            maskTextFn,
            maskInputFn,
            slimDOMOptions,
            dataURLOptions,
            inlineImages,
            recordCanvas,
            preserveWhiteSpace,
            onSerialize,
            onIframeLoad,
            iframeLoadTimeout,
            onStylesheetLoad,
            stylesheetLoadTimeout,
            keepIframeSrcFn
          });
          if (serializedLinkNode) {
            onStylesheetLoad(n2, serializedLinkNode);
          }
        }
      }, stylesheetLoadTimeout);
    }
    return serializedNode;
  }
  function snapshot(n2, options) {
    var _a2 = options || {}, _b = _a2.mirror, mirror2 = _b === void 0 ? new Mirror() : _b, _c = _a2.blockClass, blockClass = _c === void 0 ? "rr-block" : _c, _d = _a2.blockSelector, blockSelector = _d === void 0 ? null : _d, _e = _a2.maskTextClass, maskTextClass = _e === void 0 ? "rr-mask" : _e, _f = _a2.maskTextSelector, maskTextSelector = _f === void 0 ? null : _f, _g = _a2.inlineStylesheet, inlineStylesheet = _g === void 0 ? true : _g, _h = _a2.inlineImages, inlineImages = _h === void 0 ? false : _h, _j = _a2.recordCanvas, recordCanvas = _j === void 0 ? false : _j, _k = _a2.maskAllInputs, maskAllInputs = _k === void 0 ? false : _k, maskTextFn = _a2.maskTextFn, maskInputFn = _a2.maskInputFn, _l = _a2.slimDOM, slimDOM = _l === void 0 ? false : _l, dataURLOptions = _a2.dataURLOptions, preserveWhiteSpace = _a2.preserveWhiteSpace, onSerialize = _a2.onSerialize, onIframeLoad = _a2.onIframeLoad, iframeLoadTimeout = _a2.iframeLoadTimeout, onStylesheetLoad = _a2.onStylesheetLoad, stylesheetLoadTimeout = _a2.stylesheetLoadTimeout, _m = _a2.keepIframeSrcFn, keepIframeSrcFn = _m === void 0 ? function() {
      return false;
    } : _m;
    var maskInputOptions = maskAllInputs === true ? {
      color: true,
      date: true,
      "datetime-local": true,
      email: true,
      month: true,
      number: true,
      range: true,
      search: true,
      tel: true,
      text: true,
      time: true,
      url: true,
      week: true,
      textarea: true,
      select: true,
      password: true
    } : maskAllInputs === false ? {
      password: true
    } : maskAllInputs;
    var slimDOMOptions = slimDOM === true || slimDOM === "all" ? {
      script: true,
      comment: true,
      headFavicon: true,
      headWhitespace: true,
      headMetaDescKeywords: slimDOM === "all",
      headMetaSocial: true,
      headMetaRobots: true,
      headMetaHttpEquiv: true,
      headMetaAuthorship: true,
      headMetaVerification: true
    } : slimDOM === false ? {} : slimDOM;
    return serializeNodeWithId(n2, {
      doc: n2,
      mirror: mirror2,
      blockClass,
      blockSelector,
      maskTextClass,
      maskTextSelector,
      skipChild: false,
      inlineStylesheet,
      maskInputOptions,
      maskTextFn,
      maskInputFn,
      slimDOMOptions,
      dataURLOptions,
      inlineImages,
      recordCanvas,
      preserveWhiteSpace,
      onSerialize,
      onIframeLoad,
      iframeLoadTimeout,
      onStylesheetLoad,
      stylesheetLoadTimeout,
      keepIframeSrcFn,
      newlyAddedElement: false
    });
  }
  var HOVER_SELECTOR = /([^\\]):hover/;
  var HOVER_SELECTOR_GLOBAL = new RegExp(HOVER_SELECTOR.source, "g");

  // ../node_modules/rrweb/es/rrweb/packages/rrweb/src/utils.js
  function on(type, fn, target = document) {
    const options = { capture: true, passive: true };
    target.addEventListener(type, fn, options);
    return () => target.removeEventListener(type, fn, options);
  }
  var DEPARTED_MIRROR_ACCESS_WARNING = "Please stop import mirror directly. Instead of that,\r\nnow you can use replayer.getMirror() to access the mirror instance of a replayer,\r\nor you can use record.mirror to access the mirror instance during recording.";
  var _mirror = {
    map: {},
    getId() {
      console.error(DEPARTED_MIRROR_ACCESS_WARNING);
      return -1;
    },
    getNode() {
      console.error(DEPARTED_MIRROR_ACCESS_WARNING);
      return null;
    },
    removeNodeFromMap() {
      console.error(DEPARTED_MIRROR_ACCESS_WARNING);
    },
    has() {
      console.error(DEPARTED_MIRROR_ACCESS_WARNING);
      return false;
    },
    reset() {
      console.error(DEPARTED_MIRROR_ACCESS_WARNING);
    }
  };
  if (typeof window !== "undefined" && window.Proxy && window.Reflect) {
    _mirror = new Proxy(_mirror, {
      get(target, prop, receiver) {
        if (prop === "map") {
          console.error(DEPARTED_MIRROR_ACCESS_WARNING);
        }
        return Reflect.get(target, prop, receiver);
      }
    });
  }
  function throttle(func, wait, options = {}) {
    let timeout = null;
    let previous = 0;
    return function(...args) {
      const now = Date.now();
      if (!previous && options.leading === false) {
        previous = now;
      }
      const remaining = wait - (now - previous);
      const context = this;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        func.apply(context, args);
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(() => {
          previous = options.leading === false ? 0 : Date.now();
          timeout = null;
          func.apply(context, args);
        }, remaining);
      }
    };
  }
  function hookSetter(target, key, d, isRevoked, win = window) {
    const original = win.Object.getOwnPropertyDescriptor(target, key);
    win.Object.defineProperty(target, key, isRevoked ? d : {
      set(value) {
        setTimeout(() => {
          d.set.call(this, value);
        }, 0);
        if (original && original.set) {
          original.set.call(this, value);
        }
      }
    });
    return () => hookSetter(target, key, original || {}, true);
  }
  function patch(source, name, replacement) {
    try {
      if (!(name in source)) {
        return () => {
        };
      }
      const original = source[name];
      const wrapped = replacement(original);
      if (typeof wrapped === "function") {
        wrapped.prototype = wrapped.prototype || {};
        Object.defineProperties(wrapped, {
          __rrweb_original__: {
            enumerable: false,
            value: original
          }
        });
      }
      source[name] = wrapped;
      return () => {
        source[name] = original;
      };
    } catch (_a2) {
      return () => {
      };
    }
  }
  function getWindowHeight() {
    return window.innerHeight || document.documentElement && document.documentElement.clientHeight || document.body && document.body.clientHeight;
  }
  function getWindowWidth() {
    return window.innerWidth || document.documentElement && document.documentElement.clientWidth || document.body && document.body.clientWidth;
  }
  function isBlocked(node2, blockClass, blockSelector, checkAncestors) {
    if (!node2) {
      return false;
    }
    const el = node2.nodeType === node2.ELEMENT_NODE ? node2 : node2.parentElement;
    if (!el)
      return false;
    if (typeof blockClass === "string") {
      if (el.classList.contains(blockClass))
        return true;
      if (checkAncestors && el.closest("." + blockClass) !== null)
        return true;
    } else {
      if (classMatchesRegex(el, blockClass, checkAncestors))
        return true;
    }
    if (blockSelector) {
      if (node2.matches(blockSelector))
        return true;
      if (checkAncestors && el.closest(blockSelector) !== null)
        return true;
    }
    return false;
  }
  function isSerialized(n2, mirror2) {
    return mirror2.getId(n2) !== -1;
  }
  function isIgnored(n2, mirror2) {
    return mirror2.getId(n2) === IGNORED_NODE;
  }
  function isAncestorRemoved(target, mirror2) {
    if (isShadowRoot(target)) {
      return false;
    }
    const id = mirror2.getId(target);
    if (!mirror2.has(id)) {
      return true;
    }
    if (target.parentNode && target.parentNode.nodeType === target.DOCUMENT_NODE) {
      return false;
    }
    if (!target.parentNode) {
      return true;
    }
    return isAncestorRemoved(target.parentNode, mirror2);
  }
  function isTouchEvent(event) {
    return Boolean(event.changedTouches);
  }
  function polyfill(win = window) {
    if ("NodeList" in win && !win.NodeList.prototype.forEach) {
      win.NodeList.prototype.forEach = Array.prototype.forEach;
    }
    if ("DOMTokenList" in win && !win.DOMTokenList.prototype.forEach) {
      win.DOMTokenList.prototype.forEach = Array.prototype.forEach;
    }
    if (!Node.prototype.contains) {
      Node.prototype.contains = (...args) => {
        let node2 = args[0];
        if (!(0 in args)) {
          throw new TypeError("1 argument is required");
        }
        do {
          if (this === node2) {
            return true;
          }
        } while (node2 = node2 && node2.parentNode);
        return false;
      };
    }
  }
  function isSerializedIframe(n2, mirror2) {
    return Boolean(n2.nodeName === "IFRAME" && mirror2.getMeta(n2));
  }
  function isSerializedStylesheet(n2, mirror2) {
    return Boolean(n2.nodeName === "LINK" && n2.nodeType === n2.ELEMENT_NODE && n2.getAttribute && n2.getAttribute("rel") === "stylesheet" && mirror2.getMeta(n2));
  }
  function hasShadowRoot(n2) {
    return Boolean(n2 === null || n2 === void 0 ? void 0 : n2.shadowRoot);
  }
  var StyleSheetMirror = class {
    constructor() {
      this.id = 1;
      this.styleIDMap = /* @__PURE__ */ new WeakMap();
      this.idStyleMap = /* @__PURE__ */ new Map();
    }
    getId(stylesheet) {
      var _a2;
      return (_a2 = this.styleIDMap.get(stylesheet)) !== null && _a2 !== void 0 ? _a2 : -1;
    }
    has(stylesheet) {
      return this.styleIDMap.has(stylesheet);
    }
    add(stylesheet, id) {
      if (this.has(stylesheet))
        return this.getId(stylesheet);
      let newId;
      if (id === void 0) {
        newId = this.id++;
      } else
        newId = id;
      this.styleIDMap.set(stylesheet, newId);
      this.idStyleMap.set(newId, stylesheet);
      return newId;
    }
    getStyle(id) {
      return this.idStyleMap.get(id) || null;
    }
    reset() {
      this.styleIDMap = /* @__PURE__ */ new WeakMap();
      this.idStyleMap = /* @__PURE__ */ new Map();
      this.id = 1;
    }
    generateId() {
      return this.id++;
    }
  };

  // ../node_modules/rrweb/es/rrweb/packages/types/dist/types.js
  var EventType = /* @__PURE__ */ ((EventType2) => {
    EventType2[EventType2["DomContentLoaded"] = 0] = "DomContentLoaded";
    EventType2[EventType2["Load"] = 1] = "Load";
    EventType2[EventType2["FullSnapshot"] = 2] = "FullSnapshot";
    EventType2[EventType2["IncrementalSnapshot"] = 3] = "IncrementalSnapshot";
    EventType2[EventType2["Meta"] = 4] = "Meta";
    EventType2[EventType2["Custom"] = 5] = "Custom";
    EventType2[EventType2["Plugin"] = 6] = "Plugin";
    return EventType2;
  })(EventType || {});
  var IncrementalSource = /* @__PURE__ */ ((IncrementalSource2) => {
    IncrementalSource2[IncrementalSource2["Mutation"] = 0] = "Mutation";
    IncrementalSource2[IncrementalSource2["MouseMove"] = 1] = "MouseMove";
    IncrementalSource2[IncrementalSource2["MouseInteraction"] = 2] = "MouseInteraction";
    IncrementalSource2[IncrementalSource2["Scroll"] = 3] = "Scroll";
    IncrementalSource2[IncrementalSource2["ViewportResize"] = 4] = "ViewportResize";
    IncrementalSource2[IncrementalSource2["Input"] = 5] = "Input";
    IncrementalSource2[IncrementalSource2["TouchMove"] = 6] = "TouchMove";
    IncrementalSource2[IncrementalSource2["MediaInteraction"] = 7] = "MediaInteraction";
    IncrementalSource2[IncrementalSource2["StyleSheetRule"] = 8] = "StyleSheetRule";
    IncrementalSource2[IncrementalSource2["CanvasMutation"] = 9] = "CanvasMutation";
    IncrementalSource2[IncrementalSource2["Font"] = 10] = "Font";
    IncrementalSource2[IncrementalSource2["Log"] = 11] = "Log";
    IncrementalSource2[IncrementalSource2["Drag"] = 12] = "Drag";
    IncrementalSource2[IncrementalSource2["StyleDeclaration"] = 13] = "StyleDeclaration";
    IncrementalSource2[IncrementalSource2["Selection"] = 14] = "Selection";
    IncrementalSource2[IncrementalSource2["AdoptedStyleSheet"] = 15] = "AdoptedStyleSheet";
    return IncrementalSource2;
  })(IncrementalSource || {});
  var MouseInteractions = /* @__PURE__ */ ((MouseInteractions2) => {
    MouseInteractions2[MouseInteractions2["MouseUp"] = 0] = "MouseUp";
    MouseInteractions2[MouseInteractions2["MouseDown"] = 1] = "MouseDown";
    MouseInteractions2[MouseInteractions2["Click"] = 2] = "Click";
    MouseInteractions2[MouseInteractions2["ContextMenu"] = 3] = "ContextMenu";
    MouseInteractions2[MouseInteractions2["DblClick"] = 4] = "DblClick";
    MouseInteractions2[MouseInteractions2["Focus"] = 5] = "Focus";
    MouseInteractions2[MouseInteractions2["Blur"] = 6] = "Blur";
    MouseInteractions2[MouseInteractions2["TouchStart"] = 7] = "TouchStart";
    MouseInteractions2[MouseInteractions2["TouchMove_Departed"] = 8] = "TouchMove_Departed";
    MouseInteractions2[MouseInteractions2["TouchEnd"] = 9] = "TouchEnd";
    MouseInteractions2[MouseInteractions2["TouchCancel"] = 10] = "TouchCancel";
    return MouseInteractions2;
  })(MouseInteractions || {});
  var CanvasContext = /* @__PURE__ */ ((CanvasContext2) => {
    CanvasContext2[CanvasContext2["2D"] = 0] = "2D";
    CanvasContext2[CanvasContext2["WebGL"] = 1] = "WebGL";
    CanvasContext2[CanvasContext2["WebGL2"] = 2] = "WebGL2";
    return CanvasContext2;
  })(CanvasContext || {});

  // ../node_modules/rrweb/es/rrweb/packages/rrweb/src/record/mutation.js
  function isNodeInLinkedList(n2) {
    return "__ln" in n2;
  }
  var DoubleLinkedList = class {
    constructor() {
      this.length = 0;
      this.head = null;
    }
    get(position) {
      if (position >= this.length) {
        throw new Error("Position outside of list range");
      }
      let current = this.head;
      for (let index2 = 0; index2 < position; index2++) {
        current = (current === null || current === void 0 ? void 0 : current.next) || null;
      }
      return current;
    }
    addNode(n2) {
      const node2 = {
        value: n2,
        previous: null,
        next: null
      };
      n2.__ln = node2;
      if (n2.previousSibling && isNodeInLinkedList(n2.previousSibling)) {
        const current = n2.previousSibling.__ln.next;
        node2.next = current;
        node2.previous = n2.previousSibling.__ln;
        n2.previousSibling.__ln.next = node2;
        if (current) {
          current.previous = node2;
        }
      } else if (n2.nextSibling && isNodeInLinkedList(n2.nextSibling) && n2.nextSibling.__ln.previous) {
        const current = n2.nextSibling.__ln.previous;
        node2.previous = current;
        node2.next = n2.nextSibling.__ln;
        n2.nextSibling.__ln.previous = node2;
        if (current) {
          current.next = node2;
        }
      } else {
        if (this.head) {
          this.head.previous = node2;
        }
        node2.next = this.head;
        this.head = node2;
      }
      this.length++;
    }
    removeNode(n2) {
      const current = n2.__ln;
      if (!this.head) {
        return;
      }
      if (!current.previous) {
        this.head = current.next;
        if (this.head) {
          this.head.previous = null;
        }
      } else {
        current.previous.next = current.next;
        if (current.next) {
          current.next.previous = current.previous;
        }
      }
      if (n2.__ln) {
        delete n2.__ln;
      }
      this.length--;
    }
  };
  var moveKey = (id, parentId) => `${id}@${parentId}`;
  var MutationBuffer = class {
    constructor() {
      this.frozen = false;
      this.locked = false;
      this.texts = [];
      this.attributes = [];
      this.removes = [];
      this.mapRemoves = [];
      this.movedMap = {};
      this.addedSet = /* @__PURE__ */ new Set();
      this.movedSet = /* @__PURE__ */ new Set();
      this.droppedSet = /* @__PURE__ */ new Set();
      this.processMutations = (mutations) => {
        mutations.forEach(this.processMutation);
        this.emit();
      };
      this.emit = () => {
        if (this.frozen || this.locked) {
          return;
        }
        const adds = [];
        const addList = new DoubleLinkedList();
        const getNextId = (n2) => {
          let ns = n2;
          let nextId = IGNORED_NODE;
          while (nextId === IGNORED_NODE) {
            ns = ns && ns.nextSibling;
            nextId = ns && this.mirror.getId(ns);
          }
          return nextId;
        };
        const pushAdd = (n2) => {
          var _a2, _b, _c, _d;
          let shadowHost = null;
          if (((_b = (_a2 = n2.getRootNode) === null || _a2 === void 0 ? void 0 : _a2.call(n2)) === null || _b === void 0 ? void 0 : _b.nodeType) === Node.DOCUMENT_FRAGMENT_NODE && n2.getRootNode().host)
            shadowHost = n2.getRootNode().host;
          let rootShadowHost = shadowHost;
          while (((_d = (_c = rootShadowHost === null || rootShadowHost === void 0 ? void 0 : rootShadowHost.getRootNode) === null || _c === void 0 ? void 0 : _c.call(rootShadowHost)) === null || _d === void 0 ? void 0 : _d.nodeType) === Node.DOCUMENT_FRAGMENT_NODE && rootShadowHost.getRootNode().host)
            rootShadowHost = rootShadowHost.getRootNode().host;
          const notInDoc = !this.doc.contains(n2) && (!rootShadowHost || !this.doc.contains(rootShadowHost));
          if (!n2.parentNode || notInDoc) {
            return;
          }
          const parentId = isShadowRoot(n2.parentNode) ? this.mirror.getId(shadowHost) : this.mirror.getId(n2.parentNode);
          const nextId = getNextId(n2);
          if (parentId === -1 || nextId === -1) {
            return addList.addNode(n2);
          }
          const sn = serializeNodeWithId(n2, {
            doc: this.doc,
            mirror: this.mirror,
            blockClass: this.blockClass,
            blockSelector: this.blockSelector,
            maskTextClass: this.maskTextClass,
            maskTextSelector: this.maskTextSelector,
            skipChild: true,
            newlyAddedElement: true,
            inlineStylesheet: this.inlineStylesheet,
            maskInputOptions: this.maskInputOptions,
            maskTextFn: this.maskTextFn,
            maskInputFn: this.maskInputFn,
            slimDOMOptions: this.slimDOMOptions,
            dataURLOptions: this.dataURLOptions,
            recordCanvas: this.recordCanvas,
            inlineImages: this.inlineImages,
            onSerialize: (currentN) => {
              if (isSerializedIframe(currentN, this.mirror)) {
                this.iframeManager.addIframe(currentN);
              }
              if (isSerializedStylesheet(currentN, this.mirror)) {
                this.stylesheetManager.trackLinkElement(currentN);
              }
              if (hasShadowRoot(n2)) {
                this.shadowDomManager.addShadowRoot(n2.shadowRoot, this.doc);
              }
            },
            onIframeLoad: (iframe, childSn) => {
              this.iframeManager.attachIframe(iframe, childSn);
              this.shadowDomManager.observeAttachShadow(iframe);
            },
            onStylesheetLoad: (link, childSn) => {
              this.stylesheetManager.attachLinkElement(link, childSn);
            }
          });
          if (sn) {
            adds.push({
              parentId,
              nextId,
              node: sn
            });
          }
        };
        while (this.mapRemoves.length) {
          this.mirror.removeNodeFromMap(this.mapRemoves.shift());
        }
        for (const n2 of Array.from(this.movedSet.values())) {
          if (isParentRemoved(this.removes, n2, this.mirror) && !this.movedSet.has(n2.parentNode)) {
            continue;
          }
          pushAdd(n2);
        }
        for (const n2 of Array.from(this.addedSet.values())) {
          if (!isAncestorInSet(this.droppedSet, n2) && !isParentRemoved(this.removes, n2, this.mirror)) {
            pushAdd(n2);
          } else if (isAncestorInSet(this.movedSet, n2)) {
            pushAdd(n2);
          } else {
            this.droppedSet.add(n2);
          }
        }
        let candidate = null;
        while (addList.length) {
          let node2 = null;
          if (candidate) {
            const parentId = this.mirror.getId(candidate.value.parentNode);
            const nextId = getNextId(candidate.value);
            if (parentId !== -1 && nextId !== -1) {
              node2 = candidate;
            }
          }
          if (!node2) {
            for (let index2 = addList.length - 1; index2 >= 0; index2--) {
              const _node = addList.get(index2);
              if (_node) {
                const parentId = this.mirror.getId(_node.value.parentNode);
                const nextId = getNextId(_node.value);
                if (nextId === -1)
                  continue;
                else if (parentId !== -1) {
                  node2 = _node;
                  break;
                } else {
                  const unhandledNode = _node.value;
                  if (unhandledNode.parentNode && unhandledNode.parentNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                    const shadowHost = unhandledNode.parentNode.host;
                    const parentId2 = this.mirror.getId(shadowHost);
                    if (parentId2 !== -1) {
                      node2 = _node;
                      break;
                    }
                  }
                }
              }
            }
          }
          if (!node2) {
            while (addList.head) {
              addList.removeNode(addList.head.value);
            }
            break;
          }
          candidate = node2.previous;
          addList.removeNode(node2.value);
          pushAdd(node2.value);
        }
        const payload = {
          texts: this.texts.map((text) => ({
            id: this.mirror.getId(text.node),
            value: text.value
          })).filter((text) => this.mirror.has(text.id)),
          attributes: this.attributes.map((attribute) => ({
            id: this.mirror.getId(attribute.node),
            attributes: attribute.attributes
          })).filter((attribute) => this.mirror.has(attribute.id)),
          removes: this.removes,
          adds
        };
        if (!payload.texts.length && !payload.attributes.length && !payload.removes.length && !payload.adds.length) {
          return;
        }
        this.texts = [];
        this.attributes = [];
        this.removes = [];
        this.addedSet = /* @__PURE__ */ new Set();
        this.movedSet = /* @__PURE__ */ new Set();
        this.droppedSet = /* @__PURE__ */ new Set();
        this.movedMap = {};
        this.mutationCb(payload);
      };
      this.processMutation = (m) => {
        if (isIgnored(m.target, this.mirror)) {
          return;
        }
        switch (m.type) {
          case "characterData": {
            const value = m.target.textContent;
            if (!isBlocked(m.target, this.blockClass, this.blockSelector, false) && value !== m.oldValue) {
              this.texts.push({
                value: needMaskingText(m.target, this.maskTextClass, this.maskTextSelector) && value ? this.maskTextFn ? this.maskTextFn(value) : value.replace(/[\S]/g, "*") : value,
                node: m.target
              });
            }
            break;
          }
          case "attributes": {
            const target = m.target;
            let value = m.target.getAttribute(m.attributeName);
            if (m.attributeName === "value") {
              value = maskInputValue({
                maskInputOptions: this.maskInputOptions,
                tagName: m.target.tagName,
                type: m.target.getAttribute("type"),
                value,
                maskInputFn: this.maskInputFn
              });
            }
            if (isBlocked(m.target, this.blockClass, this.blockSelector, false) || value === m.oldValue) {
              return;
            }
            let item = this.attributes.find((a) => a.node === m.target);
            if (target.tagName === "IFRAME" && m.attributeName === "src" && !this.keepIframeSrcFn(value)) {
              if (!target.contentDocument) {
                m.attributeName = "rr_src";
              } else {
                return;
              }
            }
            if (!item) {
              item = {
                node: m.target,
                attributes: {}
              };
              this.attributes.push(item);
            }
            if (m.attributeName === "style") {
              const old = this.doc.createElement("span");
              if (m.oldValue) {
                old.setAttribute("style", m.oldValue);
              }
              if (item.attributes.style === void 0 || item.attributes.style === null) {
                item.attributes.style = {};
              }
              const styleObj = item.attributes.style;
              for (const pname of Array.from(target.style)) {
                const newValue = target.style.getPropertyValue(pname);
                const newPriority = target.style.getPropertyPriority(pname);
                if (newValue !== old.style.getPropertyValue(pname) || newPriority !== old.style.getPropertyPriority(pname)) {
                  if (newPriority === "") {
                    styleObj[pname] = newValue;
                  } else {
                    styleObj[pname] = [newValue, newPriority];
                  }
                }
              }
              for (const pname of Array.from(old.style)) {
                if (target.style.getPropertyValue(pname) === "") {
                  styleObj[pname] = false;
                }
              }
            } else {
              item.attributes[m.attributeName] = transformAttribute(this.doc, target.tagName, m.attributeName, value);
            }
            break;
          }
          case "childList": {
            if (isBlocked(m.target, this.blockClass, this.blockSelector, true))
              return;
            m.addedNodes.forEach((n2) => this.genAdds(n2, m.target));
            m.removedNodes.forEach((n2) => {
              const nodeId = this.mirror.getId(n2);
              const parentId = isShadowRoot(m.target) ? this.mirror.getId(m.target.host) : this.mirror.getId(m.target);
              if (isBlocked(m.target, this.blockClass, this.blockSelector, false) || isIgnored(n2, this.mirror) || !isSerialized(n2, this.mirror)) {
                return;
              }
              if (this.addedSet.has(n2)) {
                deepDelete(this.addedSet, n2);
                this.droppedSet.add(n2);
              } else if (this.addedSet.has(m.target) && nodeId === -1) ;
              else if (isAncestorRemoved(m.target, this.mirror)) ;
              else if (this.movedSet.has(n2) && this.movedMap[moveKey(nodeId, parentId)]) {
                deepDelete(this.movedSet, n2);
              } else {
                this.removes.push({
                  parentId,
                  id: nodeId,
                  isShadow: isShadowRoot(m.target) && isNativeShadowDom(m.target) ? true : void 0
                });
              }
              this.mapRemoves.push(n2);
            });
            break;
          }
        }
      };
      this.genAdds = (n2, target) => {
        if (this.mirror.hasNode(n2)) {
          if (isIgnored(n2, this.mirror)) {
            return;
          }
          this.movedSet.add(n2);
          let targetId = null;
          if (target && this.mirror.hasNode(target)) {
            targetId = this.mirror.getId(target);
          }
          if (targetId && targetId !== -1) {
            this.movedMap[moveKey(this.mirror.getId(n2), targetId)] = true;
          }
        } else {
          this.addedSet.add(n2);
          this.droppedSet.delete(n2);
        }
        if (!isBlocked(n2, this.blockClass, this.blockSelector, false))
          n2.childNodes.forEach((childN) => this.genAdds(childN));
      };
    }
    init(options) {
      [
        "mutationCb",
        "blockClass",
        "blockSelector",
        "maskTextClass",
        "maskTextSelector",
        "inlineStylesheet",
        "maskInputOptions",
        "maskTextFn",
        "maskInputFn",
        "keepIframeSrcFn",
        "recordCanvas",
        "inlineImages",
        "slimDOMOptions",
        "dataURLOptions",
        "doc",
        "mirror",
        "iframeManager",
        "stylesheetManager",
        "shadowDomManager",
        "canvasManager"
      ].forEach((key) => {
        this[key] = options[key];
      });
    }
    freeze() {
      this.frozen = true;
      this.canvasManager.freeze();
    }
    unfreeze() {
      this.frozen = false;
      this.canvasManager.unfreeze();
      this.emit();
    }
    isFrozen() {
      return this.frozen;
    }
    lock() {
      this.locked = true;
      this.canvasManager.lock();
    }
    unlock() {
      this.locked = false;
      this.canvasManager.unlock();
      this.emit();
    }
    reset() {
      this.shadowDomManager.reset();
      this.canvasManager.reset();
    }
  };
  function deepDelete(addsSet, n2) {
    addsSet.delete(n2);
    n2.childNodes.forEach((childN) => deepDelete(addsSet, childN));
  }
  function isParentRemoved(removes, n2, mirror2) {
    if (removes.length === 0)
      return false;
    return _isParentRemoved(removes, n2, mirror2);
  }
  function _isParentRemoved(removes, n2, mirror2) {
    const { parentNode: parentNode2 } = n2;
    if (!parentNode2) {
      return false;
    }
    const parentId = mirror2.getId(parentNode2);
    if (removes.some((r) => r.id === parentId)) {
      return true;
    }
    return _isParentRemoved(removes, parentNode2, mirror2);
  }
  function isAncestorInSet(set, n2) {
    if (set.size === 0)
      return false;
    return _isAncestorInSet(set, n2);
  }
  function _isAncestorInSet(set, n2) {
    const { parentNode: parentNode2 } = n2;
    if (!parentNode2) {
      return false;
    }
    if (set.has(parentNode2)) {
      return true;
    }
    return _isAncestorInSet(set, parentNode2);
  }

  // ../node_modules/rrweb/es/rrweb/packages/rrweb/src/record/observer.js
  var mutationBuffers = [];
  var isCSSGroupingRuleSupported = typeof CSSGroupingRule !== "undefined";
  var isCSSMediaRuleSupported = typeof CSSMediaRule !== "undefined";
  var isCSSSupportsRuleSupported = typeof CSSSupportsRule !== "undefined";
  var isCSSConditionRuleSupported = typeof CSSConditionRule !== "undefined";
  function getEventTarget(event) {
    try {
      if ("composedPath" in event) {
        const path = event.composedPath();
        if (path.length) {
          return path[0];
        }
      } else if ("path" in event && event.path.length) {
        return event.path[0];
      }
      return event.target;
    } catch (_a2) {
      return event.target;
    }
  }
  function initMutationObserver(options, rootEl) {
    var _a2, _b;
    const mutationBuffer = new MutationBuffer();
    mutationBuffers.push(mutationBuffer);
    mutationBuffer.init(options);
    let mutationObserverCtor2 = window.MutationObserver || window.__rrMutationObserver;
    const angularZoneSymbol = (_b = (_a2 = window === null || window === void 0 ? void 0 : window.Zone) === null || _a2 === void 0 ? void 0 : _a2.__symbol__) === null || _b === void 0 ? void 0 : _b.call(_a2, "MutationObserver");
    if (angularZoneSymbol && window[angularZoneSymbol]) {
      mutationObserverCtor2 = window[angularZoneSymbol];
    }
    const observer = new mutationObserverCtor2(mutationBuffer.processMutations.bind(mutationBuffer));
    observer.observe(rootEl, {
      attributes: true,
      attributeOldValue: true,
      characterData: true,
      characterDataOldValue: true,
      childList: true,
      subtree: true
    });
    return observer;
  }
  function initMoveObserver({ mousemoveCb, sampling, doc, mirror: mirror2 }) {
    if (sampling.mousemove === false) {
      return () => {
      };
    }
    const threshold = typeof sampling.mousemove === "number" ? sampling.mousemove : 50;
    const callbackThreshold = typeof sampling.mousemoveCallback === "number" ? sampling.mousemoveCallback : 500;
    let positions = [];
    let timeBaseline;
    const wrappedCb = throttle((source) => {
      const totalOffset = Date.now() - timeBaseline;
      mousemoveCb(positions.map((p) => {
        p.timeOffset -= totalOffset;
        return p;
      }), source);
      positions = [];
      timeBaseline = null;
    }, callbackThreshold);
    const updatePosition = throttle((evt) => {
      const target = getEventTarget(evt);
      const { clientX, clientY } = isTouchEvent(evt) ? evt.changedTouches[0] : evt;
      if (!timeBaseline) {
        timeBaseline = Date.now();
      }
      positions.push({
        x: clientX,
        y: clientY,
        id: mirror2.getId(target),
        timeOffset: Date.now() - timeBaseline
      });
      wrappedCb(typeof DragEvent !== "undefined" && evt instanceof DragEvent ? IncrementalSource.Drag : evt instanceof MouseEvent ? IncrementalSource.MouseMove : IncrementalSource.TouchMove);
    }, threshold, {
      trailing: false
    });
    const handlers = [
      on("mousemove", updatePosition, doc),
      on("touchmove", updatePosition, doc),
      on("drag", updatePosition, doc)
    ];
    return () => {
      handlers.forEach((h) => h());
    };
  }
  function initMouseInteractionObserver({ mouseInteractionCb, doc, mirror: mirror2, blockClass, blockSelector, sampling }) {
    if (sampling.mouseInteraction === false) {
      return () => {
      };
    }
    const disableMap = sampling.mouseInteraction === true || sampling.mouseInteraction === void 0 ? {} : sampling.mouseInteraction;
    const handlers = [];
    const getHandler = (eventKey) => {
      return (event) => {
        const target = getEventTarget(event);
        if (isBlocked(target, blockClass, blockSelector, true)) {
          return;
        }
        const e = isTouchEvent(event) ? event.changedTouches[0] : event;
        if (!e) {
          return;
        }
        const id = mirror2.getId(target);
        const { clientX, clientY } = e;
        mouseInteractionCb({
          type: MouseInteractions[eventKey],
          id,
          x: clientX,
          y: clientY
        });
      };
    };
    Object.keys(MouseInteractions).filter((key) => Number.isNaN(Number(key)) && !key.endsWith("_Departed") && disableMap[key] !== false).forEach((eventKey) => {
      const eventName = eventKey.toLowerCase();
      const handler = getHandler(eventKey);
      handlers.push(on(eventName, handler, doc));
    });
    return () => {
      handlers.forEach((h) => h());
    };
  }
  function initScrollObserver({ scrollCb, doc, mirror: mirror2, blockClass, blockSelector, sampling }) {
    const updatePosition = throttle((evt) => {
      const target = getEventTarget(evt);
      if (!target || isBlocked(target, blockClass, blockSelector, true)) {
        return;
      }
      const id = mirror2.getId(target);
      if (target === doc) {
        const scrollEl = doc.scrollingElement || doc.documentElement;
        scrollCb({
          id,
          x: scrollEl.scrollLeft,
          y: scrollEl.scrollTop
        });
      } else {
        scrollCb({
          id,
          x: target.scrollLeft,
          y: target.scrollTop
        });
      }
    }, sampling.scroll || 100);
    return on("scroll", updatePosition, doc);
  }
  function initViewportResizeObserver({ viewportResizeCb }) {
    let lastH = -1;
    let lastW = -1;
    const updateDimension = throttle(() => {
      const height = getWindowHeight();
      const width = getWindowWidth();
      if (lastH !== height || lastW !== width) {
        viewportResizeCb({
          width: Number(width),
          height: Number(height)
        });
        lastH = height;
        lastW = width;
      }
    }, 200);
    return on("resize", updateDimension, window);
  }
  function wrapEventWithUserTriggeredFlag(v, enable) {
    const value = Object.assign({}, v);
    if (!enable)
      delete value.userTriggered;
    return value;
  }
  var INPUT_TAGS = ["INPUT", "TEXTAREA", "SELECT"];
  var lastInputValueMap = /* @__PURE__ */ new WeakMap();
  function initInputObserver({ inputCb, doc, mirror: mirror2, blockClass, blockSelector, ignoreClass, maskInputOptions, maskInputFn, sampling, userTriggeredOnInput }) {
    function eventHandler(event) {
      let target = getEventTarget(event);
      const userTriggered = event.isTrusted;
      if (target && target.tagName === "OPTION")
        target = target.parentElement;
      if (!target || !target.tagName || INPUT_TAGS.indexOf(target.tagName) < 0 || isBlocked(target, blockClass, blockSelector, true)) {
        return;
      }
      const type = target.type;
      if (target.classList.contains(ignoreClass)) {
        return;
      }
      let text = target.value;
      let isChecked = false;
      if (type === "radio" || type === "checkbox") {
        isChecked = target.checked;
      } else if (maskInputOptions[target.tagName.toLowerCase()] || maskInputOptions[type]) {
        text = maskInputValue({
          maskInputOptions,
          tagName: target.tagName,
          type,
          value: text,
          maskInputFn
        });
      }
      cbWithDedup(target, wrapEventWithUserTriggeredFlag({ text, isChecked, userTriggered }, userTriggeredOnInput));
      const name = target.name;
      if (type === "radio" && name && isChecked) {
        doc.querySelectorAll(`input[type="radio"][name="${name}"]`).forEach((el) => {
          if (el !== target) {
            cbWithDedup(el, wrapEventWithUserTriggeredFlag({
              text: el.value,
              isChecked: !isChecked,
              userTriggered: false
            }, userTriggeredOnInput));
          }
        });
      }
    }
    function cbWithDedup(target, v) {
      const lastInputValue = lastInputValueMap.get(target);
      if (!lastInputValue || lastInputValue.text !== v.text || lastInputValue.isChecked !== v.isChecked) {
        lastInputValueMap.set(target, v);
        const id = mirror2.getId(target);
        inputCb(Object.assign(Object.assign({}, v), { id }));
      }
    }
    const events = sampling.input === "last" ? ["change"] : ["input", "change"];
    const handlers = events.map((eventName) => on(eventName, eventHandler, doc));
    const currentWindow = doc.defaultView;
    if (!currentWindow) {
      return () => {
        handlers.forEach((h) => h());
      };
    }
    const propertyDescriptor = currentWindow.Object.getOwnPropertyDescriptor(currentWindow.HTMLInputElement.prototype, "value");
    const hookProperties = [
      [currentWindow.HTMLInputElement.prototype, "value"],
      [currentWindow.HTMLInputElement.prototype, "checked"],
      [currentWindow.HTMLSelectElement.prototype, "value"],
      [currentWindow.HTMLTextAreaElement.prototype, "value"],
      [currentWindow.HTMLSelectElement.prototype, "selectedIndex"],
      [currentWindow.HTMLOptionElement.prototype, "selected"]
    ];
    if (propertyDescriptor && propertyDescriptor.set) {
      handlers.push(...hookProperties.map((p) => hookSetter(p[0], p[1], {
        set() {
          eventHandler({ target: this });
        }
      }, false, currentWindow)));
    }
    return () => {
      handlers.forEach((h) => h());
    };
  }
  function getNestedCSSRulePositions(rule2) {
    const positions = [];
    function recurse(childRule, pos) {
      if (isCSSGroupingRuleSupported && childRule.parentRule instanceof CSSGroupingRule || isCSSMediaRuleSupported && childRule.parentRule instanceof CSSMediaRule || isCSSSupportsRuleSupported && childRule.parentRule instanceof CSSSupportsRule || isCSSConditionRuleSupported && childRule.parentRule instanceof CSSConditionRule) {
        const rules = Array.from(childRule.parentRule.cssRules);
        const index2 = rules.indexOf(childRule);
        pos.unshift(index2);
      } else if (childRule.parentStyleSheet) {
        const rules = Array.from(childRule.parentStyleSheet.cssRules);
        const index2 = rules.indexOf(childRule);
        pos.unshift(index2);
      }
      return pos;
    }
    return recurse(rule2, positions);
  }
  function getIdAndStyleId(sheet, mirror2, styleMirror) {
    let id, styleId;
    if (!sheet)
      return {};
    if (sheet.ownerNode)
      id = mirror2.getId(sheet.ownerNode);
    else
      styleId = styleMirror.getId(sheet);
    return {
      styleId,
      id
    };
  }
  function initStyleSheetObserver({ styleSheetRuleCb, mirror: mirror2, stylesheetManager }, { win }) {
    const insertRule = win.CSSStyleSheet.prototype.insertRule;
    win.CSSStyleSheet.prototype.insertRule = function(rule2, index2) {
      const { id, styleId } = getIdAndStyleId(this, mirror2, stylesheetManager.styleMirror);
      if (id && id !== -1 || styleId && styleId !== -1) {
        styleSheetRuleCb({
          id,
          styleId,
          adds: [{ rule: rule2, index: index2 }]
        });
      }
      return insertRule.apply(this, [rule2, index2]);
    };
    const deleteRule = win.CSSStyleSheet.prototype.deleteRule;
    win.CSSStyleSheet.prototype.deleteRule = function(index2) {
      const { id, styleId } = getIdAndStyleId(this, mirror2, stylesheetManager.styleMirror);
      if (id && id !== -1 || styleId && styleId !== -1) {
        styleSheetRuleCb({
          id,
          styleId,
          removes: [{ index: index2 }]
        });
      }
      return deleteRule.apply(this, [index2]);
    };
    let replace;
    if (win.CSSStyleSheet.prototype.replace) {
      replace = win.CSSStyleSheet.prototype.replace;
      win.CSSStyleSheet.prototype.replace = function(text) {
        const { id, styleId } = getIdAndStyleId(this, mirror2, stylesheetManager.styleMirror);
        if (id && id !== -1 || styleId && styleId !== -1) {
          styleSheetRuleCb({
            id,
            styleId,
            replace: text
          });
        }
        return replace.apply(this, [text]);
      };
    }
    let replaceSync;
    if (win.CSSStyleSheet.prototype.replaceSync) {
      replaceSync = win.CSSStyleSheet.prototype.replaceSync;
      win.CSSStyleSheet.prototype.replaceSync = function(text) {
        const { id, styleId } = getIdAndStyleId(this, mirror2, stylesheetManager.styleMirror);
        if (id && id !== -1 || styleId && styleId !== -1) {
          styleSheetRuleCb({
            id,
            styleId,
            replaceSync: text
          });
        }
        return replaceSync.apply(this, [text]);
      };
    }
    const supportedNestedCSSRuleTypes = {};
    if (isCSSGroupingRuleSupported) {
      supportedNestedCSSRuleTypes.CSSGroupingRule = win.CSSGroupingRule;
    } else {
      if (isCSSMediaRuleSupported) {
        supportedNestedCSSRuleTypes.CSSMediaRule = win.CSSMediaRule;
      }
      if (isCSSConditionRuleSupported) {
        supportedNestedCSSRuleTypes.CSSConditionRule = win.CSSConditionRule;
      }
      if (isCSSSupportsRuleSupported) {
        supportedNestedCSSRuleTypes.CSSSupportsRule = win.CSSSupportsRule;
      }
    }
    const unmodifiedFunctions = {};
    Object.entries(supportedNestedCSSRuleTypes).forEach(([typeKey, type]) => {
      unmodifiedFunctions[typeKey] = {
        insertRule: type.prototype.insertRule,
        deleteRule: type.prototype.deleteRule
      };
      type.prototype.insertRule = function(rule2, index2) {
        const { id, styleId } = getIdAndStyleId(this.parentStyleSheet, mirror2, stylesheetManager.styleMirror);
        if (id && id !== -1 || styleId && styleId !== -1) {
          styleSheetRuleCb({
            id,
            styleId,
            adds: [
              {
                rule: rule2,
                index: [
                  ...getNestedCSSRulePositions(this),
                  index2 || 0
                ]
              }
            ]
          });
        }
        return unmodifiedFunctions[typeKey].insertRule.apply(this, [rule2, index2]);
      };
      type.prototype.deleteRule = function(index2) {
        const { id, styleId } = getIdAndStyleId(this.parentStyleSheet, mirror2, stylesheetManager.styleMirror);
        if (id && id !== -1 || styleId && styleId !== -1) {
          styleSheetRuleCb({
            id,
            styleId,
            removes: [
              { index: [...getNestedCSSRulePositions(this), index2] }
            ]
          });
        }
        return unmodifiedFunctions[typeKey].deleteRule.apply(this, [index2]);
      };
    });
    return () => {
      win.CSSStyleSheet.prototype.insertRule = insertRule;
      win.CSSStyleSheet.prototype.deleteRule = deleteRule;
      replace && (win.CSSStyleSheet.prototype.replace = replace);
      replaceSync && (win.CSSStyleSheet.prototype.replaceSync = replaceSync);
      Object.entries(supportedNestedCSSRuleTypes).forEach(([typeKey, type]) => {
        type.prototype.insertRule = unmodifiedFunctions[typeKey].insertRule;
        type.prototype.deleteRule = unmodifiedFunctions[typeKey].deleteRule;
      });
    };
  }
  function initAdoptedStyleSheetObserver({ mirror: mirror2, stylesheetManager }, host2) {
    var _a2, _b, _c;
    let hostId = null;
    if (host2.nodeName === "#document")
      hostId = mirror2.getId(host2);
    else
      hostId = mirror2.getId(host2.host);
    const patchTarget = host2.nodeName === "#document" ? (_a2 = host2.defaultView) === null || _a2 === void 0 ? void 0 : _a2.Document : (_c = (_b = host2.ownerDocument) === null || _b === void 0 ? void 0 : _b.defaultView) === null || _c === void 0 ? void 0 : _c.ShadowRoot;
    const originalPropertyDescriptor = Object.getOwnPropertyDescriptor(patchTarget === null || patchTarget === void 0 ? void 0 : patchTarget.prototype, "adoptedStyleSheets");
    if (hostId === null || hostId === -1 || !patchTarget || !originalPropertyDescriptor)
      return () => {
      };
    Object.defineProperty(host2, "adoptedStyleSheets", {
      configurable: originalPropertyDescriptor.configurable,
      enumerable: originalPropertyDescriptor.enumerable,
      get() {
        var _a3;
        return (_a3 = originalPropertyDescriptor.get) === null || _a3 === void 0 ? void 0 : _a3.call(this);
      },
      set(sheets) {
        var _a3;
        const result2 = (_a3 = originalPropertyDescriptor.set) === null || _a3 === void 0 ? void 0 : _a3.call(this, sheets);
        if (hostId !== null && hostId !== -1) {
          try {
            stylesheetManager.adoptStyleSheets(sheets, hostId);
          } catch (e) {
          }
        }
        return result2;
      }
    });
    return () => {
      Object.defineProperty(host2, "adoptedStyleSheets", {
        configurable: originalPropertyDescriptor.configurable,
        enumerable: originalPropertyDescriptor.enumerable,
        get: originalPropertyDescriptor.get,
        set: originalPropertyDescriptor.set
      });
    };
  }
  function initStyleDeclarationObserver({ styleDeclarationCb, mirror: mirror2, ignoreCSSAttributes, stylesheetManager }, { win }) {
    const setProperty = win.CSSStyleDeclaration.prototype.setProperty;
    win.CSSStyleDeclaration.prototype.setProperty = function(property, value, priority) {
      var _a2;
      if (ignoreCSSAttributes.has(property)) {
        return setProperty.apply(this, [property, value, priority]);
      }
      const { id, styleId } = getIdAndStyleId((_a2 = this.parentRule) === null || _a2 === void 0 ? void 0 : _a2.parentStyleSheet, mirror2, stylesheetManager.styleMirror);
      if (id && id !== -1 || styleId && styleId !== -1) {
        styleDeclarationCb({
          id,
          styleId,
          set: {
            property,
            value,
            priority
          },
          index: getNestedCSSRulePositions(this.parentRule)
        });
      }
      return setProperty.apply(this, [property, value, priority]);
    };
    const removeProperty = win.CSSStyleDeclaration.prototype.removeProperty;
    win.CSSStyleDeclaration.prototype.removeProperty = function(property) {
      var _a2;
      if (ignoreCSSAttributes.has(property)) {
        return removeProperty.apply(this, [property]);
      }
      const { id, styleId } = getIdAndStyleId((_a2 = this.parentRule) === null || _a2 === void 0 ? void 0 : _a2.parentStyleSheet, mirror2, stylesheetManager.styleMirror);
      if (id && id !== -1 || styleId && styleId !== -1) {
        styleDeclarationCb({
          id,
          styleId,
          remove: {
            property
          },
          index: getNestedCSSRulePositions(this.parentRule)
        });
      }
      return removeProperty.apply(this, [property]);
    };
    return () => {
      win.CSSStyleDeclaration.prototype.setProperty = setProperty;
      win.CSSStyleDeclaration.prototype.removeProperty = removeProperty;
    };
  }
  function initMediaInteractionObserver({ mediaInteractionCb, blockClass, blockSelector, mirror: mirror2, sampling }) {
    const handler = (type) => throttle((event) => {
      const target = getEventTarget(event);
      if (!target || isBlocked(target, blockClass, blockSelector, true)) {
        return;
      }
      const { currentTime, volume, muted, playbackRate } = target;
      mediaInteractionCb({
        type,
        id: mirror2.getId(target),
        currentTime,
        volume,
        muted,
        playbackRate
      });
    }, sampling.media || 500);
    const handlers = [
      on("play", handler(0)),
      on("pause", handler(1)),
      on("seeked", handler(2)),
      on("volumechange", handler(3)),
      on("ratechange", handler(4))
    ];
    return () => {
      handlers.forEach((h) => h());
    };
  }
  function initFontObserver({ fontCb, doc }) {
    const win = doc.defaultView;
    if (!win) {
      return () => {
      };
    }
    const handlers = [];
    const fontMap = /* @__PURE__ */ new WeakMap();
    const originalFontFace = win.FontFace;
    win.FontFace = function FontFace(family, source, descriptors) {
      const fontFace = new originalFontFace(family, source, descriptors);
      fontMap.set(fontFace, {
        family,
        buffer: typeof source !== "string",
        descriptors,
        fontSource: typeof source === "string" ? source : JSON.stringify(Array.from(new Uint8Array(source)))
      });
      return fontFace;
    };
    const restoreHandler = patch(doc.fonts, "add", function(original) {
      return function(fontFace) {
        setTimeout(() => {
          const p = fontMap.get(fontFace);
          if (p) {
            fontCb(p);
            fontMap.delete(fontFace);
          }
        }, 0);
        return original.apply(this, [fontFace]);
      };
    });
    handlers.push(() => {
      win.FontFace = originalFontFace;
    });
    handlers.push(restoreHandler);
    return () => {
      handlers.forEach((h) => h());
    };
  }
  function initSelectionObserver(param) {
    const { doc, mirror: mirror2, blockClass, blockSelector, selectionCb } = param;
    let collapsed = true;
    const updateSelection = () => {
      const selection = doc.getSelection();
      if (!selection || collapsed && (selection === null || selection === void 0 ? void 0 : selection.isCollapsed))
        return;
      collapsed = selection.isCollapsed || false;
      const ranges = [];
      const count = selection.rangeCount || 0;
      for (let i = 0; i < count; i++) {
        const range = selection.getRangeAt(i);
        const { startContainer, startOffset, endContainer, endOffset } = range;
        const blocked = isBlocked(startContainer, blockClass, blockSelector, true) || isBlocked(endContainer, blockClass, blockSelector, true);
        if (blocked)
          continue;
        ranges.push({
          start: mirror2.getId(startContainer),
          startOffset,
          end: mirror2.getId(endContainer),
          endOffset
        });
      }
      selectionCb({ ranges });
    };
    updateSelection();
    return on("selectionchange", updateSelection);
  }
  function mergeHooks(o, hooks) {
    const { mutationCb, mousemoveCb, mouseInteractionCb, scrollCb, viewportResizeCb, inputCb, mediaInteractionCb, styleSheetRuleCb, styleDeclarationCb, canvasMutationCb, fontCb, selectionCb } = o;
    o.mutationCb = (...p) => {
      if (hooks.mutation) {
        hooks.mutation(...p);
      }
      mutationCb(...p);
    };
    o.mousemoveCb = (...p) => {
      if (hooks.mousemove) {
        hooks.mousemove(...p);
      }
      mousemoveCb(...p);
    };
    o.mouseInteractionCb = (...p) => {
      if (hooks.mouseInteraction) {
        hooks.mouseInteraction(...p);
      }
      mouseInteractionCb(...p);
    };
    o.scrollCb = (...p) => {
      if (hooks.scroll) {
        hooks.scroll(...p);
      }
      scrollCb(...p);
    };
    o.viewportResizeCb = (...p) => {
      if (hooks.viewportResize) {
        hooks.viewportResize(...p);
      }
      viewportResizeCb(...p);
    };
    o.inputCb = (...p) => {
      if (hooks.input) {
        hooks.input(...p);
      }
      inputCb(...p);
    };
    o.mediaInteractionCb = (...p) => {
      if (hooks.mediaInteaction) {
        hooks.mediaInteaction(...p);
      }
      mediaInteractionCb(...p);
    };
    o.styleSheetRuleCb = (...p) => {
      if (hooks.styleSheetRule) {
        hooks.styleSheetRule(...p);
      }
      styleSheetRuleCb(...p);
    };
    o.styleDeclarationCb = (...p) => {
      if (hooks.styleDeclaration) {
        hooks.styleDeclaration(...p);
      }
      styleDeclarationCb(...p);
    };
    o.canvasMutationCb = (...p) => {
      if (hooks.canvasMutation) {
        hooks.canvasMutation(...p);
      }
      canvasMutationCb(...p);
    };
    o.fontCb = (...p) => {
      if (hooks.font) {
        hooks.font(...p);
      }
      fontCb(...p);
    };
    o.selectionCb = (...p) => {
      if (hooks.selection) {
        hooks.selection(...p);
      }
      selectionCb(...p);
    };
  }
  function initObservers(o, hooks = {}) {
    const currentWindow = o.doc.defaultView;
    if (!currentWindow) {
      return () => {
      };
    }
    mergeHooks(o, hooks);
    const mutationObserver = initMutationObserver(o, o.doc);
    const mousemoveHandler = initMoveObserver(o);
    const mouseInteractionHandler = initMouseInteractionObserver(o);
    const scrollHandler = initScrollObserver(o);
    const viewportResizeHandler = initViewportResizeObserver(o);
    const inputHandler = initInputObserver(o);
    const mediaInteractionHandler = initMediaInteractionObserver(o);
    const styleSheetObserver = initStyleSheetObserver(o, { win: currentWindow });
    const adoptedStyleSheetObserver = initAdoptedStyleSheetObserver(o, o.doc);
    const styleDeclarationObserver = initStyleDeclarationObserver(o, {
      win: currentWindow
    });
    const fontObserver = o.collectFonts ? initFontObserver(o) : () => {
    };
    const selectionObserver = initSelectionObserver(o);
    const pluginHandlers = [];
    for (const plugin3 of o.plugins) {
      pluginHandlers.push(plugin3.observer(plugin3.callback, currentWindow, plugin3.options));
    }
    return () => {
      mutationBuffers.forEach((b) => b.reset());
      mutationObserver.disconnect();
      mousemoveHandler();
      mouseInteractionHandler();
      scrollHandler();
      viewportResizeHandler();
      inputHandler();
      mediaInteractionHandler();
      styleSheetObserver();
      adoptedStyleSheetObserver();
      styleDeclarationObserver();
      fontObserver();
      selectionObserver();
      pluginHandlers.forEach((h) => h());
    };
  }

  // ../node_modules/rrweb/es/rrweb/packages/rrweb/src/record/cross-origin-iframe-mirror.js
  var CrossOriginIframeMirror = class {
    constructor(generateIdFn) {
      this.generateIdFn = generateIdFn;
      this.iframeIdToRemoteIdMap = /* @__PURE__ */ new WeakMap();
      this.iframeRemoteIdToIdMap = /* @__PURE__ */ new WeakMap();
    }
    getId(iframe, remoteId, idToRemoteMap, remoteToIdMap) {
      const idToRemoteIdMap = idToRemoteMap || this.getIdToRemoteIdMap(iframe);
      const remoteIdToIdMap = remoteToIdMap || this.getRemoteIdToIdMap(iframe);
      let id = idToRemoteIdMap.get(remoteId);
      if (!id) {
        id = this.generateIdFn();
        idToRemoteIdMap.set(remoteId, id);
        remoteIdToIdMap.set(id, remoteId);
      }
      return id;
    }
    getIds(iframe, remoteId) {
      const idToRemoteIdMap = this.getIdToRemoteIdMap(iframe);
      const remoteIdToIdMap = this.getRemoteIdToIdMap(iframe);
      return remoteId.map((id) => this.getId(iframe, id, idToRemoteIdMap, remoteIdToIdMap));
    }
    getRemoteId(iframe, id, map) {
      const remoteIdToIdMap = map || this.getRemoteIdToIdMap(iframe);
      if (typeof id !== "number")
        return id;
      const remoteId = remoteIdToIdMap.get(id);
      if (!remoteId)
        return -1;
      return remoteId;
    }
    getRemoteIds(iframe, ids) {
      const remoteIdToIdMap = this.getRemoteIdToIdMap(iframe);
      return ids.map((id) => this.getRemoteId(iframe, id, remoteIdToIdMap));
    }
    reset(iframe) {
      if (!iframe) {
        this.iframeIdToRemoteIdMap = /* @__PURE__ */ new WeakMap();
        this.iframeRemoteIdToIdMap = /* @__PURE__ */ new WeakMap();
        return;
      }
      this.iframeIdToRemoteIdMap.delete(iframe);
      this.iframeRemoteIdToIdMap.delete(iframe);
    }
    getIdToRemoteIdMap(iframe) {
      let idToRemoteIdMap = this.iframeIdToRemoteIdMap.get(iframe);
      if (!idToRemoteIdMap) {
        idToRemoteIdMap = /* @__PURE__ */ new Map();
        this.iframeIdToRemoteIdMap.set(iframe, idToRemoteIdMap);
      }
      return idToRemoteIdMap;
    }
    getRemoteIdToIdMap(iframe) {
      let remoteIdToIdMap = this.iframeRemoteIdToIdMap.get(iframe);
      if (!remoteIdToIdMap) {
        remoteIdToIdMap = /* @__PURE__ */ new Map();
        this.iframeRemoteIdToIdMap.set(iframe, remoteIdToIdMap);
      }
      return remoteIdToIdMap;
    }
  };

  // ../node_modules/rrweb/es/rrweb/packages/rrweb/src/record/iframe-manager.js
  var IframeManager = class {
    constructor(options) {
      this.iframes = /* @__PURE__ */ new WeakMap();
      this.crossOriginIframeMap = /* @__PURE__ */ new WeakMap();
      this.crossOriginIframeMirror = new CrossOriginIframeMirror(genId);
      this.mutationCb = options.mutationCb;
      this.wrappedEmit = options.wrappedEmit;
      this.stylesheetManager = options.stylesheetManager;
      this.recordCrossOriginIframes = options.recordCrossOriginIframes;
      this.crossOriginIframeStyleMirror = new CrossOriginIframeMirror(this.stylesheetManager.styleMirror.generateId.bind(this.stylesheetManager.styleMirror));
      this.mirror = options.mirror;
      if (this.recordCrossOriginIframes) {
        window.addEventListener("message", this.handleMessage.bind(this));
      }
    }
    addIframe(iframeEl) {
      this.iframes.set(iframeEl, true);
      if (iframeEl.contentWindow)
        this.crossOriginIframeMap.set(iframeEl.contentWindow, iframeEl);
    }
    addLoadListener(cb) {
      this.loadListener = cb;
    }
    attachIframe(iframeEl, childSn) {
      var _a2;
      this.mutationCb({
        adds: [
          {
            parentId: this.mirror.getId(iframeEl),
            nextId: null,
            node: childSn
          }
        ],
        removes: [],
        texts: [],
        attributes: [],
        isAttachIframe: true
      });
      (_a2 = this.loadListener) === null || _a2 === void 0 ? void 0 : _a2.call(this, iframeEl);
      if (iframeEl.contentDocument && iframeEl.contentDocument.adoptedStyleSheets && iframeEl.contentDocument.adoptedStyleSheets.length > 0)
        this.stylesheetManager.adoptStyleSheets(iframeEl.contentDocument.adoptedStyleSheets, this.mirror.getId(iframeEl.contentDocument));
    }
    handleMessage(message) {
      if (message.data.type === "rrweb") {
        const iframeSourceWindow = message.source;
        if (!iframeSourceWindow)
          return;
        const iframeEl = this.crossOriginIframeMap.get(message.source);
        if (!iframeEl)
          return;
        const transformedEvent = this.transformCrossOriginEvent(iframeEl, message.data.event);
        if (transformedEvent)
          this.wrappedEmit(transformedEvent, message.data.isCheckout);
      }
    }
    transformCrossOriginEvent(iframeEl, e) {
      var _a2;
      switch (e.type) {
        case EventType.FullSnapshot: {
          this.crossOriginIframeMirror.reset(iframeEl);
          this.crossOriginIframeStyleMirror.reset(iframeEl);
          this.replaceIdOnNode(e.data.node, iframeEl);
          return {
            timestamp: e.timestamp,
            type: EventType.IncrementalSnapshot,
            data: {
              source: IncrementalSource.Mutation,
              adds: [
                {
                  parentId: this.mirror.getId(iframeEl),
                  nextId: null,
                  node: e.data.node
                }
              ],
              removes: [],
              texts: [],
              attributes: [],
              isAttachIframe: true
            }
          };
        }
        case EventType.Meta:
        case EventType.Load:
        case EventType.DomContentLoaded: {
          return false;
        }
        case EventType.Plugin: {
          return e;
        }
        case EventType.Custom: {
          this.replaceIds(e.data.payload, iframeEl, ["id", "parentId", "previousId", "nextId"]);
          return e;
        }
        case EventType.IncrementalSnapshot: {
          switch (e.data.source) {
            case IncrementalSource.Mutation: {
              e.data.adds.forEach((n2) => {
                this.replaceIds(n2, iframeEl, [
                  "parentId",
                  "nextId",
                  "previousId"
                ]);
                this.replaceIdOnNode(n2.node, iframeEl);
              });
              e.data.removes.forEach((n2) => {
                this.replaceIds(n2, iframeEl, ["parentId", "id"]);
              });
              e.data.attributes.forEach((n2) => {
                this.replaceIds(n2, iframeEl, ["id"]);
              });
              e.data.texts.forEach((n2) => {
                this.replaceIds(n2, iframeEl, ["id"]);
              });
              return e;
            }
            case IncrementalSource.Drag:
            case IncrementalSource.TouchMove:
            case IncrementalSource.MouseMove: {
              e.data.positions.forEach((p) => {
                this.replaceIds(p, iframeEl, ["id"]);
              });
              return e;
            }
            case IncrementalSource.ViewportResize: {
              return false;
            }
            case IncrementalSource.MediaInteraction:
            case IncrementalSource.MouseInteraction:
            case IncrementalSource.Scroll:
            case IncrementalSource.CanvasMutation:
            case IncrementalSource.Input: {
              this.replaceIds(e.data, iframeEl, ["id"]);
              return e;
            }
            case IncrementalSource.StyleSheetRule:
            case IncrementalSource.StyleDeclaration: {
              this.replaceIds(e.data, iframeEl, ["id"]);
              this.replaceStyleIds(e.data, iframeEl, ["styleId"]);
              return e;
            }
            case IncrementalSource.Font: {
              return e;
            }
            case IncrementalSource.Selection: {
              e.data.ranges.forEach((range) => {
                this.replaceIds(range, iframeEl, ["start", "end"]);
              });
              return e;
            }
            case IncrementalSource.AdoptedStyleSheet: {
              this.replaceIds(e.data, iframeEl, ["id"]);
              this.replaceStyleIds(e.data, iframeEl, ["styleIds"]);
              (_a2 = e.data.styles) === null || _a2 === void 0 ? void 0 : _a2.forEach((style) => {
                this.replaceStyleIds(style, iframeEl, ["styleId"]);
              });
              return e;
            }
          }
        }
      }
    }
    replace(iframeMirror, obj, iframeEl, keys) {
      for (const key of keys) {
        if (!Array.isArray(obj[key]) && typeof obj[key] !== "number")
          continue;
        if (Array.isArray(obj[key])) {
          obj[key] = iframeMirror.getIds(iframeEl, obj[key]);
        } else {
          obj[key] = iframeMirror.getId(iframeEl, obj[key]);
        }
      }
      return obj;
    }
    replaceIds(obj, iframeEl, keys) {
      return this.replace(this.crossOriginIframeMirror, obj, iframeEl, keys);
    }
    replaceStyleIds(obj, iframeEl, keys) {
      return this.replace(this.crossOriginIframeStyleMirror, obj, iframeEl, keys);
    }
    replaceIdOnNode(node2, iframeEl) {
      this.replaceIds(node2, iframeEl, ["id"]);
      if ("childNodes" in node2) {
        node2.childNodes.forEach((child) => {
          this.replaceIdOnNode(child, iframeEl);
        });
      }
    }
  };

  // ../node_modules/rrweb/es/rrweb/packages/rrweb/src/record/shadow-dom-manager.js
  var ShadowDomManager = class {
    constructor(options) {
      this.shadowDoms = /* @__PURE__ */ new WeakSet();
      this.restorePatches = [];
      this.mutationCb = options.mutationCb;
      this.scrollCb = options.scrollCb;
      this.bypassOptions = options.bypassOptions;
      this.mirror = options.mirror;
      const manager = this;
      this.restorePatches.push(patch(Element.prototype, "attachShadow", function(original) {
        return function(option) {
          const shadowRoot2 = original.call(this, option);
          if (this.shadowRoot)
            manager.addShadowRoot(this.shadowRoot, this.ownerDocument);
          return shadowRoot2;
        };
      }));
    }
    addShadowRoot(shadowRoot2, doc) {
      if (!isNativeShadowDom(shadowRoot2))
        return;
      if (this.shadowDoms.has(shadowRoot2))
        return;
      this.shadowDoms.add(shadowRoot2);
      initMutationObserver(Object.assign(Object.assign({}, this.bypassOptions), { doc, mutationCb: this.mutationCb, mirror: this.mirror, shadowDomManager: this }), shadowRoot2);
      initScrollObserver(Object.assign(Object.assign({}, this.bypassOptions), { scrollCb: this.scrollCb, doc: shadowRoot2, mirror: this.mirror }));
      setTimeout(() => {
        if (shadowRoot2.adoptedStyleSheets && shadowRoot2.adoptedStyleSheets.length > 0)
          this.bypassOptions.stylesheetManager.adoptStyleSheets(shadowRoot2.adoptedStyleSheets, this.mirror.getId(shadowRoot2.host));
        initAdoptedStyleSheetObserver({
          mirror: this.mirror,
          stylesheetManager: this.bypassOptions.stylesheetManager
        }, shadowRoot2);
      }, 0);
    }
    observeAttachShadow(iframeElement) {
      if (iframeElement.contentWindow) {
        const manager = this;
        this.restorePatches.push(patch(iframeElement.contentWindow.HTMLElement.prototype, "attachShadow", function(original) {
          return function(option) {
            const shadowRoot2 = original.call(this, option);
            if (this.shadowRoot)
              manager.addShadowRoot(this.shadowRoot, iframeElement.contentDocument);
            return shadowRoot2;
          };
        }));
      }
    }
    reset() {
      this.restorePatches.forEach((restorePatch) => restorePatch());
      this.shadowDoms = /* @__PURE__ */ new WeakSet();
    }
  };

  // ../node_modules/rrweb/es/rrweb/ext/tslib/tslib.es6.js
  function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
      t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
          t[p[i]] = s[p[i]];
      }
    return t;
  }
  function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve2) {
        resolve2(value);
      });
    }
    return new (P || (P = Promise))(function(resolve2, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result2) {
        result2.done ? resolve2(result2.value) : adopt(result2.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  }

  // ../node_modules/rrweb/es/rrweb/ext/base64-arraybuffer/dist/base64-arraybuffer.es5.js
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var lookup = typeof Uint8Array === "undefined" ? [] : new Uint8Array(256);
  for (i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }
  var i;
  var encode = function(arraybuffer) {
    var bytes = new Uint8Array(arraybuffer), i, len = bytes.length, base64 = "";
    for (i = 0; i < len; i += 3) {
      base64 += chars[bytes[i] >> 2];
      base64 += chars[(bytes[i] & 3) << 4 | bytes[i + 1] >> 4];
      base64 += chars[(bytes[i + 1] & 15) << 2 | bytes[i + 2] >> 6];
      base64 += chars[bytes[i + 2] & 63];
    }
    if (len % 3 === 2) {
      base64 = base64.substring(0, base64.length - 1) + "=";
    } else if (len % 3 === 1) {
      base64 = base64.substring(0, base64.length - 2) + "==";
    }
    return base64;
  };

  // ../node_modules/rrweb/es/rrweb/packages/rrweb/src/record/observers/canvas/serialize-args.js
  var canvasVarMap = /* @__PURE__ */ new Map();
  function variableListFor(ctx, ctor) {
    let contextMap = canvasVarMap.get(ctx);
    if (!contextMap) {
      contextMap = /* @__PURE__ */ new Map();
      canvasVarMap.set(ctx, contextMap);
    }
    if (!contextMap.has(ctor)) {
      contextMap.set(ctor, []);
    }
    return contextMap.get(ctor);
  }
  var saveWebGLVar = (value, win, ctx) => {
    if (!value || !(isInstanceOfWebGLObject(value, win) || typeof value === "object"))
      return;
    const name = value.constructor.name;
    const list2 = variableListFor(ctx, name);
    let index2 = list2.indexOf(value);
    if (index2 === -1) {
      index2 = list2.length;
      list2.push(value);
    }
    return index2;
  };
  function serializeArg(value, win, ctx) {
    if (value instanceof Array) {
      return value.map((arg) => serializeArg(arg, win, ctx));
    } else if (value === null) {
      return value;
    } else if (value instanceof Float32Array || value instanceof Float64Array || value instanceof Int32Array || value instanceof Uint32Array || value instanceof Uint8Array || value instanceof Uint16Array || value instanceof Int16Array || value instanceof Int8Array || value instanceof Uint8ClampedArray) {
      const name = value.constructor.name;
      return {
        rr_type: name,
        args: [Object.values(value)]
      };
    } else if (value instanceof ArrayBuffer) {
      const name = value.constructor.name;
      const base64 = encode(value);
      return {
        rr_type: name,
        base64
      };
    } else if (value instanceof DataView) {
      const name = value.constructor.name;
      return {
        rr_type: name,
        args: [
          serializeArg(value.buffer, win, ctx),
          value.byteOffset,
          value.byteLength
        ]
      };
    } else if (value instanceof HTMLImageElement) {
      const name = value.constructor.name;
      const { src } = value;
      return {
        rr_type: name,
        src
      };
    } else if (value instanceof HTMLCanvasElement) {
      const name = "HTMLImageElement";
      const src = value.toDataURL();
      return {
        rr_type: name,
        src
      };
    } else if (value instanceof ImageData) {
      const name = value.constructor.name;
      return {
        rr_type: name,
        args: [serializeArg(value.data, win, ctx), value.width, value.height]
      };
    } else if (isInstanceOfWebGLObject(value, win) || typeof value === "object") {
      const name = value.constructor.name;
      const index2 = saveWebGLVar(value, win, ctx);
      return {
        rr_type: name,
        index: index2
      };
    }
    return value;
  }
  var serializeArgs = (args, win, ctx) => {
    return [...args].map((arg) => serializeArg(arg, win, ctx));
  };
  var isInstanceOfWebGLObject = (value, win) => {
    const webGLConstructorNames = [
      "WebGLActiveInfo",
      "WebGLBuffer",
      "WebGLFramebuffer",
      "WebGLProgram",
      "WebGLRenderbuffer",
      "WebGLShader",
      "WebGLShaderPrecisionFormat",
      "WebGLTexture",
      "WebGLUniformLocation",
      "WebGLVertexArrayObject",
      "WebGLVertexArrayObjectOES"
    ];
    const supportedWebGLConstructorNames = webGLConstructorNames.filter((name) => typeof win[name] === "function");
    return Boolean(supportedWebGLConstructorNames.find((name) => value instanceof win[name]));
  };

  // ../node_modules/rrweb/es/rrweb/packages/rrweb/src/record/observers/canvas/2d.js
  function initCanvas2DMutationObserver(cb, win, blockClass, blockSelector) {
    const handlers = [];
    const props2D = Object.getOwnPropertyNames(win.CanvasRenderingContext2D.prototype);
    for (const prop of props2D) {
      try {
        if (typeof win.CanvasRenderingContext2D.prototype[prop] !== "function") {
          continue;
        }
        const restoreHandler = patch(win.CanvasRenderingContext2D.prototype, prop, function(original) {
          return function(...args) {
            if (!isBlocked(this.canvas, blockClass, blockSelector, true)) {
              setTimeout(() => {
                const recordArgs = serializeArgs([...args], win, this);
                cb(this.canvas, {
                  type: CanvasContext["2D"],
                  property: prop,
                  args: recordArgs
                });
              }, 0);
            }
            return original.apply(this, args);
          };
        });
        handlers.push(restoreHandler);
      } catch (_a2) {
        const hookHandler = hookSetter(win.CanvasRenderingContext2D.prototype, prop, {
          set(v) {
            cb(this.canvas, {
              type: CanvasContext["2D"],
              property: prop,
              args: [v],
              setter: true
            });
          }
        });
        handlers.push(hookHandler);
      }
    }
    return () => {
      handlers.forEach((h) => h());
    };
  }

  // ../node_modules/rrweb/es/rrweb/packages/rrweb/src/record/observers/canvas/canvas.js
  function initCanvasContextObserver(win, blockClass, blockSelector) {
    const handlers = [];
    try {
      const restoreHandler = patch(win.HTMLCanvasElement.prototype, "getContext", function(original) {
        return function(contextType, ...args) {
          if (!isBlocked(this, blockClass, blockSelector, true)) {
            if (!("__context" in this))
              this.__context = contextType;
          }
          return original.apply(this, [contextType, ...args]);
        };
      });
      handlers.push(restoreHandler);
    } catch (_a2) {
      console.error("failed to patch HTMLCanvasElement.prototype.getContext");
    }
    return () => {
      handlers.forEach((h) => h());
    };
  }

  // ../node_modules/rrweb/es/rrweb/packages/rrweb/src/record/observers/canvas/webgl.js
  function patchGLPrototype(prototype, type, cb, blockClass, blockSelector, mirror2, win) {
    const handlers = [];
    const props = Object.getOwnPropertyNames(prototype);
    for (const prop of props) {
      if ([
        "isContextLost",
        "canvas",
        "drawingBufferWidth",
        "drawingBufferHeight"
      ].includes(prop)) {
        continue;
      }
      try {
        if (typeof prototype[prop] !== "function") {
          continue;
        }
        const restoreHandler = patch(prototype, prop, function(original) {
          return function(...args) {
            const result2 = original.apply(this, args);
            saveWebGLVar(result2, win, this);
            if (!isBlocked(this.canvas, blockClass, blockSelector, true)) {
              const recordArgs = serializeArgs([...args], win, this);
              const mutation = {
                type,
                property: prop,
                args: recordArgs
              };
              cb(this.canvas, mutation);
            }
            return result2;
          };
        });
        handlers.push(restoreHandler);
      } catch (_a2) {
        const hookHandler = hookSetter(prototype, prop, {
          set(v) {
            cb(this.canvas, {
              type,
              property: prop,
              args: [v],
              setter: true
            });
          }
        });
        handlers.push(hookHandler);
      }
    }
    return handlers;
  }
  function initCanvasWebGLMutationObserver(cb, win, blockClass, blockSelector, mirror2) {
    const handlers = [];
    handlers.push(...patchGLPrototype(win.WebGLRenderingContext.prototype, CanvasContext.WebGL, cb, blockClass, blockSelector, mirror2, win));
    if (typeof win.WebGL2RenderingContext !== "undefined") {
      handlers.push(...patchGLPrototype(win.WebGL2RenderingContext.prototype, CanvasContext.WebGL2, cb, blockClass, blockSelector, mirror2, win));
    }
    return () => {
      handlers.forEach((h) => h());
    };
  }

  // ../node_modules/rrweb/es/rrweb/_virtual/_rollup-plugin-web-worker-loader__helper__node__WorkerClass.js
  var WorkerClass = null;
  try {
    WorkerThreads = typeof module !== "undefined" && typeof module.require === "function" && module.require("worker_threads") || typeof __non_webpack_require__ === "function" && __non_webpack_require__("worker_threads") || typeof __require === "function" && __require("worker_threads");
    WorkerClass = WorkerThreads.Worker;
  } catch (e) {
  }
  var WorkerThreads;

  // ../node_modules/rrweb/es/rrweb/_virtual/_rollup-plugin-web-worker-loader__helper__node__createBase64WorkerFactory.js
  function decodeBase64(base64, enableUnicode) {
    return Buffer.from(base64, "base64").toString(enableUnicode ? "utf16" : "utf8");
  }
  function createBase64WorkerFactory(base64, sourcemapArg, enableUnicodeArg) {
    var sourcemap = sourcemapArg === void 0 ? null : sourcemapArg;
    var enableUnicode = enableUnicodeArg === void 0 ? false : enableUnicodeArg;
    var source = decodeBase64(base64, enableUnicode);
    var start2 = source.indexOf("\n", 10) + 1;
    var body = source.substring(start2) + (sourcemap ? "//# sourceMappingURL=" + sourcemap : "");
    return function WorkerFactory2(options) {
      return new WorkerClass(body, Object.assign({}, options, { eval: true }));
    };
  }

  // ../node_modules/rrweb/es/rrweb/_virtual/_rollup-plugin-web-worker-loader__helper__browser__createBase64WorkerFactory.js
  function decodeBase642(base64, enableUnicode) {
    var binaryString = atob(base64);
    if (enableUnicode) {
      var binaryView = new Uint8Array(binaryString.length);
      for (var i = 0, n2 = binaryString.length; i < n2; ++i) {
        binaryView[i] = binaryString.charCodeAt(i);
      }
      return String.fromCharCode.apply(null, new Uint16Array(binaryView.buffer));
    }
    return binaryString;
  }
  function createURL(base64, sourcemapArg, enableUnicodeArg) {
    var sourcemap = sourcemapArg === void 0 ? null : sourcemapArg;
    var enableUnicode = enableUnicodeArg === void 0 ? false : enableUnicodeArg;
    var source = decodeBase642(base64, enableUnicode);
    var start2 = source.indexOf("\n", 10) + 1;
    var body = source.substring(start2) + (sourcemap ? "//# sourceMappingURL=" + sourcemap : "");
    var blob = new Blob([body], { type: "application/javascript" });
    return URL.createObjectURL(blob);
  }
  function createBase64WorkerFactory2(base64, sourcemapArg, enableUnicodeArg) {
    var url;
    return function WorkerFactory2(options) {
      url = url || createURL(base64, sourcemapArg, enableUnicodeArg);
      return new Worker(url, options);
    };
  }

  // ../node_modules/rrweb/es/rrweb/_virtual/_rollup-plugin-web-worker-loader__helper__auto__isNodeJS.js
  var kIsNodeJS = Object.prototype.toString.call(typeof process !== "undefined" ? process : 0) === "[object process]";
  function isNodeJS() {
    return kIsNodeJS;
  }

  // ../node_modules/rrweb/es/rrweb/_virtual/_rollup-plugin-web-worker-loader__helper__auto__createBase64WorkerFactory.js
  function createBase64WorkerFactory3(base64, sourcemapArg, enableUnicodeArg) {
    if (isNodeJS()) {
      return createBase64WorkerFactory(base64, sourcemapArg, enableUnicodeArg);
    }
    return createBase64WorkerFactory2(base64, sourcemapArg, enableUnicodeArg);
  }

  // ../node_modules/rrweb/es/rrweb/_virtual/image-bitmap-data-url-worker.js
  var WorkerFactory = createBase64WorkerFactory3("Lyogcm9sbHVwLXBsdWdpbi13ZWItd29ya2VyLWxvYWRlciAqLwooZnVuY3Rpb24gKCkgewogICAgJ3VzZSBzdHJpY3QnOwoKICAgIC8qISAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKg0KICAgIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLg0KDQogICAgUGVybWlzc2lvbiB0byB1c2UsIGNvcHksIG1vZGlmeSwgYW5kL29yIGRpc3RyaWJ1dGUgdGhpcyBzb2Z0d2FyZSBmb3IgYW55DQogICAgcHVycG9zZSB3aXRoIG9yIHdpdGhvdXQgZmVlIGlzIGhlcmVieSBncmFudGVkLg0KDQogICAgVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEICJBUyBJUyIgQU5EIFRIRSBBVVRIT1IgRElTQ0xBSU1TIEFMTCBXQVJSQU5USUVTIFdJVEgNCiAgICBSRUdBUkQgVE8gVEhJUyBTT0ZUV0FSRSBJTkNMVURJTkcgQUxMIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkNCiAgICBBTkQgRklUTkVTUy4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUiBCRSBMSUFCTEUgRk9SIEFOWSBTUEVDSUFMLCBESVJFQ1QsDQogICAgSU5ESVJFQ1QsIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFUyBPUiBBTlkgREFNQUdFUyBXSEFUU09FVkVSIFJFU1VMVElORyBGUk9NDQogICAgTE9TUyBPRiBVU0UsIERBVEEgT1IgUFJPRklUUywgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIE5FR0xJR0VOQ0UgT1INCiAgICBPVEhFUiBUT1JUSU9VUyBBQ1RJT04sIEFSSVNJTkcgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgVVNFIE9SDQogICAgUEVSRk9STUFOQ0UgT0YgVEhJUyBTT0ZUV0FSRS4NCiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAqLw0KDQogICAgZnVuY3Rpb24gX19hd2FpdGVyKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikgew0KICAgICAgICBmdW5jdGlvbiBhZG9wdCh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQID8gdmFsdWUgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHZhbHVlKTsgfSk7IH0NCiAgICAgICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7DQogICAgICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9DQogICAgICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvclsidGhyb3ciXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9DQogICAgICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IGFkb3B0KHJlc3VsdC52YWx1ZSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfQ0KICAgICAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pKS5uZXh0KCkpOw0KICAgICAgICB9KTsNCiAgICB9CgogICAgLyoKICAgICAqIGJhc2U2NC1hcnJheWJ1ZmZlciAxLjAuMSA8aHR0cHM6Ly9naXRodWIuY29tL25pa2xhc3ZoL2Jhc2U2NC1hcnJheWJ1ZmZlcj4KICAgICAqIENvcHlyaWdodCAoYykgMjAyMSBOaWtsYXMgdm9uIEhlcnR6ZW4gPGh0dHBzOi8vaGVydHplbi5jb20+CiAgICAgKiBSZWxlYXNlZCB1bmRlciBNSVQgTGljZW5zZQogICAgICovCiAgICB2YXIgY2hhcnMgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLyc7CiAgICAvLyBVc2UgYSBsb29rdXAgdGFibGUgdG8gZmluZCB0aGUgaW5kZXguCiAgICB2YXIgbG9va3VwID0gdHlwZW9mIFVpbnQ4QXJyYXkgPT09ICd1bmRlZmluZWQnID8gW10gOiBuZXcgVWludDhBcnJheSgyNTYpOwogICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGFycy5sZW5ndGg7IGkrKykgewogICAgICAgIGxvb2t1cFtjaGFycy5jaGFyQ29kZUF0KGkpXSA9IGk7CiAgICB9CiAgICB2YXIgZW5jb2RlID0gZnVuY3Rpb24gKGFycmF5YnVmZmVyKSB7CiAgICAgICAgdmFyIGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXlidWZmZXIpLCBpLCBsZW4gPSBieXRlcy5sZW5ndGgsIGJhc2U2NCA9ICcnOwogICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkgKz0gMykgewogICAgICAgICAgICBiYXNlNjQgKz0gY2hhcnNbYnl0ZXNbaV0gPj4gMl07CiAgICAgICAgICAgIGJhc2U2NCArPSBjaGFyc1soKGJ5dGVzW2ldICYgMykgPDwgNCkgfCAoYnl0ZXNbaSArIDFdID4+IDQpXTsKICAgICAgICAgICAgYmFzZTY0ICs9IGNoYXJzWygoYnl0ZXNbaSArIDFdICYgMTUpIDw8IDIpIHwgKGJ5dGVzW2kgKyAyXSA+PiA2KV07CiAgICAgICAgICAgIGJhc2U2NCArPSBjaGFyc1tieXRlc1tpICsgMl0gJiA2M107CiAgICAgICAgfQogICAgICAgIGlmIChsZW4gJSAzID09PSAyKSB7CiAgICAgICAgICAgIGJhc2U2NCA9IGJhc2U2NC5zdWJzdHJpbmcoMCwgYmFzZTY0Lmxlbmd0aCAtIDEpICsgJz0nOwogICAgICAgIH0KICAgICAgICBlbHNlIGlmIChsZW4gJSAzID09PSAxKSB7CiAgICAgICAgICAgIGJhc2U2NCA9IGJhc2U2NC5zdWJzdHJpbmcoMCwgYmFzZTY0Lmxlbmd0aCAtIDIpICsgJz09JzsKICAgICAgICB9CiAgICAgICAgcmV0dXJuIGJhc2U2NDsKICAgIH07CgogICAgY29uc3QgbGFzdEJsb2JNYXAgPSBuZXcgTWFwKCk7DQogICAgY29uc3QgdHJhbnNwYXJlbnRCbG9iTWFwID0gbmV3IE1hcCgpOw0KICAgIGZ1bmN0aW9uIGdldFRyYW5zcGFyZW50QmxvYkZvcih3aWR0aCwgaGVpZ2h0LCBkYXRhVVJMT3B0aW9ucykgew0KICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkgew0KICAgICAgICAgICAgY29uc3QgaWQgPSBgJHt3aWR0aH0tJHtoZWlnaHR9YDsNCiAgICAgICAgICAgIGlmICgnT2Zmc2NyZWVuQ2FudmFzJyBpbiBnbG9iYWxUaGlzKSB7DQogICAgICAgICAgICAgICAgaWYgKHRyYW5zcGFyZW50QmxvYk1hcC5oYXMoaWQpKQ0KICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJhbnNwYXJlbnRCbG9iTWFwLmdldChpZCk7DQogICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2NyZWVuID0gbmV3IE9mZnNjcmVlbkNhbnZhcyh3aWR0aCwgaGVpZ2h0KTsNCiAgICAgICAgICAgICAgICBvZmZzY3JlZW4uZ2V0Q29udGV4dCgnMmQnKTsNCiAgICAgICAgICAgICAgICBjb25zdCBibG9iID0geWllbGQgb2Zmc2NyZWVuLmNvbnZlcnRUb0Jsb2IoZGF0YVVSTE9wdGlvbnMpOw0KICAgICAgICAgICAgICAgIGNvbnN0IGFycmF5QnVmZmVyID0geWllbGQgYmxvYi5hcnJheUJ1ZmZlcigpOw0KICAgICAgICAgICAgICAgIGNvbnN0IGJhc2U2NCA9IGVuY29kZShhcnJheUJ1ZmZlcik7DQogICAgICAgICAgICAgICAgdHJhbnNwYXJlbnRCbG9iTWFwLnNldChpZCwgYmFzZTY0KTsNCiAgICAgICAgICAgICAgICByZXR1cm4gYmFzZTY0Ow0KICAgICAgICAgICAgfQ0KICAgICAgICAgICAgZWxzZSB7DQogICAgICAgICAgICAgICAgcmV0dXJuICcnOw0KICAgICAgICAgICAgfQ0KICAgICAgICB9KTsNCiAgICB9DQogICAgY29uc3Qgd29ya2VyID0gc2VsZjsNCiAgICB3b3JrZXIub25tZXNzYWdlID0gZnVuY3Rpb24gKGUpIHsNCiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIHZvaWQgMCwgZnVuY3Rpb24qICgpIHsNCiAgICAgICAgICAgIGlmICgnT2Zmc2NyZWVuQ2FudmFzJyBpbiBnbG9iYWxUaGlzKSB7DQogICAgICAgICAgICAgICAgY29uc3QgeyBpZCwgYml0bWFwLCB3aWR0aCwgaGVpZ2h0LCBkYXRhVVJMT3B0aW9ucyB9ID0gZS5kYXRhOw0KICAgICAgICAgICAgICAgIGNvbnN0IHRyYW5zcGFyZW50QmFzZTY0ID0gZ2V0VHJhbnNwYXJlbnRCbG9iRm9yKHdpZHRoLCBoZWlnaHQsIGRhdGFVUkxPcHRpb25zKTsNCiAgICAgICAgICAgICAgICBjb25zdCBvZmZzY3JlZW4gPSBuZXcgT2Zmc2NyZWVuQ2FudmFzKHdpZHRoLCBoZWlnaHQpOw0KICAgICAgICAgICAgICAgIGNvbnN0IGN0eCA9IG9mZnNjcmVlbi5nZXRDb250ZXh0KCcyZCcpOw0KICAgICAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UoYml0bWFwLCAwLCAwKTsNCiAgICAgICAgICAgICAgICBiaXRtYXAuY2xvc2UoKTsNCiAgICAgICAgICAgICAgICBjb25zdCBibG9iID0geWllbGQgb2Zmc2NyZWVuLmNvbnZlcnRUb0Jsb2IoZGF0YVVSTE9wdGlvbnMpOw0KICAgICAgICAgICAgICAgIGNvbnN0IHR5cGUgPSBibG9iLnR5cGU7DQogICAgICAgICAgICAgICAgY29uc3QgYXJyYXlCdWZmZXIgPSB5aWVsZCBibG9iLmFycmF5QnVmZmVyKCk7DQogICAgICAgICAgICAgICAgY29uc3QgYmFzZTY0ID0gZW5jb2RlKGFycmF5QnVmZmVyKTsNCiAgICAgICAgICAgICAgICBpZiAoIWxhc3RCbG9iTWFwLmhhcyhpZCkgJiYgKHlpZWxkIHRyYW5zcGFyZW50QmFzZTY0KSA9PT0gYmFzZTY0KSB7DQogICAgICAgICAgICAgICAgICAgIGxhc3RCbG9iTWFwLnNldChpZCwgYmFzZTY0KTsNCiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHdvcmtlci5wb3N0TWVzc2FnZSh7IGlkIH0pOw0KICAgICAgICAgICAgICAgIH0NCiAgICAgICAgICAgICAgICBpZiAobGFzdEJsb2JNYXAuZ2V0KGlkKSA9PT0gYmFzZTY0KQ0KICAgICAgICAgICAgICAgICAgICByZXR1cm4gd29ya2VyLnBvc3RNZXNzYWdlKHsgaWQgfSk7DQogICAgICAgICAgICAgICAgd29ya2VyLnBvc3RNZXNzYWdlKHsNCiAgICAgICAgICAgICAgICAgICAgaWQsDQogICAgICAgICAgICAgICAgICAgIHR5cGUsDQogICAgICAgICAgICAgICAgICAgIGJhc2U2NCwNCiAgICAgICAgICAgICAgICAgICAgd2lkdGgsDQogICAgICAgICAgICAgICAgICAgIGhlaWdodCwNCiAgICAgICAgICAgICAgICB9KTsNCiAgICAgICAgICAgICAgICBsYXN0QmxvYk1hcC5zZXQoaWQsIGJhc2U2NCk7DQogICAgICAgICAgICB9DQogICAgICAgICAgICBlbHNlIHsNCiAgICAgICAgICAgICAgICByZXR1cm4gd29ya2VyLnBvc3RNZXNzYWdlKHsgaWQ6IGUuZGF0YS5pZCB9KTsNCiAgICAgICAgICAgIH0NCiAgICAgICAgfSk7DQogICAgfTsKCn0pKCk7Cgo=", null, false);

  // ../node_modules/rrweb/es/rrweb/packages/rrweb/src/record/observers/canvas/canvas-manager.js
  var CanvasManager = class {
    constructor(options) {
      this.pendingCanvasMutations = /* @__PURE__ */ new Map();
      this.rafStamps = { latestId: 0, invokeId: null };
      this.frozen = false;
      this.locked = false;
      this.processMutation = (target, mutation) => {
        const newFrame = this.rafStamps.invokeId && this.rafStamps.latestId !== this.rafStamps.invokeId;
        if (newFrame || !this.rafStamps.invokeId)
          this.rafStamps.invokeId = this.rafStamps.latestId;
        if (!this.pendingCanvasMutations.has(target)) {
          this.pendingCanvasMutations.set(target, []);
        }
        this.pendingCanvasMutations.get(target).push(mutation);
      };
      const { sampling = "all", win, blockClass, blockSelector, recordCanvas, dataURLOptions } = options;
      this.mutationCb = options.mutationCb;
      this.mirror = options.mirror;
      if (recordCanvas && sampling === "all")
        this.initCanvasMutationObserver(win, blockClass, blockSelector);
      if (recordCanvas && typeof sampling === "number")
        this.initCanvasFPSObserver(sampling, win, blockClass, blockSelector, {
          dataURLOptions
        });
    }
    reset() {
      this.pendingCanvasMutations.clear();
      this.resetObservers && this.resetObservers();
    }
    freeze() {
      this.frozen = true;
    }
    unfreeze() {
      this.frozen = false;
    }
    lock() {
      this.locked = true;
    }
    unlock() {
      this.locked = false;
    }
    initCanvasFPSObserver(fps, win, blockClass, blockSelector, options) {
      const canvasContextReset = initCanvasContextObserver(win, blockClass, blockSelector);
      const snapshotInProgressMap = /* @__PURE__ */ new Map();
      const worker = new WorkerFactory();
      worker.onmessage = (e) => {
        const { id } = e.data;
        snapshotInProgressMap.set(id, false);
        if (!("base64" in e.data))
          return;
        const { base64, type, width, height } = e.data;
        this.mutationCb({
          id,
          type: CanvasContext["2D"],
          commands: [
            {
              property: "clearRect",
              args: [0, 0, width, height]
            },
            {
              property: "drawImage",
              args: [
                {
                  rr_type: "ImageBitmap",
                  args: [
                    {
                      rr_type: "Blob",
                      data: [{ rr_type: "ArrayBuffer", base64 }],
                      type
                    }
                  ]
                },
                0,
                0
              ]
            }
          ]
        });
      };
      const timeBetweenSnapshots = 1e3 / fps;
      let lastSnapshotTime = 0;
      let rafId;
      const getCanvas = () => {
        const matchedCanvas = [];
        win.document.querySelectorAll("canvas").forEach((canvas) => {
          if (!isBlocked(canvas, blockClass, blockSelector, true)) {
            matchedCanvas.push(canvas);
          }
        });
        return matchedCanvas;
      };
      const takeCanvasSnapshots = (timestamp) => {
        if (lastSnapshotTime && timestamp - lastSnapshotTime < timeBetweenSnapshots) {
          rafId = requestAnimationFrame(takeCanvasSnapshots);
          return;
        }
        lastSnapshotTime = timestamp;
        getCanvas().forEach((canvas) => __awaiter(this, void 0, void 0, function* () {
          var _a2;
          const id = this.mirror.getId(canvas);
          if (snapshotInProgressMap.get(id))
            return;
          snapshotInProgressMap.set(id, true);
          if (["webgl", "webgl2"].includes(canvas.__context)) {
            const context = canvas.getContext(canvas.__context);
            if (((_a2 = context === null || context === void 0 ? void 0 : context.getContextAttributes()) === null || _a2 === void 0 ? void 0 : _a2.preserveDrawingBuffer) === false) {
              context === null || context === void 0 ? void 0 : context.clear(context.COLOR_BUFFER_BIT);
            }
          }
          const bitmap = yield createImageBitmap(canvas);
          worker.postMessage({
            id,
            bitmap,
            width: canvas.width,
            height: canvas.height,
            dataURLOptions: options.dataURLOptions
          }, [bitmap]);
        }));
        rafId = requestAnimationFrame(takeCanvasSnapshots);
      };
      rafId = requestAnimationFrame(takeCanvasSnapshots);
      this.resetObservers = () => {
        canvasContextReset();
        cancelAnimationFrame(rafId);
      };
    }
    initCanvasMutationObserver(win, blockClass, blockSelector) {
      this.startRAFTimestamping();
      this.startPendingCanvasMutationFlusher();
      const canvasContextReset = initCanvasContextObserver(win, blockClass, blockSelector);
      const canvas2DReset = initCanvas2DMutationObserver(this.processMutation.bind(this), win, blockClass, blockSelector);
      const canvasWebGL1and2Reset = initCanvasWebGLMutationObserver(this.processMutation.bind(this), win, blockClass, blockSelector, this.mirror);
      this.resetObservers = () => {
        canvasContextReset();
        canvas2DReset();
        canvasWebGL1and2Reset();
      };
    }
    startPendingCanvasMutationFlusher() {
      requestAnimationFrame(() => this.flushPendingCanvasMutations());
    }
    startRAFTimestamping() {
      const setLatestRAFTimestamp = (timestamp) => {
        this.rafStamps.latestId = timestamp;
        requestAnimationFrame(setLatestRAFTimestamp);
      };
      requestAnimationFrame(setLatestRAFTimestamp);
    }
    flushPendingCanvasMutations() {
      this.pendingCanvasMutations.forEach((values, canvas) => {
        const id = this.mirror.getId(canvas);
        this.flushPendingCanvasMutationFor(canvas, id);
      });
      requestAnimationFrame(() => this.flushPendingCanvasMutations());
    }
    flushPendingCanvasMutationFor(canvas, id) {
      if (this.frozen || this.locked) {
        return;
      }
      const valuesWithType = this.pendingCanvasMutations.get(canvas);
      if (!valuesWithType || id === -1)
        return;
      const values = valuesWithType.map((value) => {
        const rest = __rest(value, ["type"]);
        return rest;
      });
      const { type } = valuesWithType[0];
      this.mutationCb({ id, type, commands: values });
      this.pendingCanvasMutations.delete(canvas);
    }
  };

  // ../node_modules/rrweb/es/rrweb/packages/rrweb/src/record/stylesheet-manager.js
  var StylesheetManager = class {
    constructor(options) {
      this.trackedLinkElements = /* @__PURE__ */ new WeakSet();
      this.styleMirror = new StyleSheetMirror();
      this.mutationCb = options.mutationCb;
      this.adoptedStyleSheetCb = options.adoptedStyleSheetCb;
    }
    attachLinkElement(linkEl, childSn) {
      if ("_cssText" in childSn.attributes)
        this.mutationCb({
          adds: [],
          removes: [],
          texts: [],
          attributes: [
            {
              id: childSn.id,
              attributes: childSn.attributes
            }
          ]
        });
      this.trackLinkElement(linkEl);
    }
    trackLinkElement(linkEl) {
      if (this.trackedLinkElements.has(linkEl))
        return;
      this.trackedLinkElements.add(linkEl);
      this.trackStylesheetInLinkElement(linkEl);
    }
    adoptStyleSheets(sheets, hostId) {
      if (sheets.length === 0)
        return;
      const adoptedStyleSheetData = {
        id: hostId,
        styleIds: []
      };
      const styles = [];
      for (const sheet of sheets) {
        let styleId;
        if (!this.styleMirror.has(sheet)) {
          styleId = this.styleMirror.add(sheet);
          const rules = Array.from(sheet.rules || CSSRule);
          styles.push({
            styleId,
            rules: rules.map((r, index2) => {
              return {
                rule: getCssRuleString(r),
                index: index2
              };
            })
          });
        } else
          styleId = this.styleMirror.getId(sheet);
        adoptedStyleSheetData.styleIds.push(styleId);
      }
      if (styles.length > 0)
        adoptedStyleSheetData.styles = styles;
      this.adoptedStyleSheetCb(adoptedStyleSheetData);
    }
    reset() {
      this.styleMirror.reset();
      this.trackedLinkElements = /* @__PURE__ */ new WeakSet();
    }
    trackStylesheetInLinkElement(linkEl) {
    }
  };

  // ../node_modules/rrweb/es/rrweb/packages/rrweb/src/record/index.js
  function wrapEvent(e) {
    return Object.assign(Object.assign({}, e), { timestamp: Date.now() });
  }
  var wrappedEmit;
  var takeFullSnapshot;
  var canvasManager;
  var recording = false;
  var mirror = createMirror();
  function record(options = {}) {
    const { emit, checkoutEveryNms, checkoutEveryNth, blockClass = "rr-block", blockSelector = null, ignoreClass = "rr-ignore", maskTextClass = "rr-mask", maskTextSelector = null, inlineStylesheet = true, maskAllInputs, maskInputOptions: _maskInputOptions, slimDOMOptions: _slimDOMOptions, maskInputFn, maskTextFn, hooks, packFn, sampling = {}, dataURLOptions = {}, mousemoveWait, recordCanvas = false, recordCrossOriginIframes = false, userTriggeredOnInput = false, collectFonts = false, inlineImages = false, plugins, keepIframeSrcFn = () => false, ignoreCSSAttributes = /* @__PURE__ */ new Set([]) } = options;
    const inEmittingFrame = recordCrossOriginIframes ? window.parent === window : true;
    let passEmitsToParent = false;
    if (!inEmittingFrame) {
      try {
        window.parent.document;
        passEmitsToParent = false;
      } catch (e) {
        passEmitsToParent = true;
      }
    }
    if (inEmittingFrame && !emit) {
      throw new Error("emit function is required");
    }
    if (mousemoveWait !== void 0 && sampling.mousemove === void 0) {
      sampling.mousemove = mousemoveWait;
    }
    mirror.reset();
    const maskInputOptions = maskAllInputs === true ? {
      color: true,
      date: true,
      "datetime-local": true,
      email: true,
      month: true,
      number: true,
      range: true,
      search: true,
      tel: true,
      text: true,
      time: true,
      url: true,
      week: true,
      textarea: true,
      select: true,
      password: true
    } : _maskInputOptions !== void 0 ? _maskInputOptions : { password: true };
    const slimDOMOptions = _slimDOMOptions === true || _slimDOMOptions === "all" ? {
      script: true,
      comment: true,
      headFavicon: true,
      headWhitespace: true,
      headMetaSocial: true,
      headMetaRobots: true,
      headMetaHttpEquiv: true,
      headMetaVerification: true,
      headMetaAuthorship: _slimDOMOptions === "all",
      headMetaDescKeywords: _slimDOMOptions === "all"
    } : _slimDOMOptions ? _slimDOMOptions : {};
    polyfill();
    let lastFullSnapshotEvent;
    let incrementalSnapshotCount = 0;
    const eventProcessor = (e) => {
      for (const plugin3 of plugins || []) {
        if (plugin3.eventProcessor) {
          e = plugin3.eventProcessor(e);
        }
      }
      if (packFn) {
        e = packFn(e);
      }
      return e;
    };
    wrappedEmit = (e, isCheckout) => {
      var _a2;
      if (((_a2 = mutationBuffers[0]) === null || _a2 === void 0 ? void 0 : _a2.isFrozen()) && e.type !== EventType.FullSnapshot && !(e.type === EventType.IncrementalSnapshot && e.data.source === IncrementalSource.Mutation)) {
        mutationBuffers.forEach((buf) => buf.unfreeze());
      }
      if (inEmittingFrame) {
        emit === null || emit === void 0 ? void 0 : emit(eventProcessor(e), isCheckout);
      } else if (passEmitsToParent) {
        const message = {
          type: "rrweb",
          event: eventProcessor(e),
          isCheckout
        };
        window.parent.postMessage(message, "*");
      }
      if (e.type === EventType.FullSnapshot) {
        lastFullSnapshotEvent = e;
        incrementalSnapshotCount = 0;
      } else if (e.type === EventType.IncrementalSnapshot) {
        if (e.data.source === IncrementalSource.Mutation && e.data.isAttachIframe) {
          return;
        }
        incrementalSnapshotCount++;
        const exceedCount = checkoutEveryNth && incrementalSnapshotCount >= checkoutEveryNth;
        const exceedTime = checkoutEveryNms && e.timestamp - lastFullSnapshotEvent.timestamp > checkoutEveryNms;
        if (exceedCount || exceedTime) {
          takeFullSnapshot(true);
        }
      }
    };
    const wrappedMutationEmit = (m) => {
      wrappedEmit(wrapEvent({
        type: EventType.IncrementalSnapshot,
        data: Object.assign({ source: IncrementalSource.Mutation }, m)
      }));
    };
    const wrappedScrollEmit = (p) => wrappedEmit(wrapEvent({
      type: EventType.IncrementalSnapshot,
      data: Object.assign({ source: IncrementalSource.Scroll }, p)
    }));
    const wrappedCanvasMutationEmit = (p) => wrappedEmit(wrapEvent({
      type: EventType.IncrementalSnapshot,
      data: Object.assign({ source: IncrementalSource.CanvasMutation }, p)
    }));
    const wrappedAdoptedStyleSheetEmit = (a) => wrappedEmit(wrapEvent({
      type: EventType.IncrementalSnapshot,
      data: Object.assign({ source: IncrementalSource.AdoptedStyleSheet }, a)
    }));
    const stylesheetManager = new StylesheetManager({
      mutationCb: wrappedMutationEmit,
      adoptedStyleSheetCb: wrappedAdoptedStyleSheetEmit
    });
    const iframeManager = new IframeManager({
      mirror,
      mutationCb: wrappedMutationEmit,
      stylesheetManager,
      recordCrossOriginIframes,
      wrappedEmit
    });
    for (const plugin3 of plugins || []) {
      if (plugin3.getMirror)
        plugin3.getMirror({
          nodeMirror: mirror,
          crossOriginIframeMirror: iframeManager.crossOriginIframeMirror,
          crossOriginIframeStyleMirror: iframeManager.crossOriginIframeStyleMirror
        });
    }
    canvasManager = new CanvasManager({
      recordCanvas,
      mutationCb: wrappedCanvasMutationEmit,
      win: window,
      blockClass,
      blockSelector,
      mirror,
      sampling: sampling.canvas,
      dataURLOptions
    });
    const shadowDomManager = new ShadowDomManager({
      mutationCb: wrappedMutationEmit,
      scrollCb: wrappedScrollEmit,
      bypassOptions: {
        blockClass,
        blockSelector,
        maskTextClass,
        maskTextSelector,
        inlineStylesheet,
        maskInputOptions,
        dataURLOptions,
        maskTextFn,
        maskInputFn,
        recordCanvas,
        inlineImages,
        sampling,
        slimDOMOptions,
        iframeManager,
        stylesheetManager,
        canvasManager,
        keepIframeSrcFn
      },
      mirror
    });
    takeFullSnapshot = (isCheckout = false) => {
      var _a2, _b, _c, _d, _e, _f;
      wrappedEmit(wrapEvent({
        type: EventType.Meta,
        data: {
          href: window.location.href,
          width: getWindowWidth(),
          height: getWindowHeight()
        }
      }), isCheckout);
      stylesheetManager.reset();
      mutationBuffers.forEach((buf) => buf.lock());
      const node2 = snapshot(document, {
        mirror,
        blockClass,
        blockSelector,
        maskTextClass,
        maskTextSelector,
        inlineStylesheet,
        maskAllInputs: maskInputOptions,
        maskTextFn,
        slimDOM: slimDOMOptions,
        dataURLOptions,
        recordCanvas,
        inlineImages,
        onSerialize: (n2) => {
          if (isSerializedIframe(n2, mirror)) {
            iframeManager.addIframe(n2);
          }
          if (isSerializedStylesheet(n2, mirror)) {
            stylesheetManager.trackLinkElement(n2);
          }
          if (hasShadowRoot(n2)) {
            shadowDomManager.addShadowRoot(n2.shadowRoot, document);
          }
        },
        onIframeLoad: (iframe, childSn) => {
          iframeManager.attachIframe(iframe, childSn);
          shadowDomManager.observeAttachShadow(iframe);
        },
        onStylesheetLoad: (linkEl, childSn) => {
          stylesheetManager.attachLinkElement(linkEl, childSn);
        },
        keepIframeSrcFn
      });
      if (!node2) {
        return console.warn("Failed to snapshot the document");
      }
      wrappedEmit(wrapEvent({
        type: EventType.FullSnapshot,
        data: {
          node: node2,
          initialOffset: {
            left: window.pageXOffset !== void 0 ? window.pageXOffset : (document === null || document === void 0 ? void 0 : document.documentElement.scrollLeft) || ((_b = (_a2 = document === null || document === void 0 ? void 0 : document.body) === null || _a2 === void 0 ? void 0 : _a2.parentElement) === null || _b === void 0 ? void 0 : _b.scrollLeft) || ((_c = document === null || document === void 0 ? void 0 : document.body) === null || _c === void 0 ? void 0 : _c.scrollLeft) || 0,
            top: window.pageYOffset !== void 0 ? window.pageYOffset : (document === null || document === void 0 ? void 0 : document.documentElement.scrollTop) || ((_e = (_d = document === null || document === void 0 ? void 0 : document.body) === null || _d === void 0 ? void 0 : _d.parentElement) === null || _e === void 0 ? void 0 : _e.scrollTop) || ((_f = document === null || document === void 0 ? void 0 : document.body) === null || _f === void 0 ? void 0 : _f.scrollTop) || 0
          }
        }
      }));
      mutationBuffers.forEach((buf) => buf.unlock());
      if (document.adoptedStyleSheets && document.adoptedStyleSheets.length > 0)
        stylesheetManager.adoptStyleSheets(document.adoptedStyleSheets, mirror.getId(document));
    };
    try {
      const handlers = [];
      handlers.push(on("DOMContentLoaded", () => {
        wrappedEmit(wrapEvent({
          type: EventType.DomContentLoaded,
          data: {}
        }));
      }));
      const observe = (doc) => {
        var _a2;
        return initObservers({
          mutationCb: wrappedMutationEmit,
          mousemoveCb: (positions, source) => wrappedEmit(wrapEvent({
            type: EventType.IncrementalSnapshot,
            data: {
              source,
              positions
            }
          })),
          mouseInteractionCb: (d) => wrappedEmit(wrapEvent({
            type: EventType.IncrementalSnapshot,
            data: Object.assign({ source: IncrementalSource.MouseInteraction }, d)
          })),
          scrollCb: wrappedScrollEmit,
          viewportResizeCb: (d) => wrappedEmit(wrapEvent({
            type: EventType.IncrementalSnapshot,
            data: Object.assign({ source: IncrementalSource.ViewportResize }, d)
          })),
          inputCb: (v) => wrappedEmit(wrapEvent({
            type: EventType.IncrementalSnapshot,
            data: Object.assign({ source: IncrementalSource.Input }, v)
          })),
          mediaInteractionCb: (p) => wrappedEmit(wrapEvent({
            type: EventType.IncrementalSnapshot,
            data: Object.assign({ source: IncrementalSource.MediaInteraction }, p)
          })),
          styleSheetRuleCb: (r) => wrappedEmit(wrapEvent({
            type: EventType.IncrementalSnapshot,
            data: Object.assign({ source: IncrementalSource.StyleSheetRule }, r)
          })),
          styleDeclarationCb: (r) => wrappedEmit(wrapEvent({
            type: EventType.IncrementalSnapshot,
            data: Object.assign({ source: IncrementalSource.StyleDeclaration }, r)
          })),
          canvasMutationCb: wrappedCanvasMutationEmit,
          fontCb: (p) => wrappedEmit(wrapEvent({
            type: EventType.IncrementalSnapshot,
            data: Object.assign({ source: IncrementalSource.Font }, p)
          })),
          selectionCb: (p) => {
            wrappedEmit(wrapEvent({
              type: EventType.IncrementalSnapshot,
              data: Object.assign({ source: IncrementalSource.Selection }, p)
            }));
          },
          blockClass,
          ignoreClass,
          maskTextClass,
          maskTextSelector,
          maskInputOptions,
          inlineStylesheet,
          sampling,
          recordCanvas,
          inlineImages,
          userTriggeredOnInput,
          collectFonts,
          doc,
          maskInputFn,
          maskTextFn,
          keepIframeSrcFn,
          blockSelector,
          slimDOMOptions,
          dataURLOptions,
          mirror,
          iframeManager,
          stylesheetManager,
          shadowDomManager,
          canvasManager,
          ignoreCSSAttributes,
          plugins: ((_a2 = plugins === null || plugins === void 0 ? void 0 : plugins.filter((p) => p.observer)) === null || _a2 === void 0 ? void 0 : _a2.map((p) => ({
            observer: p.observer,
            options: p.options,
            callback: (payload) => wrappedEmit(wrapEvent({
              type: EventType.Plugin,
              data: {
                plugin: p.name,
                payload
              }
            }))
          }))) || []
        }, hooks);
      };
      iframeManager.addLoadListener((iframeEl) => {
        handlers.push(observe(iframeEl.contentDocument));
      });
      const init = () => {
        takeFullSnapshot();
        handlers.push(observe(document));
        recording = true;
      };
      if (document.readyState === "interactive" || document.readyState === "complete") {
        init();
      } else {
        handlers.push(on("load", () => {
          wrappedEmit(wrapEvent({
            type: EventType.Load,
            data: {}
          }));
          init();
        }, window));
      }
      return () => {
        handlers.forEach((h) => h());
        recording = false;
      };
    } catch (error) {
      console.warn(error);
    }
  }
  record.addCustomEvent = (tag, payload) => {
    if (!recording) {
      throw new Error("please add custom event after start recording");
    }
    wrappedEmit(wrapEvent({
      type: EventType.Custom,
      data: {
        tag,
        payload
      }
    }));
  };
  record.freezePage = () => {
    mutationBuffers.forEach((buf) => buf.freeze());
  };
  record.takeFullSnapshot = (isCheckout) => {
    if (!recording) {
      throw new Error("please take full snapshot after start recording");
    }
    takeFullSnapshot(isCheckout);
  };
  record.mirror = mirror;

  // ../node_modules/@rrweb/rrweb-plugin-console-record/dist/rrweb-plugin-console-record.js
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  var __defProp2 = Object.defineProperty;
  var __defNormalProp2 = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField2 = (obj, key, value) => __defNormalProp2(obj, typeof key !== "symbol" ? key + "" : key, value);
  var _a;
  var __defProp$1 = Object.defineProperty;
  var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$1 = (obj, key, value) => __defNormalProp$1(obj, typeof key !== "symbol" ? key + "" : key, value);
  var testableAccessors$1 = {
    Node: ["childNodes", "parentNode", "parentElement", "textContent"],
    ShadowRoot: ["host", "styleSheets"],
    Element: ["shadowRoot", "querySelector", "querySelectorAll"],
    MutationObserver: []
  };
  var testableMethods$1 = {
    Node: ["contains", "getRootNode"],
    ShadowRoot: ["getSelection"],
    Element: [],
    MutationObserver: ["constructor"]
  };
  var untaintedBasePrototype$1 = {};
  var isAngularZonePresent$1 = () => {
    return !!globalThis.Zone;
  };
  function getUntaintedPrototype$1(key) {
    if (untaintedBasePrototype$1[key])
      return untaintedBasePrototype$1[key];
    const defaultObj = globalThis[key];
    const defaultPrototype = defaultObj.prototype;
    const accessorNames = key in testableAccessors$1 ? testableAccessors$1[key] : void 0;
    const isUntaintedAccessors = Boolean(
      accessorNames && // @ts-expect-error 2345
      accessorNames.every(
        (accessor) => {
          var _a2, _b;
          return Boolean(
            (_b = (_a2 = Object.getOwnPropertyDescriptor(defaultPrototype, accessor)) == null ? void 0 : _a2.get) == null ? void 0 : _b.toString().includes("[native code]")
          );
        }
      )
    );
    const methodNames = key in testableMethods$1 ? testableMethods$1[key] : void 0;
    const isUntaintedMethods = Boolean(
      methodNames && methodNames.every(
        // @ts-expect-error 2345
        (method) => {
          var _a2;
          return typeof defaultPrototype[method] === "function" && ((_a2 = defaultPrototype[method]) == null ? void 0 : _a2.toString().includes("[native code]"));
        }
      )
    );
    if (isUntaintedAccessors && isUntaintedMethods && !isAngularZonePresent$1()) {
      untaintedBasePrototype$1[key] = defaultObj.prototype;
      return defaultObj.prototype;
    }
    try {
      const iframeEl = document.createElement("iframe");
      document.body.appendChild(iframeEl);
      const win = iframeEl.contentWindow;
      if (!win) return defaultObj.prototype;
      const untaintedObject = win[key].prototype;
      document.body.removeChild(iframeEl);
      if (!untaintedObject) return defaultPrototype;
      return untaintedBasePrototype$1[key] = untaintedObject;
    } catch {
      return defaultPrototype;
    }
  }
  var untaintedAccessorCache$1 = {};
  function getUntaintedAccessor$1(key, instance, accessor) {
    var _a2;
    const cacheKey = `${key}.${String(accessor)}`;
    if (untaintedAccessorCache$1[cacheKey])
      return untaintedAccessorCache$1[cacheKey].call(
        instance
      );
    const untaintedPrototype = getUntaintedPrototype$1(key);
    const untaintedAccessor = (_a2 = Object.getOwnPropertyDescriptor(
      untaintedPrototype,
      accessor
    )) == null ? void 0 : _a2.get;
    if (!untaintedAccessor) return instance[accessor];
    untaintedAccessorCache$1[cacheKey] = untaintedAccessor;
    return untaintedAccessor.call(instance);
  }
  var untaintedMethodCache$1 = {};
  function getUntaintedMethod$1(key, instance, method) {
    const cacheKey = `${key}.${String(method)}`;
    if (untaintedMethodCache$1[cacheKey])
      return untaintedMethodCache$1[cacheKey].bind(
        instance
      );
    const untaintedPrototype = getUntaintedPrototype$1(key);
    const untaintedMethod = untaintedPrototype[method];
    if (typeof untaintedMethod !== "function") return instance[method];
    untaintedMethodCache$1[cacheKey] = untaintedMethod;
    return untaintedMethod.bind(instance);
  }
  function childNodes$1(n2) {
    return getUntaintedAccessor$1("Node", n2, "childNodes");
  }
  function parentNode$1(n2) {
    return getUntaintedAccessor$1("Node", n2, "parentNode");
  }
  function parentElement$1(n2) {
    return getUntaintedAccessor$1("Node", n2, "parentElement");
  }
  function textContent$1(n2) {
    return getUntaintedAccessor$1("Node", n2, "textContent");
  }
  function contains$1(n2, other) {
    return getUntaintedMethod$1("Node", n2, "contains")(other);
  }
  function getRootNode$1(n2) {
    return getUntaintedMethod$1("Node", n2, "getRootNode")();
  }
  function host$1(n2) {
    if (!n2 || !("host" in n2)) return null;
    return getUntaintedAccessor$1("ShadowRoot", n2, "host");
  }
  function styleSheets$1(n2) {
    return n2.styleSheets;
  }
  function shadowRoot$1(n2) {
    if (!n2 || !("shadowRoot" in n2)) return null;
    return getUntaintedAccessor$1("Element", n2, "shadowRoot");
  }
  function querySelector$1(n2, selectors) {
    return getUntaintedAccessor$1("Element", n2, "querySelector")(selectors);
  }
  function querySelectorAll$1(n2, selectors) {
    return getUntaintedAccessor$1("Element", n2, "querySelectorAll")(selectors);
  }
  function mutationObserverCtor$1() {
    return getUntaintedPrototype$1("MutationObserver").constructor;
  }
  var index$1 = {
    childNodes: childNodes$1,
    parentNode: parentNode$1,
    parentElement: parentElement$1,
    textContent: textContent$1,
    contains: contains$1,
    getRootNode: getRootNode$1,
    host: host$1,
    styleSheets: styleSheets$1,
    shadowRoot: shadowRoot$1,
    querySelector: querySelector$1,
    querySelectorAll: querySelectorAll$1,
    mutationObserver: mutationObserverCtor$1
  };
  function isShadowRoot2(n2) {
    const hostEl = (
      // anchor and textarea elements also have a `host` property
      // but only shadow roots have a `mode` property
      n2 && "host" in n2 && "mode" in n2 && index$1.host(n2) || null
    );
    return Boolean(
      hostEl && "shadowRoot" in hostEl && index$1.shadowRoot(hostEl) === n2
    );
  }
  var Mirror2 = class {
    constructor() {
      __publicField$1(this, "idNodeMap", /* @__PURE__ */ new Map());
      __publicField$1(this, "nodeMetaMap", /* @__PURE__ */ new WeakMap());
    }
    getId(n2) {
      var _a2;
      if (!n2) return -1;
      const id = (_a2 = this.getMeta(n2)) == null ? void 0 : _a2.id;
      return id ?? -1;
    }
    getNode(id) {
      return this.idNodeMap.get(id) || null;
    }
    getIds() {
      return Array.from(this.idNodeMap.keys());
    }
    getMeta(n2) {
      return this.nodeMetaMap.get(n2) || null;
    }
    // removes the node from idNodeMap
    // doesn't remove the node from nodeMetaMap
    removeNodeFromMap(n2) {
      const id = this.getId(n2);
      this.idNodeMap.delete(id);
      if (n2.childNodes) {
        n2.childNodes.forEach(
          (childNode) => this.removeNodeFromMap(childNode)
        );
      }
    }
    has(id) {
      return this.idNodeMap.has(id);
    }
    hasNode(node2) {
      return this.nodeMetaMap.has(node2);
    }
    add(n2, meta) {
      const id = meta.id;
      this.idNodeMap.set(id, n2);
      this.nodeMetaMap.set(n2, meta);
    }
    replace(id, n2) {
      const oldNode = this.getNode(id);
      if (oldNode) {
        const meta = this.nodeMetaMap.get(oldNode);
        if (meta) this.nodeMetaMap.set(n2, meta);
      }
      this.idNodeMap.set(id, n2);
    }
    reset() {
      this.idNodeMap = /* @__PURE__ */ new Map();
      this.nodeMetaMap = /* @__PURE__ */ new WeakMap();
    }
  };
  function createMirror$2() {
    return new Mirror2();
  }
  var IGNORED_NODE2 = -2;
  function classMatchesRegex2(node2, regex, checkAncestors) {
    if (!node2) return false;
    if (node2.nodeType !== node2.ELEMENT_NODE) {
      if (!checkAncestors) return false;
      return classMatchesRegex2(index$1.parentNode(node2), regex, checkAncestors);
    }
    for (let eIndex = node2.classList.length; eIndex--; ) {
      const className = node2.classList[eIndex];
      if (regex.test(className)) {
        return true;
      }
    }
    if (!checkAncestors) return false;
    return classMatchesRegex2(index$1.parentNode(node2), regex, checkAncestors);
  }
  function getDefaultExportFromCjs$1(x2) {
    return x2 && x2.__esModule && Object.prototype.hasOwnProperty.call(x2, "default") ? x2["default"] : x2;
  }
  function getAugmentedNamespace$1(n2) {
    if (n2.__esModule) return n2;
    var f2 = n2.default;
    if (typeof f2 == "function") {
      var a2 = function a22() {
        if (this instanceof a22) {
          return Reflect.construct(f2, arguments, this.constructor);
        }
        return f2.apply(this, arguments);
      };
      a2.prototype = f2.prototype;
    } else a2 = {};
    Object.defineProperty(a2, "__esModule", { value: true });
    Object.keys(n2).forEach(function(k) {
      var d = Object.getOwnPropertyDescriptor(n2, k);
      Object.defineProperty(a2, k, d.get ? d : {
        enumerable: true,
        get: function() {
          return n2[k];
        }
      });
    });
    return a2;
  }
  var picocolors_browser$1 = { exports: {} };
  var x$1 = String;
  var create$1 = function() {
    return { isColorSupported: false, reset: x$1, bold: x$1, dim: x$1, italic: x$1, underline: x$1, inverse: x$1, hidden: x$1, strikethrough: x$1, black: x$1, red: x$1, green: x$1, yellow: x$1, blue: x$1, magenta: x$1, cyan: x$1, white: x$1, gray: x$1, bgBlack: x$1, bgRed: x$1, bgGreen: x$1, bgYellow: x$1, bgBlue: x$1, bgMagenta: x$1, bgCyan: x$1, bgWhite: x$1 };
  };
  picocolors_browser$1.exports = create$1();
  picocolors_browser$1.exports.createColors = create$1;
  var picocolors_browserExports$1 = picocolors_browser$1.exports;
  var __viteBrowserExternal$2 = {};
  var __viteBrowserExternal$1$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: __viteBrowserExternal$2
  }, Symbol.toStringTag, { value: "Module" }));
  var require$$2$1 = /* @__PURE__ */ getAugmentedNamespace$1(__viteBrowserExternal$1$1);
  var pico$1 = picocolors_browserExports$1;
  var terminalHighlight$1$1 = require$$2$1;
  var CssSyntaxError$3$1 = class CssSyntaxError extends Error {
    constructor(message, line, column, source, file, plugin22) {
      super(message);
      this.name = "CssSyntaxError";
      this.reason = message;
      if (file) {
        this.file = file;
      }
      if (source) {
        this.source = source;
      }
      if (plugin22) {
        this.plugin = plugin22;
      }
      if (typeof line !== "undefined" && typeof column !== "undefined") {
        if (typeof line === "number") {
          this.line = line;
          this.column = column;
        } else {
          this.line = line.line;
          this.column = line.column;
          this.endLine = column.line;
          this.endColumn = column.column;
        }
      }
      this.setMessage();
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, CssSyntaxError);
      }
    }
    setMessage() {
      this.message = this.plugin ? this.plugin + ": " : "";
      this.message += this.file ? this.file : "<css input>";
      if (typeof this.line !== "undefined") {
        this.message += ":" + this.line + ":" + this.column;
      }
      this.message += ": " + this.reason;
    }
    showSourceCode(color) {
      if (!this.source) return "";
      let css = this.source;
      if (color == null) color = pico$1.isColorSupported;
      if (terminalHighlight$1$1) {
        if (color) css = terminalHighlight$1$1(css);
      }
      let lines = css.split(/\r?\n/);
      let start2 = Math.max(this.line - 3, 0);
      let end = Math.min(this.line + 2, lines.length);
      let maxWidth = String(end).length;
      let mark, aside;
      if (color) {
        let { bold, gray, red } = pico$1.createColors(true);
        mark = (text) => bold(red(text));
        aside = (text) => gray(text);
      } else {
        mark = aside = (str) => str;
      }
      return lines.slice(start2, end).map((line, index2) => {
        let number = start2 + 1 + index2;
        let gutter = " " + (" " + number).slice(-maxWidth) + " | ";
        if (number === this.line) {
          let spacing = aside(gutter.replace(/\d/g, " ")) + line.slice(0, this.column - 1).replace(/[^\t]/g, " ");
          return mark(">") + aside(gutter) + line + "\n " + spacing + mark("^");
        }
        return " " + aside(gutter) + line;
      }).join("\n");
    }
    toString() {
      let code = this.showSourceCode();
      if (code) {
        code = "\n\n" + code + "\n";
      }
      return this.name + ": " + this.message + code;
    }
  };
  var cssSyntaxError$1 = CssSyntaxError$3$1;
  CssSyntaxError$3$1.default = CssSyntaxError$3$1;
  var symbols$1 = {};
  symbols$1.isClean = Symbol("isClean");
  symbols$1.my = Symbol("my");
  var DEFAULT_RAW$1 = {
    after: "\n",
    beforeClose: "\n",
    beforeComment: "\n",
    beforeDecl: "\n",
    beforeOpen: " ",
    beforeRule: "\n",
    colon: ": ",
    commentLeft: " ",
    commentRight: " ",
    emptyBody: "",
    indent: "    ",
    semicolon: false
  };
  function capitalize$1(str) {
    return str[0].toUpperCase() + str.slice(1);
  }
  var Stringifier$2$1 = class Stringifier {
    constructor(builder) {
      this.builder = builder;
    }
    atrule(node2, semicolon) {
      let name = "@" + node2.name;
      let params = node2.params ? this.rawValue(node2, "params") : "";
      if (typeof node2.raws.afterName !== "undefined") {
        name += node2.raws.afterName;
      } else if (params) {
        name += " ";
      }
      if (node2.nodes) {
        this.block(node2, name + params);
      } else {
        let end = (node2.raws.between || "") + (semicolon ? ";" : "");
        this.builder(name + params + end, node2);
      }
    }
    beforeAfter(node2, detect) {
      let value;
      if (node2.type === "decl") {
        value = this.raw(node2, null, "beforeDecl");
      } else if (node2.type === "comment") {
        value = this.raw(node2, null, "beforeComment");
      } else if (detect === "before") {
        value = this.raw(node2, null, "beforeRule");
      } else {
        value = this.raw(node2, null, "beforeClose");
      }
      let buf = node2.parent;
      let depth = 0;
      while (buf && buf.type !== "root") {
        depth += 1;
        buf = buf.parent;
      }
      if (value.includes("\n")) {
        let indent = this.raw(node2, null, "indent");
        if (indent.length) {
          for (let step = 0; step < depth; step++) value += indent;
        }
      }
      return value;
    }
    block(node2, start2) {
      let between = this.raw(node2, "between", "beforeOpen");
      this.builder(start2 + between + "{", node2, "start");
      let after;
      if (node2.nodes && node2.nodes.length) {
        this.body(node2);
        after = this.raw(node2, "after");
      } else {
        after = this.raw(node2, "after", "emptyBody");
      }
      if (after) this.builder(after);
      this.builder("}", node2, "end");
    }
    body(node2) {
      let last = node2.nodes.length - 1;
      while (last > 0) {
        if (node2.nodes[last].type !== "comment") break;
        last -= 1;
      }
      let semicolon = this.raw(node2, "semicolon");
      for (let i2 = 0; i2 < node2.nodes.length; i2++) {
        let child = node2.nodes[i2];
        let before = this.raw(child, "before");
        if (before) this.builder(before);
        this.stringify(child, last !== i2 || semicolon);
      }
    }
    comment(node2) {
      let left = this.raw(node2, "left", "commentLeft");
      let right = this.raw(node2, "right", "commentRight");
      this.builder("/*" + left + node2.text + right + "*/", node2);
    }
    decl(node2, semicolon) {
      let between = this.raw(node2, "between", "colon");
      let string = node2.prop + between + this.rawValue(node2, "value");
      if (node2.important) {
        string += node2.raws.important || " !important";
      }
      if (semicolon) string += ";";
      this.builder(string, node2);
    }
    document(node2) {
      this.body(node2);
    }
    raw(node2, own, detect) {
      let value;
      if (!detect) detect = own;
      if (own) {
        value = node2.raws[own];
        if (typeof value !== "undefined") return value;
      }
      let parent = node2.parent;
      if (detect === "before") {
        if (!parent || parent.type === "root" && parent.first === node2) {
          return "";
        }
        if (parent && parent.type === "document") {
          return "";
        }
      }
      if (!parent) return DEFAULT_RAW$1[detect];
      let root2 = node2.root();
      if (!root2.rawCache) root2.rawCache = {};
      if (typeof root2.rawCache[detect] !== "undefined") {
        return root2.rawCache[detect];
      }
      if (detect === "before" || detect === "after") {
        return this.beforeAfter(node2, detect);
      } else {
        let method = "raw" + capitalize$1(detect);
        if (this[method]) {
          value = this[method](root2, node2);
        } else {
          root2.walk((i2) => {
            value = i2.raws[own];
            if (typeof value !== "undefined") return false;
          });
        }
      }
      if (typeof value === "undefined") value = DEFAULT_RAW$1[detect];
      root2.rawCache[detect] = value;
      return value;
    }
    rawBeforeClose(root2) {
      let value;
      root2.walk((i2) => {
        if (i2.nodes && i2.nodes.length > 0) {
          if (typeof i2.raws.after !== "undefined") {
            value = i2.raws.after;
            if (value.includes("\n")) {
              value = value.replace(/[^\n]+$/, "");
            }
            return false;
          }
        }
      });
      if (value) value = value.replace(/\S/g, "");
      return value;
    }
    rawBeforeComment(root2, node2) {
      let value;
      root2.walkComments((i2) => {
        if (typeof i2.raws.before !== "undefined") {
          value = i2.raws.before;
          if (value.includes("\n")) {
            value = value.replace(/[^\n]+$/, "");
          }
          return false;
        }
      });
      if (typeof value === "undefined") {
        value = this.raw(node2, null, "beforeDecl");
      } else if (value) {
        value = value.replace(/\S/g, "");
      }
      return value;
    }
    rawBeforeDecl(root2, node2) {
      let value;
      root2.walkDecls((i2) => {
        if (typeof i2.raws.before !== "undefined") {
          value = i2.raws.before;
          if (value.includes("\n")) {
            value = value.replace(/[^\n]+$/, "");
          }
          return false;
        }
      });
      if (typeof value === "undefined") {
        value = this.raw(node2, null, "beforeRule");
      } else if (value) {
        value = value.replace(/\S/g, "");
      }
      return value;
    }
    rawBeforeOpen(root2) {
      let value;
      root2.walk((i2) => {
        if (i2.type !== "decl") {
          value = i2.raws.between;
          if (typeof value !== "undefined") return false;
        }
      });
      return value;
    }
    rawBeforeRule(root2) {
      let value;
      root2.walk((i2) => {
        if (i2.nodes && (i2.parent !== root2 || root2.first !== i2)) {
          if (typeof i2.raws.before !== "undefined") {
            value = i2.raws.before;
            if (value.includes("\n")) {
              value = value.replace(/[^\n]+$/, "");
            }
            return false;
          }
        }
      });
      if (value) value = value.replace(/\S/g, "");
      return value;
    }
    rawColon(root2) {
      let value;
      root2.walkDecls((i2) => {
        if (typeof i2.raws.between !== "undefined") {
          value = i2.raws.between.replace(/[^\s:]/g, "");
          return false;
        }
      });
      return value;
    }
    rawEmptyBody(root2) {
      let value;
      root2.walk((i2) => {
        if (i2.nodes && i2.nodes.length === 0) {
          value = i2.raws.after;
          if (typeof value !== "undefined") return false;
        }
      });
      return value;
    }
    rawIndent(root2) {
      if (root2.raws.indent) return root2.raws.indent;
      let value;
      root2.walk((i2) => {
        let p = i2.parent;
        if (p && p !== root2 && p.parent && p.parent === root2) {
          if (typeof i2.raws.before !== "undefined") {
            let parts = i2.raws.before.split("\n");
            value = parts[parts.length - 1];
            value = value.replace(/\S/g, "");
            return false;
          }
        }
      });
      return value;
    }
    rawSemicolon(root2) {
      let value;
      root2.walk((i2) => {
        if (i2.nodes && i2.nodes.length && i2.last.type === "decl") {
          value = i2.raws.semicolon;
          if (typeof value !== "undefined") return false;
        }
      });
      return value;
    }
    rawValue(node2, prop) {
      let value = node2[prop];
      let raw = node2.raws[prop];
      if (raw && raw.value === value) {
        return raw.raw;
      }
      return value;
    }
    root(node2) {
      this.body(node2);
      if (node2.raws.after) this.builder(node2.raws.after);
    }
    rule(node2) {
      this.block(node2, this.rawValue(node2, "selector"));
      if (node2.raws.ownSemicolon) {
        this.builder(node2.raws.ownSemicolon, node2, "end");
      }
    }
    stringify(node2, semicolon) {
      if (!this[node2.type]) {
        throw new Error(
          "Unknown AST node type " + node2.type + ". Maybe you need to change PostCSS stringifier."
        );
      }
      this[node2.type](node2, semicolon);
    }
  };
  var stringifier$1 = Stringifier$2$1;
  Stringifier$2$1.default = Stringifier$2$1;
  var Stringifier$1$1 = stringifier$1;
  function stringify$4$1(node2, builder) {
    let str = new Stringifier$1$1(builder);
    str.stringify(node2);
  }
  var stringify_1$1 = stringify$4$1;
  stringify$4$1.default = stringify$4$1;
  var { isClean: isClean$2$1, my: my$2$1 } = symbols$1;
  var CssSyntaxError$2$1 = cssSyntaxError$1;
  var Stringifier2$1 = stringifier$1;
  var stringify$3$1 = stringify_1$1;
  function cloneNode$1(obj, parent) {
    let cloned = new obj.constructor();
    for (let i2 in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, i2)) {
        continue;
      }
      if (i2 === "proxyCache") continue;
      let value = obj[i2];
      let type = typeof value;
      if (i2 === "parent" && type === "object") {
        if (parent) cloned[i2] = parent;
      } else if (i2 === "source") {
        cloned[i2] = value;
      } else if (Array.isArray(value)) {
        cloned[i2] = value.map((j) => cloneNode$1(j, cloned));
      } else {
        if (type === "object" && value !== null) value = cloneNode$1(value);
        cloned[i2] = value;
      }
    }
    return cloned;
  }
  var Node$4$1 = class Node2 {
    constructor(defaults = {}) {
      this.raws = {};
      this[isClean$2$1] = false;
      this[my$2$1] = true;
      for (let name in defaults) {
        if (name === "nodes") {
          this.nodes = [];
          for (let node2 of defaults[name]) {
            if (typeof node2.clone === "function") {
              this.append(node2.clone());
            } else {
              this.append(node2);
            }
          }
        } else {
          this[name] = defaults[name];
        }
      }
    }
    addToError(error) {
      error.postcssNode = this;
      if (error.stack && this.source && /\n\s{4}at /.test(error.stack)) {
        let s2 = this.source;
        error.stack = error.stack.replace(
          /\n\s{4}at /,
          `$&${s2.input.from}:${s2.start.line}:${s2.start.column}$&`
        );
      }
      return error;
    }
    after(add) {
      this.parent.insertAfter(this, add);
      return this;
    }
    assign(overrides = {}) {
      for (let name in overrides) {
        this[name] = overrides[name];
      }
      return this;
    }
    before(add) {
      this.parent.insertBefore(this, add);
      return this;
    }
    cleanRaws(keepBetween) {
      delete this.raws.before;
      delete this.raws.after;
      if (!keepBetween) delete this.raws.between;
    }
    clone(overrides = {}) {
      let cloned = cloneNode$1(this);
      for (let name in overrides) {
        cloned[name] = overrides[name];
      }
      return cloned;
    }
    cloneAfter(overrides = {}) {
      let cloned = this.clone(overrides);
      this.parent.insertAfter(this, cloned);
      return cloned;
    }
    cloneBefore(overrides = {}) {
      let cloned = this.clone(overrides);
      this.parent.insertBefore(this, cloned);
      return cloned;
    }
    error(message, opts = {}) {
      if (this.source) {
        let { end, start: start2 } = this.rangeBy(opts);
        return this.source.input.error(
          message,
          { column: start2.column, line: start2.line },
          { column: end.column, line: end.line },
          opts
        );
      }
      return new CssSyntaxError$2$1(message);
    }
    getProxyProcessor() {
      return {
        get(node2, prop) {
          if (prop === "proxyOf") {
            return node2;
          } else if (prop === "root") {
            return () => node2.root().toProxy();
          } else {
            return node2[prop];
          }
        },
        set(node2, prop, value) {
          if (node2[prop] === value) return true;
          node2[prop] = value;
          if (prop === "prop" || prop === "value" || prop === "name" || prop === "params" || prop === "important" || /* c8 ignore next */
          prop === "text") {
            node2.markDirty();
          }
          return true;
        }
      };
    }
    markDirty() {
      if (this[isClean$2$1]) {
        this[isClean$2$1] = false;
        let next = this;
        while (next = next.parent) {
          next[isClean$2$1] = false;
        }
      }
    }
    next() {
      if (!this.parent) return void 0;
      let index2 = this.parent.index(this);
      return this.parent.nodes[index2 + 1];
    }
    positionBy(opts, stringRepresentation) {
      let pos = this.source.start;
      if (opts.index) {
        pos = this.positionInside(opts.index, stringRepresentation);
      } else if (opts.word) {
        stringRepresentation = this.toString();
        let index2 = stringRepresentation.indexOf(opts.word);
        if (index2 !== -1) pos = this.positionInside(index2, stringRepresentation);
      }
      return pos;
    }
    positionInside(index2, stringRepresentation) {
      let string = stringRepresentation || this.toString();
      let column = this.source.start.column;
      let line = this.source.start.line;
      for (let i2 = 0; i2 < index2; i2++) {
        if (string[i2] === "\n") {
          column = 1;
          line += 1;
        } else {
          column += 1;
        }
      }
      return { column, line };
    }
    prev() {
      if (!this.parent) return void 0;
      let index2 = this.parent.index(this);
      return this.parent.nodes[index2 - 1];
    }
    rangeBy(opts) {
      let start2 = {
        column: this.source.start.column,
        line: this.source.start.line
      };
      let end = this.source.end ? {
        column: this.source.end.column + 1,
        line: this.source.end.line
      } : {
        column: start2.column + 1,
        line: start2.line
      };
      if (opts.word) {
        let stringRepresentation = this.toString();
        let index2 = stringRepresentation.indexOf(opts.word);
        if (index2 !== -1) {
          start2 = this.positionInside(index2, stringRepresentation);
          end = this.positionInside(index2 + opts.word.length, stringRepresentation);
        }
      } else {
        if (opts.start) {
          start2 = {
            column: opts.start.column,
            line: opts.start.line
          };
        } else if (opts.index) {
          start2 = this.positionInside(opts.index);
        }
        if (opts.end) {
          end = {
            column: opts.end.column,
            line: opts.end.line
          };
        } else if (typeof opts.endIndex === "number") {
          end = this.positionInside(opts.endIndex);
        } else if (opts.index) {
          end = this.positionInside(opts.index + 1);
        }
      }
      if (end.line < start2.line || end.line === start2.line && end.column <= start2.column) {
        end = { column: start2.column + 1, line: start2.line };
      }
      return { end, start: start2 };
    }
    raw(prop, defaultType) {
      let str = new Stringifier2$1();
      return str.raw(this, prop, defaultType);
    }
    remove() {
      if (this.parent) {
        this.parent.removeChild(this);
      }
      this.parent = void 0;
      return this;
    }
    replaceWith(...nodes) {
      if (this.parent) {
        let bookmark = this;
        let foundSelf = false;
        for (let node2 of nodes) {
          if (node2 === this) {
            foundSelf = true;
          } else if (foundSelf) {
            this.parent.insertAfter(bookmark, node2);
            bookmark = node2;
          } else {
            this.parent.insertBefore(bookmark, node2);
          }
        }
        if (!foundSelf) {
          this.remove();
        }
      }
      return this;
    }
    root() {
      let result2 = this;
      while (result2.parent && result2.parent.type !== "document") {
        result2 = result2.parent;
      }
      return result2;
    }
    toJSON(_, inputs) {
      let fixed = {};
      let emitInputs = inputs == null;
      inputs = inputs || /* @__PURE__ */ new Map();
      let inputsNextIndex = 0;
      for (let name in this) {
        if (!Object.prototype.hasOwnProperty.call(this, name)) {
          continue;
        }
        if (name === "parent" || name === "proxyCache") continue;
        let value = this[name];
        if (Array.isArray(value)) {
          fixed[name] = value.map((i2) => {
            if (typeof i2 === "object" && i2.toJSON) {
              return i2.toJSON(null, inputs);
            } else {
              return i2;
            }
          });
        } else if (typeof value === "object" && value.toJSON) {
          fixed[name] = value.toJSON(null, inputs);
        } else if (name === "source") {
          let inputId = inputs.get(value.input);
          if (inputId == null) {
            inputId = inputsNextIndex;
            inputs.set(value.input, inputsNextIndex);
            inputsNextIndex++;
          }
          fixed[name] = {
            end: value.end,
            inputId,
            start: value.start
          };
        } else {
          fixed[name] = value;
        }
      }
      if (emitInputs) {
        fixed.inputs = [...inputs.keys()].map((input2) => input2.toJSON());
      }
      return fixed;
    }
    toProxy() {
      if (!this.proxyCache) {
        this.proxyCache = new Proxy(this, this.getProxyProcessor());
      }
      return this.proxyCache;
    }
    toString(stringifier2 = stringify$3$1) {
      if (stringifier2.stringify) stringifier2 = stringifier2.stringify;
      let result2 = "";
      stringifier2(this, (i2) => {
        result2 += i2;
      });
      return result2;
    }
    warn(result2, text, opts) {
      let data = { node: this };
      for (let i2 in opts) data[i2] = opts[i2];
      return result2.warn(text, data);
    }
    get proxyOf() {
      return this;
    }
  };
  var node$1 = Node$4$1;
  Node$4$1.default = Node$4$1;
  var Node$3$1 = node$1;
  var Declaration$4$1 = class Declaration extends Node$3$1 {
    constructor(defaults) {
      if (defaults && typeof defaults.value !== "undefined" && typeof defaults.value !== "string") {
        defaults = { ...defaults, value: String(defaults.value) };
      }
      super(defaults);
      this.type = "decl";
    }
    get variable() {
      return this.prop.startsWith("--") || this.prop[0] === "$";
    }
  };
  var declaration$1 = Declaration$4$1;
  Declaration$4$1.default = Declaration$4$1;
  var urlAlphabet$1 = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
  var customAlphabet$1 = (alphabet, defaultSize = 21) => {
    return (size = defaultSize) => {
      let id = "";
      let i2 = size;
      while (i2--) {
        id += alphabet[Math.random() * alphabet.length | 0];
      }
      return id;
    };
  };
  var nanoid$1$1 = (size = 21) => {
    let id = "";
    let i2 = size;
    while (i2--) {
      id += urlAlphabet$1[Math.random() * 64 | 0];
    }
    return id;
  };
  var nonSecure$1 = { nanoid: nanoid$1$1, customAlphabet: customAlphabet$1 };
  var { SourceMapConsumer: SourceMapConsumer$2$1, SourceMapGenerator: SourceMapGenerator$2$1 } = require$$2$1;
  var { existsSync: existsSync$1, readFileSync: readFileSync$1 } = require$$2$1;
  var { dirname: dirname$1$1, join: join$1 } = require$$2$1;
  function fromBase64$1(str) {
    if (Buffer) {
      return Buffer.from(str, "base64").toString();
    } else {
      return window.atob(str);
    }
  }
  var PreviousMap$2$1 = class PreviousMap {
    constructor(css, opts) {
      if (opts.map === false) return;
      this.loadAnnotation(css);
      this.inline = this.startWith(this.annotation, "data:");
      let prev = opts.map ? opts.map.prev : void 0;
      let text = this.loadMap(opts.from, prev);
      if (!this.mapFile && opts.from) {
        this.mapFile = opts.from;
      }
      if (this.mapFile) this.root = dirname$1$1(this.mapFile);
      if (text) this.text = text;
    }
    consumer() {
      if (!this.consumerCache) {
        this.consumerCache = new SourceMapConsumer$2$1(this.text);
      }
      return this.consumerCache;
    }
    decodeInline(text) {
      let baseCharsetUri = /^data:application\/json;charset=utf-?8;base64,/;
      let baseUri = /^data:application\/json;base64,/;
      let charsetUri = /^data:application\/json;charset=utf-?8,/;
      let uri = /^data:application\/json,/;
      if (charsetUri.test(text) || uri.test(text)) {
        return decodeURIComponent(text.substr(RegExp.lastMatch.length));
      }
      if (baseCharsetUri.test(text) || baseUri.test(text)) {
        return fromBase64$1(text.substr(RegExp.lastMatch.length));
      }
      let encoding = text.match(/data:application\/json;([^,]+),/)[1];
      throw new Error("Unsupported source map encoding " + encoding);
    }
    getAnnotationURL(sourceMapString) {
      return sourceMapString.replace(/^\/\*\s*# sourceMappingURL=/, "").trim();
    }
    isMap(map) {
      if (typeof map !== "object") return false;
      return typeof map.mappings === "string" || typeof map._mappings === "string" || Array.isArray(map.sections);
    }
    loadAnnotation(css) {
      let comments = css.match(/\/\*\s*# sourceMappingURL=/gm);
      if (!comments) return;
      let start2 = css.lastIndexOf(comments.pop());
      let end = css.indexOf("*/", start2);
      if (start2 > -1 && end > -1) {
        this.annotation = this.getAnnotationURL(css.substring(start2, end));
      }
    }
    loadFile(path) {
      this.root = dirname$1$1(path);
      if (existsSync$1(path)) {
        this.mapFile = path;
        return readFileSync$1(path, "utf-8").toString().trim();
      }
    }
    loadMap(file, prev) {
      if (prev === false) return false;
      if (prev) {
        if (typeof prev === "string") {
          return prev;
        } else if (typeof prev === "function") {
          let prevPath = prev(file);
          if (prevPath) {
            let map = this.loadFile(prevPath);
            if (!map) {
              throw new Error(
                "Unable to load previous source map: " + prevPath.toString()
              );
            }
            return map;
          }
        } else if (prev instanceof SourceMapConsumer$2$1) {
          return SourceMapGenerator$2$1.fromSourceMap(prev).toString();
        } else if (prev instanceof SourceMapGenerator$2$1) {
          return prev.toString();
        } else if (this.isMap(prev)) {
          return JSON.stringify(prev);
        } else {
          throw new Error(
            "Unsupported previous source map format: " + prev.toString()
          );
        }
      } else if (this.inline) {
        return this.decodeInline(this.annotation);
      } else if (this.annotation) {
        let map = this.annotation;
        if (file) map = join$1(dirname$1$1(file), map);
        return this.loadFile(map);
      }
    }
    startWith(string, start2) {
      if (!string) return false;
      return string.substr(0, start2.length) === start2;
    }
    withContent() {
      return !!(this.consumer().sourcesContent && this.consumer().sourcesContent.length > 0);
    }
  };
  var previousMap$1 = PreviousMap$2$1;
  PreviousMap$2$1.default = PreviousMap$2$1;
  var { SourceMapConsumer: SourceMapConsumer$1$1, SourceMapGenerator: SourceMapGenerator$1$1 } = require$$2$1;
  var { fileURLToPath: fileURLToPath$1, pathToFileURL: pathToFileURL$1$1 } = require$$2$1;
  var { isAbsolute: isAbsolute$1, resolve: resolve$1$1 } = require$$2$1;
  var { nanoid: nanoid$2 } = nonSecure$1;
  var terminalHighlight$2 = require$$2$1;
  var CssSyntaxError$1$1 = cssSyntaxError$1;
  var PreviousMap$1$1 = previousMap$1;
  var fromOffsetCache$1 = Symbol("fromOffsetCache");
  var sourceMapAvailable$1$1 = Boolean(SourceMapConsumer$1$1 && SourceMapGenerator$1$1);
  var pathAvailable$1$1 = Boolean(resolve$1$1 && isAbsolute$1);
  var Input$4$1 = class Input {
    constructor(css, opts = {}) {
      if (css === null || typeof css === "undefined" || typeof css === "object" && !css.toString) {
        throw new Error(`PostCSS received ${css} instead of CSS string`);
      }
      this.css = css.toString();
      if (this.css[0] === "\uFEFF" || this.css[0] === "\uFFFE") {
        this.hasBOM = true;
        this.css = this.css.slice(1);
      } else {
        this.hasBOM = false;
      }
      if (opts.from) {
        if (!pathAvailable$1$1 || /^\w+:\/\//.test(opts.from) || isAbsolute$1(opts.from)) {
          this.file = opts.from;
        } else {
          this.file = resolve$1$1(opts.from);
        }
      }
      if (pathAvailable$1$1 && sourceMapAvailable$1$1) {
        let map = new PreviousMap$1$1(this.css, opts);
        if (map.text) {
          this.map = map;
          let file = map.consumer().file;
          if (!this.file && file) this.file = this.mapResolve(file);
        }
      }
      if (!this.file) {
        this.id = "<input css " + nanoid$2(6) + ">";
      }
      if (this.map) this.map.file = this.from;
    }
    error(message, line, column, opts = {}) {
      let result2, endLine, endColumn;
      if (line && typeof line === "object") {
        let start2 = line;
        let end = column;
        if (typeof start2.offset === "number") {
          let pos = this.fromOffset(start2.offset);
          line = pos.line;
          column = pos.col;
        } else {
          line = start2.line;
          column = start2.column;
        }
        if (typeof end.offset === "number") {
          let pos = this.fromOffset(end.offset);
          endLine = pos.line;
          endColumn = pos.col;
        } else {
          endLine = end.line;
          endColumn = end.column;
        }
      } else if (!column) {
        let pos = this.fromOffset(line);
        line = pos.line;
        column = pos.col;
      }
      let origin = this.origin(line, column, endLine, endColumn);
      if (origin) {
        result2 = new CssSyntaxError$1$1(
          message,
          origin.endLine === void 0 ? origin.line : { column: origin.column, line: origin.line },
          origin.endLine === void 0 ? origin.column : { column: origin.endColumn, line: origin.endLine },
          origin.source,
          origin.file,
          opts.plugin
        );
      } else {
        result2 = new CssSyntaxError$1$1(
          message,
          endLine === void 0 ? line : { column, line },
          endLine === void 0 ? column : { column: endColumn, line: endLine },
          this.css,
          this.file,
          opts.plugin
        );
      }
      result2.input = { column, endColumn, endLine, line, source: this.css };
      if (this.file) {
        if (pathToFileURL$1$1) {
          result2.input.url = pathToFileURL$1$1(this.file).toString();
        }
        result2.input.file = this.file;
      }
      return result2;
    }
    fromOffset(offset) {
      let lastLine, lineToIndex;
      if (!this[fromOffsetCache$1]) {
        let lines = this.css.split("\n");
        lineToIndex = new Array(lines.length);
        let prevIndex = 0;
        for (let i2 = 0, l2 = lines.length; i2 < l2; i2++) {
          lineToIndex[i2] = prevIndex;
          prevIndex += lines[i2].length + 1;
        }
        this[fromOffsetCache$1] = lineToIndex;
      } else {
        lineToIndex = this[fromOffsetCache$1];
      }
      lastLine = lineToIndex[lineToIndex.length - 1];
      let min = 0;
      if (offset >= lastLine) {
        min = lineToIndex.length - 1;
      } else {
        let max = lineToIndex.length - 2;
        let mid;
        while (min < max) {
          mid = min + (max - min >> 1);
          if (offset < lineToIndex[mid]) {
            max = mid - 1;
          } else if (offset >= lineToIndex[mid + 1]) {
            min = mid + 1;
          } else {
            min = mid;
            break;
          }
        }
      }
      return {
        col: offset - lineToIndex[min] + 1,
        line: min + 1
      };
    }
    mapResolve(file) {
      if (/^\w+:\/\//.test(file)) {
        return file;
      }
      return resolve$1$1(this.map.consumer().sourceRoot || this.map.root || ".", file);
    }
    origin(line, column, endLine, endColumn) {
      if (!this.map) return false;
      let consumer = this.map.consumer();
      let from = consumer.originalPositionFor({ column, line });
      if (!from.source) return false;
      let to;
      if (typeof endLine === "number") {
        to = consumer.originalPositionFor({ column: endColumn, line: endLine });
      }
      let fromUrl;
      if (isAbsolute$1(from.source)) {
        fromUrl = pathToFileURL$1$1(from.source);
      } else {
        fromUrl = new URL(
          from.source,
          this.map.consumer().sourceRoot || pathToFileURL$1$1(this.map.mapFile)
        );
      }
      let result2 = {
        column: from.column,
        endColumn: to && to.column,
        endLine: to && to.line,
        line: from.line,
        url: fromUrl.toString()
      };
      if (fromUrl.protocol === "file:") {
        if (fileURLToPath$1) {
          result2.file = fileURLToPath$1(fromUrl);
        } else {
          throw new Error(`file: protocol is not available in this PostCSS build`);
        }
      }
      let source = consumer.sourceContentFor(from.source);
      if (source) result2.source = source;
      return result2;
    }
    toJSON() {
      let json = {};
      for (let name of ["hasBOM", "css", "file", "id"]) {
        if (this[name] != null) {
          json[name] = this[name];
        }
      }
      if (this.map) {
        json.map = { ...this.map };
        if (json.map.consumerCache) {
          json.map.consumerCache = void 0;
        }
      }
      return json;
    }
    get from() {
      return this.file || this.id;
    }
  };
  var input$1 = Input$4$1;
  Input$4$1.default = Input$4$1;
  if (terminalHighlight$2 && terminalHighlight$2.registerInput) {
    terminalHighlight$2.registerInput(Input$4$1);
  }
  var { SourceMapConsumer: SourceMapConsumer$3, SourceMapGenerator: SourceMapGenerator$3 } = require$$2$1;
  var { dirname: dirname$2, relative: relative$1, resolve: resolve$2, sep: sep$1 } = require$$2$1;
  var { pathToFileURL: pathToFileURL$2 } = require$$2$1;
  var Input$3$1 = input$1;
  var sourceMapAvailable$2 = Boolean(SourceMapConsumer$3 && SourceMapGenerator$3);
  var pathAvailable$2 = Boolean(dirname$2 && resolve$2 && relative$1 && sep$1);
  var MapGenerator$2$1 = class MapGenerator {
    constructor(stringify2, root2, opts, cssString) {
      this.stringify = stringify2;
      this.mapOpts = opts.map || {};
      this.root = root2;
      this.opts = opts;
      this.css = cssString;
      this.originalCSS = cssString;
      this.usesFileUrls = !this.mapOpts.from && this.mapOpts.absolute;
      this.memoizedFileURLs = /* @__PURE__ */ new Map();
      this.memoizedPaths = /* @__PURE__ */ new Map();
      this.memoizedURLs = /* @__PURE__ */ new Map();
    }
    addAnnotation() {
      let content;
      if (this.isInline()) {
        content = "data:application/json;base64," + this.toBase64(this.map.toString());
      } else if (typeof this.mapOpts.annotation === "string") {
        content = this.mapOpts.annotation;
      } else if (typeof this.mapOpts.annotation === "function") {
        content = this.mapOpts.annotation(this.opts.to, this.root);
      } else {
        content = this.outputFile() + ".map";
      }
      let eol = "\n";
      if (this.css.includes("\r\n")) eol = "\r\n";
      this.css += eol + "/*# sourceMappingURL=" + content + " */";
    }
    applyPrevMaps() {
      for (let prev of this.previous()) {
        let from = this.toUrl(this.path(prev.file));
        let root2 = prev.root || dirname$2(prev.file);
        let map;
        if (this.mapOpts.sourcesContent === false) {
          map = new SourceMapConsumer$3(prev.text);
          if (map.sourcesContent) {
            map.sourcesContent = null;
          }
        } else {
          map = prev.consumer();
        }
        this.map.applySourceMap(map, from, this.toUrl(this.path(root2)));
      }
    }
    clearAnnotation() {
      if (this.mapOpts.annotation === false) return;
      if (this.root) {
        let node2;
        for (let i2 = this.root.nodes.length - 1; i2 >= 0; i2--) {
          node2 = this.root.nodes[i2];
          if (node2.type !== "comment") continue;
          if (node2.text.indexOf("# sourceMappingURL=") === 0) {
            this.root.removeChild(i2);
          }
        }
      } else if (this.css) {
        this.css = this.css.replace(/\n*?\/\*#[\S\s]*?\*\/$/gm, "");
      }
    }
    generate() {
      this.clearAnnotation();
      if (pathAvailable$2 && sourceMapAvailable$2 && this.isMap()) {
        return this.generateMap();
      } else {
        let result2 = "";
        this.stringify(this.root, (i2) => {
          result2 += i2;
        });
        return [result2];
      }
    }
    generateMap() {
      if (this.root) {
        this.generateString();
      } else if (this.previous().length === 1) {
        let prev = this.previous()[0].consumer();
        prev.file = this.outputFile();
        this.map = SourceMapGenerator$3.fromSourceMap(prev, {
          ignoreInvalidMapping: true
        });
      } else {
        this.map = new SourceMapGenerator$3({
          file: this.outputFile(),
          ignoreInvalidMapping: true
        });
        this.map.addMapping({
          generated: { column: 0, line: 1 },
          original: { column: 0, line: 1 },
          source: this.opts.from ? this.toUrl(this.path(this.opts.from)) : "<no source>"
        });
      }
      if (this.isSourcesContent()) this.setSourcesContent();
      if (this.root && this.previous().length > 0) this.applyPrevMaps();
      if (this.isAnnotation()) this.addAnnotation();
      if (this.isInline()) {
        return [this.css];
      } else {
        return [this.css, this.map];
      }
    }
    generateString() {
      this.css = "";
      this.map = new SourceMapGenerator$3({
        file: this.outputFile(),
        ignoreInvalidMapping: true
      });
      let line = 1;
      let column = 1;
      let noSource = "<no source>";
      let mapping = {
        generated: { column: 0, line: 0 },
        original: { column: 0, line: 0 },
        source: ""
      };
      let lines, last;
      this.stringify(this.root, (str, node2, type) => {
        this.css += str;
        if (node2 && type !== "end") {
          mapping.generated.line = line;
          mapping.generated.column = column - 1;
          if (node2.source && node2.source.start) {
            mapping.source = this.sourcePath(node2);
            mapping.original.line = node2.source.start.line;
            mapping.original.column = node2.source.start.column - 1;
            this.map.addMapping(mapping);
          } else {
            mapping.source = noSource;
            mapping.original.line = 1;
            mapping.original.column = 0;
            this.map.addMapping(mapping);
          }
        }
        lines = str.match(/\n/g);
        if (lines) {
          line += lines.length;
          last = str.lastIndexOf("\n");
          column = str.length - last;
        } else {
          column += str.length;
        }
        if (node2 && type !== "start") {
          let p = node2.parent || { raws: {} };
          let childless = node2.type === "decl" || node2.type === "atrule" && !node2.nodes;
          if (!childless || node2 !== p.last || p.raws.semicolon) {
            if (node2.source && node2.source.end) {
              mapping.source = this.sourcePath(node2);
              mapping.original.line = node2.source.end.line;
              mapping.original.column = node2.source.end.column - 1;
              mapping.generated.line = line;
              mapping.generated.column = column - 2;
              this.map.addMapping(mapping);
            } else {
              mapping.source = noSource;
              mapping.original.line = 1;
              mapping.original.column = 0;
              mapping.generated.line = line;
              mapping.generated.column = column - 1;
              this.map.addMapping(mapping);
            }
          }
        }
      });
    }
    isAnnotation() {
      if (this.isInline()) {
        return true;
      }
      if (typeof this.mapOpts.annotation !== "undefined") {
        return this.mapOpts.annotation;
      }
      if (this.previous().length) {
        return this.previous().some((i2) => i2.annotation);
      }
      return true;
    }
    isInline() {
      if (typeof this.mapOpts.inline !== "undefined") {
        return this.mapOpts.inline;
      }
      let annotation = this.mapOpts.annotation;
      if (typeof annotation !== "undefined" && annotation !== true) {
        return false;
      }
      if (this.previous().length) {
        return this.previous().some((i2) => i2.inline);
      }
      return true;
    }
    isMap() {
      if (typeof this.opts.map !== "undefined") {
        return !!this.opts.map;
      }
      return this.previous().length > 0;
    }
    isSourcesContent() {
      if (typeof this.mapOpts.sourcesContent !== "undefined") {
        return this.mapOpts.sourcesContent;
      }
      if (this.previous().length) {
        return this.previous().some((i2) => i2.withContent());
      }
      return true;
    }
    outputFile() {
      if (this.opts.to) {
        return this.path(this.opts.to);
      } else if (this.opts.from) {
        return this.path(this.opts.from);
      } else {
        return "to.css";
      }
    }
    path(file) {
      if (this.mapOpts.absolute) return file;
      if (file.charCodeAt(0) === 60) return file;
      if (/^\w+:\/\//.test(file)) return file;
      let cached = this.memoizedPaths.get(file);
      if (cached) return cached;
      let from = this.opts.to ? dirname$2(this.opts.to) : ".";
      if (typeof this.mapOpts.annotation === "string") {
        from = dirname$2(resolve$2(from, this.mapOpts.annotation));
      }
      let path = relative$1(from, file);
      this.memoizedPaths.set(file, path);
      return path;
    }
    previous() {
      if (!this.previousMaps) {
        this.previousMaps = [];
        if (this.root) {
          this.root.walk((node2) => {
            if (node2.source && node2.source.input.map) {
              let map = node2.source.input.map;
              if (!this.previousMaps.includes(map)) {
                this.previousMaps.push(map);
              }
            }
          });
        } else {
          let input2 = new Input$3$1(this.originalCSS, this.opts);
          if (input2.map) this.previousMaps.push(input2.map);
        }
      }
      return this.previousMaps;
    }
    setSourcesContent() {
      let already = {};
      if (this.root) {
        this.root.walk((node2) => {
          if (node2.source) {
            let from = node2.source.input.from;
            if (from && !already[from]) {
              already[from] = true;
              let fromUrl = this.usesFileUrls ? this.toFileUrl(from) : this.toUrl(this.path(from));
              this.map.setSourceContent(fromUrl, node2.source.input.css);
            }
          }
        });
      } else if (this.css) {
        let from = this.opts.from ? this.toUrl(this.path(this.opts.from)) : "<no source>";
        this.map.setSourceContent(from, this.css);
      }
    }
    sourcePath(node2) {
      if (this.mapOpts.from) {
        return this.toUrl(this.mapOpts.from);
      } else if (this.usesFileUrls) {
        return this.toFileUrl(node2.source.input.from);
      } else {
        return this.toUrl(this.path(node2.source.input.from));
      }
    }
    toBase64(str) {
      if (Buffer) {
        return Buffer.from(str).toString("base64");
      } else {
        return window.btoa(unescape(encodeURIComponent(str)));
      }
    }
    toFileUrl(path) {
      let cached = this.memoizedFileURLs.get(path);
      if (cached) return cached;
      if (pathToFileURL$2) {
        let fileURL = pathToFileURL$2(path).toString();
        this.memoizedFileURLs.set(path, fileURL);
        return fileURL;
      } else {
        throw new Error(
          "`map.absolute` option is not available in this PostCSS build"
        );
      }
    }
    toUrl(path) {
      let cached = this.memoizedURLs.get(path);
      if (cached) return cached;
      if (sep$1 === "\\") {
        path = path.replace(/\\/g, "/");
      }
      let url = encodeURI(path).replace(/[#?]/g, encodeURIComponent);
      this.memoizedURLs.set(path, url);
      return url;
    }
  };
  var mapGenerator$1 = MapGenerator$2$1;
  var Node$2$1 = node$1;
  var Comment$4$1 = class Comment extends Node$2$1 {
    constructor(defaults) {
      super(defaults);
      this.type = "comment";
    }
  };
  var comment$1 = Comment$4$1;
  Comment$4$1.default = Comment$4$1;
  var { isClean: isClean$1$1, my: my$1$1 } = symbols$1;
  var Declaration$3$1 = declaration$1;
  var Comment$3$1 = comment$1;
  var Node$1$1 = node$1;
  var parse$4$1;
  var Rule$4$1;
  var AtRule$4$1;
  var Root$6$1;
  function cleanSource$1(nodes) {
    return nodes.map((i2) => {
      if (i2.nodes) i2.nodes = cleanSource$1(i2.nodes);
      delete i2.source;
      return i2;
    });
  }
  function markDirtyUp$1(node2) {
    node2[isClean$1$1] = false;
    if (node2.proxyOf.nodes) {
      for (let i2 of node2.proxyOf.nodes) {
        markDirtyUp$1(i2);
      }
    }
  }
  var Container$7$1 = class Container extends Node$1$1 {
    append(...children) {
      for (let child of children) {
        let nodes = this.normalize(child, this.last);
        for (let node2 of nodes) this.proxyOf.nodes.push(node2);
      }
      this.markDirty();
      return this;
    }
    cleanRaws(keepBetween) {
      super.cleanRaws(keepBetween);
      if (this.nodes) {
        for (let node2 of this.nodes) node2.cleanRaws(keepBetween);
      }
    }
    each(callback) {
      if (!this.proxyOf.nodes) return void 0;
      let iterator = this.getIterator();
      let index2, result2;
      while (this.indexes[iterator] < this.proxyOf.nodes.length) {
        index2 = this.indexes[iterator];
        result2 = callback(this.proxyOf.nodes[index2], index2);
        if (result2 === false) break;
        this.indexes[iterator] += 1;
      }
      delete this.indexes[iterator];
      return result2;
    }
    every(condition) {
      return this.nodes.every(condition);
    }
    getIterator() {
      if (!this.lastEach) this.lastEach = 0;
      if (!this.indexes) this.indexes = {};
      this.lastEach += 1;
      let iterator = this.lastEach;
      this.indexes[iterator] = 0;
      return iterator;
    }
    getProxyProcessor() {
      return {
        get(node2, prop) {
          if (prop === "proxyOf") {
            return node2;
          } else if (!node2[prop]) {
            return node2[prop];
          } else if (prop === "each" || typeof prop === "string" && prop.startsWith("walk")) {
            return (...args) => {
              return node2[prop](
                ...args.map((i2) => {
                  if (typeof i2 === "function") {
                    return (child, index2) => i2(child.toProxy(), index2);
                  } else {
                    return i2;
                  }
                })
              );
            };
          } else if (prop === "every" || prop === "some") {
            return (cb) => {
              return node2[prop](
                (child, ...other) => cb(child.toProxy(), ...other)
              );
            };
          } else if (prop === "root") {
            return () => node2.root().toProxy();
          } else if (prop === "nodes") {
            return node2.nodes.map((i2) => i2.toProxy());
          } else if (prop === "first" || prop === "last") {
            return node2[prop].toProxy();
          } else {
            return node2[prop];
          }
        },
        set(node2, prop, value) {
          if (node2[prop] === value) return true;
          node2[prop] = value;
          if (prop === "name" || prop === "params" || prop === "selector") {
            node2.markDirty();
          }
          return true;
        }
      };
    }
    index(child) {
      if (typeof child === "number") return child;
      if (child.proxyOf) child = child.proxyOf;
      return this.proxyOf.nodes.indexOf(child);
    }
    insertAfter(exist, add) {
      let existIndex = this.index(exist);
      let nodes = this.normalize(add, this.proxyOf.nodes[existIndex]).reverse();
      existIndex = this.index(exist);
      for (let node2 of nodes) this.proxyOf.nodes.splice(existIndex + 1, 0, node2);
      let index2;
      for (let id in this.indexes) {
        index2 = this.indexes[id];
        if (existIndex < index2) {
          this.indexes[id] = index2 + nodes.length;
        }
      }
      this.markDirty();
      return this;
    }
    insertBefore(exist, add) {
      let existIndex = this.index(exist);
      let type = existIndex === 0 ? "prepend" : false;
      let nodes = this.normalize(add, this.proxyOf.nodes[existIndex], type).reverse();
      existIndex = this.index(exist);
      for (let node2 of nodes) this.proxyOf.nodes.splice(existIndex, 0, node2);
      let index2;
      for (let id in this.indexes) {
        index2 = this.indexes[id];
        if (existIndex <= index2) {
          this.indexes[id] = index2 + nodes.length;
        }
      }
      this.markDirty();
      return this;
    }
    normalize(nodes, sample) {
      if (typeof nodes === "string") {
        nodes = cleanSource$1(parse$4$1(nodes).nodes);
      } else if (typeof nodes === "undefined") {
        nodes = [];
      } else if (Array.isArray(nodes)) {
        nodes = nodes.slice(0);
        for (let i2 of nodes) {
          if (i2.parent) i2.parent.removeChild(i2, "ignore");
        }
      } else if (nodes.type === "root" && this.type !== "document") {
        nodes = nodes.nodes.slice(0);
        for (let i2 of nodes) {
          if (i2.parent) i2.parent.removeChild(i2, "ignore");
        }
      } else if (nodes.type) {
        nodes = [nodes];
      } else if (nodes.prop) {
        if (typeof nodes.value === "undefined") {
          throw new Error("Value field is missed in node creation");
        } else if (typeof nodes.value !== "string") {
          nodes.value = String(nodes.value);
        }
        nodes = [new Declaration$3$1(nodes)];
      } else if (nodes.selector) {
        nodes = [new Rule$4$1(nodes)];
      } else if (nodes.name) {
        nodes = [new AtRule$4$1(nodes)];
      } else if (nodes.text) {
        nodes = [new Comment$3$1(nodes)];
      } else {
        throw new Error("Unknown node type in node creation");
      }
      let processed = nodes.map((i2) => {
        if (!i2[my$1$1]) Container.rebuild(i2);
        i2 = i2.proxyOf;
        if (i2.parent) i2.parent.removeChild(i2);
        if (i2[isClean$1$1]) markDirtyUp$1(i2);
        if (typeof i2.raws.before === "undefined") {
          if (sample && typeof sample.raws.before !== "undefined") {
            i2.raws.before = sample.raws.before.replace(/\S/g, "");
          }
        }
        i2.parent = this.proxyOf;
        return i2;
      });
      return processed;
    }
    prepend(...children) {
      children = children.reverse();
      for (let child of children) {
        let nodes = this.normalize(child, this.first, "prepend").reverse();
        for (let node2 of nodes) this.proxyOf.nodes.unshift(node2);
        for (let id in this.indexes) {
          this.indexes[id] = this.indexes[id] + nodes.length;
        }
      }
      this.markDirty();
      return this;
    }
    push(child) {
      child.parent = this;
      this.proxyOf.nodes.push(child);
      return this;
    }
    removeAll() {
      for (let node2 of this.proxyOf.nodes) node2.parent = void 0;
      this.proxyOf.nodes = [];
      this.markDirty();
      return this;
    }
    removeChild(child) {
      child = this.index(child);
      this.proxyOf.nodes[child].parent = void 0;
      this.proxyOf.nodes.splice(child, 1);
      let index2;
      for (let id in this.indexes) {
        index2 = this.indexes[id];
        if (index2 >= child) {
          this.indexes[id] = index2 - 1;
        }
      }
      this.markDirty();
      return this;
    }
    replaceValues(pattern, opts, callback) {
      if (!callback) {
        callback = opts;
        opts = {};
      }
      this.walkDecls((decl) => {
        if (opts.props && !opts.props.includes(decl.prop)) return;
        if (opts.fast && !decl.value.includes(opts.fast)) return;
        decl.value = decl.value.replace(pattern, callback);
      });
      this.markDirty();
      return this;
    }
    some(condition) {
      return this.nodes.some(condition);
    }
    walk(callback) {
      return this.each((child, i2) => {
        let result2;
        try {
          result2 = callback(child, i2);
        } catch (e2) {
          throw child.addToError(e2);
        }
        if (result2 !== false && child.walk) {
          result2 = child.walk(callback);
        }
        return result2;
      });
    }
    walkAtRules(name, callback) {
      if (!callback) {
        callback = name;
        return this.walk((child, i2) => {
          if (child.type === "atrule") {
            return callback(child, i2);
          }
        });
      }
      if (name instanceof RegExp) {
        return this.walk((child, i2) => {
          if (child.type === "atrule" && name.test(child.name)) {
            return callback(child, i2);
          }
        });
      }
      return this.walk((child, i2) => {
        if (child.type === "atrule" && child.name === name) {
          return callback(child, i2);
        }
      });
    }
    walkComments(callback) {
      return this.walk((child, i2) => {
        if (child.type === "comment") {
          return callback(child, i2);
        }
      });
    }
    walkDecls(prop, callback) {
      if (!callback) {
        callback = prop;
        return this.walk((child, i2) => {
          if (child.type === "decl") {
            return callback(child, i2);
          }
        });
      }
      if (prop instanceof RegExp) {
        return this.walk((child, i2) => {
          if (child.type === "decl" && prop.test(child.prop)) {
            return callback(child, i2);
          }
        });
      }
      return this.walk((child, i2) => {
        if (child.type === "decl" && child.prop === prop) {
          return callback(child, i2);
        }
      });
    }
    walkRules(selector, callback) {
      if (!callback) {
        callback = selector;
        return this.walk((child, i2) => {
          if (child.type === "rule") {
            return callback(child, i2);
          }
        });
      }
      if (selector instanceof RegExp) {
        return this.walk((child, i2) => {
          if (child.type === "rule" && selector.test(child.selector)) {
            return callback(child, i2);
          }
        });
      }
      return this.walk((child, i2) => {
        if (child.type === "rule" && child.selector === selector) {
          return callback(child, i2);
        }
      });
    }
    get first() {
      if (!this.proxyOf.nodes) return void 0;
      return this.proxyOf.nodes[0];
    }
    get last() {
      if (!this.proxyOf.nodes) return void 0;
      return this.proxyOf.nodes[this.proxyOf.nodes.length - 1];
    }
  };
  Container$7$1.registerParse = (dependant) => {
    parse$4$1 = dependant;
  };
  Container$7$1.registerRule = (dependant) => {
    Rule$4$1 = dependant;
  };
  Container$7$1.registerAtRule = (dependant) => {
    AtRule$4$1 = dependant;
  };
  Container$7$1.registerRoot = (dependant) => {
    Root$6$1 = dependant;
  };
  var container$1 = Container$7$1;
  Container$7$1.default = Container$7$1;
  Container$7$1.rebuild = (node2) => {
    if (node2.type === "atrule") {
      Object.setPrototypeOf(node2, AtRule$4$1.prototype);
    } else if (node2.type === "rule") {
      Object.setPrototypeOf(node2, Rule$4$1.prototype);
    } else if (node2.type === "decl") {
      Object.setPrototypeOf(node2, Declaration$3$1.prototype);
    } else if (node2.type === "comment") {
      Object.setPrototypeOf(node2, Comment$3$1.prototype);
    } else if (node2.type === "root") {
      Object.setPrototypeOf(node2, Root$6$1.prototype);
    }
    node2[my$1$1] = true;
    if (node2.nodes) {
      node2.nodes.forEach((child) => {
        Container$7$1.rebuild(child);
      });
    }
  };
  var Container$6$1 = container$1;
  var LazyResult$4$1;
  var Processor$3$1;
  var Document$3$1 = class Document2 extends Container$6$1 {
    constructor(defaults) {
      super({ type: "document", ...defaults });
      if (!this.nodes) {
        this.nodes = [];
      }
    }
    toResult(opts = {}) {
      let lazy = new LazyResult$4$1(new Processor$3$1(), this, opts);
      return lazy.stringify();
    }
  };
  Document$3$1.registerLazyResult = (dependant) => {
    LazyResult$4$1 = dependant;
  };
  Document$3$1.registerProcessor = (dependant) => {
    Processor$3$1 = dependant;
  };
  var document$1$1 = Document$3$1;
  Document$3$1.default = Document$3$1;
  var printed$1 = {};
  var warnOnce$2$1 = function warnOnce(message) {
    if (printed$1[message]) return;
    printed$1[message] = true;
    if (typeof console !== "undefined" && console.warn) {
      console.warn(message);
    }
  };
  var Warning$2$1 = class Warning {
    constructor(text, opts = {}) {
      this.type = "warning";
      this.text = text;
      if (opts.node && opts.node.source) {
        let range = opts.node.rangeBy(opts);
        this.line = range.start.line;
        this.column = range.start.column;
        this.endLine = range.end.line;
        this.endColumn = range.end.column;
      }
      for (let opt in opts) this[opt] = opts[opt];
    }
    toString() {
      if (this.node) {
        return this.node.error(this.text, {
          index: this.index,
          plugin: this.plugin,
          word: this.word
        }).message;
      }
      if (this.plugin) {
        return this.plugin + ": " + this.text;
      }
      return this.text;
    }
  };
  var warning$1 = Warning$2$1;
  Warning$2$1.default = Warning$2$1;
  var Warning$1$1 = warning$1;
  var Result$3$1 = class Result {
    constructor(processor2, root2, opts) {
      this.processor = processor2;
      this.messages = [];
      this.root = root2;
      this.opts = opts;
      this.css = void 0;
      this.map = void 0;
    }
    toString() {
      return this.css;
    }
    warn(text, opts = {}) {
      if (!opts.plugin) {
        if (this.lastPlugin && this.lastPlugin.postcssPlugin) {
          opts.plugin = this.lastPlugin.postcssPlugin;
        }
      }
      let warning2 = new Warning$1$1(text, opts);
      this.messages.push(warning2);
      return warning2;
    }
    warnings() {
      return this.messages.filter((i2) => i2.type === "warning");
    }
    get content() {
      return this.css;
    }
  };
  var result$1 = Result$3$1;
  Result$3$1.default = Result$3$1;
  var SINGLE_QUOTE$1 = "'".charCodeAt(0);
  var DOUBLE_QUOTE$1 = '"'.charCodeAt(0);
  var BACKSLASH$1 = "\\".charCodeAt(0);
  var SLASH$1 = "/".charCodeAt(0);
  var NEWLINE$1 = "\n".charCodeAt(0);
  var SPACE$1 = " ".charCodeAt(0);
  var FEED$1 = "\f".charCodeAt(0);
  var TAB$1 = "	".charCodeAt(0);
  var CR$1 = "\r".charCodeAt(0);
  var OPEN_SQUARE$1 = "[".charCodeAt(0);
  var CLOSE_SQUARE$1 = "]".charCodeAt(0);
  var OPEN_PARENTHESES$1 = "(".charCodeAt(0);
  var CLOSE_PARENTHESES$1 = ")".charCodeAt(0);
  var OPEN_CURLY$1 = "{".charCodeAt(0);
  var CLOSE_CURLY$1 = "}".charCodeAt(0);
  var SEMICOLON$1 = ";".charCodeAt(0);
  var ASTERISK$1 = "*".charCodeAt(0);
  var COLON$1 = ":".charCodeAt(0);
  var AT$1 = "@".charCodeAt(0);
  var RE_AT_END$1 = /[\t\n\f\r "#'()/;[\\\]{}]/g;
  var RE_WORD_END$1 = /[\t\n\f\r !"#'():;@[\\\]{}]|\/(?=\*)/g;
  var RE_BAD_BRACKET$1 = /.[\r\n"'(/\\]/;
  var RE_HEX_ESCAPE$1 = /[\da-f]/i;
  var tokenize$1 = function tokenizer(input2, options = {}) {
    let css = input2.css.valueOf();
    let ignore = options.ignoreErrors;
    let code, next, quote, content, escape;
    let escaped, escapePos, prev, n2, currentToken;
    let length = css.length;
    let pos = 0;
    let buffer = [];
    let returned = [];
    function position() {
      return pos;
    }
    function unclosed(what) {
      throw input2.error("Unclosed " + what, pos);
    }
    function endOfFile() {
      return returned.length === 0 && pos >= length;
    }
    function nextToken(opts) {
      if (returned.length) return returned.pop();
      if (pos >= length) return;
      let ignoreUnclosed = opts ? opts.ignoreUnclosed : false;
      code = css.charCodeAt(pos);
      switch (code) {
        case NEWLINE$1:
        case SPACE$1:
        case TAB$1:
        case CR$1:
        case FEED$1: {
          next = pos;
          do {
            next += 1;
            code = css.charCodeAt(next);
          } while (code === SPACE$1 || code === NEWLINE$1 || code === TAB$1 || code === CR$1 || code === FEED$1);
          currentToken = ["space", css.slice(pos, next)];
          pos = next - 1;
          break;
        }
        case OPEN_SQUARE$1:
        case CLOSE_SQUARE$1:
        case OPEN_CURLY$1:
        case CLOSE_CURLY$1:
        case COLON$1:
        case SEMICOLON$1:
        case CLOSE_PARENTHESES$1: {
          let controlChar = String.fromCharCode(code);
          currentToken = [controlChar, controlChar, pos];
          break;
        }
        case OPEN_PARENTHESES$1: {
          prev = buffer.length ? buffer.pop()[1] : "";
          n2 = css.charCodeAt(pos + 1);
          if (prev === "url" && n2 !== SINGLE_QUOTE$1 && n2 !== DOUBLE_QUOTE$1 && n2 !== SPACE$1 && n2 !== NEWLINE$1 && n2 !== TAB$1 && n2 !== FEED$1 && n2 !== CR$1) {
            next = pos;
            do {
              escaped = false;
              next = css.indexOf(")", next + 1);
              if (next === -1) {
                if (ignore || ignoreUnclosed) {
                  next = pos;
                  break;
                } else {
                  unclosed("bracket");
                }
              }
              escapePos = next;
              while (css.charCodeAt(escapePos - 1) === BACKSLASH$1) {
                escapePos -= 1;
                escaped = !escaped;
              }
            } while (escaped);
            currentToken = ["brackets", css.slice(pos, next + 1), pos, next];
            pos = next;
          } else {
            next = css.indexOf(")", pos + 1);
            content = css.slice(pos, next + 1);
            if (next === -1 || RE_BAD_BRACKET$1.test(content)) {
              currentToken = ["(", "(", pos];
            } else {
              currentToken = ["brackets", content, pos, next];
              pos = next;
            }
          }
          break;
        }
        case SINGLE_QUOTE$1:
        case DOUBLE_QUOTE$1: {
          quote = code === SINGLE_QUOTE$1 ? "'" : '"';
          next = pos;
          do {
            escaped = false;
            next = css.indexOf(quote, next + 1);
            if (next === -1) {
              if (ignore || ignoreUnclosed) {
                next = pos + 1;
                break;
              } else {
                unclosed("string");
              }
            }
            escapePos = next;
            while (css.charCodeAt(escapePos - 1) === BACKSLASH$1) {
              escapePos -= 1;
              escaped = !escaped;
            }
          } while (escaped);
          currentToken = ["string", css.slice(pos, next + 1), pos, next];
          pos = next;
          break;
        }
        case AT$1: {
          RE_AT_END$1.lastIndex = pos + 1;
          RE_AT_END$1.test(css);
          if (RE_AT_END$1.lastIndex === 0) {
            next = css.length - 1;
          } else {
            next = RE_AT_END$1.lastIndex - 2;
          }
          currentToken = ["at-word", css.slice(pos, next + 1), pos, next];
          pos = next;
          break;
        }
        case BACKSLASH$1: {
          next = pos;
          escape = true;
          while (css.charCodeAt(next + 1) === BACKSLASH$1) {
            next += 1;
            escape = !escape;
          }
          code = css.charCodeAt(next + 1);
          if (escape && code !== SLASH$1 && code !== SPACE$1 && code !== NEWLINE$1 && code !== TAB$1 && code !== CR$1 && code !== FEED$1) {
            next += 1;
            if (RE_HEX_ESCAPE$1.test(css.charAt(next))) {
              while (RE_HEX_ESCAPE$1.test(css.charAt(next + 1))) {
                next += 1;
              }
              if (css.charCodeAt(next + 1) === SPACE$1) {
                next += 1;
              }
            }
          }
          currentToken = ["word", css.slice(pos, next + 1), pos, next];
          pos = next;
          break;
        }
        default: {
          if (code === SLASH$1 && css.charCodeAt(pos + 1) === ASTERISK$1) {
            next = css.indexOf("*/", pos + 2) + 1;
            if (next === 0) {
              if (ignore || ignoreUnclosed) {
                next = css.length;
              } else {
                unclosed("comment");
              }
            }
            currentToken = ["comment", css.slice(pos, next + 1), pos, next];
            pos = next;
          } else {
            RE_WORD_END$1.lastIndex = pos + 1;
            RE_WORD_END$1.test(css);
            if (RE_WORD_END$1.lastIndex === 0) {
              next = css.length - 1;
            } else {
              next = RE_WORD_END$1.lastIndex - 2;
            }
            currentToken = ["word", css.slice(pos, next + 1), pos, next];
            buffer.push(currentToken);
            pos = next;
          }
          break;
        }
      }
      pos++;
      return currentToken;
    }
    function back(token) {
      returned.push(token);
    }
    return {
      back,
      endOfFile,
      nextToken,
      position
    };
  };
  var Container$5$1 = container$1;
  var AtRule$3$1 = class AtRule extends Container$5$1 {
    constructor(defaults) {
      super(defaults);
      this.type = "atrule";
    }
    append(...children) {
      if (!this.proxyOf.nodes) this.nodes = [];
      return super.append(...children);
    }
    prepend(...children) {
      if (!this.proxyOf.nodes) this.nodes = [];
      return super.prepend(...children);
    }
  };
  var atRule$1 = AtRule$3$1;
  AtRule$3$1.default = AtRule$3$1;
  Container$5$1.registerAtRule(AtRule$3$1);
  var Container$4$1 = container$1;
  var LazyResult$3$1;
  var Processor$2$1;
  var Root$5$1 = class Root extends Container$4$1 {
    constructor(defaults) {
      super(defaults);
      this.type = "root";
      if (!this.nodes) this.nodes = [];
    }
    normalize(child, sample, type) {
      let nodes = super.normalize(child);
      if (sample) {
        if (type === "prepend") {
          if (this.nodes.length > 1) {
            sample.raws.before = this.nodes[1].raws.before;
          } else {
            delete sample.raws.before;
          }
        } else if (this.first !== sample) {
          for (let node2 of nodes) {
            node2.raws.before = sample.raws.before;
          }
        }
      }
      return nodes;
    }
    removeChild(child, ignore) {
      let index2 = this.index(child);
      if (!ignore && index2 === 0 && this.nodes.length > 1) {
        this.nodes[1].raws.before = this.nodes[index2].raws.before;
      }
      return super.removeChild(child);
    }
    toResult(opts = {}) {
      let lazy = new LazyResult$3$1(new Processor$2$1(), this, opts);
      return lazy.stringify();
    }
  };
  Root$5$1.registerLazyResult = (dependant) => {
    LazyResult$3$1 = dependant;
  };
  Root$5$1.registerProcessor = (dependant) => {
    Processor$2$1 = dependant;
  };
  var root$1 = Root$5$1;
  Root$5$1.default = Root$5$1;
  Container$4$1.registerRoot(Root$5$1);
  var list$2$1 = {
    comma(string) {
      return list$2$1.split(string, [","], true);
    },
    space(string) {
      let spaces = [" ", "\n", "	"];
      return list$2$1.split(string, spaces);
    },
    split(string, separators, last) {
      let array = [];
      let current = "";
      let split = false;
      let func = 0;
      let inQuote = false;
      let prevQuote = "";
      let escape = false;
      for (let letter of string) {
        if (escape) {
          escape = false;
        } else if (letter === "\\") {
          escape = true;
        } else if (inQuote) {
          if (letter === prevQuote) {
            inQuote = false;
          }
        } else if (letter === '"' || letter === "'") {
          inQuote = true;
          prevQuote = letter;
        } else if (letter === "(") {
          func += 1;
        } else if (letter === ")") {
          if (func > 0) func -= 1;
        } else if (func === 0) {
          if (separators.includes(letter)) split = true;
        }
        if (split) {
          if (current !== "") array.push(current.trim());
          current = "";
          split = false;
        } else {
          current += letter;
        }
      }
      if (last || current !== "") array.push(current.trim());
      return array;
    }
  };
  var list_1$1 = list$2$1;
  list$2$1.default = list$2$1;
  var Container$3$1 = container$1;
  var list$1$1 = list_1$1;
  var Rule$3$1 = class Rule extends Container$3$1 {
    constructor(defaults) {
      super(defaults);
      this.type = "rule";
      if (!this.nodes) this.nodes = [];
    }
    get selectors() {
      return list$1$1.comma(this.selector);
    }
    set selectors(values) {
      let match = this.selector ? this.selector.match(/,\s*/) : null;
      let sep2 = match ? match[0] : "," + this.raw("between", "beforeOpen");
      this.selector = values.join(sep2);
    }
  };
  var rule$1 = Rule$3$1;
  Rule$3$1.default = Rule$3$1;
  Container$3$1.registerRule(Rule$3$1);
  var Declaration$2$1 = declaration$1;
  var tokenizer2$1 = tokenize$1;
  var Comment$2$1 = comment$1;
  var AtRule$2$1 = atRule$1;
  var Root$4$1 = root$1;
  var Rule$2$1 = rule$1;
  var SAFE_COMMENT_NEIGHBOR$1 = {
    empty: true,
    space: true
  };
  function findLastWithPosition$1(tokens) {
    for (let i2 = tokens.length - 1; i2 >= 0; i2--) {
      let token = tokens[i2];
      let pos = token[3] || token[2];
      if (pos) return pos;
    }
  }
  var Parser$1$1 = class Parser {
    constructor(input2) {
      this.input = input2;
      this.root = new Root$4$1();
      this.current = this.root;
      this.spaces = "";
      this.semicolon = false;
      this.createTokenizer();
      this.root.source = { input: input2, start: { column: 1, line: 1, offset: 0 } };
    }
    atrule(token) {
      let node2 = new AtRule$2$1();
      node2.name = token[1].slice(1);
      if (node2.name === "") {
        this.unnamedAtrule(node2, token);
      }
      this.init(node2, token[2]);
      let type;
      let prev;
      let shift;
      let last = false;
      let open = false;
      let params = [];
      let brackets = [];
      while (!this.tokenizer.endOfFile()) {
        token = this.tokenizer.nextToken();
        type = token[0];
        if (type === "(" || type === "[") {
          brackets.push(type === "(" ? ")" : "]");
        } else if (type === "{" && brackets.length > 0) {
          brackets.push("}");
        } else if (type === brackets[brackets.length - 1]) {
          brackets.pop();
        }
        if (brackets.length === 0) {
          if (type === ";") {
            node2.source.end = this.getPosition(token[2]);
            node2.source.end.offset++;
            this.semicolon = true;
            break;
          } else if (type === "{") {
            open = true;
            break;
          } else if (type === "}") {
            if (params.length > 0) {
              shift = params.length - 1;
              prev = params[shift];
              while (prev && prev[0] === "space") {
                prev = params[--shift];
              }
              if (prev) {
                node2.source.end = this.getPosition(prev[3] || prev[2]);
                node2.source.end.offset++;
              }
            }
            this.end(token);
            break;
          } else {
            params.push(token);
          }
        } else {
          params.push(token);
        }
        if (this.tokenizer.endOfFile()) {
          last = true;
          break;
        }
      }
      node2.raws.between = this.spacesAndCommentsFromEnd(params);
      if (params.length) {
        node2.raws.afterName = this.spacesAndCommentsFromStart(params);
        this.raw(node2, "params", params);
        if (last) {
          token = params[params.length - 1];
          node2.source.end = this.getPosition(token[3] || token[2]);
          node2.source.end.offset++;
          this.spaces = node2.raws.between;
          node2.raws.between = "";
        }
      } else {
        node2.raws.afterName = "";
        node2.params = "";
      }
      if (open) {
        node2.nodes = [];
        this.current = node2;
      }
    }
    checkMissedSemicolon(tokens) {
      let colon = this.colon(tokens);
      if (colon === false) return;
      let founded = 0;
      let token;
      for (let j = colon - 1; j >= 0; j--) {
        token = tokens[j];
        if (token[0] !== "space") {
          founded += 1;
          if (founded === 2) break;
        }
      }
      throw this.input.error(
        "Missed semicolon",
        token[0] === "word" ? token[3] + 1 : token[2]
      );
    }
    colon(tokens) {
      let brackets = 0;
      let token, type, prev;
      for (let [i2, element] of tokens.entries()) {
        token = element;
        type = token[0];
        if (type === "(") {
          brackets += 1;
        }
        if (type === ")") {
          brackets -= 1;
        }
        if (brackets === 0 && type === ":") {
          if (!prev) {
            this.doubleColon(token);
          } else if (prev[0] === "word" && prev[1] === "progid") {
            continue;
          } else {
            return i2;
          }
        }
        prev = token;
      }
      return false;
    }
    comment(token) {
      let node2 = new Comment$2$1();
      this.init(node2, token[2]);
      node2.source.end = this.getPosition(token[3] || token[2]);
      node2.source.end.offset++;
      let text = token[1].slice(2, -2);
      if (/^\s*$/.test(text)) {
        node2.text = "";
        node2.raws.left = text;
        node2.raws.right = "";
      } else {
        let match = text.match(/^(\s*)([^]*\S)(\s*)$/);
        node2.text = match[2];
        node2.raws.left = match[1];
        node2.raws.right = match[3];
      }
    }
    createTokenizer() {
      this.tokenizer = tokenizer2$1(this.input);
    }
    decl(tokens, customProperty) {
      let node2 = new Declaration$2$1();
      this.init(node2, tokens[0][2]);
      let last = tokens[tokens.length - 1];
      if (last[0] === ";") {
        this.semicolon = true;
        tokens.pop();
      }
      node2.source.end = this.getPosition(
        last[3] || last[2] || findLastWithPosition$1(tokens)
      );
      node2.source.end.offset++;
      while (tokens[0][0] !== "word") {
        if (tokens.length === 1) this.unknownWord(tokens);
        node2.raws.before += tokens.shift()[1];
      }
      node2.source.start = this.getPosition(tokens[0][2]);
      node2.prop = "";
      while (tokens.length) {
        let type = tokens[0][0];
        if (type === ":" || type === "space" || type === "comment") {
          break;
        }
        node2.prop += tokens.shift()[1];
      }
      node2.raws.between = "";
      let token;
      while (tokens.length) {
        token = tokens.shift();
        if (token[0] === ":") {
          node2.raws.between += token[1];
          break;
        } else {
          if (token[0] === "word" && /\w/.test(token[1])) {
            this.unknownWord([token]);
          }
          node2.raws.between += token[1];
        }
      }
      if (node2.prop[0] === "_" || node2.prop[0] === "*") {
        node2.raws.before += node2.prop[0];
        node2.prop = node2.prop.slice(1);
      }
      let firstSpaces = [];
      let next;
      while (tokens.length) {
        next = tokens[0][0];
        if (next !== "space" && next !== "comment") break;
        firstSpaces.push(tokens.shift());
      }
      this.precheckMissedSemicolon(tokens);
      for (let i2 = tokens.length - 1; i2 >= 0; i2--) {
        token = tokens[i2];
        if (token[1].toLowerCase() === "!important") {
          node2.important = true;
          let string = this.stringFrom(tokens, i2);
          string = this.spacesFromEnd(tokens) + string;
          if (string !== " !important") node2.raws.important = string;
          break;
        } else if (token[1].toLowerCase() === "important") {
          let cache = tokens.slice(0);
          let str = "";
          for (let j = i2; j > 0; j--) {
            let type = cache[j][0];
            if (str.trim().indexOf("!") === 0 && type !== "space") {
              break;
            }
            str = cache.pop()[1] + str;
          }
          if (str.trim().indexOf("!") === 0) {
            node2.important = true;
            node2.raws.important = str;
            tokens = cache;
          }
        }
        if (token[0] !== "space" && token[0] !== "comment") {
          break;
        }
      }
      let hasWord = tokens.some((i2) => i2[0] !== "space" && i2[0] !== "comment");
      if (hasWord) {
        node2.raws.between += firstSpaces.map((i2) => i2[1]).join("");
        firstSpaces = [];
      }
      this.raw(node2, "value", firstSpaces.concat(tokens), customProperty);
      if (node2.value.includes(":") && !customProperty) {
        this.checkMissedSemicolon(tokens);
      }
    }
    doubleColon(token) {
      throw this.input.error(
        "Double colon",
        { offset: token[2] },
        { offset: token[2] + token[1].length }
      );
    }
    emptyRule(token) {
      let node2 = new Rule$2$1();
      this.init(node2, token[2]);
      node2.selector = "";
      node2.raws.between = "";
      this.current = node2;
    }
    end(token) {
      if (this.current.nodes && this.current.nodes.length) {
        this.current.raws.semicolon = this.semicolon;
      }
      this.semicolon = false;
      this.current.raws.after = (this.current.raws.after || "") + this.spaces;
      this.spaces = "";
      if (this.current.parent) {
        this.current.source.end = this.getPosition(token[2]);
        this.current.source.end.offset++;
        this.current = this.current.parent;
      } else {
        this.unexpectedClose(token);
      }
    }
    endFile() {
      if (this.current.parent) this.unclosedBlock();
      if (this.current.nodes && this.current.nodes.length) {
        this.current.raws.semicolon = this.semicolon;
      }
      this.current.raws.after = (this.current.raws.after || "") + this.spaces;
      this.root.source.end = this.getPosition(this.tokenizer.position());
    }
    freeSemicolon(token) {
      this.spaces += token[1];
      if (this.current.nodes) {
        let prev = this.current.nodes[this.current.nodes.length - 1];
        if (prev && prev.type === "rule" && !prev.raws.ownSemicolon) {
          prev.raws.ownSemicolon = this.spaces;
          this.spaces = "";
        }
      }
    }
    // Helpers
    getPosition(offset) {
      let pos = this.input.fromOffset(offset);
      return {
        column: pos.col,
        line: pos.line,
        offset
      };
    }
    init(node2, offset) {
      this.current.push(node2);
      node2.source = {
        input: this.input,
        start: this.getPosition(offset)
      };
      node2.raws.before = this.spaces;
      this.spaces = "";
      if (node2.type !== "comment") this.semicolon = false;
    }
    other(start2) {
      let end = false;
      let type = null;
      let colon = false;
      let bracket = null;
      let brackets = [];
      let customProperty = start2[1].startsWith("--");
      let tokens = [];
      let token = start2;
      while (token) {
        type = token[0];
        tokens.push(token);
        if (type === "(" || type === "[") {
          if (!bracket) bracket = token;
          brackets.push(type === "(" ? ")" : "]");
        } else if (customProperty && colon && type === "{") {
          if (!bracket) bracket = token;
          brackets.push("}");
        } else if (brackets.length === 0) {
          if (type === ";") {
            if (colon) {
              this.decl(tokens, customProperty);
              return;
            } else {
              break;
            }
          } else if (type === "{") {
            this.rule(tokens);
            return;
          } else if (type === "}") {
            this.tokenizer.back(tokens.pop());
            end = true;
            break;
          } else if (type === ":") {
            colon = true;
          }
        } else if (type === brackets[brackets.length - 1]) {
          brackets.pop();
          if (brackets.length === 0) bracket = null;
        }
        token = this.tokenizer.nextToken();
      }
      if (this.tokenizer.endOfFile()) end = true;
      if (brackets.length > 0) this.unclosedBracket(bracket);
      if (end && colon) {
        if (!customProperty) {
          while (tokens.length) {
            token = tokens[tokens.length - 1][0];
            if (token !== "space" && token !== "comment") break;
            this.tokenizer.back(tokens.pop());
          }
        }
        this.decl(tokens, customProperty);
      } else {
        this.unknownWord(tokens);
      }
    }
    parse() {
      let token;
      while (!this.tokenizer.endOfFile()) {
        token = this.tokenizer.nextToken();
        switch (token[0]) {
          case "space":
            this.spaces += token[1];
            break;
          case ";":
            this.freeSemicolon(token);
            break;
          case "}":
            this.end(token);
            break;
          case "comment":
            this.comment(token);
            break;
          case "at-word":
            this.atrule(token);
            break;
          case "{":
            this.emptyRule(token);
            break;
          default:
            this.other(token);
            break;
        }
      }
      this.endFile();
    }
    precheckMissedSemicolon() {
    }
    raw(node2, prop, tokens, customProperty) {
      let token, type;
      let length = tokens.length;
      let value = "";
      let clean = true;
      let next, prev;
      for (let i2 = 0; i2 < length; i2 += 1) {
        token = tokens[i2];
        type = token[0];
        if (type === "space" && i2 === length - 1 && !customProperty) {
          clean = false;
        } else if (type === "comment") {
          prev = tokens[i2 - 1] ? tokens[i2 - 1][0] : "empty";
          next = tokens[i2 + 1] ? tokens[i2 + 1][0] : "empty";
          if (!SAFE_COMMENT_NEIGHBOR$1[prev] && !SAFE_COMMENT_NEIGHBOR$1[next]) {
            if (value.slice(-1) === ",") {
              clean = false;
            } else {
              value += token[1];
            }
          } else {
            clean = false;
          }
        } else {
          value += token[1];
        }
      }
      if (!clean) {
        let raw = tokens.reduce((all, i2) => all + i2[1], "");
        node2.raws[prop] = { raw, value };
      }
      node2[prop] = value;
    }
    rule(tokens) {
      tokens.pop();
      let node2 = new Rule$2$1();
      this.init(node2, tokens[0][2]);
      node2.raws.between = this.spacesAndCommentsFromEnd(tokens);
      this.raw(node2, "selector", tokens);
      this.current = node2;
    }
    spacesAndCommentsFromEnd(tokens) {
      let lastTokenType;
      let spaces = "";
      while (tokens.length) {
        lastTokenType = tokens[tokens.length - 1][0];
        if (lastTokenType !== "space" && lastTokenType !== "comment") break;
        spaces = tokens.pop()[1] + spaces;
      }
      return spaces;
    }
    // Errors
    spacesAndCommentsFromStart(tokens) {
      let next;
      let spaces = "";
      while (tokens.length) {
        next = tokens[0][0];
        if (next !== "space" && next !== "comment") break;
        spaces += tokens.shift()[1];
      }
      return spaces;
    }
    spacesFromEnd(tokens) {
      let lastTokenType;
      let spaces = "";
      while (tokens.length) {
        lastTokenType = tokens[tokens.length - 1][0];
        if (lastTokenType !== "space") break;
        spaces = tokens.pop()[1] + spaces;
      }
      return spaces;
    }
    stringFrom(tokens, from) {
      let result2 = "";
      for (let i2 = from; i2 < tokens.length; i2++) {
        result2 += tokens[i2][1];
      }
      tokens.splice(from, tokens.length - from);
      return result2;
    }
    unclosedBlock() {
      let pos = this.current.source.start;
      throw this.input.error("Unclosed block", pos.line, pos.column);
    }
    unclosedBracket(bracket) {
      throw this.input.error(
        "Unclosed bracket",
        { offset: bracket[2] },
        { offset: bracket[2] + 1 }
      );
    }
    unexpectedClose(token) {
      throw this.input.error(
        "Unexpected }",
        { offset: token[2] },
        { offset: token[2] + 1 }
      );
    }
    unknownWord(tokens) {
      throw this.input.error(
        "Unknown word",
        { offset: tokens[0][2] },
        { offset: tokens[0][2] + tokens[0][1].length }
      );
    }
    unnamedAtrule(node2, token) {
      throw this.input.error(
        "At-rule without name",
        { offset: token[2] },
        { offset: token[2] + token[1].length }
      );
    }
  };
  var parser$1 = Parser$1$1;
  var Container$2$1 = container$1;
  var Parser2$1 = parser$1;
  var Input$2$1 = input$1;
  function parse$3$1(css, opts) {
    let input2 = new Input$2$1(css, opts);
    let parser2 = new Parser2$1(input2);
    try {
      parser2.parse();
    } catch (e2) {
      if (true) {
        if (e2.name === "CssSyntaxError" && opts && opts.from) {
          if (/\.scss$/i.test(opts.from)) {
            e2.message += "\nYou tried to parse SCSS with the standard CSS parser; try again with the postcss-scss parser";
          } else if (/\.sass/i.test(opts.from)) {
            e2.message += "\nYou tried to parse Sass with the standard CSS parser; try again with the postcss-sass parser";
          } else if (/\.less$/i.test(opts.from)) {
            e2.message += "\nYou tried to parse Less with the standard CSS parser; try again with the postcss-less parser";
          }
        }
      }
      throw e2;
    }
    return parser2.root;
  }
  var parse_1$1 = parse$3$1;
  parse$3$1.default = parse$3$1;
  Container$2$1.registerParse(parse$3$1);
  var { isClean: isClean$3, my: my$3 } = symbols$1;
  var MapGenerator$1$1 = mapGenerator$1;
  var stringify$2$1 = stringify_1$1;
  var Container$1$1 = container$1;
  var Document$2$1 = document$1$1;
  var warnOnce$1$1 = warnOnce$2$1;
  var Result$2$1 = result$1;
  var parse$2$1 = parse_1$1;
  var Root$3$1 = root$1;
  var TYPE_TO_CLASS_NAME$1 = {
    atrule: "AtRule",
    comment: "Comment",
    decl: "Declaration",
    document: "Document",
    root: "Root",
    rule: "Rule"
  };
  var PLUGIN_PROPS$1 = {
    AtRule: true,
    AtRuleExit: true,
    Comment: true,
    CommentExit: true,
    Declaration: true,
    DeclarationExit: true,
    Document: true,
    DocumentExit: true,
    Once: true,
    OnceExit: true,
    postcssPlugin: true,
    prepare: true,
    Root: true,
    RootExit: true,
    Rule: true,
    RuleExit: true
  };
  var NOT_VISITORS$1 = {
    Once: true,
    postcssPlugin: true,
    prepare: true
  };
  var CHILDREN$1 = 0;
  function isPromise$1(obj) {
    return typeof obj === "object" && typeof obj.then === "function";
  }
  function getEvents$1(node2) {
    let key = false;
    let type = TYPE_TO_CLASS_NAME$1[node2.type];
    if (node2.type === "decl") {
      key = node2.prop.toLowerCase();
    } else if (node2.type === "atrule") {
      key = node2.name.toLowerCase();
    }
    if (key && node2.append) {
      return [
        type,
        type + "-" + key,
        CHILDREN$1,
        type + "Exit",
        type + "Exit-" + key
      ];
    } else if (key) {
      return [type, type + "-" + key, type + "Exit", type + "Exit-" + key];
    } else if (node2.append) {
      return [type, CHILDREN$1, type + "Exit"];
    } else {
      return [type, type + "Exit"];
    }
  }
  function toStack$1(node2) {
    let events;
    if (node2.type === "document") {
      events = ["Document", CHILDREN$1, "DocumentExit"];
    } else if (node2.type === "root") {
      events = ["Root", CHILDREN$1, "RootExit"];
    } else {
      events = getEvents$1(node2);
    }
    return {
      eventIndex: 0,
      events,
      iterator: 0,
      node: node2,
      visitorIndex: 0,
      visitors: []
    };
  }
  function cleanMarks$1(node2) {
    node2[isClean$3] = false;
    if (node2.nodes) node2.nodes.forEach((i2) => cleanMarks$1(i2));
    return node2;
  }
  var postcss$2$1 = {};
  var LazyResult$2$1 = class LazyResult {
    constructor(processor2, css, opts) {
      this.stringified = false;
      this.processed = false;
      let root2;
      if (typeof css === "object" && css !== null && (css.type === "root" || css.type === "document")) {
        root2 = cleanMarks$1(css);
      } else if (css instanceof LazyResult || css instanceof Result$2$1) {
        root2 = cleanMarks$1(css.root);
        if (css.map) {
          if (typeof opts.map === "undefined") opts.map = {};
          if (!opts.map.inline) opts.map.inline = false;
          opts.map.prev = css.map;
        }
      } else {
        let parser2 = parse$2$1;
        if (opts.syntax) parser2 = opts.syntax.parse;
        if (opts.parser) parser2 = opts.parser;
        if (parser2.parse) parser2 = parser2.parse;
        try {
          root2 = parser2(css, opts);
        } catch (error) {
          this.processed = true;
          this.error = error;
        }
        if (root2 && !root2[my$3]) {
          Container$1$1.rebuild(root2);
        }
      }
      this.result = new Result$2$1(processor2, root2, opts);
      this.helpers = { ...postcss$2$1, postcss: postcss$2$1, result: this.result };
      this.plugins = this.processor.plugins.map((plugin22) => {
        if (typeof plugin22 === "object" && plugin22.prepare) {
          return { ...plugin22, ...plugin22.prepare(this.result) };
        } else {
          return plugin22;
        }
      });
    }
    async() {
      if (this.error) return Promise.reject(this.error);
      if (this.processed) return Promise.resolve(this.result);
      if (!this.processing) {
        this.processing = this.runAsync();
      }
      return this.processing;
    }
    catch(onRejected) {
      return this.async().catch(onRejected);
    }
    finally(onFinally) {
      return this.async().then(onFinally, onFinally);
    }
    getAsyncError() {
      throw new Error("Use process(css).then(cb) to work with async plugins");
    }
    handleError(error, node2) {
      let plugin22 = this.result.lastPlugin;
      try {
        if (node2) node2.addToError(error);
        this.error = error;
        if (error.name === "CssSyntaxError" && !error.plugin) {
          error.plugin = plugin22.postcssPlugin;
          error.setMessage();
        } else if (plugin22.postcssVersion) {
          if (true) {
            let pluginName = plugin22.postcssPlugin;
            let pluginVer = plugin22.postcssVersion;
            let runtimeVer = this.result.processor.version;
            let a2 = pluginVer.split(".");
            let b = runtimeVer.split(".");
            if (a2[0] !== b[0] || parseInt(a2[1]) > parseInt(b[1])) {
              console.error(
                "Unknown error from PostCSS plugin. Your current PostCSS version is " + runtimeVer + ", but " + pluginName + " uses " + pluginVer + ". Perhaps this is the source of the error below."
              );
            }
          }
        }
      } catch (err) {
        if (console && console.error) console.error(err);
      }
      return error;
    }
    prepareVisitors() {
      this.listeners = {};
      let add = (plugin22, type, cb) => {
        if (!this.listeners[type]) this.listeners[type] = [];
        this.listeners[type].push([plugin22, cb]);
      };
      for (let plugin22 of this.plugins) {
        if (typeof plugin22 === "object") {
          for (let event in plugin22) {
            if (!PLUGIN_PROPS$1[event] && /^[A-Z]/.test(event)) {
              throw new Error(
                `Unknown event ${event} in ${plugin22.postcssPlugin}. Try to update PostCSS (${this.processor.version} now).`
              );
            }
            if (!NOT_VISITORS$1[event]) {
              if (typeof plugin22[event] === "object") {
                for (let filter in plugin22[event]) {
                  if (filter === "*") {
                    add(plugin22, event, plugin22[event][filter]);
                  } else {
                    add(
                      plugin22,
                      event + "-" + filter.toLowerCase(),
                      plugin22[event][filter]
                    );
                  }
                }
              } else if (typeof plugin22[event] === "function") {
                add(plugin22, event, plugin22[event]);
              }
            }
          }
        }
      }
      this.hasListener = Object.keys(this.listeners).length > 0;
    }
    async runAsync() {
      this.plugin = 0;
      for (let i2 = 0; i2 < this.plugins.length; i2++) {
        let plugin22 = this.plugins[i2];
        let promise = this.runOnRoot(plugin22);
        if (isPromise$1(promise)) {
          try {
            await promise;
          } catch (error) {
            throw this.handleError(error);
          }
        }
      }
      this.prepareVisitors();
      if (this.hasListener) {
        let root2 = this.result.root;
        while (!root2[isClean$3]) {
          root2[isClean$3] = true;
          let stack = [toStack$1(root2)];
          while (stack.length > 0) {
            let promise = this.visitTick(stack);
            if (isPromise$1(promise)) {
              try {
                await promise;
              } catch (e2) {
                let node2 = stack[stack.length - 1].node;
                throw this.handleError(e2, node2);
              }
            }
          }
        }
        if (this.listeners.OnceExit) {
          for (let [plugin22, visitor] of this.listeners.OnceExit) {
            this.result.lastPlugin = plugin22;
            try {
              if (root2.type === "document") {
                let roots = root2.nodes.map(
                  (subRoot) => visitor(subRoot, this.helpers)
                );
                await Promise.all(roots);
              } else {
                await visitor(root2, this.helpers);
              }
            } catch (e2) {
              throw this.handleError(e2);
            }
          }
        }
      }
      this.processed = true;
      return this.stringify();
    }
    runOnRoot(plugin22) {
      this.result.lastPlugin = plugin22;
      try {
        if (typeof plugin22 === "object" && plugin22.Once) {
          if (this.result.root.type === "document") {
            let roots = this.result.root.nodes.map(
              (root2) => plugin22.Once(root2, this.helpers)
            );
            if (isPromise$1(roots[0])) {
              return Promise.all(roots);
            }
            return roots;
          }
          return plugin22.Once(this.result.root, this.helpers);
        } else if (typeof plugin22 === "function") {
          return plugin22(this.result.root, this.result);
        }
      } catch (error) {
        throw this.handleError(error);
      }
    }
    stringify() {
      if (this.error) throw this.error;
      if (this.stringified) return this.result;
      this.stringified = true;
      this.sync();
      let opts = this.result.opts;
      let str = stringify$2$1;
      if (opts.syntax) str = opts.syntax.stringify;
      if (opts.stringifier) str = opts.stringifier;
      if (str.stringify) str = str.stringify;
      let map = new MapGenerator$1$1(str, this.result.root, this.result.opts);
      let data = map.generate();
      this.result.css = data[0];
      this.result.map = data[1];
      return this.result;
    }
    sync() {
      if (this.error) throw this.error;
      if (this.processed) return this.result;
      this.processed = true;
      if (this.processing) {
        throw this.getAsyncError();
      }
      for (let plugin22 of this.plugins) {
        let promise = this.runOnRoot(plugin22);
        if (isPromise$1(promise)) {
          throw this.getAsyncError();
        }
      }
      this.prepareVisitors();
      if (this.hasListener) {
        let root2 = this.result.root;
        while (!root2[isClean$3]) {
          root2[isClean$3] = true;
          this.walkSync(root2);
        }
        if (this.listeners.OnceExit) {
          if (root2.type === "document") {
            for (let subRoot of root2.nodes) {
              this.visitSync(this.listeners.OnceExit, subRoot);
            }
          } else {
            this.visitSync(this.listeners.OnceExit, root2);
          }
        }
      }
      return this.result;
    }
    then(onFulfilled, onRejected) {
      if (true) {
        if (!("from" in this.opts)) {
          warnOnce$1$1(
            "Without `from` option PostCSS could generate wrong source map and will not find Browserslist config. Set it to CSS file path or to `undefined` to prevent this warning."
          );
        }
      }
      return this.async().then(onFulfilled, onRejected);
    }
    toString() {
      return this.css;
    }
    visitSync(visitors, node2) {
      for (let [plugin22, visitor] of visitors) {
        this.result.lastPlugin = plugin22;
        let promise;
        try {
          promise = visitor(node2, this.helpers);
        } catch (e2) {
          throw this.handleError(e2, node2.proxyOf);
        }
        if (node2.type !== "root" && node2.type !== "document" && !node2.parent) {
          return true;
        }
        if (isPromise$1(promise)) {
          throw this.getAsyncError();
        }
      }
    }
    visitTick(stack) {
      let visit2 = stack[stack.length - 1];
      let { node: node2, visitors } = visit2;
      if (node2.type !== "root" && node2.type !== "document" && !node2.parent) {
        stack.pop();
        return;
      }
      if (visitors.length > 0 && visit2.visitorIndex < visitors.length) {
        let [plugin22, visitor] = visitors[visit2.visitorIndex];
        visit2.visitorIndex += 1;
        if (visit2.visitorIndex === visitors.length) {
          visit2.visitors = [];
          visit2.visitorIndex = 0;
        }
        this.result.lastPlugin = plugin22;
        try {
          return visitor(node2.toProxy(), this.helpers);
        } catch (e2) {
          throw this.handleError(e2, node2);
        }
      }
      if (visit2.iterator !== 0) {
        let iterator = visit2.iterator;
        let child;
        while (child = node2.nodes[node2.indexes[iterator]]) {
          node2.indexes[iterator] += 1;
          if (!child[isClean$3]) {
            child[isClean$3] = true;
            stack.push(toStack$1(child));
            return;
          }
        }
        visit2.iterator = 0;
        delete node2.indexes[iterator];
      }
      let events = visit2.events;
      while (visit2.eventIndex < events.length) {
        let event = events[visit2.eventIndex];
        visit2.eventIndex += 1;
        if (event === CHILDREN$1) {
          if (node2.nodes && node2.nodes.length) {
            node2[isClean$3] = true;
            visit2.iterator = node2.getIterator();
          }
          return;
        } else if (this.listeners[event]) {
          visit2.visitors = this.listeners[event];
          return;
        }
      }
      stack.pop();
    }
    walkSync(node2) {
      node2[isClean$3] = true;
      let events = getEvents$1(node2);
      for (let event of events) {
        if (event === CHILDREN$1) {
          if (node2.nodes) {
            node2.each((child) => {
              if (!child[isClean$3]) this.walkSync(child);
            });
          }
        } else {
          let visitors = this.listeners[event];
          if (visitors) {
            if (this.visitSync(visitors, node2.toProxy())) return;
          }
        }
      }
    }
    warnings() {
      return this.sync().warnings();
    }
    get content() {
      return this.stringify().content;
    }
    get css() {
      return this.stringify().css;
    }
    get map() {
      return this.stringify().map;
    }
    get messages() {
      return this.sync().messages;
    }
    get opts() {
      return this.result.opts;
    }
    get processor() {
      return this.result.processor;
    }
    get root() {
      return this.sync().root;
    }
    get [Symbol.toStringTag]() {
      return "LazyResult";
    }
  };
  LazyResult$2$1.registerPostcss = (dependant) => {
    postcss$2$1 = dependant;
  };
  var lazyResult$1 = LazyResult$2$1;
  LazyResult$2$1.default = LazyResult$2$1;
  Root$3$1.registerLazyResult(LazyResult$2$1);
  Document$2$1.registerLazyResult(LazyResult$2$1);
  var MapGenerator2$1 = mapGenerator$1;
  var stringify$1$1 = stringify_1$1;
  var warnOnce2$1 = warnOnce$2$1;
  var parse$1$1 = parse_1$1;
  var Result$1$1 = result$1;
  var NoWorkResult$1$1 = class NoWorkResult {
    constructor(processor2, css, opts) {
      css = css.toString();
      this.stringified = false;
      this._processor = processor2;
      this._css = css;
      this._opts = opts;
      this._map = void 0;
      let root2;
      let str = stringify$1$1;
      this.result = new Result$1$1(this._processor, root2, this._opts);
      this.result.css = css;
      let self = this;
      Object.defineProperty(this.result, "root", {
        get() {
          return self.root;
        }
      });
      let map = new MapGenerator2$1(str, root2, this._opts, css);
      if (map.isMap()) {
        let [generatedCSS, generatedMap] = map.generate();
        if (generatedCSS) {
          this.result.css = generatedCSS;
        }
        if (generatedMap) {
          this.result.map = generatedMap;
        }
      } else {
        map.clearAnnotation();
        this.result.css = map.css;
      }
    }
    async() {
      if (this.error) return Promise.reject(this.error);
      return Promise.resolve(this.result);
    }
    catch(onRejected) {
      return this.async().catch(onRejected);
    }
    finally(onFinally) {
      return this.async().then(onFinally, onFinally);
    }
    sync() {
      if (this.error) throw this.error;
      return this.result;
    }
    then(onFulfilled, onRejected) {
      if (true) {
        if (!("from" in this._opts)) {
          warnOnce2$1(
            "Without `from` option PostCSS could generate wrong source map and will not find Browserslist config. Set it to CSS file path or to `undefined` to prevent this warning."
          );
        }
      }
      return this.async().then(onFulfilled, onRejected);
    }
    toString() {
      return this._css;
    }
    warnings() {
      return [];
    }
    get content() {
      return this.result.css;
    }
    get css() {
      return this.result.css;
    }
    get map() {
      return this.result.map;
    }
    get messages() {
      return [];
    }
    get opts() {
      return this.result.opts;
    }
    get processor() {
      return this.result.processor;
    }
    get root() {
      if (this._root) {
        return this._root;
      }
      let root2;
      let parser2 = parse$1$1;
      try {
        root2 = parser2(this._css, this._opts);
      } catch (error) {
        this.error = error;
      }
      if (this.error) {
        throw this.error;
      } else {
        this._root = root2;
        return root2;
      }
    }
    get [Symbol.toStringTag]() {
      return "NoWorkResult";
    }
  };
  var noWorkResult$1 = NoWorkResult$1$1;
  NoWorkResult$1$1.default = NoWorkResult$1$1;
  var NoWorkResult2$1 = noWorkResult$1;
  var LazyResult$1$1 = lazyResult$1;
  var Document$1$1 = document$1$1;
  var Root$2$1 = root$1;
  var Processor$1$1 = class Processor {
    constructor(plugins = []) {
      this.version = "8.4.38";
      this.plugins = this.normalize(plugins);
    }
    normalize(plugins) {
      let normalized = [];
      for (let i2 of plugins) {
        if (i2.postcss === true) {
          i2 = i2();
        } else if (i2.postcss) {
          i2 = i2.postcss;
        }
        if (typeof i2 === "object" && Array.isArray(i2.plugins)) {
          normalized = normalized.concat(i2.plugins);
        } else if (typeof i2 === "object" && i2.postcssPlugin) {
          normalized.push(i2);
        } else if (typeof i2 === "function") {
          normalized.push(i2);
        } else if (typeof i2 === "object" && (i2.parse || i2.stringify)) {
          if (true) {
            throw new Error(
              "PostCSS syntaxes cannot be used as plugins. Instead, please use one of the syntax/parser/stringifier options as outlined in your PostCSS runner documentation."
            );
          }
        } else {
          throw new Error(i2 + " is not a PostCSS plugin");
        }
      }
      return normalized;
    }
    process(css, opts = {}) {
      if (!this.plugins.length && !opts.parser && !opts.stringifier && !opts.syntax) {
        return new NoWorkResult2$1(this, css, opts);
      } else {
        return new LazyResult$1$1(this, css, opts);
      }
    }
    use(plugin22) {
      this.plugins = this.plugins.concat(this.normalize([plugin22]));
      return this;
    }
  };
  var processor$1 = Processor$1$1;
  Processor$1$1.default = Processor$1$1;
  Root$2$1.registerProcessor(Processor$1$1);
  Document$1$1.registerProcessor(Processor$1$1);
  var Declaration$1$1 = declaration$1;
  var PreviousMap2$1 = previousMap$1;
  var Comment$1$1 = comment$1;
  var AtRule$1$1 = atRule$1;
  var Input$1$1 = input$1;
  var Root$1$1 = root$1;
  var Rule$1$1 = rule$1;
  function fromJSON$1$1(json, inputs) {
    if (Array.isArray(json)) return json.map((n2) => fromJSON$1$1(n2));
    let { inputs: ownInputs, ...defaults } = json;
    if (ownInputs) {
      inputs = [];
      for (let input2 of ownInputs) {
        let inputHydrated = { ...input2, __proto__: Input$1$1.prototype };
        if (inputHydrated.map) {
          inputHydrated.map = {
            ...inputHydrated.map,
            __proto__: PreviousMap2$1.prototype
          };
        }
        inputs.push(inputHydrated);
      }
    }
    if (defaults.nodes) {
      defaults.nodes = json.nodes.map((n2) => fromJSON$1$1(n2, inputs));
    }
    if (defaults.source) {
      let { inputId, ...source } = defaults.source;
      defaults.source = source;
      if (inputId != null) {
        defaults.source.input = inputs[inputId];
      }
    }
    if (defaults.type === "root") {
      return new Root$1$1(defaults);
    } else if (defaults.type === "decl") {
      return new Declaration$1$1(defaults);
    } else if (defaults.type === "rule") {
      return new Rule$1$1(defaults);
    } else if (defaults.type === "comment") {
      return new Comment$1$1(defaults);
    } else if (defaults.type === "atrule") {
      return new AtRule$1$1(defaults);
    } else {
      throw new Error("Unknown node type: " + json.type);
    }
  }
  var fromJSON_1$1 = fromJSON$1$1;
  fromJSON$1$1.default = fromJSON$1$1;
  var CssSyntaxError2$1 = cssSyntaxError$1;
  var Declaration2$1 = declaration$1;
  var LazyResult2$1 = lazyResult$1;
  var Container2$1 = container$1;
  var Processor2$1 = processor$1;
  var stringify$5 = stringify_1$1;
  var fromJSON$2 = fromJSON_1$1;
  var Document22 = document$1$1;
  var Warning2$1 = warning$1;
  var Comment2$1 = comment$1;
  var AtRule2$1 = atRule$1;
  var Result2$1 = result$1;
  var Input2$1 = input$1;
  var parse$5 = parse_1$1;
  var list$3 = list_1$1;
  var Rule2$1 = rule$1;
  var Root2$1 = root$1;
  var Node2$1 = node$1;
  function postcss$3(...plugins) {
    if (plugins.length === 1 && Array.isArray(plugins[0])) {
      plugins = plugins[0];
    }
    return new Processor2$1(plugins);
  }
  postcss$3.plugin = function plugin(name, initializer) {
    let warningPrinted = false;
    function creator(...args) {
      if (console && console.warn && !warningPrinted) {
        warningPrinted = true;
        console.warn(
          name + ": postcss.plugin was deprecated. Migration guide:\nhttps://evilmartians.com/chronicles/postcss-8-plugin-migration"
        );
        if (process.env.LANG && process.env.LANG.startsWith("cn")) {
          console.warn(
            name + ": \u91CC\u9762 postcss.plugin \u88AB\u5F03\u7528. \u8FC1\u79FB\u6307\u5357:\nhttps://www.w3ctech.com/topic/2226"
          );
        }
      }
      let transformer = initializer(...args);
      transformer.postcssPlugin = name;
      transformer.postcssVersion = new Processor2$1().version;
      return transformer;
    }
    let cache;
    Object.defineProperty(creator, "postcss", {
      get() {
        if (!cache) cache = creator();
        return cache;
      }
    });
    creator.process = function(css, processOpts, pluginOpts) {
      return postcss$3([creator(pluginOpts)]).process(css, processOpts);
    };
    return creator;
  };
  postcss$3.stringify = stringify$5;
  postcss$3.parse = parse$5;
  postcss$3.fromJSON = fromJSON$2;
  postcss$3.list = list$3;
  postcss$3.comment = (defaults) => new Comment2$1(defaults);
  postcss$3.atRule = (defaults) => new AtRule2$1(defaults);
  postcss$3.decl = (defaults) => new Declaration2$1(defaults);
  postcss$3.rule = (defaults) => new Rule2$1(defaults);
  postcss$3.root = (defaults) => new Root2$1(defaults);
  postcss$3.document = (defaults) => new Document22(defaults);
  postcss$3.CssSyntaxError = CssSyntaxError2$1;
  postcss$3.Declaration = Declaration2$1;
  postcss$3.Container = Container2$1;
  postcss$3.Processor = Processor2$1;
  postcss$3.Document = Document22;
  postcss$3.Comment = Comment2$1;
  postcss$3.Warning = Warning2$1;
  postcss$3.AtRule = AtRule2$1;
  postcss$3.Result = Result2$1;
  postcss$3.Input = Input2$1;
  postcss$3.Rule = Rule2$1;
  postcss$3.Root = Root2$1;
  postcss$3.Node = Node2$1;
  LazyResult2$1.registerPostcss(postcss$3);
  var postcss_1$1 = postcss$3;
  postcss$3.default = postcss$3;
  var postcss$1$1 = /* @__PURE__ */ getDefaultExportFromCjs$1(postcss_1$1);
  postcss$1$1.stringify;
  postcss$1$1.fromJSON;
  postcss$1$1.plugin;
  postcss$1$1.parse;
  postcss$1$1.list;
  postcss$1$1.document;
  postcss$1$1.comment;
  postcss$1$1.atRule;
  postcss$1$1.rule;
  postcss$1$1.decl;
  postcss$1$1.root;
  postcss$1$1.CssSyntaxError;
  postcss$1$1.Declaration;
  postcss$1$1.Container;
  postcss$1$1.Processor;
  postcss$1$1.Document;
  postcss$1$1.Comment;
  postcss$1$1.Warning;
  postcss$1$1.AtRule;
  postcss$1$1.Result;
  postcss$1$1.Input;
  postcss$1$1.Rule;
  postcss$1$1.Root;
  postcss$1$1.Node;
  var __defProp22 = Object.defineProperty;
  var __defNormalProp22 = (obj, key, value) => key in obj ? __defProp22(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField22 = (obj, key, value) => __defNormalProp22(obj, typeof key !== "symbol" ? key + "" : key, value);
  function getDefaultExportFromCjs(x2) {
    return x2 && x2.__esModule && Object.prototype.hasOwnProperty.call(x2, "default") ? x2["default"] : x2;
  }
  function getAugmentedNamespace(n2) {
    if (n2.__esModule) return n2;
    var f2 = n2.default;
    if (typeof f2 == "function") {
      var a2 = function a22() {
        if (this instanceof a22) {
          return Reflect.construct(f2, arguments, this.constructor);
        }
        return f2.apply(this, arguments);
      };
      a2.prototype = f2.prototype;
    } else a2 = {};
    Object.defineProperty(a2, "__esModule", { value: true });
    Object.keys(n2).forEach(function(k) {
      var d = Object.getOwnPropertyDescriptor(n2, k);
      Object.defineProperty(a2, k, d.get ? d : {
        enumerable: true,
        get: function() {
          return n2[k];
        }
      });
    });
    return a2;
  }
  var picocolors_browser = { exports: {} };
  var x = String;
  var create = function() {
    return { isColorSupported: false, reset: x, bold: x, dim: x, italic: x, underline: x, inverse: x, hidden: x, strikethrough: x, black: x, red: x, green: x, yellow: x, blue: x, magenta: x, cyan: x, white: x, gray: x, bgBlack: x, bgRed: x, bgGreen: x, bgYellow: x, bgBlue: x, bgMagenta: x, bgCyan: x, bgWhite: x };
  };
  picocolors_browser.exports = create();
  picocolors_browser.exports.createColors = create;
  var picocolors_browserExports = picocolors_browser.exports;
  var __viteBrowserExternal = {};
  var __viteBrowserExternal$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: __viteBrowserExternal
  }, Symbol.toStringTag, { value: "Module" }));
  var require$$2 = /* @__PURE__ */ getAugmentedNamespace(__viteBrowserExternal$1);
  var pico = picocolors_browserExports;
  var terminalHighlight$1 = require$$2;
  var CssSyntaxError$3 = class CssSyntaxError2 extends Error {
    constructor(message, line, column, source, file, plugin22) {
      super(message);
      this.name = "CssSyntaxError";
      this.reason = message;
      if (file) {
        this.file = file;
      }
      if (source) {
        this.source = source;
      }
      if (plugin22) {
        this.plugin = plugin22;
      }
      if (typeof line !== "undefined" && typeof column !== "undefined") {
        if (typeof line === "number") {
          this.line = line;
          this.column = column;
        } else {
          this.line = line.line;
          this.column = line.column;
          this.endLine = column.line;
          this.endColumn = column.column;
        }
      }
      this.setMessage();
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, CssSyntaxError2);
      }
    }
    setMessage() {
      this.message = this.plugin ? this.plugin + ": " : "";
      this.message += this.file ? this.file : "<css input>";
      if (typeof this.line !== "undefined") {
        this.message += ":" + this.line + ":" + this.column;
      }
      this.message += ": " + this.reason;
    }
    showSourceCode(color) {
      if (!this.source) return "";
      let css = this.source;
      if (color == null) color = pico.isColorSupported;
      if (terminalHighlight$1) {
        if (color) css = terminalHighlight$1(css);
      }
      let lines = css.split(/\r?\n/);
      let start2 = Math.max(this.line - 3, 0);
      let end = Math.min(this.line + 2, lines.length);
      let maxWidth = String(end).length;
      let mark, aside;
      if (color) {
        let { bold, gray, red } = pico.createColors(true);
        mark = (text) => bold(red(text));
        aside = (text) => gray(text);
      } else {
        mark = aside = (str) => str;
      }
      return lines.slice(start2, end).map((line, index2) => {
        let number = start2 + 1 + index2;
        let gutter = " " + (" " + number).slice(-maxWidth) + " | ";
        if (number === this.line) {
          let spacing = aside(gutter.replace(/\d/g, " ")) + line.slice(0, this.column - 1).replace(/[^\t]/g, " ");
          return mark(">") + aside(gutter) + line + "\n " + spacing + mark("^");
        }
        return " " + aside(gutter) + line;
      }).join("\n");
    }
    toString() {
      let code = this.showSourceCode();
      if (code) {
        code = "\n\n" + code + "\n";
      }
      return this.name + ": " + this.message + code;
    }
  };
  var cssSyntaxError = CssSyntaxError$3;
  CssSyntaxError$3.default = CssSyntaxError$3;
  var symbols = {};
  symbols.isClean = Symbol("isClean");
  symbols.my = Symbol("my");
  var DEFAULT_RAW = {
    after: "\n",
    beforeClose: "\n",
    beforeComment: "\n",
    beforeDecl: "\n",
    beforeOpen: " ",
    beforeRule: "\n",
    colon: ": ",
    commentLeft: " ",
    commentRight: " ",
    emptyBody: "",
    indent: "    ",
    semicolon: false
  };
  function capitalize(str) {
    return str[0].toUpperCase() + str.slice(1);
  }
  var Stringifier$2 = class Stringifier2 {
    constructor(builder) {
      this.builder = builder;
    }
    atrule(node2, semicolon) {
      let name = "@" + node2.name;
      let params = node2.params ? this.rawValue(node2, "params") : "";
      if (typeof node2.raws.afterName !== "undefined") {
        name += node2.raws.afterName;
      } else if (params) {
        name += " ";
      }
      if (node2.nodes) {
        this.block(node2, name + params);
      } else {
        let end = (node2.raws.between || "") + (semicolon ? ";" : "");
        this.builder(name + params + end, node2);
      }
    }
    beforeAfter(node2, detect) {
      let value;
      if (node2.type === "decl") {
        value = this.raw(node2, null, "beforeDecl");
      } else if (node2.type === "comment") {
        value = this.raw(node2, null, "beforeComment");
      } else if (detect === "before") {
        value = this.raw(node2, null, "beforeRule");
      } else {
        value = this.raw(node2, null, "beforeClose");
      }
      let buf = node2.parent;
      let depth = 0;
      while (buf && buf.type !== "root") {
        depth += 1;
        buf = buf.parent;
      }
      if (value.includes("\n")) {
        let indent = this.raw(node2, null, "indent");
        if (indent.length) {
          for (let step = 0; step < depth; step++) value += indent;
        }
      }
      return value;
    }
    block(node2, start2) {
      let between = this.raw(node2, "between", "beforeOpen");
      this.builder(start2 + between + "{", node2, "start");
      let after;
      if (node2.nodes && node2.nodes.length) {
        this.body(node2);
        after = this.raw(node2, "after");
      } else {
        after = this.raw(node2, "after", "emptyBody");
      }
      if (after) this.builder(after);
      this.builder("}", node2, "end");
    }
    body(node2) {
      let last = node2.nodes.length - 1;
      while (last > 0) {
        if (node2.nodes[last].type !== "comment") break;
        last -= 1;
      }
      let semicolon = this.raw(node2, "semicolon");
      for (let i2 = 0; i2 < node2.nodes.length; i2++) {
        let child = node2.nodes[i2];
        let before = this.raw(child, "before");
        if (before) this.builder(before);
        this.stringify(child, last !== i2 || semicolon);
      }
    }
    comment(node2) {
      let left = this.raw(node2, "left", "commentLeft");
      let right = this.raw(node2, "right", "commentRight");
      this.builder("/*" + left + node2.text + right + "*/", node2);
    }
    decl(node2, semicolon) {
      let between = this.raw(node2, "between", "colon");
      let string = node2.prop + between + this.rawValue(node2, "value");
      if (node2.important) {
        string += node2.raws.important || " !important";
      }
      if (semicolon) string += ";";
      this.builder(string, node2);
    }
    document(node2) {
      this.body(node2);
    }
    raw(node2, own, detect) {
      let value;
      if (!detect) detect = own;
      if (own) {
        value = node2.raws[own];
        if (typeof value !== "undefined") return value;
      }
      let parent = node2.parent;
      if (detect === "before") {
        if (!parent || parent.type === "root" && parent.first === node2) {
          return "";
        }
        if (parent && parent.type === "document") {
          return "";
        }
      }
      if (!parent) return DEFAULT_RAW[detect];
      let root2 = node2.root();
      if (!root2.rawCache) root2.rawCache = {};
      if (typeof root2.rawCache[detect] !== "undefined") {
        return root2.rawCache[detect];
      }
      if (detect === "before" || detect === "after") {
        return this.beforeAfter(node2, detect);
      } else {
        let method = "raw" + capitalize(detect);
        if (this[method]) {
          value = this[method](root2, node2);
        } else {
          root2.walk((i2) => {
            value = i2.raws[own];
            if (typeof value !== "undefined") return false;
          });
        }
      }
      if (typeof value === "undefined") value = DEFAULT_RAW[detect];
      root2.rawCache[detect] = value;
      return value;
    }
    rawBeforeClose(root2) {
      let value;
      root2.walk((i2) => {
        if (i2.nodes && i2.nodes.length > 0) {
          if (typeof i2.raws.after !== "undefined") {
            value = i2.raws.after;
            if (value.includes("\n")) {
              value = value.replace(/[^\n]+$/, "");
            }
            return false;
          }
        }
      });
      if (value) value = value.replace(/\S/g, "");
      return value;
    }
    rawBeforeComment(root2, node2) {
      let value;
      root2.walkComments((i2) => {
        if (typeof i2.raws.before !== "undefined") {
          value = i2.raws.before;
          if (value.includes("\n")) {
            value = value.replace(/[^\n]+$/, "");
          }
          return false;
        }
      });
      if (typeof value === "undefined") {
        value = this.raw(node2, null, "beforeDecl");
      } else if (value) {
        value = value.replace(/\S/g, "");
      }
      return value;
    }
    rawBeforeDecl(root2, node2) {
      let value;
      root2.walkDecls((i2) => {
        if (typeof i2.raws.before !== "undefined") {
          value = i2.raws.before;
          if (value.includes("\n")) {
            value = value.replace(/[^\n]+$/, "");
          }
          return false;
        }
      });
      if (typeof value === "undefined") {
        value = this.raw(node2, null, "beforeRule");
      } else if (value) {
        value = value.replace(/\S/g, "");
      }
      return value;
    }
    rawBeforeOpen(root2) {
      let value;
      root2.walk((i2) => {
        if (i2.type !== "decl") {
          value = i2.raws.between;
          if (typeof value !== "undefined") return false;
        }
      });
      return value;
    }
    rawBeforeRule(root2) {
      let value;
      root2.walk((i2) => {
        if (i2.nodes && (i2.parent !== root2 || root2.first !== i2)) {
          if (typeof i2.raws.before !== "undefined") {
            value = i2.raws.before;
            if (value.includes("\n")) {
              value = value.replace(/[^\n]+$/, "");
            }
            return false;
          }
        }
      });
      if (value) value = value.replace(/\S/g, "");
      return value;
    }
    rawColon(root2) {
      let value;
      root2.walkDecls((i2) => {
        if (typeof i2.raws.between !== "undefined") {
          value = i2.raws.between.replace(/[^\s:]/g, "");
          return false;
        }
      });
      return value;
    }
    rawEmptyBody(root2) {
      let value;
      root2.walk((i2) => {
        if (i2.nodes && i2.nodes.length === 0) {
          value = i2.raws.after;
          if (typeof value !== "undefined") return false;
        }
      });
      return value;
    }
    rawIndent(root2) {
      if (root2.raws.indent) return root2.raws.indent;
      let value;
      root2.walk((i2) => {
        let p = i2.parent;
        if (p && p !== root2 && p.parent && p.parent === root2) {
          if (typeof i2.raws.before !== "undefined") {
            let parts = i2.raws.before.split("\n");
            value = parts[parts.length - 1];
            value = value.replace(/\S/g, "");
            return false;
          }
        }
      });
      return value;
    }
    rawSemicolon(root2) {
      let value;
      root2.walk((i2) => {
        if (i2.nodes && i2.nodes.length && i2.last.type === "decl") {
          value = i2.raws.semicolon;
          if (typeof value !== "undefined") return false;
        }
      });
      return value;
    }
    rawValue(node2, prop) {
      let value = node2[prop];
      let raw = node2.raws[prop];
      if (raw && raw.value === value) {
        return raw.raw;
      }
      return value;
    }
    root(node2) {
      this.body(node2);
      if (node2.raws.after) this.builder(node2.raws.after);
    }
    rule(node2) {
      this.block(node2, this.rawValue(node2, "selector"));
      if (node2.raws.ownSemicolon) {
        this.builder(node2.raws.ownSemicolon, node2, "end");
      }
    }
    stringify(node2, semicolon) {
      if (!this[node2.type]) {
        throw new Error(
          "Unknown AST node type " + node2.type + ". Maybe you need to change PostCSS stringifier."
        );
      }
      this[node2.type](node2, semicolon);
    }
  };
  var stringifier = Stringifier$2;
  Stringifier$2.default = Stringifier$2;
  var Stringifier$1 = stringifier;
  function stringify$4(node2, builder) {
    let str = new Stringifier$1(builder);
    str.stringify(node2);
  }
  var stringify_1 = stringify$4;
  stringify$4.default = stringify$4;
  var { isClean: isClean$2, my: my$2 } = symbols;
  var CssSyntaxError$2 = cssSyntaxError;
  var Stringifier22 = stringifier;
  var stringify$3 = stringify_1;
  function cloneNode(obj, parent) {
    let cloned = new obj.constructor();
    for (let i2 in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, i2)) {
        continue;
      }
      if (i2 === "proxyCache") continue;
      let value = obj[i2];
      let type = typeof value;
      if (i2 === "parent" && type === "object") {
        if (parent) cloned[i2] = parent;
      } else if (i2 === "source") {
        cloned[i2] = value;
      } else if (Array.isArray(value)) {
        cloned[i2] = value.map((j) => cloneNode(j, cloned));
      } else {
        if (type === "object" && value !== null) value = cloneNode(value);
        cloned[i2] = value;
      }
    }
    return cloned;
  }
  var Node$4 = class Node3 {
    constructor(defaults = {}) {
      this.raws = {};
      this[isClean$2] = false;
      this[my$2] = true;
      for (let name in defaults) {
        if (name === "nodes") {
          this.nodes = [];
          for (let node2 of defaults[name]) {
            if (typeof node2.clone === "function") {
              this.append(node2.clone());
            } else {
              this.append(node2);
            }
          }
        } else {
          this[name] = defaults[name];
        }
      }
    }
    addToError(error) {
      error.postcssNode = this;
      if (error.stack && this.source && /\n\s{4}at /.test(error.stack)) {
        let s2 = this.source;
        error.stack = error.stack.replace(
          /\n\s{4}at /,
          `$&${s2.input.from}:${s2.start.line}:${s2.start.column}$&`
        );
      }
      return error;
    }
    after(add) {
      this.parent.insertAfter(this, add);
      return this;
    }
    assign(overrides = {}) {
      for (let name in overrides) {
        this[name] = overrides[name];
      }
      return this;
    }
    before(add) {
      this.parent.insertBefore(this, add);
      return this;
    }
    cleanRaws(keepBetween) {
      delete this.raws.before;
      delete this.raws.after;
      if (!keepBetween) delete this.raws.between;
    }
    clone(overrides = {}) {
      let cloned = cloneNode(this);
      for (let name in overrides) {
        cloned[name] = overrides[name];
      }
      return cloned;
    }
    cloneAfter(overrides = {}) {
      let cloned = this.clone(overrides);
      this.parent.insertAfter(this, cloned);
      return cloned;
    }
    cloneBefore(overrides = {}) {
      let cloned = this.clone(overrides);
      this.parent.insertBefore(this, cloned);
      return cloned;
    }
    error(message, opts = {}) {
      if (this.source) {
        let { end, start: start2 } = this.rangeBy(opts);
        return this.source.input.error(
          message,
          { column: start2.column, line: start2.line },
          { column: end.column, line: end.line },
          opts
        );
      }
      return new CssSyntaxError$2(message);
    }
    getProxyProcessor() {
      return {
        get(node2, prop) {
          if (prop === "proxyOf") {
            return node2;
          } else if (prop === "root") {
            return () => node2.root().toProxy();
          } else {
            return node2[prop];
          }
        },
        set(node2, prop, value) {
          if (node2[prop] === value) return true;
          node2[prop] = value;
          if (prop === "prop" || prop === "value" || prop === "name" || prop === "params" || prop === "important" || /* c8 ignore next */
          prop === "text") {
            node2.markDirty();
          }
          return true;
        }
      };
    }
    markDirty() {
      if (this[isClean$2]) {
        this[isClean$2] = false;
        let next = this;
        while (next = next.parent) {
          next[isClean$2] = false;
        }
      }
    }
    next() {
      if (!this.parent) return void 0;
      let index2 = this.parent.index(this);
      return this.parent.nodes[index2 + 1];
    }
    positionBy(opts, stringRepresentation) {
      let pos = this.source.start;
      if (opts.index) {
        pos = this.positionInside(opts.index, stringRepresentation);
      } else if (opts.word) {
        stringRepresentation = this.toString();
        let index2 = stringRepresentation.indexOf(opts.word);
        if (index2 !== -1) pos = this.positionInside(index2, stringRepresentation);
      }
      return pos;
    }
    positionInside(index2, stringRepresentation) {
      let string = stringRepresentation || this.toString();
      let column = this.source.start.column;
      let line = this.source.start.line;
      for (let i2 = 0; i2 < index2; i2++) {
        if (string[i2] === "\n") {
          column = 1;
          line += 1;
        } else {
          column += 1;
        }
      }
      return { column, line };
    }
    prev() {
      if (!this.parent) return void 0;
      let index2 = this.parent.index(this);
      return this.parent.nodes[index2 - 1];
    }
    rangeBy(opts) {
      let start2 = {
        column: this.source.start.column,
        line: this.source.start.line
      };
      let end = this.source.end ? {
        column: this.source.end.column + 1,
        line: this.source.end.line
      } : {
        column: start2.column + 1,
        line: start2.line
      };
      if (opts.word) {
        let stringRepresentation = this.toString();
        let index2 = stringRepresentation.indexOf(opts.word);
        if (index2 !== -1) {
          start2 = this.positionInside(index2, stringRepresentation);
          end = this.positionInside(index2 + opts.word.length, stringRepresentation);
        }
      } else {
        if (opts.start) {
          start2 = {
            column: opts.start.column,
            line: opts.start.line
          };
        } else if (opts.index) {
          start2 = this.positionInside(opts.index);
        }
        if (opts.end) {
          end = {
            column: opts.end.column,
            line: opts.end.line
          };
        } else if (typeof opts.endIndex === "number") {
          end = this.positionInside(opts.endIndex);
        } else if (opts.index) {
          end = this.positionInside(opts.index + 1);
        }
      }
      if (end.line < start2.line || end.line === start2.line && end.column <= start2.column) {
        end = { column: start2.column + 1, line: start2.line };
      }
      return { end, start: start2 };
    }
    raw(prop, defaultType) {
      let str = new Stringifier22();
      return str.raw(this, prop, defaultType);
    }
    remove() {
      if (this.parent) {
        this.parent.removeChild(this);
      }
      this.parent = void 0;
      return this;
    }
    replaceWith(...nodes) {
      if (this.parent) {
        let bookmark = this;
        let foundSelf = false;
        for (let node2 of nodes) {
          if (node2 === this) {
            foundSelf = true;
          } else if (foundSelf) {
            this.parent.insertAfter(bookmark, node2);
            bookmark = node2;
          } else {
            this.parent.insertBefore(bookmark, node2);
          }
        }
        if (!foundSelf) {
          this.remove();
        }
      }
      return this;
    }
    root() {
      let result2 = this;
      while (result2.parent && result2.parent.type !== "document") {
        result2 = result2.parent;
      }
      return result2;
    }
    toJSON(_, inputs) {
      let fixed = {};
      let emitInputs = inputs == null;
      inputs = inputs || /* @__PURE__ */ new Map();
      let inputsNextIndex = 0;
      for (let name in this) {
        if (!Object.prototype.hasOwnProperty.call(this, name)) {
          continue;
        }
        if (name === "parent" || name === "proxyCache") continue;
        let value = this[name];
        if (Array.isArray(value)) {
          fixed[name] = value.map((i2) => {
            if (typeof i2 === "object" && i2.toJSON) {
              return i2.toJSON(null, inputs);
            } else {
              return i2;
            }
          });
        } else if (typeof value === "object" && value.toJSON) {
          fixed[name] = value.toJSON(null, inputs);
        } else if (name === "source") {
          let inputId = inputs.get(value.input);
          if (inputId == null) {
            inputId = inputsNextIndex;
            inputs.set(value.input, inputsNextIndex);
            inputsNextIndex++;
          }
          fixed[name] = {
            end: value.end,
            inputId,
            start: value.start
          };
        } else {
          fixed[name] = value;
        }
      }
      if (emitInputs) {
        fixed.inputs = [...inputs.keys()].map((input2) => input2.toJSON());
      }
      return fixed;
    }
    toProxy() {
      if (!this.proxyCache) {
        this.proxyCache = new Proxy(this, this.getProxyProcessor());
      }
      return this.proxyCache;
    }
    toString(stringifier2 = stringify$3) {
      if (stringifier2.stringify) stringifier2 = stringifier2.stringify;
      let result2 = "";
      stringifier2(this, (i2) => {
        result2 += i2;
      });
      return result2;
    }
    warn(result2, text, opts) {
      let data = { node: this };
      for (let i2 in opts) data[i2] = opts[i2];
      return result2.warn(text, data);
    }
    get proxyOf() {
      return this;
    }
  };
  var node = Node$4;
  Node$4.default = Node$4;
  var Node$3 = node;
  var Declaration$4 = class Declaration2 extends Node$3 {
    constructor(defaults) {
      if (defaults && typeof defaults.value !== "undefined" && typeof defaults.value !== "string") {
        defaults = { ...defaults, value: String(defaults.value) };
      }
      super(defaults);
      this.type = "decl";
    }
    get variable() {
      return this.prop.startsWith("--") || this.prop[0] === "$";
    }
  };
  var declaration = Declaration$4;
  Declaration$4.default = Declaration$4;
  var urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
  var customAlphabet = (alphabet, defaultSize = 21) => {
    return (size = defaultSize) => {
      let id = "";
      let i2 = size;
      while (i2--) {
        id += alphabet[Math.random() * alphabet.length | 0];
      }
      return id;
    };
  };
  var nanoid$1 = (size = 21) => {
    let id = "";
    let i2 = size;
    while (i2--) {
      id += urlAlphabet[Math.random() * 64 | 0];
    }
    return id;
  };
  var nonSecure = { nanoid: nanoid$1, customAlphabet };
  var { SourceMapConsumer: SourceMapConsumer$2, SourceMapGenerator: SourceMapGenerator$2 } = require$$2;
  var { existsSync, readFileSync } = require$$2;
  var { dirname: dirname$1, join } = require$$2;
  function fromBase64(str) {
    if (Buffer) {
      return Buffer.from(str, "base64").toString();
    } else {
      return window.atob(str);
    }
  }
  var PreviousMap$2 = class PreviousMap2 {
    constructor(css, opts) {
      if (opts.map === false) return;
      this.loadAnnotation(css);
      this.inline = this.startWith(this.annotation, "data:");
      let prev = opts.map ? opts.map.prev : void 0;
      let text = this.loadMap(opts.from, prev);
      if (!this.mapFile && opts.from) {
        this.mapFile = opts.from;
      }
      if (this.mapFile) this.root = dirname$1(this.mapFile);
      if (text) this.text = text;
    }
    consumer() {
      if (!this.consumerCache) {
        this.consumerCache = new SourceMapConsumer$2(this.text);
      }
      return this.consumerCache;
    }
    decodeInline(text) {
      let baseCharsetUri = /^data:application\/json;charset=utf-?8;base64,/;
      let baseUri = /^data:application\/json;base64,/;
      let charsetUri = /^data:application\/json;charset=utf-?8,/;
      let uri = /^data:application\/json,/;
      if (charsetUri.test(text) || uri.test(text)) {
        return decodeURIComponent(text.substr(RegExp.lastMatch.length));
      }
      if (baseCharsetUri.test(text) || baseUri.test(text)) {
        return fromBase64(text.substr(RegExp.lastMatch.length));
      }
      let encoding = text.match(/data:application\/json;([^,]+),/)[1];
      throw new Error("Unsupported source map encoding " + encoding);
    }
    getAnnotationURL(sourceMapString) {
      return sourceMapString.replace(/^\/\*\s*# sourceMappingURL=/, "").trim();
    }
    isMap(map) {
      if (typeof map !== "object") return false;
      return typeof map.mappings === "string" || typeof map._mappings === "string" || Array.isArray(map.sections);
    }
    loadAnnotation(css) {
      let comments = css.match(/\/\*\s*# sourceMappingURL=/gm);
      if (!comments) return;
      let start2 = css.lastIndexOf(comments.pop());
      let end = css.indexOf("*/", start2);
      if (start2 > -1 && end > -1) {
        this.annotation = this.getAnnotationURL(css.substring(start2, end));
      }
    }
    loadFile(path) {
      this.root = dirname$1(path);
      if (existsSync(path)) {
        this.mapFile = path;
        return readFileSync(path, "utf-8").toString().trim();
      }
    }
    loadMap(file, prev) {
      if (prev === false) return false;
      if (prev) {
        if (typeof prev === "string") {
          return prev;
        } else if (typeof prev === "function") {
          let prevPath = prev(file);
          if (prevPath) {
            let map = this.loadFile(prevPath);
            if (!map) {
              throw new Error(
                "Unable to load previous source map: " + prevPath.toString()
              );
            }
            return map;
          }
        } else if (prev instanceof SourceMapConsumer$2) {
          return SourceMapGenerator$2.fromSourceMap(prev).toString();
        } else if (prev instanceof SourceMapGenerator$2) {
          return prev.toString();
        } else if (this.isMap(prev)) {
          return JSON.stringify(prev);
        } else {
          throw new Error(
            "Unsupported previous source map format: " + prev.toString()
          );
        }
      } else if (this.inline) {
        return this.decodeInline(this.annotation);
      } else if (this.annotation) {
        let map = this.annotation;
        if (file) map = join(dirname$1(file), map);
        return this.loadFile(map);
      }
    }
    startWith(string, start2) {
      if (!string) return false;
      return string.substr(0, start2.length) === start2;
    }
    withContent() {
      return !!(this.consumer().sourcesContent && this.consumer().sourcesContent.length > 0);
    }
  };
  var previousMap = PreviousMap$2;
  PreviousMap$2.default = PreviousMap$2;
  var { SourceMapConsumer: SourceMapConsumer$1, SourceMapGenerator: SourceMapGenerator$1 } = require$$2;
  var { fileURLToPath, pathToFileURL: pathToFileURL$1 } = require$$2;
  var { isAbsolute, resolve: resolve$1 } = require$$2;
  var { nanoid } = nonSecure;
  var terminalHighlight = require$$2;
  var CssSyntaxError$1 = cssSyntaxError;
  var PreviousMap$1 = previousMap;
  var fromOffsetCache = Symbol("fromOffsetCache");
  var sourceMapAvailable$1 = Boolean(SourceMapConsumer$1 && SourceMapGenerator$1);
  var pathAvailable$1 = Boolean(resolve$1 && isAbsolute);
  var Input$4 = class Input2 {
    constructor(css, opts = {}) {
      if (css === null || typeof css === "undefined" || typeof css === "object" && !css.toString) {
        throw new Error(`PostCSS received ${css} instead of CSS string`);
      }
      this.css = css.toString();
      if (this.css[0] === "\uFEFF" || this.css[0] === "\uFFFE") {
        this.hasBOM = true;
        this.css = this.css.slice(1);
      } else {
        this.hasBOM = false;
      }
      if (opts.from) {
        if (!pathAvailable$1 || /^\w+:\/\//.test(opts.from) || isAbsolute(opts.from)) {
          this.file = opts.from;
        } else {
          this.file = resolve$1(opts.from);
        }
      }
      if (pathAvailable$1 && sourceMapAvailable$1) {
        let map = new PreviousMap$1(this.css, opts);
        if (map.text) {
          this.map = map;
          let file = map.consumer().file;
          if (!this.file && file) this.file = this.mapResolve(file);
        }
      }
      if (!this.file) {
        this.id = "<input css " + nanoid(6) + ">";
      }
      if (this.map) this.map.file = this.from;
    }
    error(message, line, column, opts = {}) {
      let result2, endLine, endColumn;
      if (line && typeof line === "object") {
        let start2 = line;
        let end = column;
        if (typeof start2.offset === "number") {
          let pos = this.fromOffset(start2.offset);
          line = pos.line;
          column = pos.col;
        } else {
          line = start2.line;
          column = start2.column;
        }
        if (typeof end.offset === "number") {
          let pos = this.fromOffset(end.offset);
          endLine = pos.line;
          endColumn = pos.col;
        } else {
          endLine = end.line;
          endColumn = end.column;
        }
      } else if (!column) {
        let pos = this.fromOffset(line);
        line = pos.line;
        column = pos.col;
      }
      let origin = this.origin(line, column, endLine, endColumn);
      if (origin) {
        result2 = new CssSyntaxError$1(
          message,
          origin.endLine === void 0 ? origin.line : { column: origin.column, line: origin.line },
          origin.endLine === void 0 ? origin.column : { column: origin.endColumn, line: origin.endLine },
          origin.source,
          origin.file,
          opts.plugin
        );
      } else {
        result2 = new CssSyntaxError$1(
          message,
          endLine === void 0 ? line : { column, line },
          endLine === void 0 ? column : { column: endColumn, line: endLine },
          this.css,
          this.file,
          opts.plugin
        );
      }
      result2.input = { column, endColumn, endLine, line, source: this.css };
      if (this.file) {
        if (pathToFileURL$1) {
          result2.input.url = pathToFileURL$1(this.file).toString();
        }
        result2.input.file = this.file;
      }
      return result2;
    }
    fromOffset(offset) {
      let lastLine, lineToIndex;
      if (!this[fromOffsetCache]) {
        let lines = this.css.split("\n");
        lineToIndex = new Array(lines.length);
        let prevIndex = 0;
        for (let i2 = 0, l2 = lines.length; i2 < l2; i2++) {
          lineToIndex[i2] = prevIndex;
          prevIndex += lines[i2].length + 1;
        }
        this[fromOffsetCache] = lineToIndex;
      } else {
        lineToIndex = this[fromOffsetCache];
      }
      lastLine = lineToIndex[lineToIndex.length - 1];
      let min = 0;
      if (offset >= lastLine) {
        min = lineToIndex.length - 1;
      } else {
        let max = lineToIndex.length - 2;
        let mid;
        while (min < max) {
          mid = min + (max - min >> 1);
          if (offset < lineToIndex[mid]) {
            max = mid - 1;
          } else if (offset >= lineToIndex[mid + 1]) {
            min = mid + 1;
          } else {
            min = mid;
            break;
          }
        }
      }
      return {
        col: offset - lineToIndex[min] + 1,
        line: min + 1
      };
    }
    mapResolve(file) {
      if (/^\w+:\/\//.test(file)) {
        return file;
      }
      return resolve$1(this.map.consumer().sourceRoot || this.map.root || ".", file);
    }
    origin(line, column, endLine, endColumn) {
      if (!this.map) return false;
      let consumer = this.map.consumer();
      let from = consumer.originalPositionFor({ column, line });
      if (!from.source) return false;
      let to;
      if (typeof endLine === "number") {
        to = consumer.originalPositionFor({ column: endColumn, line: endLine });
      }
      let fromUrl;
      if (isAbsolute(from.source)) {
        fromUrl = pathToFileURL$1(from.source);
      } else {
        fromUrl = new URL(
          from.source,
          this.map.consumer().sourceRoot || pathToFileURL$1(this.map.mapFile)
        );
      }
      let result2 = {
        column: from.column,
        endColumn: to && to.column,
        endLine: to && to.line,
        line: from.line,
        url: fromUrl.toString()
      };
      if (fromUrl.protocol === "file:") {
        if (fileURLToPath) {
          result2.file = fileURLToPath(fromUrl);
        } else {
          throw new Error(`file: protocol is not available in this PostCSS build`);
        }
      }
      let source = consumer.sourceContentFor(from.source);
      if (source) result2.source = source;
      return result2;
    }
    toJSON() {
      let json = {};
      for (let name of ["hasBOM", "css", "file", "id"]) {
        if (this[name] != null) {
          json[name] = this[name];
        }
      }
      if (this.map) {
        json.map = { ...this.map };
        if (json.map.consumerCache) {
          json.map.consumerCache = void 0;
        }
      }
      return json;
    }
    get from() {
      return this.file || this.id;
    }
  };
  var input = Input$4;
  Input$4.default = Input$4;
  if (terminalHighlight && terminalHighlight.registerInput) {
    terminalHighlight.registerInput(Input$4);
  }
  var { SourceMapConsumer, SourceMapGenerator } = require$$2;
  var { dirname, relative, resolve, sep } = require$$2;
  var { pathToFileURL } = require$$2;
  var Input$3 = input;
  var sourceMapAvailable = Boolean(SourceMapConsumer && SourceMapGenerator);
  var pathAvailable = Boolean(dirname && resolve && relative && sep);
  var MapGenerator$2 = class MapGenerator2 {
    constructor(stringify2, root2, opts, cssString) {
      this.stringify = stringify2;
      this.mapOpts = opts.map || {};
      this.root = root2;
      this.opts = opts;
      this.css = cssString;
      this.originalCSS = cssString;
      this.usesFileUrls = !this.mapOpts.from && this.mapOpts.absolute;
      this.memoizedFileURLs = /* @__PURE__ */ new Map();
      this.memoizedPaths = /* @__PURE__ */ new Map();
      this.memoizedURLs = /* @__PURE__ */ new Map();
    }
    addAnnotation() {
      let content;
      if (this.isInline()) {
        content = "data:application/json;base64," + this.toBase64(this.map.toString());
      } else if (typeof this.mapOpts.annotation === "string") {
        content = this.mapOpts.annotation;
      } else if (typeof this.mapOpts.annotation === "function") {
        content = this.mapOpts.annotation(this.opts.to, this.root);
      } else {
        content = this.outputFile() + ".map";
      }
      let eol = "\n";
      if (this.css.includes("\r\n")) eol = "\r\n";
      this.css += eol + "/*# sourceMappingURL=" + content + " */";
    }
    applyPrevMaps() {
      for (let prev of this.previous()) {
        let from = this.toUrl(this.path(prev.file));
        let root2 = prev.root || dirname(prev.file);
        let map;
        if (this.mapOpts.sourcesContent === false) {
          map = new SourceMapConsumer(prev.text);
          if (map.sourcesContent) {
            map.sourcesContent = null;
          }
        } else {
          map = prev.consumer();
        }
        this.map.applySourceMap(map, from, this.toUrl(this.path(root2)));
      }
    }
    clearAnnotation() {
      if (this.mapOpts.annotation === false) return;
      if (this.root) {
        let node2;
        for (let i2 = this.root.nodes.length - 1; i2 >= 0; i2--) {
          node2 = this.root.nodes[i2];
          if (node2.type !== "comment") continue;
          if (node2.text.indexOf("# sourceMappingURL=") === 0) {
            this.root.removeChild(i2);
          }
        }
      } else if (this.css) {
        this.css = this.css.replace(/\n*?\/\*#[\S\s]*?\*\/$/gm, "");
      }
    }
    generate() {
      this.clearAnnotation();
      if (pathAvailable && sourceMapAvailable && this.isMap()) {
        return this.generateMap();
      } else {
        let result2 = "";
        this.stringify(this.root, (i2) => {
          result2 += i2;
        });
        return [result2];
      }
    }
    generateMap() {
      if (this.root) {
        this.generateString();
      } else if (this.previous().length === 1) {
        let prev = this.previous()[0].consumer();
        prev.file = this.outputFile();
        this.map = SourceMapGenerator.fromSourceMap(prev, {
          ignoreInvalidMapping: true
        });
      } else {
        this.map = new SourceMapGenerator({
          file: this.outputFile(),
          ignoreInvalidMapping: true
        });
        this.map.addMapping({
          generated: { column: 0, line: 1 },
          original: { column: 0, line: 1 },
          source: this.opts.from ? this.toUrl(this.path(this.opts.from)) : "<no source>"
        });
      }
      if (this.isSourcesContent()) this.setSourcesContent();
      if (this.root && this.previous().length > 0) this.applyPrevMaps();
      if (this.isAnnotation()) this.addAnnotation();
      if (this.isInline()) {
        return [this.css];
      } else {
        return [this.css, this.map];
      }
    }
    generateString() {
      this.css = "";
      this.map = new SourceMapGenerator({
        file: this.outputFile(),
        ignoreInvalidMapping: true
      });
      let line = 1;
      let column = 1;
      let noSource = "<no source>";
      let mapping = {
        generated: { column: 0, line: 0 },
        original: { column: 0, line: 0 },
        source: ""
      };
      let lines, last;
      this.stringify(this.root, (str, node2, type) => {
        this.css += str;
        if (node2 && type !== "end") {
          mapping.generated.line = line;
          mapping.generated.column = column - 1;
          if (node2.source && node2.source.start) {
            mapping.source = this.sourcePath(node2);
            mapping.original.line = node2.source.start.line;
            mapping.original.column = node2.source.start.column - 1;
            this.map.addMapping(mapping);
          } else {
            mapping.source = noSource;
            mapping.original.line = 1;
            mapping.original.column = 0;
            this.map.addMapping(mapping);
          }
        }
        lines = str.match(/\n/g);
        if (lines) {
          line += lines.length;
          last = str.lastIndexOf("\n");
          column = str.length - last;
        } else {
          column += str.length;
        }
        if (node2 && type !== "start") {
          let p = node2.parent || { raws: {} };
          let childless = node2.type === "decl" || node2.type === "atrule" && !node2.nodes;
          if (!childless || node2 !== p.last || p.raws.semicolon) {
            if (node2.source && node2.source.end) {
              mapping.source = this.sourcePath(node2);
              mapping.original.line = node2.source.end.line;
              mapping.original.column = node2.source.end.column - 1;
              mapping.generated.line = line;
              mapping.generated.column = column - 2;
              this.map.addMapping(mapping);
            } else {
              mapping.source = noSource;
              mapping.original.line = 1;
              mapping.original.column = 0;
              mapping.generated.line = line;
              mapping.generated.column = column - 1;
              this.map.addMapping(mapping);
            }
          }
        }
      });
    }
    isAnnotation() {
      if (this.isInline()) {
        return true;
      }
      if (typeof this.mapOpts.annotation !== "undefined") {
        return this.mapOpts.annotation;
      }
      if (this.previous().length) {
        return this.previous().some((i2) => i2.annotation);
      }
      return true;
    }
    isInline() {
      if (typeof this.mapOpts.inline !== "undefined") {
        return this.mapOpts.inline;
      }
      let annotation = this.mapOpts.annotation;
      if (typeof annotation !== "undefined" && annotation !== true) {
        return false;
      }
      if (this.previous().length) {
        return this.previous().some((i2) => i2.inline);
      }
      return true;
    }
    isMap() {
      if (typeof this.opts.map !== "undefined") {
        return !!this.opts.map;
      }
      return this.previous().length > 0;
    }
    isSourcesContent() {
      if (typeof this.mapOpts.sourcesContent !== "undefined") {
        return this.mapOpts.sourcesContent;
      }
      if (this.previous().length) {
        return this.previous().some((i2) => i2.withContent());
      }
      return true;
    }
    outputFile() {
      if (this.opts.to) {
        return this.path(this.opts.to);
      } else if (this.opts.from) {
        return this.path(this.opts.from);
      } else {
        return "to.css";
      }
    }
    path(file) {
      if (this.mapOpts.absolute) return file;
      if (file.charCodeAt(0) === 60) return file;
      if (/^\w+:\/\//.test(file)) return file;
      let cached = this.memoizedPaths.get(file);
      if (cached) return cached;
      let from = this.opts.to ? dirname(this.opts.to) : ".";
      if (typeof this.mapOpts.annotation === "string") {
        from = dirname(resolve(from, this.mapOpts.annotation));
      }
      let path = relative(from, file);
      this.memoizedPaths.set(file, path);
      return path;
    }
    previous() {
      if (!this.previousMaps) {
        this.previousMaps = [];
        if (this.root) {
          this.root.walk((node2) => {
            if (node2.source && node2.source.input.map) {
              let map = node2.source.input.map;
              if (!this.previousMaps.includes(map)) {
                this.previousMaps.push(map);
              }
            }
          });
        } else {
          let input2 = new Input$3(this.originalCSS, this.opts);
          if (input2.map) this.previousMaps.push(input2.map);
        }
      }
      return this.previousMaps;
    }
    setSourcesContent() {
      let already = {};
      if (this.root) {
        this.root.walk((node2) => {
          if (node2.source) {
            let from = node2.source.input.from;
            if (from && !already[from]) {
              already[from] = true;
              let fromUrl = this.usesFileUrls ? this.toFileUrl(from) : this.toUrl(this.path(from));
              this.map.setSourceContent(fromUrl, node2.source.input.css);
            }
          }
        });
      } else if (this.css) {
        let from = this.opts.from ? this.toUrl(this.path(this.opts.from)) : "<no source>";
        this.map.setSourceContent(from, this.css);
      }
    }
    sourcePath(node2) {
      if (this.mapOpts.from) {
        return this.toUrl(this.mapOpts.from);
      } else if (this.usesFileUrls) {
        return this.toFileUrl(node2.source.input.from);
      } else {
        return this.toUrl(this.path(node2.source.input.from));
      }
    }
    toBase64(str) {
      if (Buffer) {
        return Buffer.from(str).toString("base64");
      } else {
        return window.btoa(unescape(encodeURIComponent(str)));
      }
    }
    toFileUrl(path) {
      let cached = this.memoizedFileURLs.get(path);
      if (cached) return cached;
      if (pathToFileURL) {
        let fileURL = pathToFileURL(path).toString();
        this.memoizedFileURLs.set(path, fileURL);
        return fileURL;
      } else {
        throw new Error(
          "`map.absolute` option is not available in this PostCSS build"
        );
      }
    }
    toUrl(path) {
      let cached = this.memoizedURLs.get(path);
      if (cached) return cached;
      if (sep === "\\") {
        path = path.replace(/\\/g, "/");
      }
      let url = encodeURI(path).replace(/[#?]/g, encodeURIComponent);
      this.memoizedURLs.set(path, url);
      return url;
    }
  };
  var mapGenerator = MapGenerator$2;
  var Node$2 = node;
  var Comment$4 = class Comment2 extends Node$2 {
    constructor(defaults) {
      super(defaults);
      this.type = "comment";
    }
  };
  var comment = Comment$4;
  Comment$4.default = Comment$4;
  var { isClean: isClean$1, my: my$1 } = symbols;
  var Declaration$3 = declaration;
  var Comment$3 = comment;
  var Node$1 = node;
  var parse$4;
  var Rule$4;
  var AtRule$4;
  var Root$6;
  function cleanSource(nodes) {
    return nodes.map((i2) => {
      if (i2.nodes) i2.nodes = cleanSource(i2.nodes);
      delete i2.source;
      return i2;
    });
  }
  function markDirtyUp(node2) {
    node2[isClean$1] = false;
    if (node2.proxyOf.nodes) {
      for (let i2 of node2.proxyOf.nodes) {
        markDirtyUp(i2);
      }
    }
  }
  var Container$7 = class Container2 extends Node$1 {
    append(...children) {
      for (let child of children) {
        let nodes = this.normalize(child, this.last);
        for (let node2 of nodes) this.proxyOf.nodes.push(node2);
      }
      this.markDirty();
      return this;
    }
    cleanRaws(keepBetween) {
      super.cleanRaws(keepBetween);
      if (this.nodes) {
        for (let node2 of this.nodes) node2.cleanRaws(keepBetween);
      }
    }
    each(callback) {
      if (!this.proxyOf.nodes) return void 0;
      let iterator = this.getIterator();
      let index2, result2;
      while (this.indexes[iterator] < this.proxyOf.nodes.length) {
        index2 = this.indexes[iterator];
        result2 = callback(this.proxyOf.nodes[index2], index2);
        if (result2 === false) break;
        this.indexes[iterator] += 1;
      }
      delete this.indexes[iterator];
      return result2;
    }
    every(condition) {
      return this.nodes.every(condition);
    }
    getIterator() {
      if (!this.lastEach) this.lastEach = 0;
      if (!this.indexes) this.indexes = {};
      this.lastEach += 1;
      let iterator = this.lastEach;
      this.indexes[iterator] = 0;
      return iterator;
    }
    getProxyProcessor() {
      return {
        get(node2, prop) {
          if (prop === "proxyOf") {
            return node2;
          } else if (!node2[prop]) {
            return node2[prop];
          } else if (prop === "each" || typeof prop === "string" && prop.startsWith("walk")) {
            return (...args) => {
              return node2[prop](
                ...args.map((i2) => {
                  if (typeof i2 === "function") {
                    return (child, index2) => i2(child.toProxy(), index2);
                  } else {
                    return i2;
                  }
                })
              );
            };
          } else if (prop === "every" || prop === "some") {
            return (cb) => {
              return node2[prop](
                (child, ...other) => cb(child.toProxy(), ...other)
              );
            };
          } else if (prop === "root") {
            return () => node2.root().toProxy();
          } else if (prop === "nodes") {
            return node2.nodes.map((i2) => i2.toProxy());
          } else if (prop === "first" || prop === "last") {
            return node2[prop].toProxy();
          } else {
            return node2[prop];
          }
        },
        set(node2, prop, value) {
          if (node2[prop] === value) return true;
          node2[prop] = value;
          if (prop === "name" || prop === "params" || prop === "selector") {
            node2.markDirty();
          }
          return true;
        }
      };
    }
    index(child) {
      if (typeof child === "number") return child;
      if (child.proxyOf) child = child.proxyOf;
      return this.proxyOf.nodes.indexOf(child);
    }
    insertAfter(exist, add) {
      let existIndex = this.index(exist);
      let nodes = this.normalize(add, this.proxyOf.nodes[existIndex]).reverse();
      existIndex = this.index(exist);
      for (let node2 of nodes) this.proxyOf.nodes.splice(existIndex + 1, 0, node2);
      let index2;
      for (let id in this.indexes) {
        index2 = this.indexes[id];
        if (existIndex < index2) {
          this.indexes[id] = index2 + nodes.length;
        }
      }
      this.markDirty();
      return this;
    }
    insertBefore(exist, add) {
      let existIndex = this.index(exist);
      let type = existIndex === 0 ? "prepend" : false;
      let nodes = this.normalize(add, this.proxyOf.nodes[existIndex], type).reverse();
      existIndex = this.index(exist);
      for (let node2 of nodes) this.proxyOf.nodes.splice(existIndex, 0, node2);
      let index2;
      for (let id in this.indexes) {
        index2 = this.indexes[id];
        if (existIndex <= index2) {
          this.indexes[id] = index2 + nodes.length;
        }
      }
      this.markDirty();
      return this;
    }
    normalize(nodes, sample) {
      if (typeof nodes === "string") {
        nodes = cleanSource(parse$4(nodes).nodes);
      } else if (typeof nodes === "undefined") {
        nodes = [];
      } else if (Array.isArray(nodes)) {
        nodes = nodes.slice(0);
        for (let i2 of nodes) {
          if (i2.parent) i2.parent.removeChild(i2, "ignore");
        }
      } else if (nodes.type === "root" && this.type !== "document") {
        nodes = nodes.nodes.slice(0);
        for (let i2 of nodes) {
          if (i2.parent) i2.parent.removeChild(i2, "ignore");
        }
      } else if (nodes.type) {
        nodes = [nodes];
      } else if (nodes.prop) {
        if (typeof nodes.value === "undefined") {
          throw new Error("Value field is missed in node creation");
        } else if (typeof nodes.value !== "string") {
          nodes.value = String(nodes.value);
        }
        nodes = [new Declaration$3(nodes)];
      } else if (nodes.selector) {
        nodes = [new Rule$4(nodes)];
      } else if (nodes.name) {
        nodes = [new AtRule$4(nodes)];
      } else if (nodes.text) {
        nodes = [new Comment$3(nodes)];
      } else {
        throw new Error("Unknown node type in node creation");
      }
      let processed = nodes.map((i2) => {
        if (!i2[my$1]) Container2.rebuild(i2);
        i2 = i2.proxyOf;
        if (i2.parent) i2.parent.removeChild(i2);
        if (i2[isClean$1]) markDirtyUp(i2);
        if (typeof i2.raws.before === "undefined") {
          if (sample && typeof sample.raws.before !== "undefined") {
            i2.raws.before = sample.raws.before.replace(/\S/g, "");
          }
        }
        i2.parent = this.proxyOf;
        return i2;
      });
      return processed;
    }
    prepend(...children) {
      children = children.reverse();
      for (let child of children) {
        let nodes = this.normalize(child, this.first, "prepend").reverse();
        for (let node2 of nodes) this.proxyOf.nodes.unshift(node2);
        for (let id in this.indexes) {
          this.indexes[id] = this.indexes[id] + nodes.length;
        }
      }
      this.markDirty();
      return this;
    }
    push(child) {
      child.parent = this;
      this.proxyOf.nodes.push(child);
      return this;
    }
    removeAll() {
      for (let node2 of this.proxyOf.nodes) node2.parent = void 0;
      this.proxyOf.nodes = [];
      this.markDirty();
      return this;
    }
    removeChild(child) {
      child = this.index(child);
      this.proxyOf.nodes[child].parent = void 0;
      this.proxyOf.nodes.splice(child, 1);
      let index2;
      for (let id in this.indexes) {
        index2 = this.indexes[id];
        if (index2 >= child) {
          this.indexes[id] = index2 - 1;
        }
      }
      this.markDirty();
      return this;
    }
    replaceValues(pattern, opts, callback) {
      if (!callback) {
        callback = opts;
        opts = {};
      }
      this.walkDecls((decl) => {
        if (opts.props && !opts.props.includes(decl.prop)) return;
        if (opts.fast && !decl.value.includes(opts.fast)) return;
        decl.value = decl.value.replace(pattern, callback);
      });
      this.markDirty();
      return this;
    }
    some(condition) {
      return this.nodes.some(condition);
    }
    walk(callback) {
      return this.each((child, i2) => {
        let result2;
        try {
          result2 = callback(child, i2);
        } catch (e2) {
          throw child.addToError(e2);
        }
        if (result2 !== false && child.walk) {
          result2 = child.walk(callback);
        }
        return result2;
      });
    }
    walkAtRules(name, callback) {
      if (!callback) {
        callback = name;
        return this.walk((child, i2) => {
          if (child.type === "atrule") {
            return callback(child, i2);
          }
        });
      }
      if (name instanceof RegExp) {
        return this.walk((child, i2) => {
          if (child.type === "atrule" && name.test(child.name)) {
            return callback(child, i2);
          }
        });
      }
      return this.walk((child, i2) => {
        if (child.type === "atrule" && child.name === name) {
          return callback(child, i2);
        }
      });
    }
    walkComments(callback) {
      return this.walk((child, i2) => {
        if (child.type === "comment") {
          return callback(child, i2);
        }
      });
    }
    walkDecls(prop, callback) {
      if (!callback) {
        callback = prop;
        return this.walk((child, i2) => {
          if (child.type === "decl") {
            return callback(child, i2);
          }
        });
      }
      if (prop instanceof RegExp) {
        return this.walk((child, i2) => {
          if (child.type === "decl" && prop.test(child.prop)) {
            return callback(child, i2);
          }
        });
      }
      return this.walk((child, i2) => {
        if (child.type === "decl" && child.prop === prop) {
          return callback(child, i2);
        }
      });
    }
    walkRules(selector, callback) {
      if (!callback) {
        callback = selector;
        return this.walk((child, i2) => {
          if (child.type === "rule") {
            return callback(child, i2);
          }
        });
      }
      if (selector instanceof RegExp) {
        return this.walk((child, i2) => {
          if (child.type === "rule" && selector.test(child.selector)) {
            return callback(child, i2);
          }
        });
      }
      return this.walk((child, i2) => {
        if (child.type === "rule" && child.selector === selector) {
          return callback(child, i2);
        }
      });
    }
    get first() {
      if (!this.proxyOf.nodes) return void 0;
      return this.proxyOf.nodes[0];
    }
    get last() {
      if (!this.proxyOf.nodes) return void 0;
      return this.proxyOf.nodes[this.proxyOf.nodes.length - 1];
    }
  };
  Container$7.registerParse = (dependant) => {
    parse$4 = dependant;
  };
  Container$7.registerRule = (dependant) => {
    Rule$4 = dependant;
  };
  Container$7.registerAtRule = (dependant) => {
    AtRule$4 = dependant;
  };
  Container$7.registerRoot = (dependant) => {
    Root$6 = dependant;
  };
  var container = Container$7;
  Container$7.default = Container$7;
  Container$7.rebuild = (node2) => {
    if (node2.type === "atrule") {
      Object.setPrototypeOf(node2, AtRule$4.prototype);
    } else if (node2.type === "rule") {
      Object.setPrototypeOf(node2, Rule$4.prototype);
    } else if (node2.type === "decl") {
      Object.setPrototypeOf(node2, Declaration$3.prototype);
    } else if (node2.type === "comment") {
      Object.setPrototypeOf(node2, Comment$3.prototype);
    } else if (node2.type === "root") {
      Object.setPrototypeOf(node2, Root$6.prototype);
    }
    node2[my$1] = true;
    if (node2.nodes) {
      node2.nodes.forEach((child) => {
        Container$7.rebuild(child);
      });
    }
  };
  var Container$6 = container;
  var LazyResult$4;
  var Processor$3;
  var Document$3 = class Document23 extends Container$6 {
    constructor(defaults) {
      super({ type: "document", ...defaults });
      if (!this.nodes) {
        this.nodes = [];
      }
    }
    toResult(opts = {}) {
      let lazy = new LazyResult$4(new Processor$3(), this, opts);
      return lazy.stringify();
    }
  };
  Document$3.registerLazyResult = (dependant) => {
    LazyResult$4 = dependant;
  };
  Document$3.registerProcessor = (dependant) => {
    Processor$3 = dependant;
  };
  var document$1 = Document$3;
  Document$3.default = Document$3;
  var printed = {};
  var warnOnce$2 = function warnOnce2(message) {
    if (printed[message]) return;
    printed[message] = true;
    if (typeof console !== "undefined" && console.warn) {
      console.warn(message);
    }
  };
  var Warning$2 = class Warning2 {
    constructor(text, opts = {}) {
      this.type = "warning";
      this.text = text;
      if (opts.node && opts.node.source) {
        let range = opts.node.rangeBy(opts);
        this.line = range.start.line;
        this.column = range.start.column;
        this.endLine = range.end.line;
        this.endColumn = range.end.column;
      }
      for (let opt in opts) this[opt] = opts[opt];
    }
    toString() {
      if (this.node) {
        return this.node.error(this.text, {
          index: this.index,
          plugin: this.plugin,
          word: this.word
        }).message;
      }
      if (this.plugin) {
        return this.plugin + ": " + this.text;
      }
      return this.text;
    }
  };
  var warning = Warning$2;
  Warning$2.default = Warning$2;
  var Warning$1 = warning;
  var Result$3 = class Result2 {
    constructor(processor2, root2, opts) {
      this.processor = processor2;
      this.messages = [];
      this.root = root2;
      this.opts = opts;
      this.css = void 0;
      this.map = void 0;
    }
    toString() {
      return this.css;
    }
    warn(text, opts = {}) {
      if (!opts.plugin) {
        if (this.lastPlugin && this.lastPlugin.postcssPlugin) {
          opts.plugin = this.lastPlugin.postcssPlugin;
        }
      }
      let warning2 = new Warning$1(text, opts);
      this.messages.push(warning2);
      return warning2;
    }
    warnings() {
      return this.messages.filter((i2) => i2.type === "warning");
    }
    get content() {
      return this.css;
    }
  };
  var result = Result$3;
  Result$3.default = Result$3;
  var SINGLE_QUOTE = "'".charCodeAt(0);
  var DOUBLE_QUOTE = '"'.charCodeAt(0);
  var BACKSLASH = "\\".charCodeAt(0);
  var SLASH = "/".charCodeAt(0);
  var NEWLINE = "\n".charCodeAt(0);
  var SPACE = " ".charCodeAt(0);
  var FEED = "\f".charCodeAt(0);
  var TAB = "	".charCodeAt(0);
  var CR = "\r".charCodeAt(0);
  var OPEN_SQUARE = "[".charCodeAt(0);
  var CLOSE_SQUARE = "]".charCodeAt(0);
  var OPEN_PARENTHESES = "(".charCodeAt(0);
  var CLOSE_PARENTHESES = ")".charCodeAt(0);
  var OPEN_CURLY = "{".charCodeAt(0);
  var CLOSE_CURLY = "}".charCodeAt(0);
  var SEMICOLON = ";".charCodeAt(0);
  var ASTERISK = "*".charCodeAt(0);
  var COLON = ":".charCodeAt(0);
  var AT = "@".charCodeAt(0);
  var RE_AT_END = /[\t\n\f\r "#'()/;[\\\]{}]/g;
  var RE_WORD_END = /[\t\n\f\r !"#'():;@[\\\]{}]|\/(?=\*)/g;
  var RE_BAD_BRACKET = /.[\r\n"'(/\\]/;
  var RE_HEX_ESCAPE = /[\da-f]/i;
  var tokenize = function tokenizer2(input2, options = {}) {
    let css = input2.css.valueOf();
    let ignore = options.ignoreErrors;
    let code, next, quote, content, escape;
    let escaped, escapePos, prev, n2, currentToken;
    let length = css.length;
    let pos = 0;
    let buffer = [];
    let returned = [];
    function position() {
      return pos;
    }
    function unclosed(what) {
      throw input2.error("Unclosed " + what, pos);
    }
    function endOfFile() {
      return returned.length === 0 && pos >= length;
    }
    function nextToken(opts) {
      if (returned.length) return returned.pop();
      if (pos >= length) return;
      let ignoreUnclosed = opts ? opts.ignoreUnclosed : false;
      code = css.charCodeAt(pos);
      switch (code) {
        case NEWLINE:
        case SPACE:
        case TAB:
        case CR:
        case FEED: {
          next = pos;
          do {
            next += 1;
            code = css.charCodeAt(next);
          } while (code === SPACE || code === NEWLINE || code === TAB || code === CR || code === FEED);
          currentToken = ["space", css.slice(pos, next)];
          pos = next - 1;
          break;
        }
        case OPEN_SQUARE:
        case CLOSE_SQUARE:
        case OPEN_CURLY:
        case CLOSE_CURLY:
        case COLON:
        case SEMICOLON:
        case CLOSE_PARENTHESES: {
          let controlChar = String.fromCharCode(code);
          currentToken = [controlChar, controlChar, pos];
          break;
        }
        case OPEN_PARENTHESES: {
          prev = buffer.length ? buffer.pop()[1] : "";
          n2 = css.charCodeAt(pos + 1);
          if (prev === "url" && n2 !== SINGLE_QUOTE && n2 !== DOUBLE_QUOTE && n2 !== SPACE && n2 !== NEWLINE && n2 !== TAB && n2 !== FEED && n2 !== CR) {
            next = pos;
            do {
              escaped = false;
              next = css.indexOf(")", next + 1);
              if (next === -1) {
                if (ignore || ignoreUnclosed) {
                  next = pos;
                  break;
                } else {
                  unclosed("bracket");
                }
              }
              escapePos = next;
              while (css.charCodeAt(escapePos - 1) === BACKSLASH) {
                escapePos -= 1;
                escaped = !escaped;
              }
            } while (escaped);
            currentToken = ["brackets", css.slice(pos, next + 1), pos, next];
            pos = next;
          } else {
            next = css.indexOf(")", pos + 1);
            content = css.slice(pos, next + 1);
            if (next === -1 || RE_BAD_BRACKET.test(content)) {
              currentToken = ["(", "(", pos];
            } else {
              currentToken = ["brackets", content, pos, next];
              pos = next;
            }
          }
          break;
        }
        case SINGLE_QUOTE:
        case DOUBLE_QUOTE: {
          quote = code === SINGLE_QUOTE ? "'" : '"';
          next = pos;
          do {
            escaped = false;
            next = css.indexOf(quote, next + 1);
            if (next === -1) {
              if (ignore || ignoreUnclosed) {
                next = pos + 1;
                break;
              } else {
                unclosed("string");
              }
            }
            escapePos = next;
            while (css.charCodeAt(escapePos - 1) === BACKSLASH) {
              escapePos -= 1;
              escaped = !escaped;
            }
          } while (escaped);
          currentToken = ["string", css.slice(pos, next + 1), pos, next];
          pos = next;
          break;
        }
        case AT: {
          RE_AT_END.lastIndex = pos + 1;
          RE_AT_END.test(css);
          if (RE_AT_END.lastIndex === 0) {
            next = css.length - 1;
          } else {
            next = RE_AT_END.lastIndex - 2;
          }
          currentToken = ["at-word", css.slice(pos, next + 1), pos, next];
          pos = next;
          break;
        }
        case BACKSLASH: {
          next = pos;
          escape = true;
          while (css.charCodeAt(next + 1) === BACKSLASH) {
            next += 1;
            escape = !escape;
          }
          code = css.charCodeAt(next + 1);
          if (escape && code !== SLASH && code !== SPACE && code !== NEWLINE && code !== TAB && code !== CR && code !== FEED) {
            next += 1;
            if (RE_HEX_ESCAPE.test(css.charAt(next))) {
              while (RE_HEX_ESCAPE.test(css.charAt(next + 1))) {
                next += 1;
              }
              if (css.charCodeAt(next + 1) === SPACE) {
                next += 1;
              }
            }
          }
          currentToken = ["word", css.slice(pos, next + 1), pos, next];
          pos = next;
          break;
        }
        default: {
          if (code === SLASH && css.charCodeAt(pos + 1) === ASTERISK) {
            next = css.indexOf("*/", pos + 2) + 1;
            if (next === 0) {
              if (ignore || ignoreUnclosed) {
                next = css.length;
              } else {
                unclosed("comment");
              }
            }
            currentToken = ["comment", css.slice(pos, next + 1), pos, next];
            pos = next;
          } else {
            RE_WORD_END.lastIndex = pos + 1;
            RE_WORD_END.test(css);
            if (RE_WORD_END.lastIndex === 0) {
              next = css.length - 1;
            } else {
              next = RE_WORD_END.lastIndex - 2;
            }
            currentToken = ["word", css.slice(pos, next + 1), pos, next];
            buffer.push(currentToken);
            pos = next;
          }
          break;
        }
      }
      pos++;
      return currentToken;
    }
    function back(token) {
      returned.push(token);
    }
    return {
      back,
      endOfFile,
      nextToken,
      position
    };
  };
  var Container$5 = container;
  var AtRule$3 = class AtRule2 extends Container$5 {
    constructor(defaults) {
      super(defaults);
      this.type = "atrule";
    }
    append(...children) {
      if (!this.proxyOf.nodes) this.nodes = [];
      return super.append(...children);
    }
    prepend(...children) {
      if (!this.proxyOf.nodes) this.nodes = [];
      return super.prepend(...children);
    }
  };
  var atRule = AtRule$3;
  AtRule$3.default = AtRule$3;
  Container$5.registerAtRule(AtRule$3);
  var Container$4 = container;
  var LazyResult$3;
  var Processor$2;
  var Root$5 = class Root2 extends Container$4 {
    constructor(defaults) {
      super(defaults);
      this.type = "root";
      if (!this.nodes) this.nodes = [];
    }
    normalize(child, sample, type) {
      let nodes = super.normalize(child);
      if (sample) {
        if (type === "prepend") {
          if (this.nodes.length > 1) {
            sample.raws.before = this.nodes[1].raws.before;
          } else {
            delete sample.raws.before;
          }
        } else if (this.first !== sample) {
          for (let node2 of nodes) {
            node2.raws.before = sample.raws.before;
          }
        }
      }
      return nodes;
    }
    removeChild(child, ignore) {
      let index2 = this.index(child);
      if (!ignore && index2 === 0 && this.nodes.length > 1) {
        this.nodes[1].raws.before = this.nodes[index2].raws.before;
      }
      return super.removeChild(child);
    }
    toResult(opts = {}) {
      let lazy = new LazyResult$3(new Processor$2(), this, opts);
      return lazy.stringify();
    }
  };
  Root$5.registerLazyResult = (dependant) => {
    LazyResult$3 = dependant;
  };
  Root$5.registerProcessor = (dependant) => {
    Processor$2 = dependant;
  };
  var root = Root$5;
  Root$5.default = Root$5;
  Container$4.registerRoot(Root$5);
  var list$2 = {
    comma(string) {
      return list$2.split(string, [","], true);
    },
    space(string) {
      let spaces = [" ", "\n", "	"];
      return list$2.split(string, spaces);
    },
    split(string, separators, last) {
      let array = [];
      let current = "";
      let split = false;
      let func = 0;
      let inQuote = false;
      let prevQuote = "";
      let escape = false;
      for (let letter of string) {
        if (escape) {
          escape = false;
        } else if (letter === "\\") {
          escape = true;
        } else if (inQuote) {
          if (letter === prevQuote) {
            inQuote = false;
          }
        } else if (letter === '"' || letter === "'") {
          inQuote = true;
          prevQuote = letter;
        } else if (letter === "(") {
          func += 1;
        } else if (letter === ")") {
          if (func > 0) func -= 1;
        } else if (func === 0) {
          if (separators.includes(letter)) split = true;
        }
        if (split) {
          if (current !== "") array.push(current.trim());
          current = "";
          split = false;
        } else {
          current += letter;
        }
      }
      if (last || current !== "") array.push(current.trim());
      return array;
    }
  };
  var list_1 = list$2;
  list$2.default = list$2;
  var Container$3 = container;
  var list$1 = list_1;
  var Rule$3 = class Rule2 extends Container$3 {
    constructor(defaults) {
      super(defaults);
      this.type = "rule";
      if (!this.nodes) this.nodes = [];
    }
    get selectors() {
      return list$1.comma(this.selector);
    }
    set selectors(values) {
      let match = this.selector ? this.selector.match(/,\s*/) : null;
      let sep2 = match ? match[0] : "," + this.raw("between", "beforeOpen");
      this.selector = values.join(sep2);
    }
  };
  var rule = Rule$3;
  Rule$3.default = Rule$3;
  Container$3.registerRule(Rule$3);
  var Declaration$2 = declaration;
  var tokenizer22 = tokenize;
  var Comment$2 = comment;
  var AtRule$2 = atRule;
  var Root$4 = root;
  var Rule$2 = rule;
  var SAFE_COMMENT_NEIGHBOR = {
    empty: true,
    space: true
  };
  function findLastWithPosition(tokens) {
    for (let i2 = tokens.length - 1; i2 >= 0; i2--) {
      let token = tokens[i2];
      let pos = token[3] || token[2];
      if (pos) return pos;
    }
  }
  var Parser$1 = class Parser2 {
    constructor(input2) {
      this.input = input2;
      this.root = new Root$4();
      this.current = this.root;
      this.spaces = "";
      this.semicolon = false;
      this.createTokenizer();
      this.root.source = { input: input2, start: { column: 1, line: 1, offset: 0 } };
    }
    atrule(token) {
      let node2 = new AtRule$2();
      node2.name = token[1].slice(1);
      if (node2.name === "") {
        this.unnamedAtrule(node2, token);
      }
      this.init(node2, token[2]);
      let type;
      let prev;
      let shift;
      let last = false;
      let open = false;
      let params = [];
      let brackets = [];
      while (!this.tokenizer.endOfFile()) {
        token = this.tokenizer.nextToken();
        type = token[0];
        if (type === "(" || type === "[") {
          brackets.push(type === "(" ? ")" : "]");
        } else if (type === "{" && brackets.length > 0) {
          brackets.push("}");
        } else if (type === brackets[brackets.length - 1]) {
          brackets.pop();
        }
        if (brackets.length === 0) {
          if (type === ";") {
            node2.source.end = this.getPosition(token[2]);
            node2.source.end.offset++;
            this.semicolon = true;
            break;
          } else if (type === "{") {
            open = true;
            break;
          } else if (type === "}") {
            if (params.length > 0) {
              shift = params.length - 1;
              prev = params[shift];
              while (prev && prev[0] === "space") {
                prev = params[--shift];
              }
              if (prev) {
                node2.source.end = this.getPosition(prev[3] || prev[2]);
                node2.source.end.offset++;
              }
            }
            this.end(token);
            break;
          } else {
            params.push(token);
          }
        } else {
          params.push(token);
        }
        if (this.tokenizer.endOfFile()) {
          last = true;
          break;
        }
      }
      node2.raws.between = this.spacesAndCommentsFromEnd(params);
      if (params.length) {
        node2.raws.afterName = this.spacesAndCommentsFromStart(params);
        this.raw(node2, "params", params);
        if (last) {
          token = params[params.length - 1];
          node2.source.end = this.getPosition(token[3] || token[2]);
          node2.source.end.offset++;
          this.spaces = node2.raws.between;
          node2.raws.between = "";
        }
      } else {
        node2.raws.afterName = "";
        node2.params = "";
      }
      if (open) {
        node2.nodes = [];
        this.current = node2;
      }
    }
    checkMissedSemicolon(tokens) {
      let colon = this.colon(tokens);
      if (colon === false) return;
      let founded = 0;
      let token;
      for (let j = colon - 1; j >= 0; j--) {
        token = tokens[j];
        if (token[0] !== "space") {
          founded += 1;
          if (founded === 2) break;
        }
      }
      throw this.input.error(
        "Missed semicolon",
        token[0] === "word" ? token[3] + 1 : token[2]
      );
    }
    colon(tokens) {
      let brackets = 0;
      let token, type, prev;
      for (let [i2, element] of tokens.entries()) {
        token = element;
        type = token[0];
        if (type === "(") {
          brackets += 1;
        }
        if (type === ")") {
          brackets -= 1;
        }
        if (brackets === 0 && type === ":") {
          if (!prev) {
            this.doubleColon(token);
          } else if (prev[0] === "word" && prev[1] === "progid") {
            continue;
          } else {
            return i2;
          }
        }
        prev = token;
      }
      return false;
    }
    comment(token) {
      let node2 = new Comment$2();
      this.init(node2, token[2]);
      node2.source.end = this.getPosition(token[3] || token[2]);
      node2.source.end.offset++;
      let text = token[1].slice(2, -2);
      if (/^\s*$/.test(text)) {
        node2.text = "";
        node2.raws.left = text;
        node2.raws.right = "";
      } else {
        let match = text.match(/^(\s*)([^]*\S)(\s*)$/);
        node2.text = match[2];
        node2.raws.left = match[1];
        node2.raws.right = match[3];
      }
    }
    createTokenizer() {
      this.tokenizer = tokenizer22(this.input);
    }
    decl(tokens, customProperty) {
      let node2 = new Declaration$2();
      this.init(node2, tokens[0][2]);
      let last = tokens[tokens.length - 1];
      if (last[0] === ";") {
        this.semicolon = true;
        tokens.pop();
      }
      node2.source.end = this.getPosition(
        last[3] || last[2] || findLastWithPosition(tokens)
      );
      node2.source.end.offset++;
      while (tokens[0][0] !== "word") {
        if (tokens.length === 1) this.unknownWord(tokens);
        node2.raws.before += tokens.shift()[1];
      }
      node2.source.start = this.getPosition(tokens[0][2]);
      node2.prop = "";
      while (tokens.length) {
        let type = tokens[0][0];
        if (type === ":" || type === "space" || type === "comment") {
          break;
        }
        node2.prop += tokens.shift()[1];
      }
      node2.raws.between = "";
      let token;
      while (tokens.length) {
        token = tokens.shift();
        if (token[0] === ":") {
          node2.raws.between += token[1];
          break;
        } else {
          if (token[0] === "word" && /\w/.test(token[1])) {
            this.unknownWord([token]);
          }
          node2.raws.between += token[1];
        }
      }
      if (node2.prop[0] === "_" || node2.prop[0] === "*") {
        node2.raws.before += node2.prop[0];
        node2.prop = node2.prop.slice(1);
      }
      let firstSpaces = [];
      let next;
      while (tokens.length) {
        next = tokens[0][0];
        if (next !== "space" && next !== "comment") break;
        firstSpaces.push(tokens.shift());
      }
      this.precheckMissedSemicolon(tokens);
      for (let i2 = tokens.length - 1; i2 >= 0; i2--) {
        token = tokens[i2];
        if (token[1].toLowerCase() === "!important") {
          node2.important = true;
          let string = this.stringFrom(tokens, i2);
          string = this.spacesFromEnd(tokens) + string;
          if (string !== " !important") node2.raws.important = string;
          break;
        } else if (token[1].toLowerCase() === "important") {
          let cache = tokens.slice(0);
          let str = "";
          for (let j = i2; j > 0; j--) {
            let type = cache[j][0];
            if (str.trim().indexOf("!") === 0 && type !== "space") {
              break;
            }
            str = cache.pop()[1] + str;
          }
          if (str.trim().indexOf("!") === 0) {
            node2.important = true;
            node2.raws.important = str;
            tokens = cache;
          }
        }
        if (token[0] !== "space" && token[0] !== "comment") {
          break;
        }
      }
      let hasWord = tokens.some((i2) => i2[0] !== "space" && i2[0] !== "comment");
      if (hasWord) {
        node2.raws.between += firstSpaces.map((i2) => i2[1]).join("");
        firstSpaces = [];
      }
      this.raw(node2, "value", firstSpaces.concat(tokens), customProperty);
      if (node2.value.includes(":") && !customProperty) {
        this.checkMissedSemicolon(tokens);
      }
    }
    doubleColon(token) {
      throw this.input.error(
        "Double colon",
        { offset: token[2] },
        { offset: token[2] + token[1].length }
      );
    }
    emptyRule(token) {
      let node2 = new Rule$2();
      this.init(node2, token[2]);
      node2.selector = "";
      node2.raws.between = "";
      this.current = node2;
    }
    end(token) {
      if (this.current.nodes && this.current.nodes.length) {
        this.current.raws.semicolon = this.semicolon;
      }
      this.semicolon = false;
      this.current.raws.after = (this.current.raws.after || "") + this.spaces;
      this.spaces = "";
      if (this.current.parent) {
        this.current.source.end = this.getPosition(token[2]);
        this.current.source.end.offset++;
        this.current = this.current.parent;
      } else {
        this.unexpectedClose(token);
      }
    }
    endFile() {
      if (this.current.parent) this.unclosedBlock();
      if (this.current.nodes && this.current.nodes.length) {
        this.current.raws.semicolon = this.semicolon;
      }
      this.current.raws.after = (this.current.raws.after || "") + this.spaces;
      this.root.source.end = this.getPosition(this.tokenizer.position());
    }
    freeSemicolon(token) {
      this.spaces += token[1];
      if (this.current.nodes) {
        let prev = this.current.nodes[this.current.nodes.length - 1];
        if (prev && prev.type === "rule" && !prev.raws.ownSemicolon) {
          prev.raws.ownSemicolon = this.spaces;
          this.spaces = "";
        }
      }
    }
    // Helpers
    getPosition(offset) {
      let pos = this.input.fromOffset(offset);
      return {
        column: pos.col,
        line: pos.line,
        offset
      };
    }
    init(node2, offset) {
      this.current.push(node2);
      node2.source = {
        input: this.input,
        start: this.getPosition(offset)
      };
      node2.raws.before = this.spaces;
      this.spaces = "";
      if (node2.type !== "comment") this.semicolon = false;
    }
    other(start2) {
      let end = false;
      let type = null;
      let colon = false;
      let bracket = null;
      let brackets = [];
      let customProperty = start2[1].startsWith("--");
      let tokens = [];
      let token = start2;
      while (token) {
        type = token[0];
        tokens.push(token);
        if (type === "(" || type === "[") {
          if (!bracket) bracket = token;
          brackets.push(type === "(" ? ")" : "]");
        } else if (customProperty && colon && type === "{") {
          if (!bracket) bracket = token;
          brackets.push("}");
        } else if (brackets.length === 0) {
          if (type === ";") {
            if (colon) {
              this.decl(tokens, customProperty);
              return;
            } else {
              break;
            }
          } else if (type === "{") {
            this.rule(tokens);
            return;
          } else if (type === "}") {
            this.tokenizer.back(tokens.pop());
            end = true;
            break;
          } else if (type === ":") {
            colon = true;
          }
        } else if (type === brackets[brackets.length - 1]) {
          brackets.pop();
          if (brackets.length === 0) bracket = null;
        }
        token = this.tokenizer.nextToken();
      }
      if (this.tokenizer.endOfFile()) end = true;
      if (brackets.length > 0) this.unclosedBracket(bracket);
      if (end && colon) {
        if (!customProperty) {
          while (tokens.length) {
            token = tokens[tokens.length - 1][0];
            if (token !== "space" && token !== "comment") break;
            this.tokenizer.back(tokens.pop());
          }
        }
        this.decl(tokens, customProperty);
      } else {
        this.unknownWord(tokens);
      }
    }
    parse() {
      let token;
      while (!this.tokenizer.endOfFile()) {
        token = this.tokenizer.nextToken();
        switch (token[0]) {
          case "space":
            this.spaces += token[1];
            break;
          case ";":
            this.freeSemicolon(token);
            break;
          case "}":
            this.end(token);
            break;
          case "comment":
            this.comment(token);
            break;
          case "at-word":
            this.atrule(token);
            break;
          case "{":
            this.emptyRule(token);
            break;
          default:
            this.other(token);
            break;
        }
      }
      this.endFile();
    }
    precheckMissedSemicolon() {
    }
    raw(node2, prop, tokens, customProperty) {
      let token, type;
      let length = tokens.length;
      let value = "";
      let clean = true;
      let next, prev;
      for (let i2 = 0; i2 < length; i2 += 1) {
        token = tokens[i2];
        type = token[0];
        if (type === "space" && i2 === length - 1 && !customProperty) {
          clean = false;
        } else if (type === "comment") {
          prev = tokens[i2 - 1] ? tokens[i2 - 1][0] : "empty";
          next = tokens[i2 + 1] ? tokens[i2 + 1][0] : "empty";
          if (!SAFE_COMMENT_NEIGHBOR[prev] && !SAFE_COMMENT_NEIGHBOR[next]) {
            if (value.slice(-1) === ",") {
              clean = false;
            } else {
              value += token[1];
            }
          } else {
            clean = false;
          }
        } else {
          value += token[1];
        }
      }
      if (!clean) {
        let raw = tokens.reduce((all, i2) => all + i2[1], "");
        node2.raws[prop] = { raw, value };
      }
      node2[prop] = value;
    }
    rule(tokens) {
      tokens.pop();
      let node2 = new Rule$2();
      this.init(node2, tokens[0][2]);
      node2.raws.between = this.spacesAndCommentsFromEnd(tokens);
      this.raw(node2, "selector", tokens);
      this.current = node2;
    }
    spacesAndCommentsFromEnd(tokens) {
      let lastTokenType;
      let spaces = "";
      while (tokens.length) {
        lastTokenType = tokens[tokens.length - 1][0];
        if (lastTokenType !== "space" && lastTokenType !== "comment") break;
        spaces = tokens.pop()[1] + spaces;
      }
      return spaces;
    }
    // Errors
    spacesAndCommentsFromStart(tokens) {
      let next;
      let spaces = "";
      while (tokens.length) {
        next = tokens[0][0];
        if (next !== "space" && next !== "comment") break;
        spaces += tokens.shift()[1];
      }
      return spaces;
    }
    spacesFromEnd(tokens) {
      let lastTokenType;
      let spaces = "";
      while (tokens.length) {
        lastTokenType = tokens[tokens.length - 1][0];
        if (lastTokenType !== "space") break;
        spaces = tokens.pop()[1] + spaces;
      }
      return spaces;
    }
    stringFrom(tokens, from) {
      let result2 = "";
      for (let i2 = from; i2 < tokens.length; i2++) {
        result2 += tokens[i2][1];
      }
      tokens.splice(from, tokens.length - from);
      return result2;
    }
    unclosedBlock() {
      let pos = this.current.source.start;
      throw this.input.error("Unclosed block", pos.line, pos.column);
    }
    unclosedBracket(bracket) {
      throw this.input.error(
        "Unclosed bracket",
        { offset: bracket[2] },
        { offset: bracket[2] + 1 }
      );
    }
    unexpectedClose(token) {
      throw this.input.error(
        "Unexpected }",
        { offset: token[2] },
        { offset: token[2] + 1 }
      );
    }
    unknownWord(tokens) {
      throw this.input.error(
        "Unknown word",
        { offset: tokens[0][2] },
        { offset: tokens[0][2] + tokens[0][1].length }
      );
    }
    unnamedAtrule(node2, token) {
      throw this.input.error(
        "At-rule without name",
        { offset: token[2] },
        { offset: token[2] + token[1].length }
      );
    }
  };
  var parser = Parser$1;
  var Container$2 = container;
  var Parser22 = parser;
  var Input$2 = input;
  function parse$3(css, opts) {
    let input2 = new Input$2(css, opts);
    let parser2 = new Parser22(input2);
    try {
      parser2.parse();
    } catch (e2) {
      if (true) {
        if (e2.name === "CssSyntaxError" && opts && opts.from) {
          if (/\.scss$/i.test(opts.from)) {
            e2.message += "\nYou tried to parse SCSS with the standard CSS parser; try again with the postcss-scss parser";
          } else if (/\.sass/i.test(opts.from)) {
            e2.message += "\nYou tried to parse Sass with the standard CSS parser; try again with the postcss-sass parser";
          } else if (/\.less$/i.test(opts.from)) {
            e2.message += "\nYou tried to parse Less with the standard CSS parser; try again with the postcss-less parser";
          }
        }
      }
      throw e2;
    }
    return parser2.root;
  }
  var parse_1 = parse$3;
  parse$3.default = parse$3;
  Container$2.registerParse(parse$3);
  var { isClean, my } = symbols;
  var MapGenerator$1 = mapGenerator;
  var stringify$2 = stringify_1;
  var Container$1 = container;
  var Document$2 = document$1;
  var warnOnce$1 = warnOnce$2;
  var Result$2 = result;
  var parse$2 = parse_1;
  var Root$3 = root;
  var TYPE_TO_CLASS_NAME = {
    atrule: "AtRule",
    comment: "Comment",
    decl: "Declaration",
    document: "Document",
    root: "Root",
    rule: "Rule"
  };
  var PLUGIN_PROPS = {
    AtRule: true,
    AtRuleExit: true,
    Comment: true,
    CommentExit: true,
    Declaration: true,
    DeclarationExit: true,
    Document: true,
    DocumentExit: true,
    Once: true,
    OnceExit: true,
    postcssPlugin: true,
    prepare: true,
    Root: true,
    RootExit: true,
    Rule: true,
    RuleExit: true
  };
  var NOT_VISITORS = {
    Once: true,
    postcssPlugin: true,
    prepare: true
  };
  var CHILDREN = 0;
  function isPromise(obj) {
    return typeof obj === "object" && typeof obj.then === "function";
  }
  function getEvents(node2) {
    let key = false;
    let type = TYPE_TO_CLASS_NAME[node2.type];
    if (node2.type === "decl") {
      key = node2.prop.toLowerCase();
    } else if (node2.type === "atrule") {
      key = node2.name.toLowerCase();
    }
    if (key && node2.append) {
      return [
        type,
        type + "-" + key,
        CHILDREN,
        type + "Exit",
        type + "Exit-" + key
      ];
    } else if (key) {
      return [type, type + "-" + key, type + "Exit", type + "Exit-" + key];
    } else if (node2.append) {
      return [type, CHILDREN, type + "Exit"];
    } else {
      return [type, type + "Exit"];
    }
  }
  function toStack(node2) {
    let events;
    if (node2.type === "document") {
      events = ["Document", CHILDREN, "DocumentExit"];
    } else if (node2.type === "root") {
      events = ["Root", CHILDREN, "RootExit"];
    } else {
      events = getEvents(node2);
    }
    return {
      eventIndex: 0,
      events,
      iterator: 0,
      node: node2,
      visitorIndex: 0,
      visitors: []
    };
  }
  function cleanMarks(node2) {
    node2[isClean] = false;
    if (node2.nodes) node2.nodes.forEach((i2) => cleanMarks(i2));
    return node2;
  }
  var postcss$2 = {};
  var LazyResult$2 = class LazyResult2 {
    constructor(processor2, css, opts) {
      this.stringified = false;
      this.processed = false;
      let root2;
      if (typeof css === "object" && css !== null && (css.type === "root" || css.type === "document")) {
        root2 = cleanMarks(css);
      } else if (css instanceof LazyResult2 || css instanceof Result$2) {
        root2 = cleanMarks(css.root);
        if (css.map) {
          if (typeof opts.map === "undefined") opts.map = {};
          if (!opts.map.inline) opts.map.inline = false;
          opts.map.prev = css.map;
        }
      } else {
        let parser2 = parse$2;
        if (opts.syntax) parser2 = opts.syntax.parse;
        if (opts.parser) parser2 = opts.parser;
        if (parser2.parse) parser2 = parser2.parse;
        try {
          root2 = parser2(css, opts);
        } catch (error) {
          this.processed = true;
          this.error = error;
        }
        if (root2 && !root2[my]) {
          Container$1.rebuild(root2);
        }
      }
      this.result = new Result$2(processor2, root2, opts);
      this.helpers = { ...postcss$2, postcss: postcss$2, result: this.result };
      this.plugins = this.processor.plugins.map((plugin22) => {
        if (typeof plugin22 === "object" && plugin22.prepare) {
          return { ...plugin22, ...plugin22.prepare(this.result) };
        } else {
          return plugin22;
        }
      });
    }
    async() {
      if (this.error) return Promise.reject(this.error);
      if (this.processed) return Promise.resolve(this.result);
      if (!this.processing) {
        this.processing = this.runAsync();
      }
      return this.processing;
    }
    catch(onRejected) {
      return this.async().catch(onRejected);
    }
    finally(onFinally) {
      return this.async().then(onFinally, onFinally);
    }
    getAsyncError() {
      throw new Error("Use process(css).then(cb) to work with async plugins");
    }
    handleError(error, node2) {
      let plugin22 = this.result.lastPlugin;
      try {
        if (node2) node2.addToError(error);
        this.error = error;
        if (error.name === "CssSyntaxError" && !error.plugin) {
          error.plugin = plugin22.postcssPlugin;
          error.setMessage();
        } else if (plugin22.postcssVersion) {
          if (true) {
            let pluginName = plugin22.postcssPlugin;
            let pluginVer = plugin22.postcssVersion;
            let runtimeVer = this.result.processor.version;
            let a2 = pluginVer.split(".");
            let b = runtimeVer.split(".");
            if (a2[0] !== b[0] || parseInt(a2[1]) > parseInt(b[1])) {
              console.error(
                "Unknown error from PostCSS plugin. Your current PostCSS version is " + runtimeVer + ", but " + pluginName + " uses " + pluginVer + ". Perhaps this is the source of the error below."
              );
            }
          }
        }
      } catch (err) {
        if (console && console.error) console.error(err);
      }
      return error;
    }
    prepareVisitors() {
      this.listeners = {};
      let add = (plugin22, type, cb) => {
        if (!this.listeners[type]) this.listeners[type] = [];
        this.listeners[type].push([plugin22, cb]);
      };
      for (let plugin22 of this.plugins) {
        if (typeof plugin22 === "object") {
          for (let event in plugin22) {
            if (!PLUGIN_PROPS[event] && /^[A-Z]/.test(event)) {
              throw new Error(
                `Unknown event ${event} in ${plugin22.postcssPlugin}. Try to update PostCSS (${this.processor.version} now).`
              );
            }
            if (!NOT_VISITORS[event]) {
              if (typeof plugin22[event] === "object") {
                for (let filter in plugin22[event]) {
                  if (filter === "*") {
                    add(plugin22, event, plugin22[event][filter]);
                  } else {
                    add(
                      plugin22,
                      event + "-" + filter.toLowerCase(),
                      plugin22[event][filter]
                    );
                  }
                }
              } else if (typeof plugin22[event] === "function") {
                add(plugin22, event, plugin22[event]);
              }
            }
          }
        }
      }
      this.hasListener = Object.keys(this.listeners).length > 0;
    }
    async runAsync() {
      this.plugin = 0;
      for (let i2 = 0; i2 < this.plugins.length; i2++) {
        let plugin22 = this.plugins[i2];
        let promise = this.runOnRoot(plugin22);
        if (isPromise(promise)) {
          try {
            await promise;
          } catch (error) {
            throw this.handleError(error);
          }
        }
      }
      this.prepareVisitors();
      if (this.hasListener) {
        let root2 = this.result.root;
        while (!root2[isClean]) {
          root2[isClean] = true;
          let stack = [toStack(root2)];
          while (stack.length > 0) {
            let promise = this.visitTick(stack);
            if (isPromise(promise)) {
              try {
                await promise;
              } catch (e2) {
                let node2 = stack[stack.length - 1].node;
                throw this.handleError(e2, node2);
              }
            }
          }
        }
        if (this.listeners.OnceExit) {
          for (let [plugin22, visitor] of this.listeners.OnceExit) {
            this.result.lastPlugin = plugin22;
            try {
              if (root2.type === "document") {
                let roots = root2.nodes.map(
                  (subRoot) => visitor(subRoot, this.helpers)
                );
                await Promise.all(roots);
              } else {
                await visitor(root2, this.helpers);
              }
            } catch (e2) {
              throw this.handleError(e2);
            }
          }
        }
      }
      this.processed = true;
      return this.stringify();
    }
    runOnRoot(plugin22) {
      this.result.lastPlugin = plugin22;
      try {
        if (typeof plugin22 === "object" && plugin22.Once) {
          if (this.result.root.type === "document") {
            let roots = this.result.root.nodes.map(
              (root2) => plugin22.Once(root2, this.helpers)
            );
            if (isPromise(roots[0])) {
              return Promise.all(roots);
            }
            return roots;
          }
          return plugin22.Once(this.result.root, this.helpers);
        } else if (typeof plugin22 === "function") {
          return plugin22(this.result.root, this.result);
        }
      } catch (error) {
        throw this.handleError(error);
      }
    }
    stringify() {
      if (this.error) throw this.error;
      if (this.stringified) return this.result;
      this.stringified = true;
      this.sync();
      let opts = this.result.opts;
      let str = stringify$2;
      if (opts.syntax) str = opts.syntax.stringify;
      if (opts.stringifier) str = opts.stringifier;
      if (str.stringify) str = str.stringify;
      let map = new MapGenerator$1(str, this.result.root, this.result.opts);
      let data = map.generate();
      this.result.css = data[0];
      this.result.map = data[1];
      return this.result;
    }
    sync() {
      if (this.error) throw this.error;
      if (this.processed) return this.result;
      this.processed = true;
      if (this.processing) {
        throw this.getAsyncError();
      }
      for (let plugin22 of this.plugins) {
        let promise = this.runOnRoot(plugin22);
        if (isPromise(promise)) {
          throw this.getAsyncError();
        }
      }
      this.prepareVisitors();
      if (this.hasListener) {
        let root2 = this.result.root;
        while (!root2[isClean]) {
          root2[isClean] = true;
          this.walkSync(root2);
        }
        if (this.listeners.OnceExit) {
          if (root2.type === "document") {
            for (let subRoot of root2.nodes) {
              this.visitSync(this.listeners.OnceExit, subRoot);
            }
          } else {
            this.visitSync(this.listeners.OnceExit, root2);
          }
        }
      }
      return this.result;
    }
    then(onFulfilled, onRejected) {
      if (true) {
        if (!("from" in this.opts)) {
          warnOnce$1(
            "Without `from` option PostCSS could generate wrong source map and will not find Browserslist config. Set it to CSS file path or to `undefined` to prevent this warning."
          );
        }
      }
      return this.async().then(onFulfilled, onRejected);
    }
    toString() {
      return this.css;
    }
    visitSync(visitors, node2) {
      for (let [plugin22, visitor] of visitors) {
        this.result.lastPlugin = plugin22;
        let promise;
        try {
          promise = visitor(node2, this.helpers);
        } catch (e2) {
          throw this.handleError(e2, node2.proxyOf);
        }
        if (node2.type !== "root" && node2.type !== "document" && !node2.parent) {
          return true;
        }
        if (isPromise(promise)) {
          throw this.getAsyncError();
        }
      }
    }
    visitTick(stack) {
      let visit2 = stack[stack.length - 1];
      let { node: node2, visitors } = visit2;
      if (node2.type !== "root" && node2.type !== "document" && !node2.parent) {
        stack.pop();
        return;
      }
      if (visitors.length > 0 && visit2.visitorIndex < visitors.length) {
        let [plugin22, visitor] = visitors[visit2.visitorIndex];
        visit2.visitorIndex += 1;
        if (visit2.visitorIndex === visitors.length) {
          visit2.visitors = [];
          visit2.visitorIndex = 0;
        }
        this.result.lastPlugin = plugin22;
        try {
          return visitor(node2.toProxy(), this.helpers);
        } catch (e2) {
          throw this.handleError(e2, node2);
        }
      }
      if (visit2.iterator !== 0) {
        let iterator = visit2.iterator;
        let child;
        while (child = node2.nodes[node2.indexes[iterator]]) {
          node2.indexes[iterator] += 1;
          if (!child[isClean]) {
            child[isClean] = true;
            stack.push(toStack(child));
            return;
          }
        }
        visit2.iterator = 0;
        delete node2.indexes[iterator];
      }
      let events = visit2.events;
      while (visit2.eventIndex < events.length) {
        let event = events[visit2.eventIndex];
        visit2.eventIndex += 1;
        if (event === CHILDREN) {
          if (node2.nodes && node2.nodes.length) {
            node2[isClean] = true;
            visit2.iterator = node2.getIterator();
          }
          return;
        } else if (this.listeners[event]) {
          visit2.visitors = this.listeners[event];
          return;
        }
      }
      stack.pop();
    }
    walkSync(node2) {
      node2[isClean] = true;
      let events = getEvents(node2);
      for (let event of events) {
        if (event === CHILDREN) {
          if (node2.nodes) {
            node2.each((child) => {
              if (!child[isClean]) this.walkSync(child);
            });
          }
        } else {
          let visitors = this.listeners[event];
          if (visitors) {
            if (this.visitSync(visitors, node2.toProxy())) return;
          }
        }
      }
    }
    warnings() {
      return this.sync().warnings();
    }
    get content() {
      return this.stringify().content;
    }
    get css() {
      return this.stringify().css;
    }
    get map() {
      return this.stringify().map;
    }
    get messages() {
      return this.sync().messages;
    }
    get opts() {
      return this.result.opts;
    }
    get processor() {
      return this.result.processor;
    }
    get root() {
      return this.sync().root;
    }
    get [Symbol.toStringTag]() {
      return "LazyResult";
    }
  };
  LazyResult$2.registerPostcss = (dependant) => {
    postcss$2 = dependant;
  };
  var lazyResult = LazyResult$2;
  LazyResult$2.default = LazyResult$2;
  Root$3.registerLazyResult(LazyResult$2);
  Document$2.registerLazyResult(LazyResult$2);
  var MapGenerator22 = mapGenerator;
  var stringify$1 = stringify_1;
  var warnOnce22 = warnOnce$2;
  var parse$1 = parse_1;
  var Result$1 = result;
  var NoWorkResult$1 = class NoWorkResult2 {
    constructor(processor2, css, opts) {
      css = css.toString();
      this.stringified = false;
      this._processor = processor2;
      this._css = css;
      this._opts = opts;
      this._map = void 0;
      let root2;
      let str = stringify$1;
      this.result = new Result$1(this._processor, root2, this._opts);
      this.result.css = css;
      let self = this;
      Object.defineProperty(this.result, "root", {
        get() {
          return self.root;
        }
      });
      let map = new MapGenerator22(str, root2, this._opts, css);
      if (map.isMap()) {
        let [generatedCSS, generatedMap] = map.generate();
        if (generatedCSS) {
          this.result.css = generatedCSS;
        }
        if (generatedMap) {
          this.result.map = generatedMap;
        }
      } else {
        map.clearAnnotation();
        this.result.css = map.css;
      }
    }
    async() {
      if (this.error) return Promise.reject(this.error);
      return Promise.resolve(this.result);
    }
    catch(onRejected) {
      return this.async().catch(onRejected);
    }
    finally(onFinally) {
      return this.async().then(onFinally, onFinally);
    }
    sync() {
      if (this.error) throw this.error;
      return this.result;
    }
    then(onFulfilled, onRejected) {
      if (true) {
        if (!("from" in this._opts)) {
          warnOnce22(
            "Without `from` option PostCSS could generate wrong source map and will not find Browserslist config. Set it to CSS file path or to `undefined` to prevent this warning."
          );
        }
      }
      return this.async().then(onFulfilled, onRejected);
    }
    toString() {
      return this._css;
    }
    warnings() {
      return [];
    }
    get content() {
      return this.result.css;
    }
    get css() {
      return this.result.css;
    }
    get map() {
      return this.result.map;
    }
    get messages() {
      return [];
    }
    get opts() {
      return this.result.opts;
    }
    get processor() {
      return this.result.processor;
    }
    get root() {
      if (this._root) {
        return this._root;
      }
      let root2;
      let parser2 = parse$1;
      try {
        root2 = parser2(this._css, this._opts);
      } catch (error) {
        this.error = error;
      }
      if (this.error) {
        throw this.error;
      } else {
        this._root = root2;
        return root2;
      }
    }
    get [Symbol.toStringTag]() {
      return "NoWorkResult";
    }
  };
  var noWorkResult = NoWorkResult$1;
  NoWorkResult$1.default = NoWorkResult$1;
  var NoWorkResult22 = noWorkResult;
  var LazyResult$1 = lazyResult;
  var Document$1 = document$1;
  var Root$2 = root;
  var Processor$1 = class Processor2 {
    constructor(plugins = []) {
      this.version = "8.4.38";
      this.plugins = this.normalize(plugins);
    }
    normalize(plugins) {
      let normalized = [];
      for (let i2 of plugins) {
        if (i2.postcss === true) {
          i2 = i2();
        } else if (i2.postcss) {
          i2 = i2.postcss;
        }
        if (typeof i2 === "object" && Array.isArray(i2.plugins)) {
          normalized = normalized.concat(i2.plugins);
        } else if (typeof i2 === "object" && i2.postcssPlugin) {
          normalized.push(i2);
        } else if (typeof i2 === "function") {
          normalized.push(i2);
        } else if (typeof i2 === "object" && (i2.parse || i2.stringify)) {
          if (true) {
            throw new Error(
              "PostCSS syntaxes cannot be used as plugins. Instead, please use one of the syntax/parser/stringifier options as outlined in your PostCSS runner documentation."
            );
          }
        } else {
          throw new Error(i2 + " is not a PostCSS plugin");
        }
      }
      return normalized;
    }
    process(css, opts = {}) {
      if (!this.plugins.length && !opts.parser && !opts.stringifier && !opts.syntax) {
        return new NoWorkResult22(this, css, opts);
      } else {
        return new LazyResult$1(this, css, opts);
      }
    }
    use(plugin22) {
      this.plugins = this.plugins.concat(this.normalize([plugin22]));
      return this;
    }
  };
  var processor = Processor$1;
  Processor$1.default = Processor$1;
  Root$2.registerProcessor(Processor$1);
  Document$1.registerProcessor(Processor$1);
  var Declaration$1 = declaration;
  var PreviousMap22 = previousMap;
  var Comment$1 = comment;
  var AtRule$1 = atRule;
  var Input$1 = input;
  var Root$1 = root;
  var Rule$1 = rule;
  function fromJSON$1(json, inputs) {
    if (Array.isArray(json)) return json.map((n2) => fromJSON$1(n2));
    let { inputs: ownInputs, ...defaults } = json;
    if (ownInputs) {
      inputs = [];
      for (let input2 of ownInputs) {
        let inputHydrated = { ...input2, __proto__: Input$1.prototype };
        if (inputHydrated.map) {
          inputHydrated.map = {
            ...inputHydrated.map,
            __proto__: PreviousMap22.prototype
          };
        }
        inputs.push(inputHydrated);
      }
    }
    if (defaults.nodes) {
      defaults.nodes = json.nodes.map((n2) => fromJSON$1(n2, inputs));
    }
    if (defaults.source) {
      let { inputId, ...source } = defaults.source;
      defaults.source = source;
      if (inputId != null) {
        defaults.source.input = inputs[inputId];
      }
    }
    if (defaults.type === "root") {
      return new Root$1(defaults);
    } else if (defaults.type === "decl") {
      return new Declaration$1(defaults);
    } else if (defaults.type === "rule") {
      return new Rule$1(defaults);
    } else if (defaults.type === "comment") {
      return new Comment$1(defaults);
    } else if (defaults.type === "atrule") {
      return new AtRule$1(defaults);
    } else {
      throw new Error("Unknown node type: " + json.type);
    }
  }
  var fromJSON_1 = fromJSON$1;
  fromJSON$1.default = fromJSON$1;
  var CssSyntaxError22 = cssSyntaxError;
  var Declaration22 = declaration;
  var LazyResult22 = lazyResult;
  var Container22 = container;
  var Processor22 = processor;
  var stringify$6 = stringify_1;
  var fromJSON = fromJSON_1;
  var Document222 = document$1;
  var Warning22 = warning;
  var Comment22 = comment;
  var AtRule22 = atRule;
  var Result22 = result;
  var Input22 = input;
  var parse = parse_1;
  var list = list_1;
  var Rule22 = rule;
  var Root22 = root;
  var Node22 = node;
  function postcss(...plugins) {
    if (plugins.length === 1 && Array.isArray(plugins[0])) {
      plugins = plugins[0];
    }
    return new Processor22(plugins);
  }
  postcss.plugin = function plugin2(name, initializer) {
    let warningPrinted = false;
    function creator(...args) {
      if (console && console.warn && !warningPrinted) {
        warningPrinted = true;
        console.warn(
          name + ": postcss.plugin was deprecated. Migration guide:\nhttps://evilmartians.com/chronicles/postcss-8-plugin-migration"
        );
        if (process.env.LANG && process.env.LANG.startsWith("cn")) {
          console.warn(
            name + ": \u91CC\u9762 postcss.plugin \u88AB\u5F03\u7528. \u8FC1\u79FB\u6307\u5357:\nhttps://www.w3ctech.com/topic/2226"
          );
        }
      }
      let transformer = initializer(...args);
      transformer.postcssPlugin = name;
      transformer.postcssVersion = new Processor22().version;
      return transformer;
    }
    let cache;
    Object.defineProperty(creator, "postcss", {
      get() {
        if (!cache) cache = creator();
        return cache;
      }
    });
    creator.process = function(css, processOpts, pluginOpts) {
      return postcss([creator(pluginOpts)]).process(css, processOpts);
    };
    return creator;
  };
  postcss.stringify = stringify$6;
  postcss.parse = parse;
  postcss.fromJSON = fromJSON;
  postcss.list = list;
  postcss.comment = (defaults) => new Comment22(defaults);
  postcss.atRule = (defaults) => new AtRule22(defaults);
  postcss.decl = (defaults) => new Declaration22(defaults);
  postcss.rule = (defaults) => new Rule22(defaults);
  postcss.root = (defaults) => new Root22(defaults);
  postcss.document = (defaults) => new Document222(defaults);
  postcss.CssSyntaxError = CssSyntaxError22;
  postcss.Declaration = Declaration22;
  postcss.Container = Container22;
  postcss.Processor = Processor22;
  postcss.Document = Document222;
  postcss.Comment = Comment22;
  postcss.Warning = Warning22;
  postcss.AtRule = AtRule22;
  postcss.Result = Result22;
  postcss.Input = Input22;
  postcss.Rule = Rule22;
  postcss.Root = Root22;
  postcss.Node = Node22;
  LazyResult22.registerPostcss(postcss);
  var postcss_1 = postcss;
  postcss.default = postcss;
  var postcss$1 = /* @__PURE__ */ getDefaultExportFromCjs(postcss_1);
  postcss$1.stringify;
  postcss$1.fromJSON;
  postcss$1.plugin;
  postcss$1.parse;
  postcss$1.list;
  postcss$1.document;
  postcss$1.comment;
  postcss$1.atRule;
  postcss$1.rule;
  postcss$1.decl;
  postcss$1.root;
  postcss$1.CssSyntaxError;
  postcss$1.Declaration;
  postcss$1.Container;
  postcss$1.Processor;
  postcss$1.Document;
  postcss$1.Comment;
  postcss$1.Warning;
  postcss$1.AtRule;
  postcss$1.Result;
  postcss$1.Input;
  postcss$1.Rule;
  postcss$1.Root;
  postcss$1.Node;
  var BaseRRNode = class _BaseRRNode {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    constructor(..._args) {
      __publicField22(this, "parentElement", null);
      __publicField22(this, "parentNode", null);
      __publicField22(this, "ownerDocument");
      __publicField22(this, "firstChild", null);
      __publicField22(this, "lastChild", null);
      __publicField22(this, "previousSibling", null);
      __publicField22(this, "nextSibling", null);
      __publicField22(this, "ELEMENT_NODE", 1);
      __publicField22(this, "TEXT_NODE", 3);
      __publicField22(this, "nodeType");
      __publicField22(this, "nodeName");
      __publicField22(this, "RRNodeType");
    }
    get childNodes() {
      const childNodes2 = [];
      let childIterator = this.firstChild;
      while (childIterator) {
        childNodes2.push(childIterator);
        childIterator = childIterator.nextSibling;
      }
      return childNodes2;
    }
    contains(node2) {
      if (!(node2 instanceof _BaseRRNode)) return false;
      else if (node2.ownerDocument !== this.ownerDocument) return false;
      else if (node2 === this) return true;
      while (node2.parentNode) {
        if (node2.parentNode === this) return true;
        node2 = node2.parentNode;
      }
      return false;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    appendChild(_newChild) {
      throw new Error(
        `RRDomException: Failed to execute 'appendChild' on 'RRNode': This RRNode type does not support this method.`
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    insertBefore(_newChild, _refChild) {
      throw new Error(
        `RRDomException: Failed to execute 'insertBefore' on 'RRNode': This RRNode type does not support this method.`
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    removeChild(_node) {
      throw new Error(
        `RRDomException: Failed to execute 'removeChild' on 'RRNode': This RRNode type does not support this method.`
      );
    }
    toString() {
      return "RRNode";
    }
  };
  var testableAccessors = {
    Node: ["childNodes", "parentNode", "parentElement", "textContent"],
    ShadowRoot: ["host", "styleSheets"],
    Element: ["shadowRoot", "querySelector", "querySelectorAll"],
    MutationObserver: []
  };
  var testableMethods = {
    Node: ["contains", "getRootNode"],
    ShadowRoot: ["getSelection"],
    Element: [],
    MutationObserver: ["constructor"]
  };
  var untaintedBasePrototype = {};
  var isAngularZonePresent = () => {
    return !!globalThis.Zone;
  };
  function getUntaintedPrototype(key) {
    if (untaintedBasePrototype[key])
      return untaintedBasePrototype[key];
    const defaultObj = globalThis[key];
    const defaultPrototype = defaultObj.prototype;
    const accessorNames = key in testableAccessors ? testableAccessors[key] : void 0;
    const isUntaintedAccessors = Boolean(
      accessorNames && // @ts-expect-error 2345
      accessorNames.every(
        (accessor) => {
          var _a2, _b;
          return Boolean(
            (_b = (_a2 = Object.getOwnPropertyDescriptor(defaultPrototype, accessor)) == null ? void 0 : _a2.get) == null ? void 0 : _b.toString().includes("[native code]")
          );
        }
      )
    );
    const methodNames = key in testableMethods ? testableMethods[key] : void 0;
    const isUntaintedMethods = Boolean(
      methodNames && methodNames.every(
        // @ts-expect-error 2345
        (method) => {
          var _a2;
          return typeof defaultPrototype[method] === "function" && ((_a2 = defaultPrototype[method]) == null ? void 0 : _a2.toString().includes("[native code]"));
        }
      )
    );
    if (isUntaintedAccessors && isUntaintedMethods && !isAngularZonePresent()) {
      untaintedBasePrototype[key] = defaultObj.prototype;
      return defaultObj.prototype;
    }
    try {
      const iframeEl = document.createElement("iframe");
      document.body.appendChild(iframeEl);
      const win = iframeEl.contentWindow;
      if (!win) return defaultObj.prototype;
      const untaintedObject = win[key].prototype;
      document.body.removeChild(iframeEl);
      if (!untaintedObject) return defaultPrototype;
      return untaintedBasePrototype[key] = untaintedObject;
    } catch {
      return defaultPrototype;
    }
  }
  var untaintedAccessorCache = {};
  function getUntaintedAccessor(key, instance, accessor) {
    var _a2;
    const cacheKey = `${key}.${String(accessor)}`;
    if (untaintedAccessorCache[cacheKey])
      return untaintedAccessorCache[cacheKey].call(
        instance
      );
    const untaintedPrototype = getUntaintedPrototype(key);
    const untaintedAccessor = (_a2 = Object.getOwnPropertyDescriptor(
      untaintedPrototype,
      accessor
    )) == null ? void 0 : _a2.get;
    if (!untaintedAccessor) return instance[accessor];
    untaintedAccessorCache[cacheKey] = untaintedAccessor;
    return untaintedAccessor.call(instance);
  }
  var untaintedMethodCache = {};
  function getUntaintedMethod(key, instance, method) {
    const cacheKey = `${key}.${String(method)}`;
    if (untaintedMethodCache[cacheKey])
      return untaintedMethodCache[cacheKey].bind(
        instance
      );
    const untaintedPrototype = getUntaintedPrototype(key);
    const untaintedMethod = untaintedPrototype[method];
    if (typeof untaintedMethod !== "function") return instance[method];
    untaintedMethodCache[cacheKey] = untaintedMethod;
    return untaintedMethod.bind(instance);
  }
  function childNodes(n2) {
    return getUntaintedAccessor("Node", n2, "childNodes");
  }
  function parentNode(n2) {
    return getUntaintedAccessor("Node", n2, "parentNode");
  }
  function parentElement(n2) {
    return getUntaintedAccessor("Node", n2, "parentElement");
  }
  function textContent(n2) {
    return getUntaintedAccessor("Node", n2, "textContent");
  }
  function contains(n2, other) {
    return getUntaintedMethod("Node", n2, "contains")(other);
  }
  function getRootNode(n2) {
    return getUntaintedMethod("Node", n2, "getRootNode")();
  }
  function host(n2) {
    if (!n2 || !("host" in n2)) return null;
    return getUntaintedAccessor("ShadowRoot", n2, "host");
  }
  function styleSheets(n2) {
    return n2.styleSheets;
  }
  function shadowRoot(n2) {
    if (!n2 || !("shadowRoot" in n2)) return null;
    return getUntaintedAccessor("Element", n2, "shadowRoot");
  }
  function querySelector(n2, selectors) {
    return getUntaintedAccessor("Element", n2, "querySelector")(selectors);
  }
  function querySelectorAll(n2, selectors) {
    return getUntaintedAccessor("Element", n2, "querySelectorAll")(selectors);
  }
  function mutationObserverCtor() {
    return getUntaintedPrototype("MutationObserver").constructor;
  }
  var index = {
    childNodes,
    parentNode,
    parentElement,
    textContent,
    contains,
    getRootNode,
    host,
    styleSheets,
    shadowRoot,
    querySelector,
    querySelectorAll,
    mutationObserver: mutationObserverCtor
  };
  function on2(type, fn, target = document) {
    const options = { capture: true, passive: true };
    target.addEventListener(type, fn, options);
    return () => target.removeEventListener(type, fn, options);
  }
  var DEPARTED_MIRROR_ACCESS_WARNING2 = "Please stop import mirror directly. Instead of that,\r\nnow you can use replayer.getMirror() to access the mirror instance of a replayer,\r\nor you can use record.mirror to access the mirror instance during recording.";
  var _mirror2 = {
    map: {},
    getId() {
      console.error(DEPARTED_MIRROR_ACCESS_WARNING2);
      return -1;
    },
    getNode() {
      console.error(DEPARTED_MIRROR_ACCESS_WARNING2);
      return null;
    },
    removeNodeFromMap() {
      console.error(DEPARTED_MIRROR_ACCESS_WARNING2);
    },
    has() {
      console.error(DEPARTED_MIRROR_ACCESS_WARNING2);
      return false;
    },
    reset() {
      console.error(DEPARTED_MIRROR_ACCESS_WARNING2);
    }
  };
  if (typeof window !== "undefined" && window.Proxy && window.Reflect) {
    _mirror2 = new Proxy(_mirror2, {
      get(target, prop, receiver) {
        if (prop === "map") {
          console.error(DEPARTED_MIRROR_ACCESS_WARNING2);
        }
        return Reflect.get(target, prop, receiver);
      }
    });
  }
  function throttle2(func, wait, options = {}) {
    let timeout = null;
    let previous = 0;
    return function(...args) {
      const now = Date.now();
      if (!previous && options.leading === false) {
        previous = now;
      }
      const remaining = wait - (now - previous);
      const context = this;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        func.apply(context, args);
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(() => {
          previous = options.leading === false ? 0 : Date.now();
          timeout = null;
          func.apply(context, args);
        }, remaining);
      }
    };
  }
  function hookSetter2(target, key, d, isRevoked, win = window) {
    const original = win.Object.getOwnPropertyDescriptor(target, key);
    win.Object.defineProperty(
      target,
      key,
      isRevoked ? d : {
        set(value) {
          setTimeout(() => {
            d.set.call(this, value);
          }, 0);
          if (original && original.set) {
            original.set.call(this, value);
          }
        }
      }
    );
    return () => hookSetter2(target, key, original || {}, true);
  }
  function patch2(source, name, replacement) {
    try {
      if (!(name in source)) {
        return () => {
        };
      }
      const original = source[name];
      const wrapped = replacement(original);
      if (typeof wrapped === "function") {
        wrapped.prototype = wrapped.prototype || {};
        Object.defineProperties(wrapped, {
          __rrweb_original__: {
            enumerable: false,
            value: original
          }
        });
      }
      source[name] = wrapped;
      return () => {
        source[name] = original;
      };
    } catch {
      return () => {
      };
    }
  }
  var nowTimestamp = Date.now;
  if (!/* @__PURE__ */ /[1-9][0-9]{12}/.test(Date.now().toString())) {
    nowTimestamp = () => (/* @__PURE__ */ new Date()).getTime();
  }
  function getWindowScroll(win) {
    var _a2, _b, _c, _d;
    const doc = win.document;
    return {
      left: doc.scrollingElement ? doc.scrollingElement.scrollLeft : win.pageXOffset !== void 0 ? win.pageXOffset : doc.documentElement.scrollLeft || (doc == null ? void 0 : doc.body) && ((_a2 = index.parentElement(doc.body)) == null ? void 0 : _a2.scrollLeft) || ((_b = doc == null ? void 0 : doc.body) == null ? void 0 : _b.scrollLeft) || 0,
      top: doc.scrollingElement ? doc.scrollingElement.scrollTop : win.pageYOffset !== void 0 ? win.pageYOffset : (doc == null ? void 0 : doc.documentElement.scrollTop) || (doc == null ? void 0 : doc.body) && ((_c = index.parentElement(doc.body)) == null ? void 0 : _c.scrollTop) || ((_d = doc == null ? void 0 : doc.body) == null ? void 0 : _d.scrollTop) || 0
    };
  }
  function getWindowHeight2() {
    return window.innerHeight || document.documentElement && document.documentElement.clientHeight || document.body && document.body.clientHeight;
  }
  function getWindowWidth2() {
    return window.innerWidth || document.documentElement && document.documentElement.clientWidth || document.body && document.body.clientWidth;
  }
  function closestElementOfNode(node2) {
    if (!node2) {
      return null;
    }
    const el = node2.nodeType === node2.ELEMENT_NODE ? node2 : index.parentElement(node2);
    return el;
  }
  function isBlocked2(node2, blockClass, blockSelector, checkAncestors) {
    if (!node2) {
      return false;
    }
    const el = closestElementOfNode(node2);
    if (!el) {
      return false;
    }
    try {
      if (typeof blockClass === "string") {
        if (el.classList.contains(blockClass)) return true;
        if (checkAncestors && el.closest("." + blockClass) !== null) return true;
      } else {
        if (classMatchesRegex2(el, blockClass, checkAncestors)) return true;
      }
    } catch (e2) {
    }
    if (blockSelector) {
      if (el.matches(blockSelector)) return true;
      if (checkAncestors && el.closest(blockSelector) !== null) return true;
    }
    return false;
  }
  function isSerialized2(n2, mirror2) {
    return mirror2.getId(n2) !== -1;
  }
  function isIgnored2(n2, mirror2, slimDOMOptions) {
    if (n2.tagName === "TITLE" && slimDOMOptions.headTitleMutations) {
      return true;
    }
    return mirror2.getId(n2) === IGNORED_NODE2;
  }
  function isAncestorRemoved2(target, mirror2) {
    if (isShadowRoot2(target)) {
      return false;
    }
    const id = mirror2.getId(target);
    if (!mirror2.has(id)) {
      return true;
    }
    const parent = index.parentNode(target);
    if (parent && parent.nodeType === target.DOCUMENT_NODE) {
      return false;
    }
    if (!parent) {
      return true;
    }
    return isAncestorRemoved2(parent, mirror2);
  }
  function legacy_isTouchEvent(event) {
    return Boolean(event.changedTouches);
  }
  function polyfill$1(win = window) {
    if ("NodeList" in win && !win.NodeList.prototype.forEach) {
      win.NodeList.prototype.forEach = Array.prototype.forEach;
    }
    if ("DOMTokenList" in win && !win.DOMTokenList.prototype.forEach) {
      win.DOMTokenList.prototype.forEach = Array.prototype.forEach;
    }
  }
  function queueToResolveTrees(queue) {
    const queueNodeMap = {};
    const putIntoMap = (m, parent) => {
      const nodeInTree = {
        value: m,
        parent,
        children: []
      };
      queueNodeMap[m.node.id] = nodeInTree;
      return nodeInTree;
    };
    const queueNodeTrees = [];
    for (const mutation of queue) {
      const { nextId, parentId } = mutation;
      if (nextId && nextId in queueNodeMap) {
        const nextInTree = queueNodeMap[nextId];
        if (nextInTree.parent) {
          const idx = nextInTree.parent.children.indexOf(nextInTree);
          nextInTree.parent.children.splice(
            idx,
            0,
            putIntoMap(mutation, nextInTree.parent)
          );
        } else {
          const idx = queueNodeTrees.indexOf(nextInTree);
          queueNodeTrees.splice(idx, 0, putIntoMap(mutation, null));
        }
        continue;
      }
      if (parentId in queueNodeMap) {
        const parentInTree = queueNodeMap[parentId];
        parentInTree.children.push(putIntoMap(mutation, parentInTree));
        continue;
      }
      queueNodeTrees.push(putIntoMap(mutation, null));
    }
    return queueNodeTrees;
  }
  function iterateResolveTree(tree, cb) {
    cb(tree.value);
    for (let i2 = tree.children.length - 1; i2 >= 0; i2--) {
      iterateResolveTree(tree.children[i2], cb);
    }
  }
  function isSerializedIframe2(n2, mirror2) {
    return Boolean(n2.nodeName === "IFRAME" && mirror2.getMeta(n2));
  }
  function isSerializedStylesheet2(n2, mirror2) {
    return Boolean(
      n2.nodeName === "LINK" && n2.nodeType === n2.ELEMENT_NODE && n2.getAttribute && n2.getAttribute("rel") === "stylesheet" && mirror2.getMeta(n2)
    );
  }
  function getBaseDimension(node2, rootIframe) {
    var _a2, _b;
    const frameElement = (_b = (_a2 = node2.ownerDocument) == null ? void 0 : _a2.defaultView) == null ? void 0 : _b.frameElement;
    if (!frameElement || frameElement === rootIframe) {
      return {
        x: 0,
        y: 0,
        relativeScale: 1,
        absoluteScale: 1
      };
    }
    const frameDimension = frameElement.getBoundingClientRect();
    const frameBaseDimension = getBaseDimension(frameElement, rootIframe);
    const relativeScale = frameDimension.height / frameElement.clientHeight;
    return {
      x: frameDimension.x * frameBaseDimension.relativeScale + frameBaseDimension.x,
      y: frameDimension.y * frameBaseDimension.relativeScale + frameBaseDimension.y,
      relativeScale,
      absoluteScale: frameBaseDimension.absoluteScale * relativeScale
    };
  }
  function hasShadowRoot2(n2) {
    if (!n2) return false;
    if (n2 instanceof BaseRRNode && "shadowRoot" in n2) {
      return Boolean(n2.shadowRoot);
    }
    return Boolean(index.shadowRoot(n2));
  }
  function getNestedRule(rules2, position) {
    const rule2 = rules2[position[0]];
    if (position.length === 1) {
      return rule2;
    } else {
      return getNestedRule(
        rule2.cssRules[position[1]].cssRules,
        position.slice(2)
      );
    }
  }
  function getPositionsAndIndex(nestedIndex) {
    const positions = [...nestedIndex];
    const index2 = positions.pop();
    return { positions, index: index2 };
  }
  function uniqueTextMutations(mutations) {
    const idSet = /* @__PURE__ */ new Set();
    const uniqueMutations = [];
    for (let i2 = mutations.length; i2--; ) {
      const mutation = mutations[i2];
      if (!idSet.has(mutation.id)) {
        uniqueMutations.push(mutation);
        idSet.add(mutation.id);
      }
    }
    return uniqueMutations;
  }
  var StyleSheetMirror2 = class {
    constructor() {
      __publicField2(this, "id", 1);
      __publicField2(this, "styleIDMap", /* @__PURE__ */ new WeakMap());
      __publicField2(this, "idStyleMap", /* @__PURE__ */ new Map());
    }
    getId(stylesheet) {
      return this.styleIDMap.get(stylesheet) ?? -1;
    }
    has(stylesheet) {
      return this.styleIDMap.has(stylesheet);
    }
    /**
     * @returns If the stylesheet is in the mirror, returns the id of the stylesheet. If not, return the new assigned id.
     */
    add(stylesheet, id) {
      if (this.has(stylesheet)) return this.getId(stylesheet);
      let newId;
      if (id === void 0) {
        newId = this.id++;
      } else newId = id;
      this.styleIDMap.set(stylesheet, newId);
      this.idStyleMap.set(newId, stylesheet);
      return newId;
    }
    getStyle(id) {
      return this.idStyleMap.get(id) || null;
    }
    reset() {
      this.styleIDMap = /* @__PURE__ */ new WeakMap();
      this.idStyleMap = /* @__PURE__ */ new Map();
      this.id = 1;
    }
    generateId() {
      return this.id++;
    }
  };
  function getShadowHost(n2) {
    var _a2;
    let shadowHost = null;
    if ("getRootNode" in n2 && ((_a2 = index.getRootNode(n2)) == null ? void 0 : _a2.nodeType) === Node.DOCUMENT_FRAGMENT_NODE && index.host(index.getRootNode(n2)))
      shadowHost = index.host(index.getRootNode(n2));
    return shadowHost;
  }
  function getRootShadowHost(n2) {
    let rootShadowHost = n2;
    let shadowHost;
    while (shadowHost = getShadowHost(rootShadowHost))
      rootShadowHost = shadowHost;
    return rootShadowHost;
  }
  function shadowHostInDom(n2) {
    const doc = n2.ownerDocument;
    if (!doc) return false;
    const shadowHost = getRootShadowHost(n2);
    return index.contains(doc, shadowHost);
  }
  function inDom(n2) {
    const doc = n2.ownerDocument;
    if (!doc) return false;
    return index.contains(doc, n2) || shadowHostInDom(n2);
  }
  var utils = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    StyleSheetMirror: StyleSheetMirror2,
    get _mirror() {
      return _mirror2;
    },
    closestElementOfNode,
    getBaseDimension,
    getNestedRule,
    getPositionsAndIndex,
    getRootShadowHost,
    getShadowHost,
    getWindowHeight: getWindowHeight2,
    getWindowScroll,
    getWindowWidth: getWindowWidth2,
    hasShadowRoot: hasShadowRoot2,
    hookSetter: hookSetter2,
    inDom,
    isAncestorRemoved: isAncestorRemoved2,
    isBlocked: isBlocked2,
    isIgnored: isIgnored2,
    isSerialized: isSerialized2,
    isSerializedIframe: isSerializedIframe2,
    isSerializedStylesheet: isSerializedStylesheet2,
    iterateResolveTree,
    legacy_isTouchEvent,
    get nowTimestamp() {
      return nowTimestamp;
    },
    on: on2,
    patch: patch2,
    polyfill: polyfill$1,
    queueToResolveTrees,
    shadowHostInDom,
    throttle: throttle2,
    uniqueTextMutations
  }, Symbol.toStringTag, { value: "Module" }));
  var chars2 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var lookup2 = typeof Uint8Array === "undefined" ? [] : new Uint8Array(256);
  for (i$1 = 0; i$1 < chars2.length; i$1++) {
    lookup2[chars2.charCodeAt(i$1)] = i$1;
  }
  var i$1;
  var encodedJs = "KGZ1bmN0aW9uKCkgewogICJ1c2Ugc3RyaWN0IjsKICB2YXIgY2hhcnMgPSAiQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLyI7CiAgdmFyIGxvb2t1cCA9IHR5cGVvZiBVaW50OEFycmF5ID09PSAidW5kZWZpbmVkIiA/IFtdIDogbmV3IFVpbnQ4QXJyYXkoMjU2KTsKICBmb3IgKHZhciBpID0gMDsgaSA8IGNoYXJzLmxlbmd0aDsgaSsrKSB7CiAgICBsb29rdXBbY2hhcnMuY2hhckNvZGVBdChpKV0gPSBpOwogIH0KICB2YXIgZW5jb2RlID0gZnVuY3Rpb24oYXJyYXlidWZmZXIpIHsKICAgIHZhciBieXRlcyA9IG5ldyBVaW50OEFycmF5KGFycmF5YnVmZmVyKSwgaTIsIGxlbiA9IGJ5dGVzLmxlbmd0aCwgYmFzZTY0ID0gIiI7CiAgICBmb3IgKGkyID0gMDsgaTIgPCBsZW47IGkyICs9IDMpIHsKICAgICAgYmFzZTY0ICs9IGNoYXJzW2J5dGVzW2kyXSA+PiAyXTsKICAgICAgYmFzZTY0ICs9IGNoYXJzWyhieXRlc1tpMl0gJiAzKSA8PCA0IHwgYnl0ZXNbaTIgKyAxXSA+PiA0XTsKICAgICAgYmFzZTY0ICs9IGNoYXJzWyhieXRlc1tpMiArIDFdICYgMTUpIDw8IDIgfCBieXRlc1tpMiArIDJdID4+IDZdOwogICAgICBiYXNlNjQgKz0gY2hhcnNbYnl0ZXNbaTIgKyAyXSAmIDYzXTsKICAgIH0KICAgIGlmIChsZW4gJSAzID09PSAyKSB7CiAgICAgIGJhc2U2NCA9IGJhc2U2NC5zdWJzdHJpbmcoMCwgYmFzZTY0Lmxlbmd0aCAtIDEpICsgIj0iOwogICAgfSBlbHNlIGlmIChsZW4gJSAzID09PSAxKSB7CiAgICAgIGJhc2U2NCA9IGJhc2U2NC5zdWJzdHJpbmcoMCwgYmFzZTY0Lmxlbmd0aCAtIDIpICsgIj09IjsKICAgIH0KICAgIHJldHVybiBiYXNlNjQ7CiAgfTsKICBjb25zdCBsYXN0QmxvYk1hcCA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCk7CiAgY29uc3QgdHJhbnNwYXJlbnRCbG9iTWFwID0gLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKTsKICBhc3luYyBmdW5jdGlvbiBnZXRUcmFuc3BhcmVudEJsb2JGb3Iod2lkdGgsIGhlaWdodCwgZGF0YVVSTE9wdGlvbnMpIHsKICAgIGNvbnN0IGlkID0gYCR7d2lkdGh9LSR7aGVpZ2h0fWA7CiAgICBpZiAoIk9mZnNjcmVlbkNhbnZhcyIgaW4gZ2xvYmFsVGhpcykgewogICAgICBpZiAodHJhbnNwYXJlbnRCbG9iTWFwLmhhcyhpZCkpIHJldHVybiB0cmFuc3BhcmVudEJsb2JNYXAuZ2V0KGlkKTsKICAgICAgY29uc3Qgb2Zmc2NyZWVuID0gbmV3IE9mZnNjcmVlbkNhbnZhcyh3aWR0aCwgaGVpZ2h0KTsKICAgICAgb2Zmc2NyZWVuLmdldENvbnRleHQoIjJkIik7CiAgICAgIGNvbnN0IGJsb2IgPSBhd2FpdCBvZmZzY3JlZW4uY29udmVydFRvQmxvYihkYXRhVVJMT3B0aW9ucyk7CiAgICAgIGNvbnN0IGFycmF5QnVmZmVyID0gYXdhaXQgYmxvYi5hcnJheUJ1ZmZlcigpOwogICAgICBjb25zdCBiYXNlNjQgPSBlbmNvZGUoYXJyYXlCdWZmZXIpOwogICAgICB0cmFuc3BhcmVudEJsb2JNYXAuc2V0KGlkLCBiYXNlNjQpOwogICAgICByZXR1cm4gYmFzZTY0OwogICAgfSBlbHNlIHsKICAgICAgcmV0dXJuICIiOwogICAgfQogIH0KICBjb25zdCB3b3JrZXIgPSBzZWxmOwogIHdvcmtlci5vbm1lc3NhZ2UgPSBhc3luYyBmdW5jdGlvbihlKSB7CiAgICBpZiAoIk9mZnNjcmVlbkNhbnZhcyIgaW4gZ2xvYmFsVGhpcykgewogICAgICBjb25zdCB7IGlkLCBiaXRtYXAsIHdpZHRoLCBoZWlnaHQsIGRhdGFVUkxPcHRpb25zIH0gPSBlLmRhdGE7CiAgICAgIGNvbnN0IHRyYW5zcGFyZW50QmFzZTY0ID0gZ2V0VHJhbnNwYXJlbnRCbG9iRm9yKAogICAgICAgIHdpZHRoLAogICAgICAgIGhlaWdodCwKICAgICAgICBkYXRhVVJMT3B0aW9ucwogICAgICApOwogICAgICBjb25zdCBvZmZzY3JlZW4gPSBuZXcgT2Zmc2NyZWVuQ2FudmFzKHdpZHRoLCBoZWlnaHQpOwogICAgICBjb25zdCBjdHggPSBvZmZzY3JlZW4uZ2V0Q29udGV4dCgiMmQiKTsKICAgICAgY3R4LmRyYXdJbWFnZShiaXRtYXAsIDAsIDApOwogICAgICBiaXRtYXAuY2xvc2UoKTsKICAgICAgY29uc3QgYmxvYiA9IGF3YWl0IG9mZnNjcmVlbi5jb252ZXJ0VG9CbG9iKGRhdGFVUkxPcHRpb25zKTsKICAgICAgY29uc3QgdHlwZSA9IGJsb2IudHlwZTsKICAgICAgY29uc3QgYXJyYXlCdWZmZXIgPSBhd2FpdCBibG9iLmFycmF5QnVmZmVyKCk7CiAgICAgIGNvbnN0IGJhc2U2NCA9IGVuY29kZShhcnJheUJ1ZmZlcik7CiAgICAgIGlmICghbGFzdEJsb2JNYXAuaGFzKGlkKSAmJiBhd2FpdCB0cmFuc3BhcmVudEJhc2U2NCA9PT0gYmFzZTY0KSB7CiAgICAgICAgbGFzdEJsb2JNYXAuc2V0KGlkLCBiYXNlNjQpOwogICAgICAgIHJldHVybiB3b3JrZXIucG9zdE1lc3NhZ2UoeyBpZCB9KTsKICAgICAgfQogICAgICBpZiAobGFzdEJsb2JNYXAuZ2V0KGlkKSA9PT0gYmFzZTY0KSByZXR1cm4gd29ya2VyLnBvc3RNZXNzYWdlKHsgaWQgfSk7CiAgICAgIHdvcmtlci5wb3N0TWVzc2FnZSh7CiAgICAgICAgaWQsCiAgICAgICAgdHlwZSwKICAgICAgICBiYXNlNjQsCiAgICAgICAgd2lkdGgsCiAgICAgICAgaGVpZ2h0CiAgICAgIH0pOwogICAgICBsYXN0QmxvYk1hcC5zZXQoaWQsIGJhc2U2NCk7CiAgICB9IGVsc2UgewogICAgICByZXR1cm4gd29ya2VyLnBvc3RNZXNzYWdlKHsgaWQ6IGUuZGF0YS5pZCB9KTsKICAgIH0KICB9Owp9KSgpOwovLyMgc291cmNlTWFwcGluZ1VSTD1pbWFnZS1iaXRtYXAtZGF0YS11cmwtd29ya2VyLUlKcEM3Z19iLmpzLm1hcAo=";
  var decodeBase643 = (base64) => Uint8Array.from(atob(base64), (c2) => c2.charCodeAt(0));
  typeof window !== "undefined" && window.Blob && new Blob([decodeBase643(encodedJs)], { type: "text/javascript;charset=utf-8" });
  try {
    if (Array.from([1], (x2) => x2 * 2)[0] !== 2) {
      const cleanFrame = document.createElement("iframe");
      document.body.appendChild(cleanFrame);
      Array.from = ((_a = cleanFrame.contentWindow) == null ? void 0 : _a.Array.from) || Array.from;
      document.body.removeChild(cleanFrame);
    }
  } catch (err) {
    console.debug("Unable to override Array.from", err);
  }
  createMirror$2();
  var n;
  !function(t2) {
    t2[t2.NotStarted = 0] = "NotStarted", t2[t2.Running = 1] = "Running", t2[t2.Stopped = 2] = "Stopped";
  }(n || (n = {}));
  var StackFrame = class {
    constructor(obj) {
      __publicField(this, "fileName");
      __publicField(this, "functionName");
      __publicField(this, "lineNumber");
      __publicField(this, "columnNumber");
      this.fileName = obj.fileName || "";
      this.functionName = obj.functionName || "";
      this.lineNumber = obj.lineNumber;
      this.columnNumber = obj.columnNumber;
    }
    toString() {
      const lineNumber = this.lineNumber || "";
      const columnNumber = this.columnNumber || "";
      if (this.functionName)
        return `${this.functionName} (${this.fileName}:${lineNumber}:${columnNumber})`;
      return `${this.fileName}:${lineNumber}:${columnNumber}`;
    }
  };
  var FIREFOX_SAFARI_STACK_REGEXP = /(^|@)\S+:\d+/;
  var CHROME_IE_STACK_REGEXP = /^\s*at .*(\S+:\d+|\(native\))/m;
  var SAFARI_NATIVE_CODE_REGEXP = /^(eval@)?(\[native code])?$/;
  var ErrorStackParser = {
    /**
     * Given an Error object, extract the most information from it.
     */
    parse: function(error) {
      if (!error) {
        return [];
      }
      if (
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        typeof error.stacktrace !== "undefined" || // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        typeof error["opera#sourceloc"] !== "undefined"
      ) {
        return this.parseOpera(
          error
        );
      } else if (error.stack && error.stack.match(CHROME_IE_STACK_REGEXP)) {
        return this.parseV8OrIE(error);
      } else if (error.stack) {
        return this.parseFFOrSafari(error);
      } else {
        console.warn(
          "[console-record-plugin]: Failed to parse error object:",
          error
        );
        return [];
      }
    },
    // Separate line and column numbers from a string of the form: (URI:Line:Column)
    extractLocation: function(urlLike) {
      if (urlLike.indexOf(":") === -1) {
        return [urlLike];
      }
      const regExp = /(.+?)(?::(\d+))?(?::(\d+))?$/;
      const parts = regExp.exec(urlLike.replace(/[()]/g, ""));
      if (!parts) throw new Error(`Cannot parse given url: ${urlLike}`);
      return [parts[1], parts[2] || void 0, parts[3] || void 0];
    },
    parseV8OrIE: function(error) {
      const filtered = error.stack.split("\n").filter(function(line) {
        return !!line.match(CHROME_IE_STACK_REGEXP);
      }, this);
      return filtered.map(function(line) {
        if (line.indexOf("(eval ") > -1) {
          line = line.replace(/eval code/g, "eval").replace(/(\(eval at [^()]*)|(\),.*$)/g, "");
        }
        let sanitizedLine = line.replace(/^\s+/, "").replace(/\(eval code/g, "(");
        const location = sanitizedLine.match(/ (\((.+):(\d+):(\d+)\)$)/);
        sanitizedLine = location ? sanitizedLine.replace(location[0], "") : sanitizedLine;
        const tokens = sanitizedLine.split(/\s+/).slice(1);
        const locationParts = this.extractLocation(
          location ? location[1] : tokens.pop()
        );
        const functionName = tokens.join(" ") || void 0;
        const fileName = ["eval", "<anonymous>"].indexOf(locationParts[0]) > -1 ? void 0 : locationParts[0];
        return new StackFrame({
          functionName,
          fileName,
          lineNumber: locationParts[1],
          columnNumber: locationParts[2]
        });
      }, this);
    },
    parseFFOrSafari: function(error) {
      const filtered = error.stack.split("\n").filter(function(line) {
        return !line.match(SAFARI_NATIVE_CODE_REGEXP);
      }, this);
      return filtered.map(function(line) {
        if (line.indexOf(" > eval") > -1) {
          line = line.replace(
            / line (\d+)(?: > eval line \d+)* > eval:\d+:\d+/g,
            ":$1"
          );
        }
        if (line.indexOf("@") === -1 && line.indexOf(":") === -1) {
          return new StackFrame({
            functionName: line
          });
        } else {
          const functionNameRegex = /((.*".+"[^@]*)?[^@]*)(?:@)/;
          const matches = line.match(functionNameRegex);
          const functionName = matches && matches[1] ? matches[1] : void 0;
          const locationParts = this.extractLocation(
            line.replace(functionNameRegex, "")
          );
          return new StackFrame({
            functionName,
            fileName: locationParts[0],
            lineNumber: locationParts[1],
            columnNumber: locationParts[2]
          });
        }
      }, this);
    },
    parseOpera: function(e) {
      if (!e.stacktrace || e.message.indexOf("\n") > -1 && e.message.split("\n").length > e.stacktrace.split("\n").length) {
        return this.parseOpera9(e);
      } else if (!e.stack) {
        return this.parseOpera10(e);
      } else {
        return this.parseOpera11(e);
      }
    },
    parseOpera9: function(e) {
      const lineRE = /Line (\d+).*script (?:in )?(\S+)/i;
      const lines = e.message.split("\n");
      const result2 = [];
      for (let i = 2, len = lines.length; i < len; i += 2) {
        const match = lineRE.exec(lines[i]);
        if (match) {
          result2.push(
            new StackFrame({
              fileName: match[2],
              lineNumber: parseFloat(match[1])
            })
          );
        }
      }
      return result2;
    },
    parseOpera10: function(e) {
      const lineRE = /Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i;
      const lines = e.stacktrace.split("\n");
      const result2 = [];
      for (let i = 0, len = lines.length; i < len; i += 2) {
        const match = lineRE.exec(lines[i]);
        if (match) {
          result2.push(
            new StackFrame({
              functionName: match[3] || void 0,
              fileName: match[2],
              lineNumber: parseFloat(match[1])
            })
          );
        }
      }
      return result2;
    },
    // Opera 10.65+ Error.stack very similar to FF/Safari
    parseOpera11: function(error) {
      const filtered = error.stack.split("\n").filter(function(line) {
        return !!line.match(FIREFOX_SAFARI_STACK_REGEXP) && !line.match(/^Error created at/);
      }, this);
      return filtered.map(function(line) {
        const tokens = line.split("@");
        const locationParts = this.extractLocation(tokens.pop());
        const functionCall = tokens.shift() || "";
        const functionName = functionCall.replace(/<anonymous function(: (\w+))?>/, "$2").replace(/\([^)]*\)/g, "") || void 0;
        return new StackFrame({
          functionName,
          fileName: locationParts[0],
          lineNumber: locationParts[1],
          columnNumber: locationParts[2]
        });
      }, this);
    }
  };
  function pathToSelector(node2) {
    if (!node2 || !node2.outerHTML) {
      return "";
    }
    let path = "";
    while (node2.parentElement) {
      let name = node2.localName;
      if (!name) {
        break;
      }
      name = name.toLowerCase();
      const parent = node2.parentElement;
      const domSiblings = [];
      if (parent.children && parent.children.length > 0) {
        for (let i = 0; i < parent.children.length; i++) {
          const sibling = parent.children[i];
          if (sibling.localName && sibling.localName.toLowerCase) {
            if (sibling.localName.toLowerCase() === name) {
              domSiblings.push(sibling);
            }
          }
        }
      }
      if (domSiblings.length > 1) {
        name += `:eq(${domSiblings.indexOf(node2)})`;
      }
      path = name + (path ? ">" + path : "");
      node2 = parent;
    }
    return path;
  }
  function isObject(obj) {
    return Object.prototype.toString.call(obj) === "[object Object]";
  }
  function isObjTooDeep(obj, limit) {
    if (limit === 0) {
      return true;
    }
    const keys = Object.keys(obj);
    for (const key of keys) {
      if (isObject(obj[key]) && isObjTooDeep(obj[key], limit - 1)) {
        return true;
      }
    }
    return false;
  }
  function stringify(obj, stringifyOptions) {
    const options = {
      numOfKeysLimit: 50,
      depthOfLimit: 4
    };
    Object.assign(options, stringifyOptions);
    const stack = [];
    const keys = [];
    return JSON.stringify(
      obj,
      function(key, value) {
        if (stack.length > 0) {
          const thisPos = stack.indexOf(this);
          ~thisPos ? stack.splice(thisPos + 1) : stack.push(this);
          ~thisPos ? keys.splice(thisPos, Infinity, key) : keys.push(key);
          if (~stack.indexOf(value)) {
            if (stack[0] === value) {
              value = "[Circular ~]";
            } else {
              value = "[Circular ~." + keys.slice(0, stack.indexOf(value)).join(".") + "]";
            }
          }
        } else {
          stack.push(value);
        }
        if (value === null) return value;
        if (value === void 0) return "undefined";
        if (shouldIgnore(value)) {
          return toString2(value);
        }
        if (typeof value === "bigint") {
          return value.toString() + "n";
        }
        if (value instanceof Event) {
          const eventResult = {};
          for (const eventKey in value) {
            const eventValue = value[eventKey];
            if (Array.isArray(eventValue)) {
              eventResult[eventKey] = pathToSelector(
                eventValue.length ? eventValue[0] : null
              );
            } else {
              eventResult[eventKey] = eventValue;
            }
          }
          return eventResult;
        } else if (value instanceof Node) {
          if (value instanceof HTMLElement) {
            return value ? value.outerHTML : "";
          }
          return value.nodeName;
        } else if (value instanceof Error) {
          return value.stack ? value.stack + "\nEnd of stack for Error object" : value.name + ": " + value.message;
        }
        return value;
      }
    );
    function shouldIgnore(_obj) {
      if (isObject(_obj) && Object.keys(_obj).length > options.numOfKeysLimit) {
        return true;
      }
      if (typeof _obj === "function") {
        return true;
      }
      if (isObject(_obj) && isObjTooDeep(_obj, options.depthOfLimit)) {
        return true;
      }
      return false;
    }
    function toString2(_obj) {
      let str = _obj.toString();
      if (options.stringLengthLimit && str.length > options.stringLengthLimit) {
        str = `${str.slice(0, options.stringLengthLimit)}...`;
      }
      return str;
    }
  }
  var defaultLogOptions = {
    level: [
      "assert",
      "clear",
      "count",
      "countReset",
      "debug",
      "dir",
      "dirxml",
      "error",
      "group",
      "groupCollapsed",
      "groupEnd",
      "info",
      "log",
      "table",
      "time",
      "timeEnd",
      "timeLog",
      "trace",
      "warn"
    ],
    lengthThreshold: 1e3,
    logger: "console"
  };
  function initLogObserver(cb, win, options) {
    const logOptions = options ? Object.assign({}, defaultLogOptions, options) : defaultLogOptions;
    const loggerType = logOptions.logger;
    if (!loggerType) {
      return () => {
      };
    }
    let logger2;
    if (typeof loggerType === "string") {
      logger2 = win[loggerType];
    } else {
      logger2 = loggerType;
    }
    let logCount = 0;
    let inStack = false;
    const cancelHandlers = [];
    if (logOptions.level.includes("error")) {
      const errorHandler = (event) => {
        const message = event.message, error = event.error;
        const trace = ErrorStackParser.parse(error).map(
          (stackFrame) => stackFrame.toString()
        );
        const payload = [stringify(message, logOptions.stringifyOptions)];
        cb({
          level: "error",
          trace,
          payload
        });
      };
      win.addEventListener("error", errorHandler);
      cancelHandlers.push(() => {
        win.removeEventListener("error", errorHandler);
      });
      const unhandledrejectionHandler = (event) => {
        let error;
        let payload;
        if (event.reason instanceof Error) {
          error = event.reason;
          payload = [
            stringify(
              `Uncaught (in promise) ${error.name}: ${error.message}`,
              logOptions.stringifyOptions
            )
          ];
        } else {
          error = new Error();
          payload = [
            stringify("Uncaught (in promise)", logOptions.stringifyOptions),
            stringify(event.reason, logOptions.stringifyOptions)
          ];
        }
        const trace = ErrorStackParser.parse(error).map(
          (stackFrame) => stackFrame.toString()
        );
        cb({
          level: "error",
          trace,
          payload
        });
      };
      win.addEventListener("unhandledrejection", unhandledrejectionHandler);
      cancelHandlers.push(() => {
        win.removeEventListener("unhandledrejection", unhandledrejectionHandler);
      });
    }
    for (const levelType of logOptions.level) {
      cancelHandlers.push(replace(logger2, levelType));
    }
    return () => {
      cancelHandlers.forEach((h) => h());
    };
    function replace(_logger, level) {
      if (!_logger[level]) {
        return () => {
        };
      }
      return utils.patch(
        _logger,
        level,
        (original) => {
          return (...args) => {
            original.apply(this, args);
            if (level === "assert" && !!args[0]) {
              return;
            }
            if (inStack) {
              return;
            }
            inStack = true;
            try {
              const trace = ErrorStackParser.parse(new Error()).map((stackFrame) => stackFrame.toString()).splice(1);
              const argsForPayload = level === "assert" ? args.slice(1) : args;
              const payload = argsForPayload.map(
                (s) => stringify(s, logOptions.stringifyOptions)
              );
              logCount++;
              if (logCount < logOptions.lengthThreshold) {
                cb({
                  level,
                  trace,
                  payload
                });
              } else if (logCount === logOptions.lengthThreshold) {
                cb({
                  level: "warn",
                  trace: [],
                  payload: [
                    stringify("The number of log records reached the threshold.")
                  ]
                });
              }
            } catch (error) {
              original("rrweb logger error:", error, ...args);
            } finally {
              inStack = false;
            }
          };
        }
      );
    }
  }
  var PLUGIN_NAME = "rrweb/console@1";
  var getRecordConsolePlugin = (options) => ({
    name: PLUGIN_NAME,
    observer: initLogObserver,
    options
  });

  // ../src/common/defaults.ts
  var ACTIVE_SOURCES = [
    IncrementalSource.MouseMove,
    IncrementalSource.MouseInteraction,
    IncrementalSource.Scroll,
    IncrementalSource.ViewportResize,
    IncrementalSource.Input,
    IncrementalSource.TouchMove,
    IncrementalSource.MediaInteraction,
    IncrementalSource.Drag
  ];
  var INCREMENTAL_SNAPSHOT_EVENT_TYPE = 3;
  var MUTATION_SOURCE_TYPE = 0;
  var SEVEN_MEGABYTES = 1024 * 1024 * 7 * 0.9;

  // ../src/utils/type-utils.ts
  var nativeIsArray = Array.isArray;
  var ObjProto = Object.prototype;
  var hasOwnProperty = ObjProto.hasOwnProperty;
  var toString = ObjProto.toString;
  var isNumber = (x2) => {
    return toString.call(x2) == "[object Number]";
  };

  // ../src/utils/sessionrecording-utils.ts
  function sessionRecordingUrlTriggerMatches(url, triggers) {
    return triggers.some((trigger) => {
      switch (trigger.matching) {
        case "regex":
          return new RegExp(trigger.url).test(url);
        default:
          return false;
      }
    });
  }

  // ../src/utils/number-utils.ts
  function clampToRange(value, min, max, label, fallbackValue) {
    if (min > max) {
      min = max;
    }
    if (!isNumber(value)) {
      return clampToRange(fallbackValue || max, min, max, label);
    } else if (value > max) {
      return max;
    } else if (value < min) {
      return min;
    } else {
      return value;
    }
  }

  // ../src/common/services/MutationRateLimiter.ts
  var MutationRateLimiter = class {
    constructor(rrweb, options = {}) {
      this.rrweb = rrweb;
      this.options = options;
      this.bucketSize = 100;
      this.refillRate = 10;
      this.mutationBuckets = {};
      this.loggedTracker = {};
      this.refillBuckets = () => {
        Object.keys(this.mutationBuckets).forEach((key) => {
          this.mutationBuckets[key] = this.mutationBuckets[key] + this.refillRate;
          if (this.mutationBuckets[key] >= this.bucketSize) {
            delete this.mutationBuckets[key];
          }
        });
      };
      this.getNodeOrRelevantParent = (id) => {
        const node2 = this.rrweb.mirror.getNode(id);
        if (node2?.nodeName !== "svg" && node2 instanceof Element) {
          const closestSVG = node2.closest("svg");
          if (closestSVG) {
            return [this.rrweb.mirror.getId(closestSVG), closestSVG];
          }
        }
        return [id, node2];
      };
      this.numberOfChanges = (data) => {
        return (data.removes?.length ?? 0) + (data.attributes?.length ?? 0) + (data.texts?.length ?? 0) + (data.adds?.length ?? 0);
      };
      this.throttleMutations = (event) => {
        if (event.type !== INCREMENTAL_SNAPSHOT_EVENT_TYPE || event.data.source !== MUTATION_SOURCE_TYPE) {
          return false;
        }
        const data = event.data;
        const initialMutationCount = this.numberOfChanges(data);
        if (data.attributes) {
          data.attributes = data.attributes.filter((attr) => {
            const [nodeId, node2] = this.getNodeOrRelevantParent(attr.id);
            if (this.mutationBuckets[nodeId] === 0) {
              return false;
            }
            this.mutationBuckets[nodeId] = this.mutationBuckets[nodeId] ?? this.bucketSize;
            this.mutationBuckets[nodeId] = Math.max(
              this.mutationBuckets[nodeId] - 1,
              0
            );
            if (this.mutationBuckets[nodeId] === 0) {
              if (!this.loggedTracker[nodeId]) {
                this.loggedTracker[nodeId] = true;
                this.options.onBlockedNode?.(nodeId, node2);
              }
            }
            return attr;
          });
        }
        const mutationCount = this.numberOfChanges(data);
        if (mutationCount === 0 && initialMutationCount !== mutationCount) {
          return true;
        }
        return false;
      };
      this.refillRate = clampToRange(
        this.options.refillRate ?? this.refillRate,
        0,
        100,
        "mutation throttling refill rate"
      );
      this.bucketSize = clampToRange(
        this.options.bucketSize ?? this.bucketSize,
        0,
        100,
        "mutation throttling bucket size"
      );
      setInterval(() => {
        this.refillBuckets();
      }, 1e3);
    }
  };

  // ../src/utils/logger.ts
  var Logger = class _Logger {
    constructor() {
      this.isDebugEnabled = false;
    }
    static getInstance() {
      if (!_Logger.instance) {
        _Logger.instance = new _Logger();
      }
      return _Logger.instance;
    }
    configure(config) {
      this.isDebugEnabled = !!config.debug;
    }
    debug(...args) {
      if (this.isDebugEnabled) {
        console.debug("[SDK] ", ...args);
      }
    }
    warn(...args) {
      if (this.isDebugEnabled) {
        console.warn("[SDK] ", ...args);
      }
    }
    error(...args) {
      if (this.isDebugEnabled) {
        console.error("[SDK] ", ...args);
      }
    }
    forceLog(level, ...args) {
      console[level](...args);
    }
  };
  var logger = Logger.getInstance();

  // ../src/SessionRecorder.ts
  var SessionRecorder = class {
    constructor(config = {}) {
      this.events = [];
      this._isRecording = false;
      this._isPaused = false;
      this._isUrlBlocked = false;
      this.config = {
        staleThreshold: config.staleThreshold ?? 36e5,
        // 1 hour default
        console: {
          lengthThreshold: config.console?.lengthThreshold ?? 1e3,
          level: config.console?.level ?? ["log", "info", "warn", "error"],
          logger: config.console?.logger ?? "console",
          stringifyOptions: config.console?.stringifyOptions ?? {
            stringLengthLimit: 1e3,
            numOfKeysLimit: 100,
            depthOfLimit: 10
          }
        },
        urlBlocklist: config.urlBlocklist ?? [],
        maxEvents: config.maxEvents ?? 1e4,
        sampling: {
          mousemove: config.sampling?.mousemove ?? 50,
          scroll: config.sampling?.scroll ?? 50,
          input: config.sampling?.input ?? "all"
        },
        blockClass: config.blockClass ?? "perceptr-block",
        ignoreClass: config.ignoreClass ?? "perceptr-ignore",
        maskTextClass: config.maskTextClass ?? "perceptr-mask",
        blockSelector: config.blockSelector ?? "",
        maskTextSelector: config.maskTextSelector ?? "",
        idleTimeout: config.idleTimeout ?? 1e4
        // 10 seconds default
      };
      this._mutationConfig = {
        enabled: true,
        bucketSize: 100,
        refillRate: 10
      };
      this.mutationRateLimiter = new MutationRateLimiter(record, {
        bucketSize: this._mutationConfig.bucketSize,
        refillRate: this._mutationConfig.refillRate,
        onBlockedNode: (id, node2) => {
          logger.debug(`Throttling mutations for node ${id}`, node2);
        }
      });
    }
    startSession() {
      if (this._isRecording) {
        return;
      }
      this.stopFn = record({
        emit: (event) => {
          if (this._mutationConfig.enabled) {
            const throttledEvent = this.mutationRateLimiter.throttleMutations(event);
            if (throttledEvent) return;
          }
          this._canAddEvent(event);
        },
        checkoutEveryNms: 1e4,
        // takes a snapshot every 10 seconds event 2
        plugins: [
          // event type === '6' is console log
          getRecordConsolePlugin({
            lengthThreshold: this.config.console?.lengthThreshold,
            level: this.config.console?.level,
            logger: this.config.console?.logger,
            stringifyOptions: this.config.console?.stringifyOptions
          })
        ],
        sampling: this.config.sampling,
        blockClass: this.config.blockClass,
        ignoreClass: this.config.ignoreClass,
        maskTextClass: this.config.maskTextClass,
        blockSelector: this.config.blockSelector,
        maskTextSelector: this.config.maskTextSelector,
        inlineStylesheet: true,
        recordCrossOriginIframes: true
      });
      this._isRecording = true;
      this._isPaused = false;
      this._resetIdleTimeout();
    }
    stopSession() {
      if (!this._isRecording) {
        logger.warn("No active recording session");
        return;
      }
      if (this.stopFn) {
        this.stopFn();
      }
      this.events = [];
      this._isRecording = false;
      this._isPaused = false;
      if (this._idleTimeout) {
        clearTimeout(this._idleTimeout);
      }
    }
    pause() {
      if (!this._isRecording || this._isPaused) {
        return;
      }
      this._isPaused = true;
      logger.debug("Recording paused");
    }
    resume() {
      if (!this._isRecording || !this._isPaused) {
        return;
      }
      this._isPaused = false;
      logger.debug("Recording resumed");
    }
    _canAddEvent(event) {
      if (this._isInteractiveEvent(event) && !this._isUrlBlocked) {
        this._resetIdleTimeout();
        this.resume();
      }
      if (this._isRecording && this._isPaused) {
        return false;
      }
      if (event.type === EventType.Meta) {
        this._checkMetaEvent(event);
      } else {
        this._pageViewFallBack();
      }
      this.events.push(event);
      if (this.events.length > this.config.maxEvents) {
        this.events.shift();
      }
      return true;
    }
    _checkMetaEvent(event) {
      const href = event.data.href;
      if (!href) {
        return false;
      }
      this._lastHref = href;
      this._shouldBlockUrl(href);
    }
    _pageViewFallBack() {
      if (typeof window === "undefined" || !window.location.href) {
        return;
      }
      const currentUrl = window.location.href;
      if (this._lastHref !== currentUrl) {
        this._lastHref = currentUrl;
        this.addCustomEvent("$url_changed", { href: currentUrl });
        this._shouldBlockUrl(currentUrl);
      }
    }
    _shouldBlockUrl(url) {
      if (typeof window === "undefined" || !window.location.href) {
        return;
      }
      const isNowBlocked = sessionRecordingUrlTriggerMatches(
        url,
        this.config.urlBlocklist
      );
      this._isUrlBlocked = isNowBlocked;
      if (isNowBlocked && !this._isPaused) {
        this.pause();
      } else if (!isNowBlocked && this._isPaused) {
        this.resume();
      }
    }
    _resetIdleTimeout() {
      if (this._idleTimeout) {
        clearTimeout(this._idleTimeout);
      }
      this._idleTimeout = setTimeout(() => {
        if (this._isRecording && !this._isPaused) {
          this.pause();
          this._idleTimeout = void 0;
        }
      }, this.config.idleTimeout);
    }
    _isInteractiveEvent(event) {
      return event.type === INCREMENTAL_SNAPSHOT_EVENT_TYPE && ACTIVE_SOURCES.indexOf(event.data?.source) !== -1;
    }
    /**
     * Get the recording events
     * @returns The recording events
     */
    getRecordingEvents() {
      if (!this._isRecording) {
        throw new Error("No active recording session");
      }
      return this.events;
    }
    onEvent(callback) {
      const originalAddEvent = this._canAddEvent;
      this._canAddEvent = (event) => {
        const canBeAdded = originalAddEvent.call(this, event);
        if (canBeAdded) {
          callback(event);
        }
        return canBeAdded;
      };
      return () => {
        this._canAddEvent = originalAddEvent;
      };
    }
    /**
     * Add a custom event to the recording
     * @param name - Event name
     * @param payload - Event data
     */
    addCustomEvent(name, payload) {
      if (!this._isRecording) {
        logger.warn("Cannot add custom event: No active recording session");
        return;
      }
      try {
        record.addCustomEvent(name, payload);
      } catch (error) {
        logger.error(`Failed to add custom event: ${name}`, error);
      }
    }
  };

  // ../node_modules/uuid/dist/esm-browser/stringify.js
  var byteToHex = [];
  for (let i = 0; i < 256; ++i) {
    byteToHex.push((i + 256).toString(16).slice(1));
  }
  function unsafeStringify(arr, offset = 0) {
    return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
  }

  // ../node_modules/uuid/dist/esm-browser/rng.js
  var getRandomValues;
  var rnds8 = new Uint8Array(16);
  function rng() {
    if (!getRandomValues) {
      if (typeof crypto === "undefined" || !crypto.getRandomValues) {
        throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
      }
      getRandomValues = crypto.getRandomValues.bind(crypto);
    }
    return getRandomValues(rnds8);
  }

  // ../node_modules/uuid/dist/esm-browser/native.js
  var randomUUID = typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID.bind(crypto);
  var native_default = { randomUUID };

  // ../node_modules/uuid/dist/esm-browser/v4.js
  function v4(options, buf, offset) {
    if (native_default.randomUUID && !buf && !options) {
      return native_default.randomUUID();
    }
    options = options || {};
    const rnds = options.random ?? options.rng?.() ?? rng();
    if (rnds.length < 16) {
      throw new Error("Random bytes length must be >= 16");
    }
    rnds[6] = rnds[6] & 15 | 64;
    rnds[8] = rnds[8] & 63 | 128;
    if (buf) {
      offset = offset || 0;
      if (offset < 0 || offset + 16 > buf.length) {
        throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
      }
      for (let i = 0; i < 16; ++i) {
        buf[offset + i] = rnds[i];
      }
      return buf;
    }
    return unsafeStringify(rnds);
  }
  var v4_default = v4;

  // ../src/NetworkMonitor.ts
  var NetworkMonitor = class {
    constructor(config = {}, startTime) {
      this.requests = [];
      this.isEnabled = false;
      this.config = {
        maxRequests: 1e3,
        sanitizeHeaders: ["authorization", "cookie", "x-auth-token"],
        sanitizeParams: [
          "password",
          "token",
          "secret",
          "key",
          "apikey",
          "api_key",
          "access_token"
        ],
        sanitizeBodyFields: [
          "password",
          "token",
          "secret",
          "key",
          "apikey",
          "api_key",
          "access_token",
          "credit_card",
          "creditCard",
          "cvv",
          "ssn"
        ],
        captureRequestBody: true,
        captureResponseBody: true,
        maxBodySize: 100 * 1024,
        // 100KB default
        excludeUrls: [/\/logs$/, /\/health$/]
      };
      this.startTime = startTime;
      this.config = { ...this.config, ...config };
      this.originalFetch = window.fetch;
      this.originalXHROpen = XMLHttpRequest.prototype.open;
      this.originalXHRSend = XMLHttpRequest.prototype.send;
    }
    enable() {
      if (this.isEnabled) {
        logger.warn("NetworkMonitor already enabled");
        return;
      }
      this.patchFetch();
      this.patchXHR();
      this.isEnabled = true;
    }
    disable() {
      if (!this.isEnabled) {
        logger.warn("NetworkMonitor already disabled");
        return;
      }
      window.fetch = this.originalFetch;
      XMLHttpRequest.prototype.open = this.originalXHROpen;
      XMLHttpRequest.prototype.send = this.originalXHRSend;
      this.isEnabled = false;
    }
    getRequests() {
      return this.requests;
    }
    clearRequests() {
      this.requests = [];
    }
    shouldCaptureUrl(url) {
      return !this.config.excludeUrls.some((pattern) => pattern.test(url)) && !url.includes("/per/");
    }
    sanitizeUrl(url) {
      try {
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.search);
        let sanitized = false;
        for (const [key] of params.entries()) {
          if (this.shouldSanitizeParam(key)) {
            params.set(key, "[REDACTED]");
            sanitized = true;
          }
        }
        if (sanitized) {
          urlObj.search = params.toString();
          return urlObj.toString();
        }
      } catch (e) {
      }
      return url;
    }
    shouldSanitizeParam(param) {
      return this.config.sanitizeParams.some(
        (pattern) => param.toLowerCase().includes(pattern.toLowerCase())
      );
    }
    sanitizeHeaders(headers) {
      const sanitized = { ...headers };
      for (const key of Object.keys(sanitized)) {
        if (this.config.sanitizeHeaders.includes(key.toLowerCase())) {
          sanitized[key] = "[REDACTED]";
        }
      }
      return sanitized;
    }
    sanitizeBody(body) {
      if (!body) return body;
      if (typeof body === "string") {
        try {
          const parsed = JSON.parse(body);
          return JSON.stringify(this.sanitizeObjectBody(parsed));
        } catch (e) {
          return this.truncateBody(body);
        }
      }
      if (body instanceof FormData) {
        const sanitized = new FormData();
        for (const [key, value] of body.entries()) {
          if (this.shouldSanitizeBodyField(key)) {
            sanitized.append(key, "[REDACTED]");
          } else {
            sanitized.append(key, value);
          }
        }
        return sanitized;
      }
      if (body instanceof URLSearchParams) {
        const sanitized = new URLSearchParams();
        for (const [key, value] of body.entries()) {
          if (this.shouldSanitizeBodyField(key)) {
            sanitized.append(key, "[REDACTED]");
          } else {
            sanitized.append(key, value);
          }
        }
        return sanitized;
      }
      if (typeof body === "object" && body !== null) {
        return this.sanitizeObjectBody(body);
      }
      return this.truncateBody(body);
    }
    sanitizeObjectBody(obj) {
      if (Array.isArray(obj)) {
        return obj.map((item) => this.sanitizeObjectBody(item));
      }
      if (typeof obj === "object" && obj !== null) {
        const result2 = { ...obj };
        for (const key in result2) {
          if (this.shouldSanitizeBodyField(key)) {
            result2[key] = "[REDACTED]";
          } else if (typeof result2[key] === "object" && result2[key] !== null) {
            result2[key] = this.sanitizeObjectBody(result2[key]);
          }
        }
        return result2;
      }
      return obj;
    }
    shouldSanitizeBodyField(field) {
      return this.config.sanitizeBodyFields.some(
        (pattern) => field.toLowerCase().includes(pattern.toLowerCase())
      );
    }
    truncateBody(body) {
      if (typeof body === "string" && body.length > this.config.maxBodySize) {
        return body.substring(0, this.config.maxBodySize) + "... [truncated]";
      }
      return body;
    }
    addRequest(request) {
      this.requests.push(request);
      if (this.requests.length > this.config.maxRequests) {
        this.requests.shift();
      }
    }
    getVideoTimestamp(timestamp) {
      const seconds = Math.floor((timestamp - this.startTime) / 1e3);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const remainingSeconds = seconds % 60;
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    }
    patchFetch() {
      window.fetch = async (input2, init) => {
        if (!this.shouldCaptureUrl(input2.toString())) {
          return this.originalFetch(input2, init);
        }
        const startRequestTime = Date.now();
        const requestId = v4_default();
        let requestBody = void 0;
        if (this.config.captureRequestBody && init?.body) {
          requestBody = this.sanitizeBody(init.body);
        }
        try {
          const response = await this.originalFetch(input2, init);
          const duration = Date.now() - startRequestTime;
          const requestHeaders = init?.headers ? this.sanitizeHeaders(
            Object.fromEntries(new Headers(init.headers).entries())
          ) : {};
          const responseHeaders = this.sanitizeHeaders(
            Object.fromEntries(response.headers.entries())
          );
          const request = {
            type: 7,
            id: requestId,
            timestamp: startRequestTime,
            video_timestamp: this.getVideoTimestamp(startRequestTime),
            duration,
            method: init?.method || "GET",
            url: this.sanitizeUrl(input2.toString()),
            status: response.status,
            statusText: response.statusText,
            requestHeaders,
            responseHeaders
          };
          if (requestBody) {
            request.requestBody = requestBody;
          }
          if (this.config.captureResponseBody) {
            const clonedResponse = response.clone();
            try {
              const responseText = await clonedResponse.text();
              request.responseBody = this.sanitizeBody(responseText);
            } catch (e) {
            }
          }
          this.addRequest(request);
          return response;
        } catch (error) {
          const duration = Date.now() - startRequestTime;
          this.addRequest({
            type: 7,
            id: requestId,
            timestamp: startRequestTime,
            video_timestamp: this.getVideoTimestamp(startRequestTime),
            duration,
            method: init?.method || "GET",
            url: this.sanitizeUrl(input2.toString()),
            requestHeaders: init?.headers ? this.sanitizeHeaders(
              Object.fromEntries(new Headers(init.headers).entries())
            ) : {},
            responseHeaders: {},
            requestBody,
            error
          });
          throw error;
        }
      };
    }
    patchXHR() {
      const self = this;
      XMLHttpRequest.prototype.open = function(method, url, ...args) {
        this.__requestData = {
          id: v4_default(),
          method,
          url,
          startTime: Date.now()
        };
        return self.originalXHROpen.apply(this, [method, url, ...args]);
      };
      XMLHttpRequest.prototype.send = function(body) {
        if (!this.__requestData || !self.shouldCaptureUrl(this.__requestData.url)) {
          return self.originalXHRSend.call(this, body);
        }
        const requestData = this.__requestData;
        let sanitizedBody = void 0;
        if (self.config.captureRequestBody && body) {
          sanitizedBody = self.sanitizeBody(body);
        }
        this.addEventListener("load", function() {
          const duration = Date.now() - requestData.startTime;
          const request = {
            type: 7,
            id: requestData.id,
            timestamp: requestData.startTime,
            video_timestamp: self.getVideoTimestamp(requestData.startTime),
            duration,
            method: requestData.method,
            url: self.sanitizeUrl(requestData.url),
            status: this.status,
            statusText: this.statusText,
            requestHeaders: self.sanitizeHeaders(
              this.getAllResponseHeaders().split("\r\n").reduce((acc, line) => {
                const [key, value] = line.split(": ");
                if (key && value) acc[key] = value;
                return acc;
              }, {})
            ),
            responseHeaders: {}
          };
          if (sanitizedBody) {
            request.requestBody = sanitizedBody;
          }
          if (self.config.captureResponseBody) {
            request.responseBody = self.sanitizeBody(this.responseText);
          }
          self.addRequest(request);
        });
        this.addEventListener("error", function() {
          const duration = Date.now() - requestData.startTime;
          self.addRequest({
            type: 7,
            id: requestData.id,
            timestamp: requestData.startTime,
            video_timestamp: self.getVideoTimestamp(requestData.startTime),
            duration,
            method: requestData.method,
            url: self.sanitizeUrl(requestData.url),
            requestHeaders: {},
            responseHeaders: {},
            requestBody: sanitizedBody,
            error: "Network error"
          });
        });
        return self.originalXHRSend.call(this, body);
      };
    }
    onRequest(callback) {
      const originalAddRequest = this.addRequest;
      this.addRequest = (request) => {
        originalAddRequest.call(this, request);
        callback(request);
      };
      return () => {
        this.addRequest = originalAddRequest;
      };
    }
  };

  // injected.ts
  var EVENT_NAME_START = "perceptr-recorder-start";
  var EVENT_NAME_STOP = "perceptr-recorder-stop";
  var EVENT_NAME_EVENTS = "perceptr-recorder-events";
  var EVENT_NAME_ENDED = "perceptr-recorder-ended";
  var BATCH_SIZE = 25;
  var BATCH_MS = 500;
  var recorder = null;
  var networkMonitor = null;
  var eventBatch = [];
  var batchTimer = null;
  function flushBatch() {
    if (eventBatch.length === 0) return;
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME_EVENTS, { detail: { events: [...eventBatch] } })
    );
    eventBatch = [];
    batchTimer = null;
  }
  function scheduleFlush() {
    if (batchTimer) return;
    batchTimer = setTimeout(() => {
      flushBatch();
    }, BATCH_MS);
  }
  function onRecorderEvent(ev) {
    eventBatch.push(ev);
    if (eventBatch.length >= BATCH_SIZE) flushBatch();
    else scheduleFlush();
  }
  function start() {
    if (recorder) return;
    const startTime = Date.now();
    recorder = new SessionRecorder({});
    recorder.startSession();
    recorder.onEvent(onRecorderEvent);
    networkMonitor = new NetworkMonitor({}, startTime);
    networkMonitor.enable();
    networkMonitor.onRequest((request) => onRecorderEvent(request));
  }
  function stop() {
    if (!recorder) return;
    flushBatch();
    if (networkMonitor) {
      networkMonitor.disable();
      networkMonitor = null;
    }
    try {
      const remaining = recorder.getRecordingEvents();
      if (remaining.length) {
        window.dispatchEvent(
          new CustomEvent(EVENT_NAME_EVENTS, { detail: { events: remaining } })
        );
      }
    } catch (_) {
    }
    recorder.stopSession();
    recorder = null;
    window.dispatchEvent(new CustomEvent(EVENT_NAME_ENDED));
  }
  window.addEventListener(EVENT_NAME_START, start);
  window.addEventListener(EVENT_NAME_STOP, stop);
})();
/*! Bundled license information:

rrweb/es/rrweb/ext/tslib/tslib.es6.js:
  (*! *****************************************************************************
  Copyright (c) Microsoft Corporation.
  
  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.
  
  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** *)
*/
