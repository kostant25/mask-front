import './App.css';
import demoImg from './demo.jpg';
import {useEffect, useRef, useState} from "react";
import {
    Button,
    ButtonGroup,
    Card,
    Col,
    Container,
    Dropdown,
    DropdownButton,
    Form,
    FormGroup,
    Row
} from "react-bootstrap";

const tg = window.Telegram.WebApp;

const elements = {
    image: null,
    chooseButton: null,
    saveButton: null,
    fileInput: null
}

const options = {
    mode: "draw",
    isDrawing: false,
    width: 480,
    height: 640,
    brush: {
        size: 35,
        hardness: 1,
        opacity: 1,
    },
}

const canvases = {
    preview: {
        canvas: null,
        ctx: null
    },
    drawing: {
        canvas: null,
        ctx: null
    }
}

function setDemoImage() {
    const image = new Image();
    image.onload = function () {
        handleCanvasForImage(image)
    };
    image.src = demoImg;
    elements.image = image;
    getDrawCursor()
}

function handleCanvasForImage(image) {
    const [width, height] = [image.width, image.height]

    // adjusts canvas sizes
    options.width = width;
    options.height = height;
    canvases.drawing.canvas.width = options.width;
    canvases.drawing.canvas.height = options.height;
    canvases.preview.canvas.width = options.width;
    canvases.preview.canvas.height = options.height;

    canvases.drawing.ctx.fillStyle = "white";
    canvases.drawing.ctx.fillRect(0, 0, options.width, options.height);

    // draw the uploaded photo on the preview canvas
    canvases.preview.ctx.drawImage(image, 0, 0, options.width, options.height);
}

function getDrawCursor(brushSize = options.brush.size) {
    const circle = `
		<svg
			height="${brushSize}"
			width="${brushSize}"
			fill="rgb(0 0 0 / 25%)"
			viewBox="0 0 ${brushSize * 2} ${brushSize * 2}"
			xmlns="http://www.w3.org/2000/svg"
		>
			<circle
				cx="50%"
				cy="50%"
				r="${brushSize}" 
				stroke="#e4e4e4"
                stroke-width="1"
			/>
		</svg>
	`;
    const cursor = `data:image/svg+xml;base64,${window.btoa(circle)}`;
    canvases.drawing.canvas.style.cursor = `url("${cursor}") ${brushSize / 2} ${brushSize / 2}, crosshair`
}

function setMode(mode) {
    options.mode = mode
}

function bootstrapRangeEvents(brushOpacity, brushSize, setSize, setOpacity) {
    const ranges = [
        {
            el: brushOpacity.current,
            handler: (el) => {
                options.brush.opacity = (parseInt(el.value) / 100).toFixed(2);
                setOpacity(options.brush.opacity);
            },
        },
        {
            el: brushSize.current,
            handler: (el) => {
                options.brush.size = parseInt(el.value);
                setSize(options.brush.size);
            },
        },
    ];

    ranges.forEach(range => {
        range.el.addEventListener("change", (e) => {
            range.handler(range.el)
            getDrawCursor();
        })
    })
}

function bootstrapCanvasEvents() {
    canvases.drawing.canvas.addEventListener("mousemove", draw);
    canvases.drawing.canvas.addEventListener("click", (e) => {
        options.isDrawing = true;
        draw(e)
        options.isDrawing = false;
    });
    canvases.drawing.canvas.addEventListener("mousedown", () => {
        options.isDrawing = true;
    });
    canvases.drawing.canvas.addEventListener("mouseup", () => {
        options.isDrawing = false;
    });
    canvases.drawing.canvas.addEventListener("mouseout", () => {
        options.isDrawing = false;
    });

    canvases.drawing.canvas.addEventListener("touchmove", draw);
    canvases.drawing.canvas.addEventListener("touch", (e) => {
        options.isDrawing = true;
        draw(e)
        options.isDrawing = false;
    });
    canvases.drawing.canvas.addEventListener("touchstart", () => {
        options.isDrawing = true;
    });
    canvases.drawing.canvas.addEventListener("touchend", () => {
        options.isDrawing = false;
    });
}

function draw(e) {
    if (!options.isDrawing) return;

    const x = e.offsetX;
    const y = e.offsetY;

    if (options.mode === "draw") {
        canvases.drawing.ctx.fillStyle = canvases.drawing.ctx.shadowColor = `rgba(0,0,0,${options.brush.opacity})`;
    } else {
        canvases.drawing.ctx.fillStyle = canvases.drawing.ctx.shadowColor = `rgba(255,255,255,${options.brush.opacity})`;
    }

    canvases.drawing.ctx.lineJoin = canvases.drawing.ctx.lineCap = 'round';
    canvases.drawing.ctx.shadowBlur = options.brush.hardness;
    canvases.drawing.ctx.beginPath();
    canvases.drawing.ctx.arc(x, y, options.brush.size / 2, 0, Math.PI * 2);
    canvases.drawing.ctx.fill();

    requestAnimationFrame(applyMask);
}

function applyMask() {
    // Get the image data for the drawing canvas.
    const idata = canvases.drawing.ctx.getImageData(0, 0, options.width, options.height);

    // Create a 32-bit array from the image data buffer.
    const data32 = new Uint32Array(idata.data.buffer);

    // Apply a left shift of 8 bits to each 32-bit value in the array.
    let i = 0, len = data32.length;
    while (i < len) data32[i] = data32[i++] << 8;

    // Update the preview canvas with the masked image data.
    canvases.preview.ctx.putImageData(idata, 0, 0);

    // Set the global composite operation to "source-in".
    canvases.preview.ctx.globalCompositeOperation = "source-in";

    // Draw the image on the preview canvas with the applied mask.
    canvases.preview.ctx.drawImage(elements.image, 0, 0);
}

function downloadFile(type) {
    let canvas = canvases.preview.canvas;
    let name = "image.png"
    if (type === "mask") {
        canvas = canvases.drawing.canvas;
        name = "mask.png"
    }
    const link = document.createElement("a");
    link.download = name;
    link.href = canvas.toDataURL();
    link.click();
}

function clearCanvases() {
    canvases.drawing.ctx.clearRect(0, 0, options.width, options.height)
    canvases.preview.ctx.clearRect(0, 0, options.width, options.height)
}

function loadImage() {
    const file = elements.fileInput.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function (e) {
        const image = new Image();
        image.onload = function () {
            clearCanvases()
            handleCanvasForImage(image)
        };
        image.src = e.target.result;
        elements.image = image;
    }
    getDrawCursor();
}

function App() {
    const chooseButton = useRef(null);
    const fileInput = useRef(null);
    const brushOpacity = useRef(null);
    const brushSize = useRef(null);

    const drawingCanvas = useRef(null);
    const previewCanvas = useRef(null);

    const [size, setSize] = useState(0);
    const [opacity, setOpacity] = useState(0)


    useEffect(() => {
        elements.chooseButton = chooseButton.current;
        elements.fileInput = fileInput.current;

        elements.fileInput.addEventListener("change", loadImage);
        elements.chooseButton.addEventListener("click", () => elements.fileInput.click());

        const drawingCtx = drawingCanvas.current.getContext("2d", {willReadFrequently: true});
        const previewCtx = previewCanvas.current.getContext("2d");

        setSize(parseInt(brushSize.current.value));
        setOpacity(parseInt(brushOpacity.current.value) / 100).toFixed(2)

        canvases.drawing = {
            canvas: drawingCanvas.current,
            ctx: drawingCtx
        };

        canvases.preview = {
            canvas: previewCanvas.current,
            ctx: previewCtx
        };

        bootstrapCanvasEvents();
        bootstrapRangeEvents(brushOpacity, brushSize, setSize, setOpacity);
        setDemoImage();

        tg.ready();
    }, [])

    const onClose = () => {
        tg.close();
    }

    return (
        <div className="App">
            <Container>
                <Col>
                    <Row>
                        <Card>
                            <Card.Body>
                                <div className="image-container">
                                    <canvas ref={drawingCanvas} id="drawing-canvas"></canvas>
                                    <canvas ref={previewCanvas} id="preview-canvas"></canvas>
                                </div>
                            </Card.Body>
                        </Card>
                    </Row>
                    <Row>
                        <Card>
                            <Card.Body>
                                <ButtonGroup>
                                    <Button variant="primary" onClick={() => setMode('draw')}>Mask</Button>
                                    <Button variant="primary" onClick={() => setMode('erase')}>Unmask</Button>
                                </ButtonGroup>

                                <FormGroup>
                                    <Form.Label>Brush Size</Form.Label>
                                    <span className="sizeSpan">{size}</span>
                                    <Form.Range ref={brushSize}/>
                                </FormGroup>

                                <FormGroup>
                                    <Form.Label>Brush Opacity</Form.Label>
                                    <span className="sizeSpan">{opacity}</span>
                                    <Form.Range ref={brushOpacity}/>
                                </FormGroup>

                                <input type="file"
                                       className="d-none"
                                       ref={fileInput}
                                       accept="image/*"
                                       hidden/>

                                <Button variant="primary" ref={chooseButton}>Choose Image</Button>

                                <ButtonGroup>
                                    <DropdownButton as={ButtonGroup} title="Save" id="bg-nested-dropdown">
                                        <Dropdown.Item onClick={() => downloadFile('image')}>Image</Dropdown.Item>
                                        <Dropdown.Item onClick={() => downloadFile('mask')}>Mask</Dropdown.Item>
                                    </DropdownButton>
                                </ButtonGroup>

                            </Card.Body>
                        </Card>
                    </Row>
                </Col>
            </Container>
            <button onClick={onClose}>закрыть</button>
        </div>
    );
}

export default App;
