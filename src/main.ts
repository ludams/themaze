import "./styles.css";
import { Application, Assets, Graphics, Text } from "pixi.js";
import seedrandom from "seedrandom";
import maze1String from "./mazes/maze1.txt?raw";

const wallColor = 0x000000;
const levelColor = 0xffffff;
const pixelSize = 20;
const fontSize = 15;
const letters = "abcdefghijklmnopqrstuvwxyz";

await Assets.load("JetBrainsMono/JetBrainsMono-Regular.woff2");
let rng = seedrandom("1337");

const app = new Application();
await app.init({ resizeTo: window, backgroundColor: levelColor });
document.getElementById("app")!.appendChild(app.canvas);

function randomLetter() {
  return letters[Math.floor(rng() * letters.length)];
}

function loadMaze(maze: string) {
  const walls = [];
  const pathFields = [];
  const rows = maze.split("\n");
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      if (row[x] === " ") {
        pathFields.push([x, y]);
      } else {
        walls.push([x, y]);
      }
    }
  }
  return { walls, path: pathFields };
}

const maze = loadMaze(maze1String as string);

for (const [x, y] of maze.walls) {
  const obj = new Graphics({ x: x * pixelSize, y: y * pixelSize })
    .rect(0, 0, pixelSize, pixelSize)
    .fill(wallColor);
  app.stage.addChild(obj);
}

for (const [x, y] of maze.path) {
  const text = new Text({
    text: randomLetter(),
    style: {
      fontFamily: "Jetbrainsmono Regular",
      fontSize: fontSize,
    },
  });
  text.x = pixelSize / 2 - text.width / 2 + x * pixelSize;
  text.y = y * pixelSize;
  app.stage.addChild(text);
}
