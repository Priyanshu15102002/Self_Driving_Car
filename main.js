const carCanvas = document.getElementById("carCanvas");
carCanvas.width = 200;
const networkCanvas = document.getElementById("networkCanvas");
networkCanvas.width = 300;

const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");

const road = new Road(carCanvas.width / 2, carCanvas.width * 0.9);

const N = 100;
const cars = generateCars(N);
let bestCar = cars[0];
if (localStorage.getItem("bestBrain")) {
    for (let i = 0; i < cars.length; i++) {
        cars[i].brain = JSON.parse(localStorage.getItem("bestBrain"));
        if (i !== 0) {
            NeuralNetwork.mutate(cars[i].brain, 0.2);
        }
    }
}

trafficConfig = [
    { lane: 1, row: 1 },
    { lane: 0, row: 3 },
    { lane: 2, row: 3 },
    { lane: 0, row: 5 },
    { lane: 1, row: 5 },
    { lane: 1, row: 7 },
    { lane: 2, row: 7 },
    { lane: 0, row: 9 },
    { lane: 1, row: 10 },
    { lane: 0, row: 11 },
    { lane: 1, row: 11 },
    { lane: 2, row: 13 },
    { lane: 1, row: 14 },
];

const traffic = trafficConfig.map(
    ({
        lane,
        row,
        width = 30,
        height = 50,
        controlType = "DUMMY",
        maxSpeed = 2,
    }) =>
        new Car(
            road.getLaneCenter(lane),
            row * -100,
            width,
            height,
            controlType,
            maxSpeed
        )
);

animate();

// Saves the best 'brain'
function save() {
    localStorage.setItem("bestBrain", JSON.stringify(bestCar.brain));
}

// Deletes the best 'brain'
function discard() {
    localStorage.removeItem("bestBrain");
}

function generateCars(N) {
    const cars = [];

    for (let i = 1; i <= N; i++) {
        cars.push(new Car(road.getLaneCenter(1), 100, 30, 50, "AI"));
    }
    return cars;
}

function animate(time) {
    for (let i = 0; i < traffic.length; i++) {
        traffic[i].update(road.borders, []);
    }

    for (let i = 0; i < cars?.length; i++) {
        cars[i].update(road.borders, traffic);
    }

    /*
        This is our fitness function. We could change this to be 
        a function that looks for the most distance travelled - however this could find
        the car that travels directly backwards.. not great!
        Also notice that even the smallest y value (furthest up the screen) would be bad
        if the road curved.. lots to think about when choosing a fitness function!
    */
    bestCar = cars.find((c) => c.y === Math.min(...cars.map((c) => c.y)));

    carCanvas.height = window.innerHeight;
    networkCanvas.height = window.innerHeight;

    carCtx.save();
    carCtx.translate(0, -bestCar.y + carCanvas.height * 0.7);

    road.draw(carCtx);
    for (let i = 0; i < traffic.length; i++) {
        traffic[i].draw(carCtx, "red");
    }
    carCtx.globalAlpha = 0.2;
    for (let i = 0; i < cars.length; i++) {
        cars[i].draw(carCtx, "blue");
    }
    carCtx.globalAlpha = 1;
    bestCar.draw(carCtx, "blue", true);

    carCtx.restore();

    networkCtx.lineDashOffset = -time / 50;
    Visualizer.drawNetwork(networkCtx, bestCar.brain);
    requestAnimationFrame(animate); // calls the animate method many times a second, gives the look of movement we want
}
