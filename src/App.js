import './App.css';
import demoImg from './demo.jpg';
import {useEffect, useRef} from "react";
import {Button, ButtonGroup, Card, Col, Container, Row} from "react-bootstrap";

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
    // getDrawCursor()
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

function App() {
    const drawingCanvas = useRef(null);
    const previewCanvas = useRef(null);


    useEffect(() => {
        const drawingCtx = drawingCanvas.current.getContext("2d", {willReadFrequently: true});
        const previewCtx = previewCanvas.current.getContext("2d");

        canvases.drawing = {
            canvas: drawingCanvas.current,
            ctx: drawingCtx
        };

        canvases.preview = {
            canvas: previewCanvas.current,
            ctx: previewCtx
        };

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
                                    <Button>Mask</Button>
                                    <Button>Unmask</Button>
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
