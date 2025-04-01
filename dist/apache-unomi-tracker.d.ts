export function useTracker(): {
    /**
     * This function initialize the tracker
     *
     * @param {object} digitalData config of the tracker
     * @returns {undefined}
     */
    initTracker: (digitalData: object) => undefined;
    /**
     * This function start the tracker by loading the context in the page
     * Note: that the tracker will start once the current DOM is complete loaded, using listener on current document: DOMContentLoaded
     *
     * @param {object[]} digitalDataOverrides optional, list of digitalData extensions, they will be merged with original digitalData before context loading
     * @returns {undefined}
     */
    startTracker: (digitalDataOverrides?: object[]) => undefined;
    /**
     * get the current loaded context from Unomi, will be accessible only after loadContext() have been performed
     * @returns {object} loaded context
     */
    getLoadedContext: () => object;
    /**
     * In case Unomi contains rules related to HTML forms in the current page.
     * The logic is simple, in case a rule exists in Unomi targeting a form event within the current webpage path
     *  - then this form will be identified as form to be watched.
     * You can reuse this function to get the list of concerned forms in order to attach listeners automatically for those form for example
     * (not that current tracker is doing that by default, check function: _registerListenersForTrackedConditions())
     * @returns {string[]} form names/ids in current web page
     */
    getFormNamesToWatch: () => string[];
    /**
     * Get current session id
     * @returns {null|string} get current session id
     */
    getSessionId: () => null | string;
    /**
     * This function will register a personalization
     *
     * @param {object} personalization the personalization object
     * @param {object} variants the variants
     * @param {boolean} [ajax] Deprecated: Ajax rendering is not supported anymore
     * @param {function} [resultCallback] the callback to be executed after personalization resolved
     * @returns {undefined}
     */
    registerPersonalizationObject: (personalization: object, variants: object, ajax?: boolean, resultCallback?: Function) => undefined;
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
    registerOptimizationTest: (optimizationTestNodeId: string, goalId: string, containerId: string, variants: object, ajax?: boolean, variantsTraffic?: object) => undefined;
    /**
     * This function is used to load the current context in the page
     *
     * @param {boolean} [skipEvents=false] Should we send the events
     * @param {boolean} [invalidate=false] Should we invalidate the current context
     * @param {boolean} [forceReload=false] This function contains an internal check to avoid loading of the context multiple times.
     *                                      But in some rare cases, it could be useful to force the reloading of the context and bypass the check.
     * @return {undefined}
     */
    loadContext: (skipEvents?: boolean, invalidate?: boolean, forceReload?: boolean) => undefined;
    /**
     * This function will send an event to Apache Unomi
     * @param {object} event The event object to send, you can build it using wem.buildEvent(eventType, target, source)
     * @param {function} successCallback optional, will be executed in case of success
     * @param {function} errorCallback optional, will be executed in case of error
     * @return {undefined}
     */
    collectEvent: (event: object, successCallback?: Function, errorCallback?: Function) => undefined;
    /**
     * This function will send the events to Apache Unomi
     *
     * @param {object} events Javascript object { events: [event1, event2] }
     * @param {function} successCallback optional, will be executed in case of success
     * @param {function} errorCallback optional, will be executed in case of error
     * @return {undefined}
     */
    collectEvents: (events: object, successCallback?: Function, errorCallback?: Function) => undefined;
    /**
     * This function will build an event of type click and send it to Apache Unomi
     *
     * @param {object} event javascript
     * @param {function} [successCallback] optional, will be executed if case of success
     * @param {function} [errorCallback] optional, will be executed if case of error
     * @return {undefined}
     */
    sendClickEvent: (event: object, successCallback?: Function, errorCallback?: Function) => undefined;
    /**
     * This function will build an event of type video and send it to Apache Unomi
     *
     * @param {object} event javascript
     * @param {function} [successCallback] optional, will be executed if case of success
     * @param {function} [errorCallback] optional, will be executed if case of error
     * @return {undefined}
     */
    sendVideoEvent: (event: object, successCallback?: Function, errorCallback?: Function) => undefined;
    /**
     * This function will invalidate the Apache Unomi session and profile,
     * by removing the associated cookies, set the loaded context to undefined
     * and set the session id cookie with a newly generated ID
     * @return {undefined}
     */
    invalidateSessionAndProfile: () => undefined;
    /**
     * This function return the basic structure for an event, it must be adapted to your need
     *
     * @param {string} eventType The name of your event
     * @param {object} [target] The target object for your event can be build with wem.buildTarget(targetId, targetType, targetProperties)
     * @param {object} [source] The source object for your event can be build with wem.buildSource(sourceId, sourceType, sourceProperties)
     * @returns {object} the event
     */
    buildEvent: (eventType: string, target?: object, source?: object) => object;
    /**
     * This function return an event of type form
     *
     * @param {string} formName The HTML name of id of the form to use in the target of the event
     * @param {HTMLFormElement} form optional HTML form element, if provided will be used to extract the form fields and populate the form event
     * @returns {object} the form event
     */
    buildFormEvent: (formName: string, form?: HTMLFormElement) => object;
    buildSearchEvent: (formName: any, form: any, term: any, language: any) => object;
    /**
     * This function return the source object for a source of type page
     *
     * @returns {object} the target page
     */
    buildTargetPage: () => object;
    /**
     * This function return the source object for a source of type page
     *
     * @returns {object} the source page
     */
    buildSourcePage: () => object;
    /**
     * This function return the basic structure for the target of your event
     *
     * @param {string} targetId The ID of the target
     * @param {string} targetType The type of the target
     * @param {object} [targetProperties] The optional properties of the target
     * @returns {object} the target
     */
    buildTarget: (targetId: string, targetType: string, targetProperties?: object) => object;
    /**
     * This function return the basic structure for the source of your event
     *
     * @param {string} sourceId The ID of the source
     * @param {string} sourceType The type of the source
     * @param {object} [sourceProperties] The optional properties of the source
     * @returns {object} the source
     */
    buildSource: (sourceId: string, sourceType: string, sourceProperties?: object) => object;
    /*************************************/
    /*************************************/
    /**
     * This is an utility function to set a cookie
     *
     * @param {string} cookieName name of the cookie
     * @param {string} cookieValue value of the cookie
     * @param {number} [expireDays] number of days to set the expire date
     * @return {undefined}
     */
    setCookie: (cookieName: string, cookieValue: string, expireDays?: number) => undefined;
    /**
     * This is an utility function to get a cookie
     *
     * @param {string} cookieName name of the cookie to get
     * @returns {string} the value of the first cookie with the corresponding name or null if not found
     */
    getCookie: (cookieName: string) => string;
    /**
     * This is an utility function to remove a cookie
     *
     * @param {string} cookieName the name of the cookie to rename
     * @return {undefined}
     */
    removeCookie: (cookieName: string) => undefined;
    /**
     * This is an utility function to execute AJAX call
     *
     * @param {object} options options of the request
     * @return {undefined}
     */
    ajax: (options: object) => undefined;
    /**
     * This is an utility function to generate a new UUID
     *
     * @returns {string} the newly generated UUID
     */
    generateGuid: () => string;
    /**
     * This is an utility function to check if the local storage is available or not
     * @param {string} type the type of storage to test
     * @returns {boolean} true in case storage is available, false otherwise
     */
    storageAvailable: (type: string) => boolean;
    /**
     * Dispatch a JavaScript event in current HTML document
     *
     * @param {string} name the name of the event
     * @param {boolean} canBubble does the event can bubble ?
     * @param {boolean} cancelable is the event cancelable ?
     * @param {*} detail event details
     * @return {undefined}
     */
    dispatchJSEvent: (name: string, canBubble: boolean, cancelable: boolean, detail: any) => undefined;
    /**
     * Fill the wem.digitalData.displayedVariants with the javascript event passed as parameter
     * @param {object} jsEvent javascript event
     * @private
     * @return {undefined}
     */
    _fillDisplayedVariants: (jsEvent: object) => undefined;
    /**
     * This is an utility function to get current url parameter value
     *
     * @param {string} name, the name of the parameter
     * @returns {string} the value of the parameter
     */
    getUrlParameter: (name: string) => string;
    /**
     * convert the passed query string into JS object.
     * @param {string} searchString The URL query string
     * @returns {object} converted URL params
     */
    convertUrlParametersToObj: (searchString: string) => object;
    /*************************************/
    /*************************************/
    /**
     * Used to override the default digitalData values,
     * the result will impact directly the current instance wem.digitalData
     *
     * @param {object[]} digitalDataOverrides list of overrides
     * @private
     * @return {undefined}
     */
    _handleDigitalDataOverrides: (digitalDataOverrides: object[]) => undefined;
    /**
     * Check for tracked conditions in the current loaded context, and attach listeners for the known tracked condition types:
     * - formEventCondition
     * - videoViewEventCondition
     * - clickOnLinkEventCondition
     *
     * @private
     * @return {undefined}
     */
    _registerListenersForTrackedConditions: () => undefined;
    /**
     * Check for currently registered events in wem.digitalData.events that would be incomplete:
     * - autocomplete the event with the current digitalData page infos for the source
     * @private
     * @return {undefined}
     */
    _checkUncompleteRegisteredEvents: () => undefined;
    /**
     * dispatch JavaScript event in current HTML document for perso and opti events contains in digitalData.events
     * @private
     * @return {undefined}
     */
    _dispatchJSExperienceDisplayedEvents: () => undefined;
    /**
     * build and dispatch JavaScript event in current HTML document for the given Unomi event (perso/opti)
     * @private
     * @param {object} experienceUnomiEvent perso/opti Unomi event
     * @return {undefined}
     */
    _dispatchJSExperienceDisplayedEvent: (experienceUnomiEvent: object) => undefined;
    /**
     * Filter events in digitalData.events that would have the property: event.properties.doNotSendToUnomi
     * The effect is directly stored in a new version of wem.digitalData.events
     * @private
     * @return {undefined}
     */
    _filterUnomiEvents: () => undefined;
    /**
     * Check if event is incomplete and complete what is missing:
     * - source: if missing, use the current source page
     * - scope: if missing, use the current scope
     * @param {object} event, the event to be checked
     * @private
     * @return {object} the complete event
     */
    _completeEvent: (event: object) => object;
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
    _registerEvent: (event: object, unshift?: boolean) => undefined;
    /**
     * This function allow for registering callback that will be executed once the context is loaded.
     * @param {function} onLoadCallback the callback to be executed
     * @param {string} name optional name for the call, used mostly for logging the execution
     * @param {number} priority optional priority to execute the callbacks in a specific order
     *                          (default: 5, to leave room for the tracker default callback(s))
     * @private
     * @return {undefined}
     */
    _registerCallback: (onLoadCallback: Function, name?: string, priority?: number) => undefined;
    /**
     * Internal function for personalization specific callbacks (used for HTML dom manipulation once we get the context loaded)
     * @param {object} personalization the personalization
     * @param {function} callback the callback
     * @private
     * @return {undefined}
     */
    _registerPersonalizationCallback: (personalization: object, callback: Function) => undefined;
    /**
     * Build a simple Unomi object
     * @param {string} itemId the itemId of the object
     * @param {string} itemType the itemType of the object
     * @param {object} properties optional properties for the object
     * @private
     * @return {object} the built Unomi JSON object
     */
    _buildObject: (itemId: string, itemType: string, properties?: object) => object;
    /**
     * Main callback used once the Ajax context request succeed
     * @param {XMLHttpRequest} xhr the request
     * @private
     * @return {undefined}
     */
    _onSuccess: (xhr: XMLHttpRequest) => undefined;
    /**
     * Main callback used once the Ajax context request failed
     * @param {string} logMessage the log message, to identify the place of failure
     * @private
     * @return {undefined}
     */
    _executeFallback: (logMessage: string) => undefined;
    /**
     * Executed the registered context loaded callbacks
     * @param {*} callbackParam param of the callbacks
     * @private
     * @return {undefined}
     */
    _executeLoadCallbacks: (callbackParam: any) => undefined;
    /**
     * Parse current HTML document referrer information to enrich the digitalData page infos
     * @private
     * @return {undefined}
     */
    _processReferrer: () => undefined;
    /**
     * Listener callback that can be attached to a specific HTML form,
     * this listener will automatically send the form event to Unomi, by parsing the HTML form data.
     * (NOTE: the form listener only work for know forms to be watch due to tracked conditions)
     *
     * @param {object} event the original HTML form submition event for the watch form.
     * @private
     * @return {undefined}
     */
    _formSubmitEventListener: (event: object) => undefined;
    /**
     * Utility function to extract data from an HTML form.
     *
     * @param {HTMLFormElement} form the HTML form element
     * @private
     * @return {object} the form data as JSON
     */
    _extractFormData: (form: HTMLFormElement) => object;
    /**
     * Internal function used for mapping ids when current HTML document ids doesn't match ids stored in Unomi backend
     * @param {string} id the id to resolve
     * @return {string} the resolved id or the original id if not match found
     * @private
     */
    _resolveId: (id: string) => string;
    /**
     * Enable or disable tracking in current page
     * @param {boolean} enable true will enable the tracking feature, otherwise they will be disabled
     * @param {function} callback an optional callback that can be used to perform additional logic based on enabling/disabling results
     * @private
     * @return {undefined}
     */
    _enableWem: (enable: boolean, callback?: Function) => undefined;
    /**
     * Utility function used to merge two JSON object together (arrays are concat for example)
     * @param {object} source the source object for merge
     * @param {object} target the target object for merge
     * @private
     * @return {object} the merged results
     */
    _deepMergeObjects: (source: object, target: object) => object;
    /**
     * Utility function used to check if the given variable is a JavaScript object.
     * @param {*} obj the variable to check
     * @private
     * @return {boolean} true if the variable is an object, false otherwise
     */
    _isObject: (obj: any) => boolean;
};
