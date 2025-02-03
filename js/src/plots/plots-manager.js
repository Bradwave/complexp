/**
 * Manages plots, sort of...
 */
let plotsManager = new function () {

    /**
     * Number of milliseconds to wait after resizing.
     * @type {Number}
     */
    const waitTime = 200;

    let resizeTimeout;

    /**
     * Plots.
     */
    plots = new Map();

    /**
     * Spinning loaders
     */
    let loaders = [...document.getElementsByClassName("plot loader")];

    let canvases = [...document.getElementsByName("plot")];

    function init() {
        // Init plots here
        plots.set('complexp', new complexpPlot("complexp",
            {
                viewportCenter: { x: 0, y: 0 },
                initialPixelsPerUnit: 100,
                parameters: [
                    { id: "x" },
                    { id: "r" }
                ],
                points: [
                    {
                        x: (params) => { return params["r"] * Math.cos(params["x"]) },
                        y: (params) => { return params["r"] * Math.sin(params["x"]) },
                        color: "#000000",
                        size: 5
                    }
                ],
                labelSize: 15,
                realColor: getCssVariable("crimson-red"),
                imaginaryColor: getCssVariable("accent"),
                vectorWidth: 5,
                arrowSize: 20,
                geometricAidColor: "#666666",
                geometricAidWidth: 4,
                backgroundColor: getCssVariable("incredibly-light-accent"),
                axisColor: getCssVariable("highlight"),
                axisLineWidth: 3,
                gridColor: getCssVariable("highlight"),
                gridLineWidth: 1,
                secondaryGridColor: getCssVariable("transparent-highlight"),
                secondaryGridLineWidth: 1
            }));

        plots.forEach((plot) => {
            plot.drawPlot();
        });
    }

    window.addEventListener("resize", () => {
        plots.forEach(plot => {
            // Clear the canvas
            plot.clearPlot();
        });

        canvases.forEach(canvas => {
            canvas.style.opacity = 0;
            canvas.style.visibility = "collapse";
        })

        loaders.forEach(loader => {
            // Displays the loader while waiting
            loader.style.visibility = "visible";
            loader.style.animationPlayState = "running";
        });

        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            loaders.forEach(loader => {
                // Displays the loader while waiting
                loader.style.visibility = "collapse";
                loader.style.animationPlayState = "paused";
            });

            canvases.forEach(canvas => {
                canvas.style.visibility = "visible";
                canvas.style.opacity = 1;
            })

            plots.forEach(plot => {
                // Resize the after waiting (for better performances)
                plot.resizeCanvas();
                // Draws the plot
                plot.drawPlot();
            });
        }, waitTime);
    });

    window.onclick = (e) => {
        e.target.focus();
    }

    /**
     * Converts the input value to float and sets the input box value.
     * @param {*} id Id of the input box. 
     * @returns Returns the float value of the input box.
     */
    const getInputNumber = (inputsMap, id) => {
        let newValue = parseFloat(inputsMap.get(id).value);
        inputsMap.get(id).value = newValue;
        return newValue;
    }

    init();
}