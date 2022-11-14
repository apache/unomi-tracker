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

import { Crawler } from 'es6-crawler-detect';

export const newTracker = () => {
    const wem = {
        /**
         * This function initialize the tracker
         *
         * @param {object} digitalData config of the tracker
         * @returns {undefined}
         */
        initTracker: function (digitalData) {
            wem.digitalData = digitalData;
            wem.trackerProfileIdCookieName =  wem.digitalData.wemInitConfig.trackerProfileIdCookieName ?  wem.digitalData.wemInitConfig.trackerProfileIdCookieName : 'wem-profile-id';
            wem.trackerSessionIdCookieName =  wem.digitalData.wemInitConfig.trackerSessionIdCookieName ?  wem.digitalData.wemInitConfig.trackerSessionIdCookieName : 'wem-session-id';
            wem.browserGeneratedSessionSuffix =  wem.digitalData.wemInitConfig.browserGeneratedSessionSuffix ?  wem.digitalData.wemInitConfig.browserGeneratedSessionSuffix : '';
            wem.disableTrackedConditionsListeners =  wem.digitalData.wemInitConfig.disableTrackedConditionsListeners;
            wem.activateWem = wem.digitalData.wemInitConfig.activateWem;

            const { contextServerUrl, timeoutInMilliseconds, contextServerCookieName } = wem.digitalData.wemInitConfig;
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
         * @returns {undefined}
         */
        startTracker: function (digitalDataOverrides = undefined) {
            // Check before start
            let cookieDisabled = !navigator.cookieEnabled;
            let noSessionID = !wem.sessionID || wem.sessionID === '';
            let crawlerDetected = navigator.userAgent;
            if (crawlerDetected) {
                const browserDetector = new Crawler();
                crawlerDetected = browserDetector.isCrawler(navigator.userAgent);
            }
            if (cookieDisabled || noSessionID || crawlerDetected) {
                document.addEventListener('DOMContentLoaded', function () {
                    wem._executeFallback('navigator cookie disabled: ' + cookieDisabled + ', no sessionID: ' + noSessionID + ', web crawler detected: ' + crawlerDetected);
                });
                return;
            }

            // Register base context callback
            wem._registerCallback(function () {
                if (wem.cxs.profileId) {
                    wem.setCookie(wem.trackerProfileIdCookieName, wem.cxs.profileId);
                }
                if (!wem.cxs.profileId) {
                    wem.removeCookie(wem.trackerProfileIdCookieName);
                }

                if (!wem.disableTrackedConditionsListeners) {
                    wem._registerListenersForTrackedConditions();
                }
            }, 'Default tracker', 0);

            // Load the context once document is ready
            document.addEventListener('DOMContentLoaded', function () {
                wem.DOMLoaded = true;

                // enrich digital data considering extensions
                wem._handleDigitalDataOverrides(digitalDataOverrides);

                // complete already registered events
                wem._checkUncompleteRegisteredEvents();

                // Dispatch javascript events for the experience (perso/opti displayed from SSR, based on unomi events)
                wem._dispatchJSExperienceDisplayedEvents();

                // Some event may not need to be send to unomi, check for them and filter them out.
                wem._filterUnomiEvents();

                // Add referrer info into digitalData.page object.
                wem._processReferrer();

                // Build view event
                const viewEvent = wem.buildEvent('view', wem.buildTargetPage(), wem.buildSource(wem.digitalData.site.siteInfo.siteID, 'site'));
                viewEvent.flattenedProperties = {};

                // Add URLParameters
                if (location.search) {
                    viewEvent.flattenedProperties['URLParameters'] = wem.convertUrlParametersToObj(location.search);
                }
                // Add interests
                if (wem.digitalData.interests) {
                    viewEvent.flattenedProperties['interests'] = wem.digitalData.interests;
                }

                // Register the page view event, it's unshift because it should be the first event, this is just for logical purpose. (page view comes before perso displayed event for example)
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
        getLoadedContext: function () {
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
        getFormNamesToWatch: function () {
            return wem.formNamesToWatch;
        },

        /**
         * Get current session id
         * @returns {null|string} get current session id
         */
        getSessionId: function () {
            return wem.sessionID;
        },

        /**
         * This function will register a personalization
         *
         * @param {object} personalization the personalization object
         * @param {object} variants the variants
         * @param {boolean} [ajax] Deprecated: Ajax rendering is not supported anymore
         * @param {function} [resultCallback] the callback to be executed after personalization resolved
         * @returns {undefined}
         */
        registerPersonalizationObject: function (personalization, variants, ajax, resultCallback) {
            var target = personalization.id;
            wem._registerPersonalizationCallback(personalization, function (result, additionalResultInfos) {
                var selectedFilter = null;
                var successfulFilters = [];

                var inControlGroup = additionalResultInfos && additionalResultInfos.inControlGroup;
                // In case of control group Unomi is not resolving any strategy or fallback for us. So we have to do the fallback here.
                if (inControlGroup && personalization.strategyOptions && personalization.strategyOptions.fallback) {
                    selectedFilter = variants[personalization.strategyOptions.fallback];
                    successfulFilters.push(selectedFilter);
                } else {
                    for (var i = 0; i < result.length; i++) {
                        successfulFilters.push(variants[result[i]]);
                    }

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
                                filter.style.display = (filter.id === selectedFilter.content) ? '' : 'none';
                            }
                        }

                        // we now add control group information to event if the user is in the control group.
                        if (inControlGroup) {
                            console.info('[WEM] Profile is in control group for target: ' + target + ', adding to personalization event...');
                            selectedFilter.event.target.properties.inControlGroup = true;
                            if (selectedFilter.event.target.properties.variants) {
                                selectedFilter.event.target.properties.variants.forEach(variant => variant.inControlGroup = true);
                            }
                        }

                        // send event to unomi
                        wem.collectEvent(wem._completeEvent(selectedFilter.event), function () {
                            console.info('[WEM] Personalization event successfully collected.');
                        }, function () {
                            console.error('[WEM] Could not send personalization event.');
                        });

                        //Trigger variant display event for personalization
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
         * @param {string} optimizationTestNodeId the optimization test node id
         * @param {string} goalId the associated goal Id
         * @param {string} containerId the HTML container Id
         * @param {object} variants the variants
         * @param {boolean} [ajax] Deprecated: Ajax rendering is not supported anymore
         * @param {object} [variantsTraffic] the associated traffic allocation
         * @return {undefined}
         */
        registerOptimizationTest: function (optimizationTestNodeId, goalId, containerId, variants, ajax, variantsTraffic) {

            // check persona panel forced variant
            var selectedVariantId = wem.getUrlParameter('wemSelectedVariantId-' + optimizationTestNodeId);

            // check already resolved variant stored in local
            if (selectedVariantId === null) {
                if (wem.storageAvailable('sessionStorage')) {
                    selectedVariantId = sessionStorage.getItem(optimizationTestNodeId);
                } else {
                    selectedVariantId = wem.getCookie('selectedVariantId');
                    if (selectedVariantId != null && selectedVariantId === '') {
                        selectedVariantId = null;
                    }
                }
            }

            // select random variant and call unomi
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
                }

                // spread event to unomi
                wem._registerEvent(wem._completeEvent(variants[selectedVariantId].event));
            }

            //Trigger variant display event for optimization
            // (Wrapped in DOMContentLoaded because opti are resulted synchronously at page load, so we dispatch the JS even after page load, to be sure that listeners are ready)
            window.addEventListener('DOMContentLoaded', () => {
                wem._dispatchJSExperienceDisplayedEvent(variants[selectedVariantId].event);
            });
            if (selectedVariantId) {
                // update persona panel selected variant
                if (window.optimizedContentAreas && window.optimizedContentAreas[optimizationTestNodeId]) {
                    window.optimizedContentAreas[optimizationTestNodeId].selectedVariant = selectedVariantId;
                }

                // display the good variant
                document.getElementById(variants[selectedVariantId].content).style.display = '';
            }
        },

        /**
         * This function is used to load the current context in the page
         *
         * @param {boolean} [skipEvents=false] Should we send the events
         * @param {boolean} [invalidate=false] Should we invalidate the current context
         * @param {boolean} [forceReload=false] This function contains an internal check to avoid loading of the context multiple times.
         *                                      But in some rare cases, it could be useful to force the reloading of the context and bypass the check.
         * @return {undefined}
         */
        loadContext: function (skipEvents = false, invalidate = false, forceReload = false) {
            if (wem.contextLoaded && !forceReload) {
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
                contentType: 'text/plain;charset=UTF-8', // Use text/plain to avoid CORS preflight
                jsonData: jsonData,
                dataType: 'application/json',
                invalidate: invalidate,
                success: wem._onSuccess,
                error: function () {
                    wem._executeFallback('error during context loading');
                }
            });
            wem.contextLoaded = Error().stack;
            console.info('[WEM] context loading...');
        },

        /**
         * This function will send an event to Apache Unomi
         * @param {object} event The event object to send, you can build it using wem.buildEvent(eventType, target, source)
         * @param {function} successCallback optional, will be executed in case of success
         * @param {function} errorCallback optional, will be executed in case of error
         * @return {undefined}
         */
        collectEvent: function (event, successCallback = undefined, errorCallback = undefined) {
            wem.collectEvents({ events: [event] }, successCallback, errorCallback);
        },

        /**
         * This function will send the events to Apache Unomi
         *
         * @param {object} events Javascript object { events: [event1, event2] }
         * @param {function} successCallback optional, will be executed in case of success
         * @param {function} errorCallback optional, will be executed in case of error
         * @return {undefined}
         */
        collectEvents: function (events, successCallback = undefined, errorCallback = undefined) {
            if (wem.fallback) {
                // in case of fallback we don't want to collect any events
                return;
            }

            events.sessionId = wem.sessionID ? wem.sessionID : '';

            var data = JSON.stringify(events);
            wem.ajax({
                url: wem.contextServerUrl + '/eventcollector',
                type: 'POST',
                async: true,
                contentType: 'text/plain;charset=UTF-8', // Use text/plain to avoid CORS preflight
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
         * @param {function} [successCallback] optional, will be executed if case of success
         * @param {function} [errorCallback] optional, will be executed if case of error
         * @return {undefined}
         */
        sendClickEvent: function (event, successCallback = undefined, errorCallback = undefined) {
            if (event.target.id || event.target.name) {
                console.info('[WEM] Send click event');
                var targetId = event.target.id ? event.target.id : event.target.name;
                var clickEvent = wem.buildEvent('click',
                    wem.buildTarget(targetId, event.target.localName),
                    wem.buildSourcePage());

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
         * @param {function} [successCallback] optional, will be executed if case of success
         * @param {function} [errorCallback] optional, will be executed if case of error
         * @return {undefined}
         */
        sendVideoEvent: function (event, successCallback = undefined, errorCallback = undefined) {
            console.info('[WEM] catching video event');
            var videoEvent = wem.buildEvent('video', wem.buildTarget(event.target.id, 'video', { action: event.type }), wem.buildSourcePage());

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
         * @return {undefined}
         */
        invalidateSessionAndProfile: function () {
            'use strict';
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
         * @returns {object} the event
         */
        buildEvent: function (eventType, target, source) {
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
         * @param {HTMLFormElement} form optional HTML form element, if provided will be used to extract the form fields and populate the form event
         * @returns {object} the form event
         */
        buildFormEvent: function (formName, form = undefined) {
            const formEvent = wem.buildEvent('form', wem.buildTarget(formName, 'form'), wem.buildSourcePage());
            formEvent.flattenedProperties = {
                fields: form ? wem._extractFormData(form) : {}
            };
            return formEvent;
        },

        /**
         * This function return the source object for a source of type page
         *
         * @returns {object} the target page
         */
        buildTargetPage: function () {
            return wem.buildTarget(wem.digitalData.page.pageInfo.pageID, 'page', wem.digitalData.page);
        },

        /**
         * This function return the source object for a source of type page
         *
         * @returns {object} the source page
         */
        buildSourcePage: function () {
            return wem.buildSource(wem.digitalData.page.pageInfo.pageID, 'page', wem.digitalData.page);
        },

        /**
         * This function return the basic structure for the target of your event
         *
         * @param {string} targetId The ID of the target
         * @param {string} targetType The type of the target
         * @param {object} [targetProperties] The optional properties of the target
         * @returns {object} the target
         */
        buildTarget: function (targetId, targetType, targetProperties = undefined) {
            return wem._buildObject(targetId, targetType, targetProperties);
        },

        /**
         * This function return the basic structure for the source of your event
         *
         * @param {string} sourceId The ID of the source
         * @param {string} sourceType The type of the source
         * @param {object} [sourceProperties] The optional properties of the source
         * @returns {object} the source
         */
        buildSource: function (sourceId, sourceType, sourceProperties = undefined) {
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
         * @return {undefined}
         */
        setCookie: function (cookieName, cookieValue, expireDays) {
            var expires = '';
            if (expireDays) {
                var d = new Date();
                d.setTime(d.getTime() + (expireDays * 24 * 60 * 60 * 1000));
                expires = '; expires=' + d.toUTCString();
            }
            document.cookie = cookieName + '=' + cookieValue + expires + '; path=/; SameSite=Strict';
        },

        /**
         * This is an utility function to get a cookie
         *
         * @param {string} cookieName name of the cookie to get
         * @returns {string} the value of the first cookie with the corresponding name or null if not found
         */
        getCookie: function (cookieName) {
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
         * @return {undefined}
         */
        removeCookie: function (cookieName) {
            'use strict';
            wem.setCookie(cookieName, '', -1);
        },

        /**
         * This is an utility function to execute AJAX call
         *
         * @param {object} options options of the request
         * @return {undefined}
         */
        ajax: function (options) {
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
         * @returns {string} the newly generated UUID
         */
        generateGuid: function () {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }

            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
        },

        /**
         * This is an utility function to check if the local storage is available or not
         * @param {string} type the type of storage to test
         * @returns {boolean} true in case storage is available, false otherwise
         */
        storageAvailable: function (type) {
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

        /**
         * Dispatch a JavaScript event in current HTML document
         *
         * @param {string} name the name of the event
         * @param {boolean} canBubble does the event can bubble ?
         * @param {boolean} cancelable is the event cancelable ?
         * @param {*} detail event details
         * @return {undefined}
         */
        dispatchJSEvent: function (name, canBubble, cancelable, detail) {
            var event = document.createEvent('CustomEvent');
            event.initCustomEvent(name, canBubble, cancelable, detail);
            document.dispatchEvent(event);
        },

        /**
         * Fill the wem.digitalData.displayedVariants with the javascript event passed as parameter
         * @param {object} jsEvent javascript event
         * @private
         * @return {undefined}
         */
        _fillDisplayedVariants: (jsEvent) => {
            if (!wem.digitalData.displayedVariants) {
                wem.digitalData.displayedVariants = [];
            }
            wem.digitalData.displayedVariants.push(jsEvent);
        },

        /**
         * This is an utility function to get current url parameter value
         *
         * @param {string} name, the name of the parameter
         * @returns {string} the value of the parameter
         */
        getUrlParameter: function (name) {
            name = name.replace(/[[]/, '\\[').replace(/[\]]/, '\\]');
            var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
            var results = regex.exec(window.location.search);
            return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' '));
        },

        /**
         * convert the passed query string into JS object.
         * @param {string} searchString The URL query string
         * @returns {object} converted URL params
         */
        convertUrlParametersToObj: function (searchString) {
            if (!searchString) {
                return null;
            }

            return searchString
                .replace(/^\?/, '') // Only trim off a single leading interrobang.
                .split('&')
                .reduce((result, next) => {
                    if (next === '') {
                        return result;
                    }
                    let pair = next.split('=');
                    let key = decodeURIComponent(pair[0]);
                    let value = typeof pair[1] !== 'undefined' && decodeURIComponent(pair[1]) || undefined;
                    if (Object.prototype.hasOwnProperty.call(result, key)) { // Check to see if this property has been met before.
                        if (Array.isArray(result[key])) { // Is it already an array?
                            result[key].push(value);
                        } else { // Make it an array.
                            result[key] = [result[key], value];
                        }
                    } else { // First time seen, just add it.
                        result[key] = value;
                    }

                    return result;
                }, {}
                );
        },

        /*************************************/
        /* Private functions under this line */
        /*************************************/
        /**
         * Used to override the default digitalData values,
         * the result will impact directly the current instance wem.digitalData
         *
         * @param {object[]} digitalDataOverrides list of overrides
         * @private
         * @return {undefined}
         */
        _handleDigitalDataOverrides: function (digitalDataOverrides) {
            if (digitalDataOverrides && digitalDataOverrides.length > 0) {
                for (const digitalDataOverride of digitalDataOverrides) {
                    wem.digitalData = wem._deepMergeObjects(digitalDataOverride, wem.digitalData);
                }
            }
        },

        /**
         * Check for tracked conditions in the current loaded context, and attach listeners for the known tracked condition types:
         * - formEventCondition
         * - videoViewEventCondition
         * - clickOnLinkEventCondition
         *
         * @private
         * @return {undefined}
         */
        _registerListenersForTrackedConditions: function () {
            console.info('[WEM] Check for tracked conditions and attach related HTML listeners');

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
                var formName = form.getAttribute('name') ? form.getAttribute('name') : form.getAttribute('id');
                // test attribute data-form-id to not add a listener on FF form
                if (formName && wem.formNamesToWatch.indexOf(formName) > -1 && form.getAttribute('data-form-id') == null) {
                    // add submit listener on form that we need to watch only
                    console.info('[WEM] Watching form ' + formName);
                    form.addEventListener('submit', wem._formSubmitEventListener, true);
                }
            }

            for (var videoIndex = 0; videoIndex < videoNamesToWatch.length; videoIndex++) {
                var videoName = videoNamesToWatch[videoIndex];
                var video = document.getElementById(videoName) || document.getElementById(wem._resolveId(videoName));

                if (video) {
                    video.addEventListener('play', wem.sendVideoEvent);
                    video.addEventListener('ended', wem.sendVideoEvent);
                    console.info('[WEM] Watching video ' + videoName);
                } else {
                    console.warn('[WEM] Unable to watch video ' + videoName + ', video not found in the page');
                }
            }

            for (var clickIndex = 0; clickIndex < clickToWatch.length; clickIndex++) {
                var clickIdName = clickToWatch[clickIndex];
                var click = (document.getElementById(clickIdName) || document.getElementById(wem._resolveId(clickIdName)))
                    ? (document.getElementById(clickIdName) || document.getElementById(wem._resolveId(clickIdName)))
                    : document.getElementsByName(clickIdName)[0];
                if (click) {
                    click.addEventListener('click', wem.sendClickEvent);
                    console.info('[WEM] Watching click ' + clickIdName);
                } else {
                    console.warn('[WEM] Unable to watch click ' + clickIdName + ', element not found in the page');
                }
            }
        },

        /**
         * Check for currently registered events in wem.digitalData.events that would be incomplete:
         * - autocomplete the event with the current digitalData page infos for the source
         * @private
         * @return {undefined}
         */
        _checkUncompleteRegisteredEvents: function () {
            if (wem.digitalData && wem.digitalData.events) {
                for (const event of wem.digitalData.events) {
                    wem._completeEvent(event);
                }
            }
        },

        /**
         * dispatch JavaScript event in current HTML document for perso and opti events contains in digitalData.events
         * @private
         * @return {undefined}
         */
        _dispatchJSExperienceDisplayedEvents: () => {
            if (wem.digitalData && wem.digitalData.events) {
                for (const event of wem.digitalData.events) {
                    if (event.eventType === 'optimizationTestEvent' || event.eventType === 'personalizationEvent') {
                        wem._dispatchJSExperienceDisplayedEvent(event);
                    }
                }
            }
        },

        /**
         * build and dispatch JavaScript event in current HTML document for the given Unomi event (perso/opti)
         * @private
         * @param {object} experienceUnomiEvent perso/opti Unomi event
         * @return {undefined}
         */
        _dispatchJSExperienceDisplayedEvent: experienceUnomiEvent => {
            if (!wem.fallback &&
                experienceUnomiEvent &&
                experienceUnomiEvent.target &&
                experienceUnomiEvent.target.properties &&
                experienceUnomiEvent.target.properties.variants &&
                experienceUnomiEvent.target.properties.variants.length > 0) {

                let typeMapper = {
                    optimizationTestEvent: 'optimization',
                    personalizationEvent: 'personalization'
                };
                for (const variant of experienceUnomiEvent.target.properties.variants) {
                    let jsEventDetail = {
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

                    if (experienceUnomiEvent.eventType === 'personalizationEvent') {
                        jsEventDetail.wrapper.inControlGroup = experienceUnomiEvent.target.properties.inControlGroup;
                    }
                    wem._fillDisplayedVariants(jsEventDetail);
                    wem.dispatchJSEvent('displayWemVariant', false, false, jsEventDetail);
                }
            }
        },

        /**
         * Filter events in digitalData.events that would have the property: event.properties.doNotSendToUnomi
         * The effect is directly stored in a new version of wem.digitalData.events
         * @private
         * @return {undefined}
         */
        _filterUnomiEvents: () => {
            if (wem.digitalData && wem.digitalData.events) {
                wem.digitalData.events = wem.digitalData.events
                    .filter(event => !event.properties || !event.properties.doNotSendToUnomi)
                    .map(event => {
                        if (event.properties) {
                            delete event.properties.doNotSendToUnomi;
                        }
                        return event;
                    });
            }
        },

        /**
         * Check if event is incomplete and complete what is missing:
         * - source: if missing, use the current source page
         * - scope: if missing, use the current scope
         * @param {object} event, the event to be checked
         * @private
         * @return {object} the complete event
         */
        _completeEvent: function (event) {
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

        /**
         * Register an event in the wem.digitalData.events.
         * Registered event, will be sent automatically during the context loading process.
         *
         * Beware this function is useless in case the context is already loaded.
         * in case the context is already loaded (check: wem.getLoadedContext()), then you should use: wem.collectEvent(s) functions
         *
         * @private
         * @param {object} event the Unomi event to be registered
         * @param {boolean} unshift optional, if true, the event will be added at the beginning of the list otherwise at the end of the list. (default: false)
         * @return {undefined}
         */
        _registerEvent: function (event, unshift = false) {
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
         * @param {function} onLoadCallback the callback to be executed
         * @param {string} name optional name for the call, used mostly for logging the execution
         * @param {number} priority optional priority to execute the callbacks in a specific order
         *                          (default: 5, to leave room for the tracker default callback(s))
         * @private
         * @return {undefined}
         */
        _registerCallback: function (onLoadCallback, name = undefined, priority = 5) {
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
                            priority,
                            name,
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
                        priority,
                        name,
                        execute: onLoadCallback
                    });
                }
            }
        },

        /**
         * Internal function for personalization specific callbacks (used for HTML dom manipulation once we get the context loaded)
         * @param {object} personalization the personalization
         * @param {function} callback the callback
         * @private
         * @return {undefined}
         */
        _registerPersonalizationCallback: function (personalization, callback) {
            if (wem.digitalData) {
                if (wem.cxs) {
                    console.error('[WEM] already loaded, too late...');
                } else {
                    console.info('[WEM] digitalData object present but not loaded, registering sort callback...');
                    wem.digitalData.personalizationCallback = wem.digitalData.personalizationCallback || [];
                    wem.digitalData.personalizationCallback.push({ personalization: personalization, callback: callback });
                }
            } else {
                wem.digitalData = {};
                wem.digitalData.personalizationCallback = wem.digitalData.personalizationCallback || [];
                wem.digitalData.personalizationCallback.push({ personalization: personalization, callback: callback });
            }
        },

        /**
         * Build a simple Unomi object
         * @param {string} itemId the itemId of the object
         * @param {string} itemType the itemType of the object
         * @param {object} properties optional properties for the object
         * @private
         * @return {object} the built Unomi JSON object
         */
        _buildObject: function (itemId, itemType, properties = undefined) {
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

        /**
         * Main callback used once the Ajax context request succeed
         * @param {XMLHttpRequest} xhr the request
         * @private
         * @return {undefined}
         */
        _onSuccess: function (xhr) {
            wem.cxs = JSON.parse(xhr.responseText);

            if (wem.digitalData.loadCallbacks && wem.digitalData.loadCallbacks.length > 0) {
                console.info('[WEM] Found context server load callbacks, calling now...');
                wem._executeLoadCallbacks(wem.digitalData);

                if (wem.digitalData.personalizationCallback) {
                    for (var j = 0; j < wem.digitalData.personalizationCallback.length; j++) {
                        if (wem.cxs.personalizationResults) {
                            // Since Unomi 2.1.0 personalization results are available with more infos
                            var personalizationResult = wem.cxs.personalizationResults[wem.digitalData.personalizationCallback[j].personalization.id];
                            wem.digitalData.personalizationCallback[j].callback(personalizationResult.contentIds, personalizationResult.additionalResultInfos);
                        } else {
                            // probably a version older than Unomi 2.1.0, fallback to old personalization results
                            wem.digitalData.personalizationCallback[j].callback(wem.cxs.personalizations[wem.digitalData.personalizationCallback[j].personalization.id]);
                        }
                    }
                }
            }
        },

        /**
         * Main callback used once the Ajax context request failed
         * @param {string} logMessage the log message, to identify the place of failure
         * @private
         * @return {undefined}
         */
        _executeFallback: function (logMessage) {
            console.warn('[WEM] execute fallback' + (logMessage ? (': ' + logMessage) : '') + ', load fallback callbacks, calling now...');
            wem.fallback = true;
            wem.cxs = {};
            wem._executeLoadCallbacks(undefined);

            if (wem.digitalData.personalizationCallback) {
                for (var i = 0; i < wem.digitalData.personalizationCallback.length; i++) {
                    wem.digitalData.personalizationCallback[i].callback([wem.digitalData.personalizationCallback[i].personalization.strategyOptions.fallback]);
                }
            }
        },

        /**
         * Executed the registered context loaded callbacks
         * @param {*} callbackParam param of the callbacks
         * @private
         * @return {undefined}
         */
        _executeLoadCallbacks: function (callbackParam) {
            if (wem.digitalData.loadCallbacks && wem.digitalData.loadCallbacks.length > 0) {
                wem.digitalData.loadCallbacks
                    .sort((a, b) => a.priority - b.priority)
                    .forEach(loadCallback => {
                        console.info('[WEM] executing context load callback: ' + (loadCallback.name ? loadCallback.name : 'callback without name'));
                        loadCallback.execute(callbackParam);
                    });
            }
        },

        /**
         * Parse current HTML document referrer information to enrich the digitalData page infos
         * @private
         * @return {undefined}
         */
        _processReferrer: function () {
            var referrerURL = wem.digitalData.page.pageInfo.referringURL || document.referrer;
            var sameDomainReferrer = false;
            if (referrerURL) {
                // parse referrer URL
                var referrer = new URL(referrerURL);
                // Set sameDomainReferrer property
                sameDomainReferrer = referrer.host === window.location.host;

                // only process referrer if it's not coming from the same site as the current page
                if (!sameDomainReferrer) {
                    // get search element if it exists and extract search query if available
                    var search = referrer.search;
                    var query = undefined;
                    if (search && search != '') {
                        // parse parameters
                        var queryParams = [], param;
                        var queryParamPairs = search.slice(1).split('&');
                        for (var i = 0; i < queryParamPairs.length; i++) {
                            param = queryParamPairs[i].split('=');
                            queryParams.push(param[0]);
                            queryParams[param[0]] = param[1];
                        }

                        // try to extract query: q is Google-like (most search engines), p is Yahoo
                        query = queryParams.q || queryParams.p;
                        query = decodeURIComponent(query).replace(/\+/g, ' ');
                    }

                    // register referrer event
                    // Create deep copy of wem.digitalData.page and add data to pageInfo sub object
                    if (wem.digitalData && wem.digitalData.page && wem.digitalData.page.pageInfo) {
                        wem.digitalData.page.pageInfo.referrerHost = referrer.host;
                        wem.digitalData.page.pageInfo.referrerQuery = query;
                    }
                }
            }
            wem.digitalData.page.pageInfo.sameDomainReferrer = sameDomainReferrer;
        },

        /**
         * Listener callback that can be attached to a specific HTML form,
         * this listener will automatically send the form event to Unomi, by parsing the HTML form data.
         * (NOTE: the form listener only work for know forms to be watch due to tracked conditions)
         *
         * @param {object} event the original HTML form submition event for the watch form.
         * @private
         * @return {undefined}
         */
        _formSubmitEventListener: function (event) {
            console.info('[WEM] Registering form event callback');
            var form = event.target;
            var formName = form.getAttribute('name') ? form.getAttribute('name') : form.getAttribute('id');
            if (formName && wem.formNamesToWatch.indexOf(formName) > -1) {
                console.info('[WEM] catching form ' + formName);

                var eventCopy = document.createEvent('Event');
                // Define that the event name is 'build'.
                eventCopy.initEvent('submit', event.bubbles, event.cancelable);

                event.stopImmediatePropagation();
                event.preventDefault();

                wem.collectEvent(wem.buildFormEvent(formName, form),
                    function () {
                        form.removeEventListener('submit', wem._formSubmitEventListener, true);
                        form.dispatchEvent(eventCopy);
                        if (!eventCopy.defaultPrevented && !eventCopy.cancelBubble) {
                            form.submit();
                        }
                        form.addEventListener('submit', wem._formSubmitEventListener, true);
                    },
                    function (xhr) {
                        console.error('[WEM] Error while collecting form event: ' + xhr.status + ' ' + xhr.statusText);
                        xhr.abort();
                        form.removeEventListener('submit', wem._formSubmitEventListener, true);
                        form.dispatchEvent(eventCopy);
                        if (!eventCopy.defaultPrevented && !eventCopy.cancelBubble) {
                            form.submit();
                        }
                        form.addEventListener('submit', wem._formSubmitEventListener, true);
                    }
                );
            }
        },

        /**
         * Utility function to extract data from an HTML form.
         *
         * @param {HTMLFormElement} form the HTML form element
         * @private
         * @return {object} the form data as JSON
         */
        _extractFormData: function (form) {
            var params = {};
            for (var i = 0; i < form.elements.length; i++) {
                var e = form.elements[i];
                // ignore empty and undefined key (e.name)
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

        /**
         * Internal function used for mapping ids when current HTML document ids doesn't match ids stored in Unomi backend
         * @param {string} id the id to resolve
         * @return {string} the resolved id or the original id if not match found
         * @private
         */
        _resolveId: function (id) {
            if (wem.digitalData.sourceLocalIdentifierMap) {
                var source = Object.keys(wem.digitalData.sourceLocalIdentifierMap).filter(function (source) {
                    return id.indexOf(source) > 0;
                });
                return source ? id.replace(source, wem.digitalData.sourceLocalIdentifierMap[source]) : id;
            }
            return id;
        },

        /**
         * Enable or disable tracking in current page
         * @param {boolean} enable true will enable the tracking feature, otherwise they will be disabled
         * @param {function} callback an optional callback that can be used to perform additional logic based on enabling/disabling results
         * @private
         * @return {undefined}
         */
        _enableWem: (enable, callback = undefined) => {
            // display fallback if wem is not enable
            wem.fallback = !enable;
            // remove cookies, reset cxs
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
            console.log(`[WEM] successfully ${enable ? 'enabled' : 'disabled'} tracking in current page`);
        },

        /**
         * Utility function used to merge two JSON object together (arrays are concat for example)
         * @param {object} source the source object for merge
         * @param {object} target the target object for merge
         * @private
         * @return {object} the merged results
         */
        _deepMergeObjects: function (source, target) {
            if (!wem._isObject(target) || !wem._isObject(source)) {
                return source;
            }

            Object.keys(source).forEach(key => {
                const targetValue = target[key];
                const sourceValue = source[key];

                // concat arrays || merge objects || add new props
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

        /**
         * Utility function used to check if the given variable is a JavaScript object.
         * @param {*} obj the variable to check
         * @private
         * @return {boolean} true if the variable is an object, false otherwise
         */
        _isObject: function (obj) {
            return obj && typeof obj === 'object';
        }
    };

    return wem;
};