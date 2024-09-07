class Sensor {
    constructor(car) {
        this.car = car;
        this.rayCount = 5; // number of rays used to 'sense' from the car
        this.rayLength = 150; // how far in front the rays reach
        this.raySpread = Math.PI / 2; // angle we spread the rays cast by the sensor

        this.rays = [];
        this.readings = []; // some values for each ray telling if theres a border or not & how far away it is
    }

    update(roadBorders, traffic) {
        this.#castRays();
        this.readings = [];
        for (let i = 0; i < this.rays.length; i++) {
            this.readings.push(
                this.#getReading(this.rays[i], roadBorders, traffic)
            );
        }
    }

    #getReading(ray, roadBorders, traffic) {
        let touches = [];

        for (let i = 0; i < roadBorders.length; i++) {
            const touch = getIntersection(
                ray[0],
                ray[1],
                roadBorders[i][0],
                roadBorders[i][1]
            );

            if (touch) {
                touches.push(touch);
            }
        }

        for (let i = 0; i < traffic.length; i++) {
            const poly = traffic[i].polygon;
            for (let j = 0; j < poly.length; j++) {
                const value = getIntersection(
                    ray[0],
                    ray[1],
                    poly[j],
                    poly[(j + 1) % poly.length]
                );
                if (value) {
                    touches.push(value);
                }
            }
        }

        if (touches.length === 0) {
            return null;
        } else {
            const offsets = touches.map((e) => e.offset);
            const minOffset = Math.min(...offsets); // nearest intersection
            return touches.find((e) => e.offset === minOffset); // return the touch that has the nearest intersection
        }
    }

    #castRays() {
        this.rays = [];
        for (let i = 0; i < this.rayCount; i++) {
            const rayAngle =
                lerp(
                    this.raySpread / 2,
                    -this.raySpread / 2,
                    this.rayCount === 1 ? 0.5 : i / (this.rayCount - 1) // stops division by 0 if rayCount = 1
                ) + this.car.angle; // this keeps the rays coming out from the front of the car relative to the direction of the car

            const start = { x: this.car.x, y: this.car.y };
            const end = {
                x: this.car.x - Math.sin(rayAngle) * this.rayLength,
                y: this.car.y - Math.cos(rayAngle) * this.rayLength,
            };
            this.rays.push([start, end]);
        }
    }

    draw(ctx) {
        for (let i = 0; i < this.rayCount; i++) {
            let end = this.rays[i][1];
            if (this.readings[i]) {
                end = this.readings[i];
            }

            // This chunk shows the part of the ray in yellow that is before the boundary
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "yellow";
            ctx.moveTo(this.rays[i][0].x, this.rays[i][0].y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();

            // This chunk shows the part of the ray in black that is past the boundary
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "black";
            ctx.moveTo(this.rays[i][1].x, this.rays[i][1].y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        }
    }
}
