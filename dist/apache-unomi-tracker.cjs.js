'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _typeof = require('@babel/runtime/helpers/typeof');
var es6CrawlerDetect = require('es6-crawler-detect');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var _typeof__default = /*#__PURE__*/_interopDefaultLegacy(_typeof);

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }
var newTracker = function newTracker() {
  var wem = {
    /**
     * This function initialize the tracker
     *
     * @param {object} digitalData config of the tracker
     */
    initTracker: function initTracker(digitalData) {
      wem.digitalData = digitalData;
      wem.trackerProfileIdCookieName = wem.digitalData.wemInitConfig.trackerProfileIdCookieName ? wem.digitalData.wemInitConfig.trackerProfileIdCookieName : "wem-profile-id";
      wem.trackerSessionIdCookieName = wem.digitalData.wemInitConfig.trackerSessionIdCookieName ? wem.digitalData.wemInitConfig.trackerSessionIdCookieName : "wem-session-id";
      wem.browserGeneratedSessionSuffix = wem.digitalData.wemInitConfig.browserGeneratedSessionSuffix ? wem.digitalData.wemInitConfig.browserGeneratedSessionSuffix : "";
      wem.activateWem = wem.digitalData.wemInitConfig.activateWem;
      var _wem$digitalData$wemI = wem.digitalData.wemInitConfig,
          contextServerUrl = _wem$digitalData$wemI.contextServerUrl,
          timeoutInMilliseconds = _wem$digitalData$wemI.timeoutInMilliseconds,
          contextServerCookieName = _wem$digitalData$wemI.contextServerCookieName;
      wem.contextServerCookieName = contextServerCookieName;
      wem.contextServerUrl = contextServerUrl;
      wem.timeoutInMilliseconds = timeoutInMilliseconds;
      wem.formNamesToWatch = [];
      wem.eventsPrevented = [];
      wem.sessionID = wem.getCookie(wem.trackerSessionIdCookieName);
      wem.fallback = false;

      if (wem.sessionID === null) {
        console.warn('[WEM] sessionID is null !');
      } else if (!wem.sessionID || wem.sessionID === '') {
        console.warn('[WEM] empty sessionID, setting to null !');
        wem.sessionID = null;
      }
    },

    /**
     * This function start the tracker by loading the context in the page
     * Note: that the tracker will start once the current DOM is complete loaded, using listener on current document: DOMContentLoaded
     *
     * @param {object[]} digitalDataOverrides optional, list of digitalData extensions, they will be merged with original digitalData before context loading
     */
    startTracker: function startTracker() {
      var digitalDataOverrides = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;
      // Check before start
      var cookieDisabled = !navigator.cookieEnabled;
      var noSessionID = !wem.sessionID || wem.sessionID === '';
      var crawlerDetected = navigator.userAgent;

      if (crawlerDetected) {
        var browserDetector = new es6CrawlerDetect.Crawler();
        crawlerDetected = browserDetector.isCrawler(navigator.userAgent);
      }

      if (cookieDisabled || noSessionID || crawlerDetected) {
        document.addEventListener('DOMContentLoaded', function () {
          wem._executeFallback('navigator cookie disabled: ' + cookieDisabled + ', no sessionID: ' + noSessionID + ', web crawler detected: ' + crawlerDetected);
        });
        return;
      } // Register base context callback


      wem._registerCallback(function () {
        if (wem.cxs.profileId) {
          wem.setCookie(wem.trackerProfileIdCookieName, wem.cxs.profileId);
        }

        if (!wem.cxs.profileId) {
          wem.removeCookie(wem.trackerProfileIdCookieName);
        }

        wem._registerListenersForTrackedConditions();
      }, 'Default tracker callback', 0); // Load the context once document is ready


      document.addEventListener('DOMContentLoaded', function () {
        wem.DOMLoaded = true; // enrich digital data considering extensions

        wem._handleDigitalDataOverrides(digitalDataOverrides); // complete already registered events


        wem._checkUncompleteRegisteredEvents(); // Dispatch javascript events for the experience (perso/opti displayed from SSR, based on unomi events)


        wem._dispatchJSExperienceDisplayedEvents(); // Some event may not need to be send to unomi, check for them and filter them out.


        wem._filterUnomiEvents(); // Add referrer info into digitalData.page object.


        wem._processReferrer(); // Build view event


        var viewEvent = wem.buildEvent('view', wem.buildTargetPage(), wem.buildSource(wem.digitalData.site.siteInfo.siteID, 'site'));
        viewEvent.flattenedProperties = {}; // Add URLParameters

        if (location.search) {
          viewEvent.flattenedProperties['URLParameters'] = wem.convertUrlParametersToObj(location.search);
        } // Add interests


        if (wem.digitalData.interests) {
          viewEvent.flattenedProperties['interests'] = wem.digitalData.interests;
        } // Register the page view event, it's unshift because it should be the first event, this is just for logical purpose. (page view comes before perso displayed event for example)


        wem._registerEvent(viewEvent, true);

        if (wem.activateWem) {
          wem.loadContext();
        } else {
          wem._executeFallback('wem is not activated on current page');
        }
      });
    },

    /**
     * get the current loaded context from Unomi, will be accessible only after loadContext() have been performed
     * @returns {object} loaded context
     */
    getLoadedContext: function getLoadedContext() {
      return wem.cxs;
    },

    /**
     * In case Unomi contains rules related to HTML forms in the current page.
     * The logic is simple, in case a rule exists in Unomi targeting a form event within the current webpage path
     *  - then this form will be identified as form to be watched.
     * You can reuse this function to get the list of concerned forms in order to attach listeners automatically for those form for example
     * (not that current tracker is doing that by default, check function: _registerListenersForTrackedConditions())
     * @returns {string[]} form names/ids in current web page
     */
    getFormNamesToWatch: function getFormNamesToWatch() {
      return wem.formNamesToWatch;
    },

    /**
     * Get current session id
     * @returns {null|*}
     */
    getSessionId: function getSessionId() {
      return wem.sessionID;
    },
    convertUrlParametersToObj: function convertUrlParametersToObj(searchString) {
      if (!searchString) {
        return null;
      }

      return searchString.replace(/^\?/, '') // Only trim off a single leading interrobang.
      .split('&').reduce(function (result, next) {
        if (next === '') {
          return result;
        }

        var pair = next.split('=');
        var key = decodeURIComponent(pair[0]);
        var value = typeof pair[1] !== 'undefined' && decodeURIComponent(pair[1]) || undefined;

        if (Object.prototype.hasOwnProperty.call(result, key)) {
          // Check to see if this property has been met before.
          if (Array.isArray(result[key])) {
            // Is it already an array?
            result[key].push(value);
          } else {
            // Make it an array.
            result[key] = [result[key], value];
          }
        } else {
          // First time seen, just add it.
          result[key] = value;
        }

        return result;
      }, {});
    },

    /**
     * This function will register a personalization
     *
     * @param {object} personalization
     * @param {object} variants
     * @param {boolean} [ajax] Deprecated: Ajax rendering is not supported anymore
     * @param {function} [resultCallback]
     */
    registerPersonalizationObject: function registerPersonalizationObject(personalization, variants, ajax, resultCallback) {
      var target = personalization.id;

      wem._registerPersonalizationCallback(personalization, function (result) {
        var successfulFilters = [];

        for (var i = 0; i < result.length; i++) {
          successfulFilters.push(variants[result[i]]);
        }

        var selectedFilter = null;

        if (successfulFilters.length > 0) {
          selectedFilter = successfulFilters[0];
          var minPos = successfulFilters[0].position;

          if (minPos >= 0) {
            for (var j = 1; j < successfulFilters.length; j++) {
              if (successfulFilters[j].position < minPos) {
                selectedFilter = successfulFilters[j];
              }
            }
          }
        }

        if (resultCallback) {
          // execute callback
          resultCallback(successfulFilters, selectedFilter);
        } else {
          if (selectedFilter) {
            var targetFilters = document.getElementById(target).children;

            for (var fIndex in targetFilters) {
              var filter = targetFilters.item(fIndex);

              if (filter) {
                filter.style.display = filter.id === selectedFilter.content ? '' : 'none';
              }
            } // we now add control group information to event if the user is in the control group.


            if (wem._isInControlGroup(target)) {
              console.info('[WEM] Profile is in control group for target: ' + target + ', adding to personalization event...');
              selectedFilter.event.target.properties.inControlGroup = true;

              if (selectedFilter.event.target.properties.variants) {
                selectedFilter.event.target.properties.variants.forEach(function (variant) {
                  return variant.inControlGroup = true;
                });
              }
            } // send event to unomi


            wem.collectEvent(wem._completeEvent(selectedFilter.event), function () {
              console.info('[WEM] Personalization event successfully collected.');
            }, function () {
              console.error('[WEM] Could not send personalization event.');
            }); //Trigger variant display event for personalization

            wem._dispatchJSExperienceDisplayedEvent(selectedFilter.event);
          } else {
            var elements = document.getElementById(target).children;

            for (var eIndex in elements) {
              var el = elements.item(eIndex);
              el.style.display = 'none';
            }
          }
        }
      });
    },

    /**
     * This function will register an optimization test or A/B test
     *
     * @param {string} optimizationTestNodeId
     * @param {string} goalId
     * @param {string} containerId
     * @param {object} variants
     * @param {boolean} [ajax] Deprecated: Ajax rendering is not supported anymore
     * @param {object} [variantsTraffic]
     */
    registerOptimizationTest: function registerOptimizationTest(optimizationTestNodeId, goalId, containerId, variants, ajax, variantsTraffic) {
      // check persona panel forced variant
      var selectedVariantId = wem.getUrlParameter('wemSelectedVariantId-' + optimizationTestNodeId); // check already resolved variant stored in local

      if (selectedVariantId === null) {
        if (wem.storageAvailable('sessionStorage')) {
          selectedVariantId = sessionStorage.getItem(optimizationTestNodeId);
        } else {
          selectedVariantId = wem.getCookie('selectedVariantId');

          if (selectedVariantId != null && selectedVariantId === '') {
            selectedVariantId = null;
          }
        }
      } // select random variant and call unomi


      if (!(selectedVariantId && variants[selectedVariantId])) {
        var keys = Object.keys(variants);

        if (variantsTraffic) {
          var rand = 100 * Math.random() << 0;

          for (var nodeIdentifier in variantsTraffic) {
            if ((rand -= variantsTraffic[nodeIdentifier]) < 0 && selectedVariantId == null) {
              selectedVariantId = nodeIdentifier;
            }
          }
        } else {
          selectedVariantId = keys[keys.length * Math.random() << 0];
        }

        if (wem.storageAvailable('sessionStorage')) {
          sessionStorage.setItem(optimizationTestNodeId, selectedVariantId);
        } else {
          wem.setCookie('selectedVariantId', selectedVariantId, 1);
        } // spread event to unomi


        wem._registerEvent(wem._completeEvent(variants[selectedVariantId].event));
      } //Trigger variant display event for optimization
      // (Wrapped in DOMContentLoaded because opti are resulted synchronously at page load, so we dispatch the JS even after page load, to be sure that listeners are ready)


      window.addEventListener('DOMContentLoaded', function () {
        wem._dispatchJSExperienceDisplayedEvent(variants[selectedVariantId].event);
      });

      if (selectedVariantId) {
        // update persona panel selected variant
        if (window.optimizedContentAreas && window.optimizedContentAreas[optimizationTestNodeId]) {
          window.optimizedContentAreas[optimizationTestNodeId].selectedVariant = selectedVariantId;
        } // display the good variant


        document.getElementById(variants[selectedVariantId].content).style.display = '';
      }
    },

    /**
     * This function is used to load the current context in the page
     *
     * @param {boolean} [skipEvents=false] Should we send the events
     * @param {boolean} [invalidate=false] Should we invalidate the current context
     */
    loadContext: function loadContext(skipEvents, invalidate) {
      if (wem.contextLoaded) {
        console.log('Context already requested by', wem.contextLoaded);
        return;
      }

      var jsonData = {
        requiredProfileProperties: wem.digitalData.wemInitConfig.requiredProfileProperties,
        requiredSessionProperties: wem.digitalData.wemInitConfig.requiredSessionProperties,
        requireSegments: wem.digitalData.wemInitConfig.requireSegments,
        requireScores: wem.digitalData.wemInitConfig.requireScores,
        source: wem.buildSourcePage()
      };

      if (!skipEvents) {
        jsonData.events = wem.digitalData.events;
      }

      if (wem.digitalData.personalizationCallback) {
        jsonData.personalizations = wem.digitalData.personalizationCallback.map(function (x) {
          return x.personalization;
        });
      }

      jsonData.sessionId = wem.sessionID;
      var contextUrl = wem.contextServerUrl + '/context.json';

      if (invalidate) {
        contextUrl += '?invalidateSession=true&invalidateProfile=true';
      }

      wem.ajax({
        url: contextUrl,
        type: 'POST',
        async: true,
        contentType: 'text/plain;charset=UTF-8',
        // Use text/plain to avoid CORS preflight
        jsonData: jsonData,
        dataType: 'application/json',
        invalidate: invalidate,
        success: wem._onSuccess,
        error: function error() {
          wem._executeFallback('error during context loading');
        }
      });
      wem.contextLoaded = Error().stack;
      console.info('[WEM] context loading...');
    },

    /**
     * This function will send an event to Apache Unomi
     * @param {object} event The event object to send, you can build it using wem.buildEvent(eventType, target, source)
     * @param {function} successCallback will be executed in case of success
     * @param {function} errorCallback will be executed in case of error
     */
    collectEvent: function collectEvent(event, successCallback, errorCallback) {
      wem.collectEvents({
        events: [event]
      }, successCallback, errorCallback);
    },

    /**
     * This function will send the events to Apache Unomi
     *
     * @param {object} events Javascript object { events: [event1, event2] }
     * @param {function} successCallback will be executed in case of success
     * @param {function} errorCallback will be executed in case of error
     */
    collectEvents: function collectEvents(events, successCallback, errorCallback) {
      if (wem.fallback) {
        // in case of fallback we dont want to collect any events
        return;
      }

      events.sessionId = wem.sessionID ? wem.sessionID : '';
      var data = JSON.stringify(events);
      wem.ajax({
        url: wem.contextServerUrl + '/eventcollector',
        type: 'POST',
        async: true,
        contentType: 'text/plain;charset=UTF-8',
        // Use text/plain to avoid CORS preflight
        data: data,
        dataType: 'application/json',
        success: successCallback,
        error: errorCallback
      });
    },

    /**
     * This function will build an event of type click and send it to Apache Unomi
     *
     * @param {object} event javascript
     * @param {function} [successCallback] will be executed if case of success
     * @param {function} [errorCallback] will be executed if case of error
     */
    sendClickEvent: function sendClickEvent(event, successCallback, errorCallback) {
      if (event.target.id || event.target.name) {
        console.info('[WEM] Send click event');
        var targetId = event.target.id ? event.target.id : event.target.name;
        var clickEvent = wem.buildEvent('click', wem.buildTarget(targetId, event.target.localName), wem.buildSourcePage());
        var eventIndex = wem.eventsPrevented.indexOf(targetId);

        if (eventIndex !== -1) {
          wem.eventsPrevented.splice(eventIndex, 0);
        } else {
          wem.eventsPrevented.push(targetId);
          event.preventDefault();
          var target = event.target;
          wem.collectEvent(clickEvent, function (xhr) {
            console.info('[WEM] Click event successfully collected.');

            if (successCallback) {
              successCallback(xhr);
            } else {
              target.click();
            }
          }, function (xhr) {
            console.error('[WEM] Could not send click event.');

            if (errorCallback) {
              errorCallback(xhr);
            } else {
              target.click();
            }
          });
        }
      }
    },

    /**
     * This function will build an event of type video and send it to Apache Unomi
     *
     * @param {object} event javascript
     * @param {function} [successCallback] will be executed if case of success
     * @param {function} [errorCallback] will be executed if case of error
     */
    sendVideoEvent: function sendVideoEvent(event, successCallback, errorCallback) {
      console.info('[WEM] catching video event');
      var videoEvent = wem.buildEvent('video', wem.buildTarget(event.target.id, 'video', {
        action: event.type
      }), wem.buildSourcePage());
      wem.collectEvent(videoEvent, function (xhr) {
        console.info('[WEM] Video event successfully collected.');

        if (successCallback) {
          successCallback(xhr);
        }
      }, function (xhr) {
        console.error('[WEM] Could not send video event.');

        if (errorCallback) {
          errorCallback(xhr);
        }
      });
    },

    /**
     * This function will invalidate the Apache Unomi session and profile,
     * by removing the associated cookies, set the loaded context to undefined
     * and set the session id cookie with a newly generated ID
     */
    invalidateSessionAndProfile: function invalidateSessionAndProfile() {

      wem.sessionID = wem.generateGuid() + wem.browserGeneratedSessionSuffix;
      wem.setCookie(wem.trackerSessionIdCookieName, wem.sessionID, 1);
      wem.removeCookie(wem.contextServerCookieName);
      wem.removeCookie(wem.trackerProfileIdCookieName);
      wem.cxs = undefined;
    },

    /**
     * This function return the basic structure for an event, it must be adapted to your need
     *
     * @param {string} eventType The name of your event
     * @param {object} [target] The target object for your event can be build with wem.buildTarget(targetId, targetType, targetProperties)
     * @param {object} [source] The source object for your event can be build with wem.buildSource(sourceId, sourceType, sourceProperties)
     * @returns {{eventType: *, scope}}
     */
    buildEvent: function buildEvent(eventType, target, source) {
      var event = {
        eventType: eventType,
        scope: wem.digitalData.scope
      };

      if (target) {
        event.target = target;
      }

      if (source) {
        event.source = source;
      }

      return event;
    },

    /**
     * This function return an event of type form
     *
     * @param {string} formName The HTML name of id of the form to use in the target of the event
     * @returns {*|{eventType: *, scope, source: {scope, itemId: string, itemType: string, properties: {}}, target: {scope, itemId: string, itemType: string, properties: {}}}}
     */
    buildFormEvent: function buildFormEvent(formName) {
      return wem.buildEvent('form', wem.buildTarget(formName, 'form'), wem.buildSourcePage());
    },

    /**
     * This function return the source object for a source of type page
     *
     * @returns {*|{scope, itemId: *, itemType: *}}
     */
    buildTargetPage: function buildTargetPage() {
      return wem.buildTarget(wem.digitalData.page.pageInfo.pageID, 'page', wem.digitalData.page);
    },

    /**
     * This function return the source object for a source of type page
     *
     * @returns {*|{scope, itemId: *, itemType: *}}
     */
    buildSourcePage: function buildSourcePage() {
      return wem.buildSource(wem.digitalData.page.pageInfo.pageID, 'page', wem.digitalData.page);
    },

    /**
     * This function return the basic structure for the target of your event
     *
     * @param {string} targetId The ID of the target
     * @param {string} targetType The type of the target
     * @param {object} [targetProperties] The optional properties of the target
     * @returns {{scope, itemId: *, itemType: *}}
     */
    buildTarget: function buildTarget(targetId, targetType, targetProperties) {
      return wem._buildObject(targetId, targetType, targetProperties);
    },

    /**
     * This function return the basic structure for the source of your event
     *
     * @param {string} sourceId The ID of the source
     * @param {string} sourceType The type of the source
     * @param {object} [sourceProperties] The optional properties of the source
     * @returns {{scope, itemId: *, itemType: *}}
     */
    buildSource: function buildSource(sourceId, sourceType, sourceProperties) {
      return wem._buildObject(sourceId, sourceType, sourceProperties);
    },

    /*************************************/

    /* Utility functions under this line */

    /*************************************/

    /**
     * This is an utility function to set a cookie
     *
     * @param {string} cookieName name of the cookie
     * @param {string} cookieValue value of the cookie
     * @param {number} [expireDays] number of days to set the expire date
     */
    setCookie: function setCookie(cookieName, cookieValue, expireDays) {
      var expires = '';

      if (expireDays) {
        var d = new Date();
        d.setTime(d.getTime() + expireDays * 24 * 60 * 60 * 1000);
        expires = '; expires=' + d.toUTCString();
      }

      document.cookie = cookieName + '=' + cookieValue + expires + '; path=/; SameSite=Strict';
    },

    /**
     * This is an utility function to get a cookie
     *
     * @param {string} cookieName name of the cookie to get
     * @returns {*} the value of the first cookie with the corresponding name or null if not found
     */
    getCookie: function getCookie(cookieName) {
      var name = cookieName + '=';
      var ca = document.cookie.split(';');

      for (var i = 0; i < ca.length; i++) {
        var c = ca[i];

        while (c.charAt(0) == ' ') {
          c = c.substring(1);
        }

        if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
        }
      }

      return null;
    },

    /**
     * This is an utility function to remove a cookie
     *
     * @param {string} cookieName the name of the cookie to rename
     */
    removeCookie: function removeCookie(cookieName) {

      wem.setCookie(cookieName, '', -1);
    },

    /**
     * This is an utility function to execute AJAX call
     *
     * @param {object} options
     */
    ajax: function ajax(options) {
      var xhr = new XMLHttpRequest();

      if ('withCredentials' in xhr) {
        xhr.open(options.type, options.url, options.async);
        xhr.withCredentials = true;
      } else if (typeof XDomainRequest != 'undefined') {
        /* global XDomainRequest */
        xhr = new XDomainRequest();
        xhr.open(options.type, options.url);
      }

      if (options.contentType) {
        xhr.setRequestHeader('Content-Type', options.contentType);
      }

      if (options.dataType) {
        xhr.setRequestHeader('Accept', options.dataType);
      }

      if (options.responseType) {
        xhr.responseType = options.responseType;
      }

      var requestExecuted = false;

      if (wem.timeoutInMilliseconds !== -1) {
        setTimeout(function () {
          if (!requestExecuted) {
            console.error('[WEM] XML request timeout, url: ' + options.url);
            requestExecuted = true;

            if (options.error) {
              options.error(xhr);
            }
          }
        }, wem.timeoutInMilliseconds);
      }

      xhr.onreadystatechange = function () {
        if (!requestExecuted) {
          if (xhr.readyState === 4) {
            if (xhr.status === 200 || xhr.status === 204 || xhr.status === 304) {
              if (xhr.responseText != null) {
                requestExecuted = true;

                if (options.success) {
                  options.success(xhr);
                }
              }
            } else {
              requestExecuted = true;

              if (options.error) {
                options.error(xhr);
              }

              console.error('[WEM] XML request error: ' + xhr.statusText + ' (' + xhr.status + ')');
            }
          }
        }
      };

      if (options.jsonData) {
        xhr.send(JSON.stringify(options.jsonData));
      } else if (options.data) {
        xhr.send(options.data);
      } else {
        xhr.send();
      }
    },

    /**
     * This is an utility function to generate a new UUID
     *
     * @returns {string}
     */
    generateGuid: function generateGuid() {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
      }

      return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    },

    /**
     * This is an utility function to check if the local storage is available or not
     * @param type
     * @returns {boolean}
     */
    storageAvailable: function storageAvailable(type) {
      try {
        var storage = window[type],
            x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
      } catch (e) {
        return false;
      }
    },
    dispatchJSEvent: function dispatchJSEvent(name, canBubble, cancelable, detail) {
      var event = document.createEvent('CustomEvent');
      event.initCustomEvent(name, canBubble, cancelable, detail);
      document.dispatchEvent(event);
    },

    /**
     * This is an utility function to get current url parameter value
     * @param name, the name of the parameter
     * @returns {string}
     */
    getUrlParameter: function getUrlParameter(name) {
      name = name.replace(/[[]/, '\\[').replace(/[\]]/, '\\]');
      var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
      var results = regex.exec(window.location.search);
      return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' '));
    },

    /*************************************/

    /* Private functions under this line */

    /*************************************/
    _handleDigitalDataOverrides: function _handleDigitalDataOverrides(digitalDataOverrides) {
      if (digitalDataOverrides && digitalDataOverrides.length > 0) {
        var _iterator = _createForOfIteratorHelper(digitalDataOverrides),
            _step;

        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var digitalDataOverride = _step.value;
            wem.digitalData = wem._deepMergeObjects(digitalDataOverride, wem.digitalData);
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }
    },
    _registerListenersForTrackedConditions: function _registerListenersForTrackedConditions() {
      var videoNamesToWatch = [];
      var clickToWatch = [];

      if (wem.cxs.trackedConditions && wem.cxs.trackedConditions.length > 0) {
        for (var i = 0; i < wem.cxs.trackedConditions.length; i++) {
          switch (wem.cxs.trackedConditions[i].type) {
            case 'formEventCondition':
              if (wem.cxs.trackedConditions[i].parameterValues && wem.cxs.trackedConditions[i].parameterValues.formId) {
                wem.formNamesToWatch.push(wem.cxs.trackedConditions[i].parameterValues.formId);
              }

              break;

            case 'videoViewEventCondition':
              if (wem.cxs.trackedConditions[i].parameterValues && wem.cxs.trackedConditions[i].parameterValues.videoId) {
                videoNamesToWatch.push(wem.cxs.trackedConditions[i].parameterValues.videoId);
              }

              break;

            case 'clickOnLinkEventCondition':
              if (wem.cxs.trackedConditions[i].parameterValues && wem.cxs.trackedConditions[i].parameterValues.itemId) {
                clickToWatch.push(wem.cxs.trackedConditions[i].parameterValues.itemId);
              }

              break;
          }
        }
      }

      var forms = document.querySelectorAll('form');

      for (var formIndex = 0; formIndex < forms.length; formIndex++) {
        var form = forms.item(formIndex);
        var formName = form.getAttribute('name') ? form.getAttribute('name') : form.getAttribute('id'); // test attribute data-form-id to not add a listener on FF form

        if (formName && wem.formNamesToWatch.indexOf(formName) > -1 && form.getAttribute('data-form-id') == null) {
          // add submit listener on form that we need to watch only
          console.info('[WEM] watching form ' + formName);
          form.addEventListener('submit', wem._formSubmitEventListener, true);
        }
      }

      for (var videoIndex = 0; videoIndex < videoNamesToWatch.length; videoIndex++) {
        var videoName = videoNamesToWatch[videoIndex];
        var video = document.getElementById(videoName) || document.getElementById(wem._resolveId(videoName));

        if (video) {
          video.addEventListener('play', wem.sendVideoEvent);
          video.addEventListener('ended', wem.sendVideoEvent);
          console.info('[WEM] watching video ' + videoName);
        } else {
          console.warn('[WEM] unable to watch video ' + videoName + ', video not found in the page');
        }
      }

      for (var clickIndex = 0; clickIndex < clickToWatch.length; clickIndex++) {
        var clickIdName = clickToWatch[clickIndex];
        var click = document.getElementById(clickIdName) || document.getElementById(wem._resolveId(clickIdName)) ? document.getElementById(clickIdName) || document.getElementById(wem._resolveId(clickIdName)) : document.getElementsByName(clickIdName)[0];

        if (click) {
          click.addEventListener('click', wem.sendClickEvent);
          console.info('[WEM] watching click ' + clickIdName);
        } else {
          console.warn('[WEM] unable to watch click ' + clickIdName + ', element not found in the page');
        }
      }
    },
    _checkUncompleteRegisteredEvents: function _checkUncompleteRegisteredEvents() {
      if (wem.digitalData && wem.digitalData.events) {
        var _iterator2 = _createForOfIteratorHelper(wem.digitalData.events),
            _step2;

        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var event = _step2.value;

            wem._completeEvent(event);
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }
      }
    },
    _dispatchJSExperienceDisplayedEvents: function _dispatchJSExperienceDisplayedEvents() {
      if (wem.digitalData && wem.digitalData.events) {
        var _iterator3 = _createForOfIteratorHelper(wem.digitalData.events),
            _step3;

        try {
          for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
            var event = _step3.value;

            if (event.eventType === 'optimizationTestEvent' || event.eventType === 'personalizationEvent') {
              wem._dispatchJSExperienceDisplayedEvent(event);
            }
          }
        } catch (err) {
          _iterator3.e(err);
        } finally {
          _iterator3.f();
        }
      }
    },
    _dispatchJSExperienceDisplayedEvent: function _dispatchJSExperienceDisplayedEvent(experienceUnomiEvent) {
      if (!wem.fallback && experienceUnomiEvent && experienceUnomiEvent.target && experienceUnomiEvent.target.properties && experienceUnomiEvent.target.properties.variants && experienceUnomiEvent.target.properties.variants.length > 0) {
        var typeMapper = {
          optimizationTestEvent: 'optimization',
          personalizationEvent: 'personalization'
        };

        var _iterator4 = _createForOfIteratorHelper(experienceUnomiEvent.target.properties.variants),
            _step4;

        try {
          for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
            var variant = _step4.value;
            var jsEventDetail = {
              id: variant.id,
              name: variant.systemName,
              displayableName: variant.displayableName,
              path: variant.path,
              type: typeMapper[experienceUnomiEvent.eventType],
              variantType: experienceUnomiEvent.target.properties.type,
              tags: variant.tags,
              nodeType: variant.nodeType,
              wrapper: {
                id: experienceUnomiEvent.target.itemId,
                name: experienceUnomiEvent.target.properties.systemName,
                displayableName: experienceUnomiEvent.target.properties.displayableName,
                path: experienceUnomiEvent.target.properties.path,
                tags: experienceUnomiEvent.target.properties.tags,
                nodeType: experienceUnomiEvent.target.properties.nodeType
              }
            };
            wem.dispatchJSEvent('displayWemVariant', false, false, jsEventDetail);
          }
        } catch (err) {
          _iterator4.e(err);
        } finally {
          _iterator4.f();
        }
      }
    },
    _filterUnomiEvents: function _filterUnomiEvents() {
      if (wem.digitalData && wem.digitalData.events) {
        wem.digitalData.events = wem.digitalData.events.filter(function (event) {
          return !event.properties || !event.properties.doNotSendToUnomi;
        }).map(function (event) {
          if (event.properties) {
            delete event.properties.doNotSendToUnomi;
          }

          return event;
        });
      }
    },
    _completeEvent: function _completeEvent(event) {
      if (!event.source) {
        event.source = wem.buildSourcePage();
      }

      if (!event.scope) {
        event.scope = wem.digitalData.scope;
      }

      if (event.target && !event.target.scope) {
        event.target.scope = wem.digitalData.scope;
      }

      return event;
    },
    _registerEvent: function _registerEvent(event, unshift) {
      if (wem.digitalData) {
        if (wem.cxs) {
          console.error('[WEM] already loaded, too late...');
          return;
        }
      } else {
        wem.digitalData = {};
      }

      wem.digitalData.events = wem.digitalData.events || [];

      if (unshift) {
        wem.digitalData.events.unshift(event);
      } else {
        wem.digitalData.events.push(event);
      }
    },

    /**
     * This function allow for registering callback that will be executed once the context is loaded.
     * @param onLoadCallback the callback to be executed
     * @param name optional name for the call, used mostly for logging the execution
     * @param priority optional priority to execute the callbacks in a specific order (default: 5, to leave room for the tracker default callback(s))
     * @private
     */
    _registerCallback: function _registerCallback(onLoadCallback) {
      var name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
      var priority = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 5;

      if (wem.digitalData) {
        if (wem.cxs) {
          console.info('[WEM] Trying to register context load callback, but context already loaded, executing now...');

          if (onLoadCallback) {
            console.info('[WEM] executing context load callback: ' + (name ? name : 'Callback without name'));
            onLoadCallback(wem.digitalData);
          }
        } else {
          console.info('[WEM] registering context load callback: ' + (name ? name : 'Callback without name'));

          if (onLoadCallback) {
            wem.digitalData.loadCallbacks = wem.digitalData.loadCallbacks || [];
            wem.digitalData.loadCallbacks.push({
              priority: priority,
              name: name,
              execute: onLoadCallback
            });
          }
        }
      } else {
        console.info('[WEM] Trying to register context load callback, but no digitalData conf found, creating it and registering the callback: ' + (name ? name : 'Callback without name'));
        wem.digitalData = {};

        if (onLoadCallback) {
          wem.digitalData.loadCallbacks = [];
          wem.digitalData.loadCallbacks.push({
            priority: priority,
            name: name,
            execute: onLoadCallback
          });
        }
      }
    },
    _registerPersonalizationCallback: function _registerPersonalizationCallback(personalization, callback) {
      if (wem.digitalData) {
        if (wem.cxs) {
          console.error('[WEM] already loaded, too late...');
        } else {
          console.info('[WEM] digitalData object present but not loaded, registering sort callback...');
          wem.digitalData.personalizationCallback = wem.digitalData.personalizationCallback || [];
          wem.digitalData.personalizationCallback.push({
            personalization: personalization,
            callback: callback
          });
        }
      } else {
        wem.digitalData = {};
        wem.digitalData.personalizationCallback = wem.digitalData.personalizationCallback || [];
        wem.digitalData.personalizationCallback.push({
          personalization: personalization,
          callback: callback
        });
      }
    },
    _buildObject: function _buildObject(itemId, itemType, properties) {
      var object = {
        scope: wem.digitalData.scope,
        itemId: itemId,
        itemType: itemType
      };

      if (properties) {
        object.properties = properties;
      }

      return object;
    },
    _onSuccess: function _onSuccess(xhr) {
      wem.cxs = JSON.parse(xhr.responseText);

      if (wem.digitalData.loadCallbacks && wem.digitalData.loadCallbacks.length > 0) {
        console.info('[WEM] Found context server load callbacks, calling now...');

        wem._executeLoadCallbacks(wem.digitalData);

        if (wem.digitalData.personalizationCallback) {
          for (var j = 0; j < wem.digitalData.personalizationCallback.length; j++) {
            wem.digitalData.personalizationCallback[j].callback(wem.cxs.personalizations[wem.digitalData.personalizationCallback[j].personalization.id]);
          }
        }
      } // Put a marker to be able to know when wem is full loaded, context is loaded, and callbacks have been executed.


      window.wemLoaded = true;
    },
    _executeFallback: function _executeFallback(logMessage) {
      console.warn('[WEM] execute fallback' + (logMessage ? ': ' + logMessage : '') + ', load fallback callbacks, calling now...');
      wem.fallback = true;
      wem.cxs = {};

      wem._executeLoadCallbacks(undefined);

      if (wem.digitalData.personalizationCallback) {
        for (var i = 0; i < wem.digitalData.personalizationCallback.length; i++) {
          wem.digitalData.personalizationCallback[i].callback([wem.digitalData.personalizationCallback[i].personalization.strategyOptions.fallback]);
        }
      }
    },
    _executeLoadCallbacks: function _executeLoadCallbacks(callbackParam) {
      if (wem.digitalData.loadCallbacks && wem.digitalData.loadCallbacks.length > 0) {
        wem.digitalData.loadCallbacks.sort(function (a, b) {
          return a.priority - b.priority;
        }).forEach(function (loadCallback) {
          console.info('[WEM] executing context load callback: ' + (loadCallback.name ? loadCallback.name : 'callback without name'));
          loadCallback.execute(callbackParam);
        });
      }
    },
    _processReferrer: function _processReferrer() {
      var referrerURL = wem.digitalData.page.pageInfo.referringURL || document.referrer;
      var sameDomainReferrer = false;

      if (referrerURL) {
        // parse referrer URL
        var referrer = new URL(referrerURL); // Set sameDomainReferrer property

        sameDomainReferrer = referrer.host === window.location.host; // only process referrer if it's not coming from the same site as the current page

        if (!sameDomainReferrer) {
          // get search element if it exists and extract search query if available
          var search = referrer.search;
          var query = undefined;

          if (search && search != '') {
            // parse parameters
            var queryParams = [],
                param;
            var queryParamPairs = search.slice(1).split('&');

            for (var i = 0; i < queryParamPairs.length; i++) {
              param = queryParamPairs[i].split('=');
              queryParams.push(param[0]);
              queryParams[param[0]] = param[1];
            } // try to extract query: q is Google-like (most search engines), p is Yahoo


            query = queryParams.q || queryParams.p;
            query = decodeURIComponent(query).replace(/\+/g, ' ');
          } // register referrer event
          // Create deep copy of wem.digitalData.page and add data to pageInfo sub object


          if (wem.digitalData && wem.digitalData.page && wem.digitalData.page.pageInfo) {
            wem.digitalData.page.pageInfo.referrerHost = referrer.host;
            wem.digitalData.page.pageInfo.referrerQuery = query;
          }
        }
      }

      wem.digitalData.page.pageInfo.sameDomainReferrer = sameDomainReferrer;
    },
    _formSubmitEventListener: function _formSubmitEventListener(event) {
      console.info('[WEM] Registering form event callback');
      var form = event.target;
      var formName = form.getAttribute('name') ? form.getAttribute('name') : form.getAttribute('id');

      if (formName && wem.formNamesToWatch.indexOf(formName) > -1) {
        console.info('[WEM] catching form ' + formName);
        var eventCopy = document.createEvent('Event'); // Define that the event name is 'build'.

        eventCopy.initEvent('submit', event.bubbles, event.cancelable);
        event.stopImmediatePropagation();
        event.preventDefault();
        var formEvent = wem.buildFormEvent(formName); // merge form properties with event properties

        formEvent.flattenedProperties = {
          fields: wem._extractFormData(form)
        };
        wem.collectEvent(formEvent, function () {
          form.removeEventListener('submit', wem._formSubmitEventListener, true);
          form.dispatchEvent(eventCopy);

          if (!eventCopy.defaultPrevented && !eventCopy.cancelBubble) {
            form.submit();
          }

          form.addEventListener('submit', wem._formSubmitEventListener, true);
        }, function (xhr) {
          console.error('[WEM] Error while collecting form event: ' + xhr.status + ' ' + xhr.statusText);
          xhr.abort();
          form.removeEventListener('submit', wem._formSubmitEventListener, true);
          form.dispatchEvent(eventCopy);

          if (!eventCopy.defaultPrevented && !eventCopy.cancelBubble) {
            form.submit();
          }

          form.addEventListener('submit', wem._formSubmitEventListener, true);
        });
      }
    },
    _extractFormData: function _extractFormData(form) {
      var params = {};

      for (var i = 0; i < form.elements.length; i++) {
        var e = form.elements[i]; // ignore empty and undefined key (e.name)

        if (e.name) {
          switch (e.nodeName) {
            case 'TEXTAREA':
            case 'INPUT':
              switch (e.type) {
                case 'checkbox':
                  var checkboxes = document.querySelectorAll('input[name="' + e.name + '"]');

                  if (checkboxes.length > 1) {
                    if (!params[e.name]) {
                      params[e.name] = [];
                    }

                    if (e.checked) {
                      params[e.name].push(e.value);
                    }
                  }

                  break;

                case 'radio':
                  if (e.checked) {
                    params[e.name] = e.value;
                  }

                  break;

                default:
                  if (!e.value || e.value == '') {
                    // ignore element if no value is provided
                    break;
                  }

                  params[e.name] = e.value;
              }

              break;

            case 'SELECT':
              if (e.options && e.options[e.selectedIndex]) {
                if (e.multiple) {
                  params[e.name] = [];

                  for (var j = 0; j < e.options.length; j++) {
                    if (e.options[j].selected) {
                      params[e.name].push(e.options[j].value);
                    }
                  }
                } else {
                  params[e.name] = e.options[e.selectedIndex].value;
                }
              }

              break;
          }
        }
      }

      return params;
    },
    _resolveId: function _resolveId(id) {
      if (wem.digitalData.sourceLocalIdentifierMap) {
        var source = Object.keys(wem.digitalData.sourceLocalIdentifierMap).filter(function (source) {
          return id.indexOf(source) > 0;
        });
        return source ? id.replace(source, wem.digitalData.sourceLocalIdentifierMap[source]) : id;
      }

      return id;
    },
    _enableWem: function _enableWem(enable, callback) {
      // display fallback if wem is not enable
      wem.fallback = !enable; // remove cookies, reset cxs

      if (!enable) {
        wem.cxs = {};
        document.cookie = wem.trackerProfileIdCookieName + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = wem.contextServerCookieName + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        delete wem.contextLoaded;
      } else {
        if (wem.DOMLoaded) {
          wem.loadContext();
        } else {
          // As Dom loaded listener not triggered, enable global value.
          wem.activateWem = true;
        }
      }

      if (callback) {
        callback(enable);
      }

      console.log("Wem ".concat(enable ? 'enabled' : 'disabled'));
    },
    _deepMergeObjects: function _deepMergeObjects(source, target) {
      if (!wem._isObject(target) || !wem._isObject(source)) {
        return source;
      }

      Object.keys(source).forEach(function (key) {
        var targetValue = target[key];
        var sourceValue = source[key]; // concat arrays || merge objects || add new props

        if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
          target[key] = targetValue.concat(sourceValue);
        } else if (wem._isObject(targetValue) && wem._isObject(sourceValue)) {
          target[key] = wem._deepMergeObjects(sourceValue, Object.assign({}, targetValue));
        } else {
          target[key] = sourceValue;
        }
      });
      return target;
    },
    _isObject: function _isObject(obj) {
      return obj && _typeof__default["default"](obj) === 'object';
    },
    _isInControlGroup: function _isInControlGroup(id) {
      if (wem.cxs.profileProperties && wem.cxs.profileProperties.unomiControlGroups) {
        var controlGroup = wem.cxs.profileProperties.unomiControlGroups.find(function (controlGroup) {
          return controlGroup.id === id;
        });

        if (controlGroup) {
          return true;
        }
      }

      if (wem.cxs.sessionProperties && wem.cxs.sessionProperties.unomiControlGroups) {
        var _controlGroup = wem.cxs.sessionProperties.unomiControlGroups.find(function (controlGroup) {
          return controlGroup.id === id;
        });

        if (_controlGroup) {
          return true;
        }
      }

      return false;
    }
  };
  return wem;
};

/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var useTracker = function useTracker() {
  return newTracker();
};

exports.useTracker = useTracker;
