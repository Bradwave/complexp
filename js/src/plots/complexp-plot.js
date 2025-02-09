/**
 * Plots of a function.
 * @param {String} id ID/Key of the canvas.
 * @param {Array} options Options of the plot. 
 * @returns Public APIs.
 */
let complexpPlot = function (id, options) {

    /**
     * Public methods.
     */
    let publicAPIs = {};

    /**
     * Coordinate system.
     */
    let cs;

    /*_______________________________________
    |   Math
    */

    /**
     * Absolute values of series vectors.
     */
    let seriesTerms = [];

    /**
     * Coordinates of the series partial sum.
     */
    let partialSum = [];

    /**
     * Index at which the series terms start decreasing
     */
    let seriesDecreasingIndex;

    /**
     * Unit vectors that indicates the direction of the series therms.
     */
    let vectorDirections = [
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
        { x: 0, y: -1 },
    ]

    /*_______________________________________
    |   Resizing variables
    */

    /**
     * Width of the plot.
     */
    let width;

    /**
     * Height of the plot.
     */
    let height;

    /*_______________________________________
    |   Plot of the geometric aid
    */

    /**
     * Vector plot
     */
    let gPlot;

    /**
     * Contexts of the vectors plot.
     */
    let gCtx;

    /*_______________________________________
    |   Plot of vectors
    */

    /**
     * Vector plot
     */
    let vPlot;

    /**
     * Contexts of the vectors plot.
     */
    let vCtx;

    /*_______________________________________
    |   Plots of points
    */

    /**
     * Plot of points.
     */
    let pPlot;

    /**
     * Context of the points plot.
     */
    let pCtx;

    /*_______________________________________
    |   General variables
    */

    /**
     * True if the renderer is running, false otherwise.
     */
    let isRunning = true;

    /**
     * True if the vectors renderer is running, false otherwise.
     */
    let isVectorsRunning = false;

    /**
     * True if the plot is being translated along a certain axes, false otherwise.
     */
    let isTranslating = { x: false, y: false };

    /**
     * True if touch on the canvas started, false otherwise.
     */
    let isLeftMouseDown = false;

    /**
     * Mouse or touch position in screen coordinates (x, y).
     */
    let touchPosition;

    /**
     * Current zoom factor.
     */
    let currentZoom = 1;

    /**
     * True if the grid is visible, false otherwise.
     */
    let isGridVisible = true;

    /**
     * True if the geometric aid is visible, false otherwise.
     */
    let isGeometricAidVisible = false;

    /**
     * True if the plot is full screen, false otherwise.
     */
    let isFullscreen = false;

    /*_______________________________________
    |   Parameters
    */

    /**
     * Parameters.
     */
    let params = [];

    /*_______________________________________
    |   Methods
    */

    /**
     * Computes the Taylor series for the complex exponential function.
     */
    function computeSeries() {
        // Defines the factorial of 0
        let factorial = 1;

        // Stores the parameters
        const x = params["x"];
        const r = params["r"];

        // Defines the partial sum for index 0
        partialSum[0] = { x: 0, y: 0 };

        // Sets to 0 the index at which the series terms start decreasing
        seriesDecreasingIndex = 0;

        for (let n = 0; n < 100; n++) {
            // Computes the Taylor series term
            const seriesTerm = r * Math.pow(x, n) / factorial;
            // Stores the term
            seriesTerms[n] = seriesTerm;

            // If the series terms start decreasing, the index is stored
            if (n > 0 && Math.abs(seriesTerms[n - 1]) > Math.abs(seriesTerm) && seriesDecreasingIndex == 0) {
                seriesDecreasingIndex = n;
            }

            // Computes the partial sum
            partialSum[n + 1] = {
                x: partialSum[n].x + vectorDirections[n % 4].x * seriesTerm,
                y: partialSum[n].y + vectorDirections[n % 4].y * seriesTerm
            };

            // Updates the factorial
            factorial *= n + 1;
        }
    }

    /**
     * Inits the plot.
     */
    function init() {
        // Sets default parameters
        if (options.parameters == undefined) options.parameters = [];
        if (options.points == undefined) options.points = [];
        if (options.labelSize == undefined) options.labelSize = 15;
        if (options.realColor == undefined) options.realColor = "#1484e6";
        if (options.imaginaryColor == undefined) options.imaginaryColor = "#B01A00";
        if (options.vectorWidth == undefined) options.vectorWidth = 3;
        if (options.arrowSize == undefined) options.arrowSize = 10;
        if (options.backgroundColor == undefined) options.backgroundColor = "#ffffff";
        if (options.geometricAidColor == undefined) options.geometricAidColor = "#222222";
        if (options.geometricAidWidth == undefined) options.geometricAidWidth = 2;
        if (options.axisColor == undefined) options.axisColor = "#3c3c3c";
        if (options.gridColor == undefined) options.gridColor = "#777777";
        if (options.gridLineWidth == undefined) options.gridLineWidth = 1;
        if (options.secondaryGridColor == undefined) options.secondaryGridColor = "#7777776e";
        if (options.secondaryGridLineWidth == undefined) options.secondaryGridLineWidth = 1
        if (options.isGridVisible == undefined) options.isGridVisible = true;
        if (options.isGridToggleActive == undefined) options.isGridToggleActive = true;
        if (options.isRefreshActive == undefined) options.isRefreshActive = true;
        if (options.isTranslationActive == undefined) options.isTranslationActive = true;
        if (options.isZoomActive == undefined) options.isZoomActive = true;
        if (options.isFullscreenToggleActive == undefined) options.isFullscreenToggleActive = true;

        // Sets the grid visibility
        isGridVisible = options.isGridVisible;

        // Creates the vector plot structure
        gPlot = new plotStructure("geometric-aid-" + id, { alpha: true });
        // Gets the context
        gCtx = gPlot.getCtx();

        // Creates the vector plot structure
        vPlot = new plotStructure("vectors-" + id, { alpha: true });
        // Gets the context
        vCtx = vPlot.getCtx();

        // Sets the initial value of the parameters
        options.parameters.forEach((p) => {
            // Gets the starting value of the parameter from the corresponding input slider
            params[p.id] = parseFloat(document.getElementById(id + "-param-" + p.id).value);
            // Sets the slider animation status to false
            p.isPlaying = false;
            // When animated, it starts increasing by default
            p.isIncreasing = true;
            // Sets the default animation speed if undefined
            if (p.animationSpeed == undefined) p.animationSpeed = 0.5;
        });

        // If points are present...
        if (options.points.length > 0) {
            // Creates the plot structure
            pPlot = new plotStructure("points" + "-" + id, { alpha: true });
            // And stores the context
            pCtx = pPlot.getCtx();
        }

        // Sets default options for points
        options.points.forEach(p => {
            if (p.color == undefined) p.color = "#1484e6";
            if (p.size == undefined) p.size = 2;
            if (p.outline == undefined) p.outline = true;
        });

        // Updates width and heigh of the canvas
        updateCanvasDimension();

        // Create a new coordinate system
        cs = new CoordinateSystem(width, height,
            { x: options.viewportCenter.x, y: options.viewportCenter.y }, options.initialPixelsPerUnit);

        // Adds event listeners
        addEventListeners();
    }

    /*_______________________________________
    |   Canvas and canvas dimension
    */

    const axisPlot = new plotStructure(id, { alpha: true });
    const axisCtx = axisPlot.getCtx();

    /**
     * Updates width and heigh of the canvas.
     */
    function updateCanvasDimension() {
        // Resizes the axis/grid canvas
        axisPlot.resizeCanvas();
        // Resizes the geometric aid canvas
        gPlot.resizeCanvas();
        // Resizes the vectors canvas
        vPlot.resizeCanvas();
        // Resizes the points canvas
        if (options.points.length > 0) pPlot.resizeCanvas();
        // Stores the new dimensions
        width = Math.ceil(axisPlot.getWidth());
        height = Math.ceil(axisPlot.getHeight());
    }


    /**
     * Resizes the canvas to fill the HTML canvas element.
     */
    publicAPIs.resizeCanvas = () => {
        // Updates width and heigh of the canvas
        updateCanvasDimension();
        // Updates the edges of the canvas in the coordinate system
        cs.updateSystem(width, height);
    }

    /*_______________________________________
    |   Events and controls
    */

    function addEventListeners() {

        const eventsCache = [];
        let previousDiff = -1;
        let isZooming = false;

        /* -- Axis translation -- */

        if (options.isTranslationActive) {
            // Executes when a mouse button si pressed the canvas
            document.getElementById(id + "-plot").onpointerdown = (e) => {
                // The mouse or touch position is stored
                touchPosition = { x: e.clientX * dpi, y: e.clientY * dpi };
                //Not mouse pointer or mouse pointer with left button
                if (e.pointerType == 'mouse' && e.button === 0) {
                    isLeftMouseDown = true;
                }
                if (e.pointerType == 'touch') {
                    eventsCache.push(e);
                }
            }

            // Executes when a mouse button or a touch is released on the whole document
            document.onpointerup = (e) => {
                // Not mouse pointer or mouse pointer with left button
                if (e.pointerType == 'mouse' && e.button === 0) {
                    isLeftMouseDown = false;
                } else if (e.pointerType == 'touch') {
                    // If it's a touch pointer
                    // Remove this pointer from the cache and reset the target's
                    const index = eventsCache.findIndex(
                        (cachedEvent) => cachedEvent.pointerId === e.pointerId,
                    );
                    eventsCache.splice(index, 1);

                    // If the number of pointers down is less than two then reset diff tracker
                    if (isZooming && eventsCache.length < 2) {
                        prevDiff = -1;
                        // Not zooming anymore
                        isZooming = false;
                        // Stores the remaining touch position
                        touchPosition = { x: eventsCache[0].clientX * dpi, y: eventsCache[0].clientY * dpi };
                    }
                }
            }

            // Executes when the mouse is moved on the whole document
            document.getElementById(id + "-plot").ontouchmove = (e) => {
                if (!isZooming) {
                    // Stores the current touch position
                    const newTouchPosition = getTouchPosition(e);
                    // Translates the axis
                    translateAxis(newTouchPosition);
                }
            }

            // Executes when the pointer moves
            document.onpointermove = (e) => {
                if (isLeftMouseDown && e.pointerType == 'mouse') {
                    // Stores the current mouse position
                    const newTouchPosition = { x: e.clientX * dpi, y: e.clientY * dpi }
                    // Translates the axis
                    translateAxis(newTouchPosition);
                }
            }

            // Executes when the pointer event is cancelled
            document.onpointercancel = () => {
                isLeftMouseDown = false;
            }

            /**
             * Store the latest touch position.
             * @param {*} e Event
             * @returns The current touch position.
             */
            const getTouchPosition = (e) => {
                // e.preventDefault();
                // Stores the touches
                let touches = e.changedTouches;
                return {
                    x: touches[0].pageX * dpi,
                    y: touches[0].pageY * dpi
                }
            }

            /**
             * Translates the axis according to the latest touch/mouse position and the starting touch/mouse position.
             * @param {Object} newTouchPosition The latest touch/mouse position (x, y);
             */
            function translateAxis(newTouchPosition) {
                // Translates the origin
                cs.translateOrigin(
                    newTouchPosition.x - touchPosition.x,
                    newTouchPosition.y - touchPosition.y
                );
                // Updates the touch position
                touchPosition = newTouchPosition;
                // Draws the updated plot
                publicAPIs.drawPlot();
            }
        }

        /* -- Zoom -- */

        if (options.isZoomActive) {
            // Executes when the zoom-in button is pressed
            document.getElementById(id + "-plot-zoom-in").onclick = () => {
                isRunning = true;
                // Stores current zoom as 1
                currentZoom = 1;
                // Sets the zoom increment factor
                const zoomInc = 1.05;
                // Sets the maximum zoom, compared to current (which is set to 1)
                const maxZoom = 2;
                // Animates the zoom-in
                animate(() => {
                    zoomViewport(zoomInc, maxZoom, () => { return currentZoom > maxZoom / zoomInc });
                });
            }

            // Executes when the zoom-out button is pressed
            document.getElementById(id + "-plot-zoom-out").onclick = () => {
                isRunning = true;
                // Stores current zoom as 1
                currentZoom = 1;
                // Sets the zoom increment factor
                const zoomInc = 1.05;
                // Sets the minimum zoom, compared to current (which is set to 1)
                const minZoom = 1 / 2;
                // Animates the zoom-out
                animate(() => {
                    zoomViewport(1 / zoomInc, minZoom, () => { return currentZoom < minZoom * zoomInc });
                });
            }

            // Executes when the mouse wheel is scrolled
            axisPlot.getCanvas().addEventListener("wheel", (e) => {
                // Stops running animations
                isRunning = false;

                // Prevents page scrolling
                e.preventDefault();

                // Bounding client rectangle
                const rect = e.target.getBoundingClientRect();
                // x position within the canvas
                const zoomX = (e.clientX - rect.left) * dpi;
                // y position within the canvas
                const zoomY = (e.clientY - rect.top) * dpi;

                // Updates the zoom level
                cs.updateZoom(Math.exp(-e.deltaY / 1000), { x: zoomX, y: zoomY });
                // Draws the plot
                publicAPIs.drawPlot();
                // "passive: false" allows preventDefault() to be called
            }, { passive: false });

            // Executes when a touch pointer moves
            document.getElementById(id + "-plot").onpointermove = (e) => {
                if (e.pointerType == 'touch') {
                    // Caches the event
                    const index = eventsCache.findIndex(
                        (cachedEvent) => cachedEvent.pointerId === e.pointerId,
                    );
                    eventsCache[index] = e;

                    // If two pointers are down, check for pinch gestures
                    if (eventsCache.length === 2) {
                        isZooming = true;
                        // Calculate the distance between the two pointers
                        const currentDiff = Math.sqrt(
                            (eventsCache[0].clientX * dpi - eventsCache[1].clientX * dpi) ** 2 +
                            (eventsCache[0].clientY * dpi - eventsCache[1].clientY * dpi) ** 2);

                        // Bounding client rectangle
                        const rect = e.target.getBoundingClientRect();
                        // x position of the zoom center
                        const zoomX = (.5 * (eventsCache[0].clientX + eventsCache[1].clientX) - rect.left) * dpi;
                        // y position of the zoom center
                        const zoomY = (.5 * (eventsCache[0].clientY + eventsCache[1].clientY) - rect.top) * dpi;

                        if (previousDiff > 0) {
                            // The distance between the two pointers has increased
                            if (currentDiff > previousDiff) {
                                // Updates the zoom level
                                cs.updateZoom(1.03, { x: zoomX, y: zoomY });
                            }
                            // The distance between the two pointers has decreased
                            if (currentDiff < previousDiff) {
                                cs.updateZoom(0.97, { x: zoomX, y: zoomY });
                            }
                            // Draws the plot
                            publicAPIs.drawPlot();
                        }

                        // Cache the distance for the next move event
                        previousDiff = currentDiff;
                    }
                }
            }
        }

        if (options.isGridToggleActive) {
            // Executes when the grid button is pressed
            document.getElementById(id + "-plot-toggle-grid").onclick = () => {
                isGridVisible = !isGridVisible;
                // Styles the button
                if (isGridVisible) document.getElementById(id + "-plot-toggle-grid").classList.remove("transparent");
                else document.getElementById(id + "-plot-toggle-grid").classList.add("transparent");
                // Draws the plot
                publicAPIs.drawPlot();
            }
        }

        document.getElementById(id + "-plot-toggle-geometric-aid").onclick = () => {
            isGeometricAidVisible = !isGeometricAidVisible;
            // Styles the button
            if (isGeometricAidVisible) document.getElementById(id + "-plot-toggle-geometric-aid").classList.remove("transparent");
            else document.getElementById(id + "-plot-toggle-geometric-aid").classList.add("transparent");
            // Draws the plot
            publicAPIs.drawPlot();
        }

        if (options.isRefreshActive) {
            // Executes when the refresh button is pressed
            document.getElementById(id + "-plot-refresh").onclick = () => {
                isRunning = true;

                /* -- Zoom setup -- */

                // Stores current zoom level as 1
                currentZoom = 1;
                // Computes the end zoom level, compared to current (which is set to 1)
                const endZoom = options.initialPixelsPerUnit / cs.pixelsPerUnit;
                // Sets the zoom increment factor
                const zoomInc = 1.05;
                // Zoom needs to be performed by default (not locked)
                let isZoomLocked = false;

                /* -- Translation setup -- */

                // The translation is performed by default
                isTranslating = { x: true, y: true };

                /* -- Animation -- */

                animate(() => {
                    // Animates the zoom-in or zoom-out
                    zoomViewport(endZoom > 1 ? zoomInc : (1 / zoomInc), endZoom,
                        () => {
                            if (endZoom > 1) return currentZoom > endZoom / zoomInc;
                            else return currentZoom <= endZoom * zoomInc
                        }, cs.toScreen(0, 0), isZoomLocked);

                    // If the zoom animation is stopped, the zoom is locked
                    // The value of "running" could change depending on the translation animation
                    if (!isRunning) {
                        isZoomLocked = true;
                    }

                    // Animates the translation
                    autoTranslate(options.viewportCenter, 0.05);

                    // The animation keeps running until both the zoom and the translation stop
                    isRunning = !isRunning || isTranslating.x || isTranslating.y;
                });
            }
        }

        if (options.isFullscreenToggleActive) {
            // Executes when the fullscreen button is pressed
            document.getElementById(id + "-plot-toggle-fullscreen").onclick = () => {
                // Changes the fullscreen status
                isFullscreen = !isFullscreen;

                // Changes the icon
                document.getElementById(id + "-plot-toggle-fullscreen-icon").innerText =
                    isFullscreen ? "fullscreen_exit" : "fullscreen";

                // Stores the fullscreen and original container
                let fullscreenContainer = document.getElementById("fullscreen-container");
                let fullscreenSlidersContainer = document.getElementById("fullscreen-sliders-container");
                let originalPlotContainer = document.getElementById(id + "-plot-container");
                let originalSlidersContainer = document.getElementById(id + "-plot-sliders-container");

                // Sets the body opacity to zero
                document.body.classList.add("transparent");

                // Executes after the body opacity is lowered
                setTimeout(() => {
                    if (isFullscreen) {
                        // Makes the container for fullscreen content visible
                        fullscreenContainer.classList.add("visible");
                        fullscreenSlidersContainer.classList.add("visible")
                        // Hides the scrollbar
                        document.body.classList.add("hidden-overflow");
                        // Moves the plot into the full screen container
                        moveHTML(originalPlotContainer, fullscreenContainer);
                        // Moves the slider panel into the full screen container
                        moveHTML(originalSlidersContainer, fullscreenSlidersContainer);
                        // Styles the plot as fullscreen
                        document.getElementById(id + "-plot").classList.add("fullscreen");
                        // Makes the plot canvas borders squared
                        document.getElementById(id + "-canvas").classList.add("squared-border");
                        // Moves the sliders panel in the top-left corner
                        document.getElementById(id + "-plot-sliders-panel").classList.add("fullscreen");
                    } else {
                        // Hides the container for fullscreen content
                        fullscreenContainer.classList.remove("visible");
                        fullscreenSlidersContainer.classList.remove("visible");
                        // Displays the scrollbar
                        document.body.classList.remove("hidden-overflow");
                        // Moves the plot into its original container
                        moveHTML(fullscreenContainer, originalPlotContainer)
                        // Moves the sliders back where they belong
                        moveHTML(fullscreenSlidersContainer, originalSlidersContainer);
                        // Removes the fullscreen class and style
                        document.getElementById(id + "-plot").classList.remove("fullscreen");
                        // Makes the plot canvas borders rounded
                        document.getElementById(id + "-canvas").classList.remove("squared-border")
                        // Moves back the sliders panel where it was before
                        document.getElementById(id + "-plot-sliders-panel").classList.remove("fullscreen");
                    }

                    // Changes the border radius of the vectors and geometric aid canvases
                    if (isFullscreen) {
                        gPlot.getCanvas().classList.add("squared-border");
                        vPlot.getCanvas().classList.add("squared-border");

                    } else {
                        gPlot.getCanvas().classList.remove("squared-border")
                        vPlot.getCanvas().classList.remove("squared-border")
                    }

                    // Resizes the canvas
                    publicAPIs.resizeCanvas();
                    // Draws the plot
                    publicAPIs.drawPlot();
                }, 200);

                // After the transition between fullscreen and non-fullscreen (or viceversa) is completed...
                setTimeout(() => {
                    // ...resets the body opacity
                    document.body.classList.remove("transparent");
                }, 300);
            }
        }

        // If some parameter is used
        if (options.parameters.length > 0) {
            options.parameters.forEach((p) => {
                // Executes when the input changes
                document.getElementById(id + "-param-" + p.id).oninput = () => {
                    // Stores the value
                    params[p.id] = parseFloat(document.getElementById(id + "-param-" + p.id).value);

                    // Updates the slider value
                    updateSliderValue(p.id);

                    // Compute absolute values of series vectors
                    computeSeries();

                    // Clears the vectors and points and redraws them
                    clearGeometricAid();
                    clearVectors();
                    clearPoints();
                    drawGeometricAid();
                    drawVectors();
                    drawPoints();
                }

                // Executes when the play/pause button for the parameter slider is pressed
                document.getElementById(id + "-param-" + p.id + "-play-button").onclick = () => {
                    // Sets the status
                    p.isPlaying = !p.isPlaying;

                    // Changes the icon of the play/pause button
                    document.getElementById(id + "-param-" + p.id + "-play-icon").innerText =
                        p.isPlaying ? "pause" : "play_arrow";

                    // Checks if some parameter is animated
                    let isParameterPlaying = false;
                    options.parameters.forEach(parameter => {
                        if (parameter.isPlaying) isParameterPlaying = true;
                    })

                    // If no parameter was previously animated, but at least one now is...
                    if (!isVectorsRunning && isParameterPlaying) {
                        // It starts animating the functions
                        isVectorsRunning = true;
                        animateVectors();
                    } else if (!isParameterPlaying) {
                        // Otherwise, if no parameter is animated, it stops the functions animation
                        isVectorsRunning = false;
                    }
                }
            });
        }
    }

    /**
     * Updates the value of the parameter in the corresponding slider value span.
     * @param {String} paramId Id of the parameter.
     */
    function updateSliderValue(paramId) {
        // Gets the span with the slider value
        const sliderValueSpan = document.getElementById(id + "-param-" + paramId + "-value");
        // MathJax will forget about the math inside said span
        MathJax.typesetClear([sliderValueSpan]);
        // The inner text of the span is edited
        sliderValueSpan.innerText =
            "$" + paramId + "=" + roundNumberDigit(params[paramId], 2) + "$";
        // MathJax does its things and re-renders the formula
        MathJax.typesetPromise([sliderValueSpan]).then(() => {
            // the new content is has been typeset
        });
    }

    /* -- Utils -- */

    /**
     * Moves an HTML element and its children to a new parent.
     * @param {HTMLElement} oldParent Old parent HTML element.
     * @param {HTMLElement} newParent New parent HTML element.
     */
    function moveHTML(oldParent, newParent) {
        while (oldParent.childNodes.length > 0) {
            newParent.appendChild(oldParent.childNodes[0]);
        }
    }

    /*_______________________________________
    |   Animations
    */

    /**
     * A (probably poor) implementation of the pause-able loop.
     * @param {Function} action Function to be executed every frame.
     * @returns Early return if not playing.
     */
    function animate(action) {
        if (!isRunning) {
            return;
        }
        // Executes action to be performed every frame
        action();
        // Draws the plot
        publicAPIs.drawPlot();
        // Keeps executing this function
        requestAnimationFrame(() => { animate(action); });
    }

    /**
     * It animates the vectors
     * @returns Early return if not playing.
     */
    function animateVectors() {
        // When no parameter is animated, it stops
        if (!isVectorsRunning) {
            return;
        }
        // Executes action to be performed every frame
        options.parameters.forEach(p => {
            // If a specific parameter is playing...
            if (p.isPlaying) {
                // ...it stores the parameter input slider
                const paramInput = document.getElementById(id + "-param-" + p.id);
                // It stores the current parameter value
                let paramValue = params[p.id];

                // If the parameter should increase...
                if (p.isIncreasing) {
                    // ...it increases its value, according to step and speed
                    paramValue += parseFloat(paramInput.step) * parseFloat(p.animationSpeed);
                    // If it's larger than the max allowed value...
                    if (paramValue >= parseFloat(paramInput.max)) {
                        //...it constrains its value
                        paramValue = parseFloat(paramInput.max)
                        // And switches the animation direction
                        p.isIncreasing = false;
                    }
                } else {
                    // Otherwise, if it should decrease, it decreases its value
                    paramValue -= parseFloat(paramInput.step) * parseFloat(p.animationSpeed);
                    // If it's smaller than the min allowed value...
                    if (paramValue <= parseFloat(paramInput.min)) {
                        // ...it constrains its value
                        paramValue = parseFloat(paramInput.min);
                        // And switches the animation direction
                        p.isIncreasing = true;
                    }
                }

                // Sets the value in the slider
                paramInput.value = paramValue;
                // Stores the updated parameter value
                params[p.id] = paramValue;
                // Updates the displayed value (a bit spastically)
                updateSliderValue(p.id);
            }
        })

        // Compute absolute values of series vectors
        computeSeries();

        // Clears and redraws the vectors and points
        clearGeometricAid();
        clearVectors();
        clearPoints();
        drawGeometricAid();
        drawVectors();
        drawPoints();

        // Keeps executing this function
        requestAnimationFrame(() => { animateVectors(); });
    }

    /**
     * Zooms the viewport.
     * @param {Number} zoomInc Zoom multiplication factor by which zoom is increased every frame.
     * @param {Number} endZoom Maximum zoom multiplication factor
     * @param {Function} condition Function returning true or false; when true, it ends the zoom.
     * @param {Boolean} isLocked True if zoom must not be performed, false otherwise. 
     */
    function zoomViewport(zoomInc, endZoom, condition,
        zoomCenter = { x: width / 2, y: height / 2 }, isLocked = false) {
        // If zoom isn't locked (needed in case another animations is playing as well, translating e.g.)
        if (!isLocked) {
            // Multiplies the current zoom by the zoom increment factor
            currentZoom *= zoomInc;
            // IF the end condition is met
            if (condition()) {
                // The zoom increment is set so that the final zoom matches endZoom
                zoomInc = endZoom / (currentZoom / zoomInc);
                // Animations is gonna stop
                isRunning = false;
            }
            // Updates the zoom
            cs.updateZoom(zoomInc, { x: zoomCenter.x, y: zoomCenter.y });
        }
    }

    /**
     * Performs a step in the auto translation animation to center a given point.
     * @param {Object} endingPoint Ending point which needs to moved in the middle of the screen.
     * @param {*} translationFactor Translation factor.
     */
    function autoTranslate(endingPoint, translationFactor) {
        // Screen center in cartesian coordinates
        const screenCenterInCartesian = cs.toCartesian(width / 2, height / 2);
        // Total translation vector from current point to ending point, measured in pixels
        const totalTranslation = {
            x: (screenCenterInCartesian.x - endingPoint.x) * cs.pixelsPerUnit,
            y: -(screenCenterInCartesian.y - endingPoint.y) * cs.pixelsPerUnit
        }
        // Sign of the translation vector components
        const translationSign = {
            x: Math.sign(totalTranslation.x),
            y: Math.sign(totalTranslation.y)
        }
        // Translation increment (always positive)
        const tInc = {
            x: translationFactor * Math.abs(totalTranslation.x) + 1,
            y: translationFactor * Math.abs(totalTranslation.y) + 1,
        }
        // Executes if, along the x axes, the increment is greater than the total translation magnitude
        if (tInc.x > Math.abs(totalTranslation.x)) {
            // Increment is set equal to the total translation along the x axes
            tInc.x = Math.abs(totalTranslation.x);
            // Translation is stopped along the x axes
            isTranslating.x = false;
        }
        // Executes if, along the y axes, the increment is greater than the total translation magnitude
        if (tInc.y > Math.abs(totalTranslation.y)) {
            // Increment is set equal to the total translation the y axes
            tInc.y = Math.abs(totalTranslation.y);
            // Translation is stopped along the y axes
            isTranslating.y = false;
        }

        // The translation is performed
        cs.translateOrigin(translationSign.x * tInc.x, translationSign.y * tInc.y);
    }

    /*_______________________________________
    |   Plot
    */

    /**
     * Draws the plots.
     */
    publicAPIs.drawPlot = () => {
        // Clears the canvases
        publicAPIs.clearPlot();

        // Compute absolute values of series vectors
        computeSeries();

        // ------- STUFF HERE -------
        drawAxisPlot();

        drawGeometricAid();
        drawVectors();
        drawPoints();
    }

    /**
     * Draws the geometric aid
     */
    function drawGeometricAid() {
        if (isGeometricAidVisible) {
            // Stores the sign of the x parameter
            const xSign = Math.sign(params["x"]) > 0;

            // Sets the stroke color for all the geometric aids
            gCtx.strokeStyle = options.geometricAidColor;

            /* -- Circle -- */

            // Sets the line width for the circle and the line
            gCtx.lineWidth = options.geometricAidWidth - 1;
            // Sets the dash pattern for the circle and the line
            gCtx.setLineDash([5, 10]);

            // Draws the dashed circle
            gCtx.beginPath();
            gCtx.arc(cs.toScreenX(0), cs.toScreenY(0), params["r"] * cs.pixelsPerUnit, 0, 2 * Math.PI);
            gCtx.stroke();

            /* -- Line -- */

            // Draws the dashed line
            gCtx.setLineDash([]);
            gCtx.beginPath();
            gCtx.moveTo(cs.toScreenX(0), cs.toScreenY(0));
            gCtx.lineTo(cs.toScreenX(params["r"] * Math.cos(params["x"])), cs.toScreenY(params["r"] * Math.sin(params["x"])));
            gCtx.stroke();

            /* -- Arcs -- */

            // Sets the line width for the arc
            gCtx.strokeStyle = options.geometricAidWidth;

            // Draws the first arc
            gCtx.beginPath();
            gCtx.arc(cs.toScreenX(0), cs.toScreenY(0), params["r"] * cs.pixelsPerUnit, 0, -params["x"], xSign);
            gCtx.stroke();

            // Draws a second arc if the angle is greater than 2 * PI or less then -2 * PI
            if (params["x"] > 2 * Math.PI || params["x"] < -2 * Math.PI) {
                // Sets the line width for the second arc
                gCtx.lineWidth = options.geometricAidWidth + 1;

                // Draws the second arc
                gCtx.beginPath();
                gCtx.arc(cs.toScreenX(0), cs.toScreenY(0), params["r"] * cs.pixelsPerUnit, 0, -params["x"] + (xSign ? 1 : -1) * 2 * Math.PI, xSign);
                gCtx.stroke();
            }
        }
    }

    /**
     * Draws the vectors
     */
    function drawVectors() {
        // Sets the vector width
        vCtx.lineWidth = options.vectorWidth;
        // Determines the x parameters sign
        const arrowSign = Math.sign(seriesTerms[1]);

        for (let n = 0; n < seriesTerms.length - 1; n++) {
            // Executes if the vector is big enough to be displayed
            if (Math.abs(seriesTerms[n]) * cs.pixelsPerUnit > 1) {
                // Computes the arrow size and half size
                const arrowSize = Math.min(.5 * Math.abs(seriesTerms[n]) * cs.pixelsPerUnit, options.arrowSize);
                const arrowHalfSize = arrowSize / 2;

                // Computes the arrow starting point coordinates
                const arrowPointX = cs.toScreenX(partialSum[n + 1].x);
                const arrowPointY = cs.toScreenY(partialSum[n + 1].y);

                // Alternates between horizontal and vertical vectors
                if (n % 2 == 0) {
                    // Computes the vector starting y coordinate
                    const vStartY = cs.toScreenY(partialSum[n].y);
                    // Stores a combination of size and direction for the vector arrow
                    const arrowDirectionalSize = vectorDirections[n % 4].x * arrowSize;

                    // Draws the vector if visible
                    if (vStartY > cs.screenYMin && vStartY < cs.screenYMax) {
                        // Sets the stroke color
                        vCtx.strokeStyle = options.realColor;

                        // Computes the vector starting and ending x coordinates
                        const vStartX = constrain(cs.toScreenX(partialSum[n].x), cs.screenXMin, cs.screenXMax);
                        const vEndX = constrain(cs.toScreenX(partialSum[n + 1].x) - arrowDirectionalSize, cs.screenXMin, cs.screenXMax);

                        // Draws the vector
                        vCtx.beginPath();
                        vCtx.moveTo(vStartX, vStartY);
                        vCtx.lineTo(vEndX, cs.toScreenY(partialSum[n + 1].y));
                        vCtx.stroke();
                    }

                    // Draws the vector arrow if inbound
                    if (isInbound(arrowPointX, arrowPointY, arrowSize)) {
                        // Sets the fill color
                        vCtx.fillStyle = options.realColor;

                        // Computes the arrow base x coordinate
                        const arrowBaseX = arrowPointX - arrowDirectionalSize;

                        // Draws the vector arrow
                        vCtx.beginPath();
                        vCtx.moveTo(arrowPointX, arrowPointY);
                        vCtx.lineTo(arrowBaseX, arrowPointY - arrowHalfSize);
                        vCtx.lineTo(arrowBaseX, arrowPointY + arrowHalfSize);
                        vCtx.lineTo(arrowPointX, arrowPointY);
                        vCtx.fill();
                    }
                } else {
                    // Computes the vector starting x coordinate
                    const vStartX = cs.toScreenX(partialSum[n].x);
                    // Stores a combination of size and direction for the vector arrow
                    const arrowDirectionalSize = vectorDirections[n % 4].y * arrowSign * arrowSize;

                    // Draws the vector if visible
                    if (vStartX > cs.screenXMin && vStartX < cs.screenXMax) {
                        // Sets the stroke color
                        vCtx.strokeStyle = options.imaginaryColor;

                        // Computes the vector starting and ending y coordinates
                        const vStartY = constrain(cs.toScreenY(partialSum[n].y), cs.screenYMin, cs.screenYMax);
                        const vEndY = constrain(cs.toScreenY(partialSum[n + 1].y) + arrowDirectionalSize, cs.screenYMin, cs.screenYMax);

                        // Draws the vector
                        vCtx.beginPath();
                        vCtx.moveTo(vStartX, vStartY);
                        vCtx.lineTo(cs.toScreenX(partialSum[n + 1].x), vEndY);
                        vCtx.stroke();
                    }

                    // Draws the vector arrow if inbound
                    if (isInbound(arrowPointX, arrowPointY, arrowSize)) {
                        // Sets the fill color
                        vCtx.fillStyle = options.imaginaryColor;

                        // Computes the arrow base x coordinate
                        const arrowBaseY = arrowPointY + arrowDirectionalSize;

                        // Draws the vector arrow
                        vCtx.beginPath();
                        vCtx.moveTo(arrowPointX, arrowPointY);
                        vCtx.lineTo(arrowPointX - arrowHalfSize, arrowBaseY);
                        vCtx.lineTo(arrowPointX + arrowHalfSize, arrowBaseY);
                        vCtx.lineTo(arrowPointX, arrowPointY);
                        vCtx.fill();
                    }
                }
                // Ends the loop if the vector isn't big enough and the series terms are decreasing
            } else if (n > seriesDecreasingIndex) break;
        }
    }

    /**
     * Draws the points.
     */
    function drawPoints() {
        options.points.forEach(p => {
            /* Point outline */

            // Draws the point outline, by drawing a larger circle with the same color as the background
            if (p.outline) {
                // Sets the style
                pCtx.fillStyle = options.backgroundColor;

                // Draws the outline
                pCtx.beginPath();
                pCtx.arc(cs.toScreenX(p.x(params)), cs.toScreenY(p.y(params)), p.size + 3, 0, 2 * Math.PI);
                pCtx.fill();
            }

            /* Point dot/circle */

            // Sets the style
            pCtx.fillStyle = p.color;

            // Draws the dot/circle
            pCtx.beginPath();
            pCtx.arc(cs.toScreenX(p.x(params)), cs.toScreenY(p.y(params)), p.size, 0, 2 * Math.PI);
            pCtx.fill();
        });
    }

    /**
     * Draws the axis/grid plot.
     */
    function drawAxisPlot() {
        if (isGridVisible) {
            /* -- Secondary grid  -- */
            drawGrid({ x: cs.screenSecondaryGridXMin, y: cs.screenSecondaryGridYMin }, cs.screenSecondaryGridStep,
                options.secondaryGridColor, options.secondaryGridLineWidth
            );

            /* -- Main grid  -- */
            drawGrid({ x: cs.screenGridXMin, y: cs.screenGridYMin }, cs.screenGridStep,
                options.gridColor, options.gridLineWidth
            );

            /* -- Axis -- */
            drawAxis(options.axisColor, options.axisLineWidth);
        }

        /* -- Plot border -- */
        drawBorders(options.gridColor, options.gridLineWidth + 1);

        if (isGridVisible) {
            /* -- Labels -- */
            drawLabels(options.gridColor, 3);

            /* -- Origin --  */
            drawOrigin(options.axisColor, 4);
        }
    }

    /**
     * Draws a grid, given the (x, y) starting points and the step.
     * @param {Object} gridMin Starting points of the grid (x, y).
     * @param {Number} gridStep Grid step value.
     * @param {String} color Color of the grid.
     * @param {Number} lineWidth Line width of the grid lines.
     */
    function drawGrid(gridMin, gridStep, color, lineWidth) {
        // Sets the style
        axisCtx.strokeStyle = color;
        axisCtx.lineWidth = lineWidth;

        axisCtx.beginPath();
        // Draws the vertical grid lines
        for (i = gridMin.x; i < cs.screenXMax; i += gridStep) {
            if (i > cs.screenXMin) {
                axisCtx.moveTo(i, cs.screenYMin);
                axisCtx.lineTo(i, cs.screenYMax);
            }
        }
        // Draws the horizontal grid lines
        for (j = gridMin.y; j < cs.screenYMax; j += gridStep) {
            if (j > cs.screenYMin) {
                axisCtx.moveTo(cs.screenXMin, j);
                axisCtx.lineTo(cs.screenXMax, j);
            }
        }
        axisCtx.stroke();
    }

    /**
     * Draws the axis of the plot.alpha
     * @param {String} color Color of the axis.
     * @param {Number} lineWidth Line width of the axis.
     */
    function drawAxis(color, lineWidth) {
        // Sets the style
        axisCtx.strokeStyle = color;
        axisCtx.lineWidth = lineWidth;

        axisCtx.beginPath();
        // Draws the x axes
        const xAxes = cs.toScreenX(0);
        if (xAxes > cs.screenXMin) {
            axisCtx.moveTo(xAxes, cs.screenYMin);
            axisCtx.lineTo(xAxes, cs.screenYMax);
        }
        // Draws the y axes
        const yAxes = cs.toScreenY(0);
        if (yAxes > cs.screenYMin) {
            axisCtx.moveTo(cs.screenXMin, yAxes);
            axisCtx.lineTo(cs.screenXMax, yAxes);
        }
        axisCtx.stroke();
    }

    /**
     * Draws the origin dot.
     * @param {String} color Color of the origin dot.
     * @param {Number} size Size of the origin dot.
     */
    function drawOrigin(color, size) {
        axisCtx.fillStyle = color;

        axisCtx.beginPath();
        axisCtx.arc(cs.toScreenX(0), cs.toScreenY(0), size, 0, 2 * Math.PI);
        axisCtx.fill();
    }

    /**
     * Draws the border of the plot.
     * @param {String} color Color of the border.
     * @param {Number} lineWidth Line width of the border.
     */
    function drawBorders(color, lineWidth) {
        // Sets the style
        axisCtx.strokeStyle = color;
        axisCtx.lineWidth = lineWidth;

        axisCtx.beginPath();
        // Draws the right border
        if (cs.screenXMin > 0) {
            axisCtx.moveTo(cs.screenXMin, cs.screenYMin);
            axisCtx.lineTo(cs.screenXMin, cs.screenYMax);
        }
        // Draws the left border
        if (cs.screenXMax < width) {
            axisCtx.moveTo(cs.screenXMax, cs.screenYMin);
            axisCtx.lineTo(cs.screenXMax, cs.screenYMax);
        }
        // Draws the top border
        if (cs.screenYMin > 0) {
            axisCtx.moveTo(cs.screenXMin, cs.screenYMin);
            axisCtx.lineTo(cs.screenXMax, cs.screenYMin);
        }
        // Draws the bottom border
        if (cs.screenYMax < height) {
            axisCtx.moveTo(cs.screenXMin, cs.screenYMax);
            axisCtx.lineTo(cs.screenXMax, cs.screenYMax);
        }
        axisCtx.stroke();
    }

    function drawLabels(color, lineWidth) {
        // Sets the style of the outline
        axisCtx.strokeStyle = options.backgroundColor;
        axisCtx.lineWidth = lineWidth;

        // Sets the style of the label
        axisCtx.fillStyle = color;
        axisCtx.font = options.labelSize + "px sans-serif";

        // Computes the axis coordinates
        const xAxes = cs.toScreenX(0);
        const yAxes = cs.toScreenY(0);

        axisCtx.beginPath();

        /* -- Labels along the x axes -- */

        for (i = cs.screenGridXMin; i < cs.screenXMax + 2; i += cs.screenGridStep) {
            if (i > cs.screenXMin - 2) {
                // Label numerical value
                const labelValue = roundNumberDigit(cs.toCartesianX(i), cs.maxNumberOfGridLabelDigits);

                // If it's not the origin
                if (labelValue != 0) {
                    // Label text
                    const labelText = labelValue.toString();
                    // Label measure
                    const labelMeasure = axisCtx.measureText(labelText);
                    // Horizontal position of the label
                    const xPos = i -
                        // Moves to the left by half the label width
                        (labelMeasure.width
                            // Moves to the left if negative, to compensate for minus sign
                            + (labelValue < 0 ? axisCtx.measureText("-").width : 0)) / 2;
                    // Vertical position
                    const yPos = getLabelPosition(yAxes, cs.screenYMin, cs.screenYMax,
                        {
                            min: 0,
                            max: -5 - options.labelSize * dpi
                        },
                        {
                            default: options.labelSize * dpi,
                            min: options.labelSize * dpi,
                            max: -5
                        }
                    );

                    // Draws the label
                    axisCtx.strokeText(labelValue, xPos, yPos);
                    axisCtx.fillText(labelValue, xPos, yPos);
                }
            }
        }

        /* -- Labels along the y axes -- */

        for (j = cs.screenGridYMin; j < cs.screenYMax + 2; j += cs.screenGridStep) {
            if (j > cs.screenYMin - 2) {
                // Label numerical value
                const labelValue = roundNumberDigit(cs.toCartesianY(j), cs.maxNumberOfGridLabelDigits);

                // If it's not the origin
                if (labelValue != 0) {
                    // Label text
                    const labelText = labelValue.toString();
                    // Label measure
                    const labelMeasure = axisCtx.measureText(labelText);
                    // Horizontal label offset
                    const xOffset = labelMeasure.width + 8;
                    // Horizontal position of the label; the label is moved to the left by its width
                    const xPos = getLabelPosition(xAxes, cs.screenXMin, cs.screenXMax,
                        {
                            min: xOffset + 8,
                            max: 0
                        },
                        {
                            default: -xOffset,
                            min: 5,
                            max: -xOffset
                        }
                    );
                    // Vertical position, the label is moved up by half its height
                    const yPos = j + (options.labelSize / 2) / dpi;

                    // Draws the label
                    axisCtx.strokeText(labelValue, xPos, yPos);
                    axisCtx.fillText(labelValue, xPos, yPos);
                }

            }
        }

        /* -- Origin label -- */

        // Cartesian origin in screen coordinates
        const origin = cs.toScreen(0, 0)
        // Origin label text
        const labelText = "0";
        // Label measure
        const labelMeasure = axisCtx.measureText(labelText);

        // If the origin in on screen
        if (origin.x > cs.screenXMin && origin.x < cs.screenXMax + labelMeasure.width + 8 &&
            origin.y > cs.screenYMin - options.labelSize * dpi && origin.y < cs.screenYMax) {
            // Horizontal position
            const xPos = origin.x - labelMeasure.width - 8;
            // Vertical position
            const yPos = origin.y + options.labelSize * dpi;
            // Draws the label
            axisCtx.strokeText("0", xPos, yPos);
            axisCtx.fillText("0", xPos, yPos);
        }

        axisCtx.closePath();
    }

    /**
     * Gets the label position given the axes coordinate, the viewport edges and the offset.
     * @param {Number} axes Screen coordinate of the axes.
     * @param {*} minValue Min screen coordinate along the perpendicular axes.
     * @param {*} maxValue Max screen coordinate along the perpendicular axes
     * @param {*} tolerance Tolerance when reaching the min and max screen coordinates.
     * @param {Object} offset Label offset.
     * @returns The label position.
     */
    const getLabelPosition = (axes, minValue, maxValue, tolerance, offset) => {
        if (axes < minValue + tolerance.min) {
            return minValue + offset.min;
        } else if (axes > maxValue + tolerance.max) {
            return maxValue + offset.max;
        } else {
            return axes + offset.default;
        }
    }

    /**
     * Clears the plots.
     */
    publicAPIs.clearPlot = () => {
        // Clears the axis/grid plot
        axisCtx.clearRect(0, 0, width + 1, height + 1)

        // Draws the background
        axisCtx.fillStyle = options.backgroundColor;

        axisCtx.beginPath();
        axisCtx.rect(0, 0, width + 1, height + 1);
        axisCtx.fill();

        // Clears the functions and points
        clearGeometricAid();
        clearVectors();
        clearPoints();
    }

    /**
     * Clears the geometric aid plot.
     */
    function clearGeometricAid() {
        gCtx.clearRect(0, 0, width + 1, height + 1);
    }

    /**
     * Clears the vectors plot.
     */
    function clearVectors() {
        vCtx.clearRect(0, 0, width + 1, height + 1);
    }

    /**
     * Clears the points plot.
     */
    function clearPoints() {
        pCtx.clearRect(0, 0, width + 1, height + 1);
    }

    /**
     * Checks if a point is inside the canvas.
     * @param {Number} pX Coordinate x of the point.
     * @param {Number} pY Coordinate y of the point.
     * @param {Number} tolerance Tolerance (zero by default).
     * @returns True if the point is inside the canvas, false otherwise.
     */
    const isInbound = (pX, pY, tolerance = 0) => {
        const isXInbound = (pX < cs.screenXMax + tolerance) && (pX > cs.screenXMin - tolerance);
        const isYInbound = (pY < cs.screenYMax + tolerance) && (pY > cs.screenYMin - tolerance)
        return isXInbound && isYInbound;
    }

    init();

    // Returns public methods
    return publicAPIs;
}